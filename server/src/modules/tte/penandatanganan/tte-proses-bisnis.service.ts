import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';
import type { JwtAccessPayload } from '../../../common';
import { toWibDateOnly } from '../../../common/date/wib-date.util';
import { JenisDokumenTte, JenisNotifikasiProsesBisnis, StatusSOP } from '../../../generated/prisma';
import { NotifikasiProsesBisnisService } from '../../notifications/process/process-notification.service';
import { SopOfficialPdfService } from '../../sop/pdf/sop-official-pdf.service';
import { SopPdfStorageService } from '../../sop/pdf/sop-pdf-storage.service';
import { TandaTanganiProsesBisnisSopDto } from '../shared/dto/tanda-tangani-sop-proses-bisnis.dto';
import { TteRepository } from '../shared/repository/tte.repository';
import { buildTteQrPayload } from '../shared/utils/tte-verifikasi-qr.util';
import { TtePublicUrlResolver } from '../shared/utils/tte-public-url.resolver';
import { hashDokumenKanonik, runTteRepositoryMutation } from '../shared/utils/tte-support';
import { ProsesBisnisTteRepository } from './tte-proses-bisnis.repository';
import { TtePdfSigningService } from './tte-pdf-signing.service';

@Injectable()
export class ProsesBisnisTteService {
  constructor(
    private readonly processTteRepository: ProsesBisnisTteRepository,
    private readonly tteRepository: TteRepository,
    private readonly publicUrlResolver: TtePublicUrlResolver,
    private readonly sopOfficialPdfService: SopOfficialPdfService,
    private readonly sopPdfStorageService: SopPdfStorageService,
    private readonly ttePdfSigningService: TtePdfSigningService,
    private readonly notifikasiProsesBisnisService: NotifikasiProsesBisnisService,
  ) {}

  async sign(
    user: JwtAccessPayload,
    detailOrSopId: string,
    dto: TandaTanganiProsesBisnisSopDto,
    req?: Pick<Request, 'headers'>,
  ) {
    const contextResult = await this.processTteRepository.findSigningContext(detailOrSopId);
    if (!contextResult.ok) this.throwContextError(contextResult);
    const context = contextResult.context;
    if (context.approval.approvedById !== user.sub) {
      throw new ForbiddenException(
        'TTE hanya dapat dilakukan oleh Dekan/Kepala Departemen yang memberi persetujuan akhir',
      );
    }

    const pengguna = await this.tteRepository.findPenggunaAktif(user.sub);
    if (pengguna === null) throw new NotFoundException('Pengguna tidak ditemukan');
    await this.assertPinValid(user.sub, dto.pin);

    const hashDokumen = hashDokumenKanonik({
      jenis: JenisDokumenTte.SOP_BERLAKU,
      nomorDokumen: dto.nomorDokumen,
      judulDokumen: dto.judulDokumen,
      refId: context.detailSopId,
    });
    const prepared = await runTteRepositoryMutation(() =>
      this.processTteRepository.prepareDocument({
        detailOrSopId: context.detailSopId,
        userId: user.sub,
        hashDokumen,
        nomorDokumen: dto.nomorDokumen,
        judulDokumen: dto.judulDokumen,
      }),
    );
    if (!prepared.ok) this.throwPrepareError(prepared);

    const signedAt = new Date();
    const tanggalEfektif = toWibDateOnly(signedAt);
    const unsignedPdf = this.sopOfficialPdfService.buildUnsignedOfficialPdf(
      prepared.item.detailSopId,
      dto.pdfBase64,
    );
    const qr = buildTteQrPayload({
      publicVerifyBaseUrl: this.publicUrlResolver.resolveDocumentVerifyBaseUrl(req),
      dokumenTteId: prepared.item.dokumenTteId,
      hashDokumen: prepared.item.hashDokumen,
    });
    const stampedPdf = await this.sopOfficialPdfService.stampPengesahanMetadata({
      detailSopId: prepared.item.detailSopId,
      pdfBuffer: unsignedPdf,
      qrPayload: qr.qrPayload,
      tanggalEfektif,
    });
    const signedPdf = await this.ttePdfSigningService.signOfficialSopPdfWithUserCertificate({
      userId: user.sub,
      pin: dto.pin,
      dokumenTteId: prepared.item.dokumenTteId,
      pdfBuffer: stampedPdf,
      signerName: pengguna.nama,
    });
    const relativePath = this.sopPdfStorageService.buildRelativePath({
      prosesBisnisId: prepared.item.prosesBisnisId,
      sopId: prepared.item.sopId,
      detailSopId: prepared.item.detailSopId,
      versi: prepared.item.versi,
    });
    const stored = await this.sopPdfStorageService.writeOfficialPdf(relativePath, signedPdf.signedPdf);

    let notifiedRecipients: string[] = [];
    try {
      const finalized = await runTteRepositoryMutation(() =>
        this.processTteRepository.finalizeWithArtifact(
          {
            detailOrSopId: prepared.item.detailSopId,
            userId: user.sub,
            signedAt,
            tanggalEfektif,
            dokumenTteId: prepared.item.dokumenTteId,
            pdfPath: stored.relativePath,
            pdfSha256: stored.sha256,
            pdfSizeBytes: stored.sizeBytes,
            signatureMetadata: signedPdf.riwayatMetadata,
          },
          async (tx, finalizedContext) => {
            const [process, detail] = await Promise.all([
              tx.prosesBisnis.findUnique({
                where: { prosesBisnisId: finalizedContext.prosesBisnisId },
                select: { ownerId: true, nama: true },
              }),
              tx.detailSOP.findUnique({
                where: { detailSopId: finalizedContext.detailSopId },
                select: { dibuatOlehId: true },
              }),
            ]);
            if (process === null || detail === null) {
              throw new ConflictException('Context feedback Proses Bisnis SOP tidak ditemukan');
            }
            const authorId = detail.dibuatOlehId;
            if (authorId === null) {
              throw new ConflictException('Author SOP Proses Bisnis tidak tersedia untuk feedback efektif');
            }

            notifiedRecipients = await this.notifikasiProsesBisnisService.createManyInTransaction(tx, [
              {
                detailSopId: finalizedContext.detailSopId,
                sopId: finalizedContext.sopId,
                prosesBisnisId: finalizedContext.prosesBisnisId,
                penggunaId: authorId,
                kind: JenisNotifikasiProsesBisnis.PROCESS_SOP_EFFECTIVE,
                namaProsesBisnis: process.nama,
              },
              {
                detailSopId: finalizedContext.detailSopId,
                sopId: finalizedContext.sopId,
                prosesBisnisId: finalizedContext.prosesBisnisId,
                penggunaId: process.ownerId,
                kind: JenisNotifikasiProsesBisnis.PROCESS_SOP_EFFECTIVE,
                namaProsesBisnis: process.nama,
              },
            ]);
          },
        ),
      );
      if (!finalized.ok) this.throwFinalizeError(finalized);
      this.notifikasiProsesBisnisService.emitChangedMany(notifiedRecipients);
      return {
        detailSopId: finalized.detailSopId,
        dokumenTteId: finalized.dokumenTteId,
        authority: finalized.authority,
        authorityKey: finalized.authorityKey,
        status: StatusSOP.EFFECTIVE,
        ditandatanganiPada: signedAt.toISOString(),
        tanggalEfektif: tanggalEfektif.toISOString(),
      };
    } catch (error) {
      await this.sopPdfStorageService.deleteStoredPdf(stored.relativePath);
      throw error;
    }
  }

