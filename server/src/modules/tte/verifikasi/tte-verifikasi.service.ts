import { Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { JenisDokumenTte, PejabatBerwenang, StatusSOP } from '../../../generated/prisma';
import { TteRepository } from '../shared/repository/tte.repository';
import type { TtePengesahanPublicResponse, TtePublicStatus } from '../shared/types/tte.types';
import { buildTteQrPayload } from '../shared/utils/tte-verifikasi-qr.util';
import { TtePublicUrlResolver } from '../shared/utils/tte-public-url.resolver';

@Injectable()
export class TteVerifikasiService {
  constructor(
    private readonly tteRepository: TteRepository,
    private readonly publicUrlResolver: TtePublicUrlResolver,
  ) {}

  async getPengesahanPublic(
    dokumenTteId: string,
    userId: string,
    req?: Pick<Request, 'headers'>,
  ): Promise<TtePengesahanPublicResponse> {
    const row = await this.tteRepository.findRiwayatPengesahanByUserAndDokumen(
      userId,
      dokumenTteId,
    );
    if (row === null || row.dokumenTte === null || row.user === null) {
      throw new NotFoundException('Data pengesahan tidak ditemukan');
    }

    const { detailSopId, prosesBisnisId } = row.dokumenTte;
    const detail = row.dokumenTte.detailSop;
    if (detail === null || detail.sop.prosesBisnisId !== prosesBisnisId) {
      throw new NotFoundException('Binding Dokumen TTE dan SOP FTI tidak valid');
    }

    const currentPublicStatus = this.resolveCurrentPublicStatus({
      jenisDokumen: row.dokumenTte.jenisDokumen,
      pdfPath: row.dokumenTte.pdfPath,
      pdfStatus: row.dokumenTte.pdfStatus,
      detailStatus: detail.status,
    });

    const authorityLabel =
      row.authority === PejabatBerwenang.DEAN ? ('Dekan' as const) : ('Kepala Departemen' as const);
    const qr = buildTteQrPayload({
      publicVerifyBaseUrl: this.publicUrlResolver.resolveDocumentVerifyBaseUrl(req),
      dokumenTteId: row.dokumenTte.dokumenTteId,
      hashDokumen: row.dokumenTte.hashDokumen,
    });

    return {
      signatureValid: true,
      currentPublicStatus,
      userId: row.userId,
      dokumenTteId: row.dokumenTteId,
      ditandatanganiPada: row.ditandatanganiPada.toISOString(),
      authority: row.authority,
      authorityLabel,
      penandatangan: {
        nama: row.user.nama,
        nip: row.user.nip,
        jabatan: row.user.jabatan ?? '',
      },
      dokumen: {
        dokumenTteId: row.dokumenTte.dokumenTteId,
        nomorDokumen: row.dokumenTte.nomorDokumen,
        judulDokumen: row.dokumenTte.judulDokumen,
        jenisDokumen: String(row.dokumenTte.jenisDokumen),
        hashDokumen: row.dokumenTte.hashDokumen,
        sopDetailId: detailSopId,
      },
      qrVerificationUrl: qr.qrVerificationUrl,
      qrPayload: qr.qrPayload,
    };
  }

  private resolveCurrentPublicStatus(params: {
    jenisDokumen: JenisDokumenTte;
    pdfPath: string | null;
    pdfStatus: string | null;
    detailStatus: StatusSOP;
  }): TtePublicStatus {
    if (params.detailStatus === StatusSOP.REVOKED || params.pdfStatus === 'REVOKED') {
      return 'REVOKED';
    }
    if (params.detailStatus === StatusSOP.SUPERSEDED || params.pdfStatus === 'SUPERSEDED') {
      return 'SUPERSEDED';
    }
    if (
      params.jenisDokumen !== JenisDokumenTte.SOP_BERLAKU ||
      params.detailStatus !== StatusSOP.EFFECTIVE ||
      params.pdfStatus !== 'PUBLISHED' ||
      params.pdfPath === null
    ) {
      return 'NOT_PUBLIC';
    }
    return 'CURRENT';
  }
}