  private async assertPinValid(userId: string, pin: string): Promise<void> {
    const kredensial = await this.tteRepository.findKredensial(userId);
    if (kredensial === null) {
      throw new BadRequestException('Kredensial TTE belum dibuat. Atur PIN TTE terlebih dahulu.');
    }
    if (!(await bcrypt.compare(pin, kredensial.hashPin))) {
      throw new ForbiddenException('PIN TTE tidak valid');
    }
  }

  private throwContextError(result: { error?: string; status?: StatusSOP }): never {
    if (result.error === 'NOT_FOUND') throw new NotFoundException('DetailSOP tidak ditemukan');
    if (result.error === 'NOT_LATEST') {
      throw new ConflictException('TTE hanya dapat dilakukan pada versi SOP terbaru');
    }
    if (result.error === 'UNASSIGNED_ARCHIVE') {
      throw new ConflictException('SOP arsip tanpa Proses Bisnis tidak dapat masuk TTE FTI');
    }
    if (result.error === 'NOT_APPROVED') {
      throw new ConflictException('SOP belum mendapat persetujuan akhir');
    }
    if (result.error === 'APPROVAL_CONTEXT_DRIFT') {
      throw new ConflictException('Context persetujuan akhir tidak cocok dengan Proses Bisnis SOP');
    }
    if (result.error === 'BAD_STATUS') {
      throw new ConflictException(`SOP tidak siap TTE pada status ${String(result.status)}`);
    }
    throw new ConflictException('Context TTE SOP tidak valid');
  }

  private throwPrepareError(result: { error?: string; status?: StatusSOP }): never {
    if (result.error === 'FORBIDDEN_SIGNER') {
      throw new ForbiddenException('Final approval SOP ini diberikan oleh pengguna lain');
    }
    if (result.error === 'INVALID_DOC_PARENT') {
      throw new ConflictException('Data dokumen TTE SOP tidak konsisten');
    }
    if (result.error === 'ALREADY_SIGNED') {
      throw new ConflictException('SOP version ini sudah ditandatangani');
    }
    this.throwContextError(result);
  }

  private throwFinalizeError(result: { error?: string; status?: StatusSOP }): never {
    if (result.error === 'SOP_STATUS_DRIFT') {
      throw new ConflictException('Status SOP berubah selama proses TTE. Muat ulang lalu coba lagi.');
    }
    this.throwPrepareError(result);
  }
}
