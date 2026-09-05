import { Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { OrganizationalAuthority } from '../../../generated/prisma';
import { TteRepository } from '../shared/repository/tte.repository';
import type { TtePengesahanPublicResponse } from '../shared/types/tte.types';
import { buildTteQrPayload } from '../shared/utils/tte-verifikasi-qr.util';
import { TtePublicUrlResolver } from '../shared/utils/tte-public-url.resolver';
import { ProcessTteVerificationRepository } from './process-tte-verification.repository';

@Injectable()
export class TteVerifikasiService {
  constructor(
    private readonly tteRepository: TteRepository,
    private readonly publicUrlResolver: TtePublicUrlResolver,
    // Optional only for isolated legacy unit construction. Nest runtime wires this provider;
    // Process-bound verification fails closed when it is absent.
    private readonly processVerificationRepository?: ProcessTteVerificationRepository,
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
    const qr = buildTteQrPayload({
      publicVerifyBaseUrl: this.publicUrlResolver.resolveDocumentVerifyBaseUrl(req),
      dokumenTteId: row.dokumenTte.dokumenTteId,
      hashDokumen: row.dokumenTte.hashDokumen,
    });

    const { detailSopId, processId } = row.dokumenTte;
    const isNativeProcessArtifact = detailSopId !== null && processId !== null;
    if (isNativeProcessArtifact && this.processVerificationRepository === undefined) {
      throw new Error('Process TTE verification repository tidak tersedia');
    }
    const processApproval = isNativeProcessArtifact
      ? await this.processVerificationRepository!.findApprovalForSignedDetail(
          detailSopId,
          row.userId,
          processId,
        )
      : null;
    const authorityLabel =
      processApproval === null
        ? undefined
        : processApproval.authority === OrganizationalAuthority.DEAN
          ? ('Dekan' as const)
          : ('Kepala Departemen' as const);

    return {
      userId: row.userId,
      dokumenTteId: row.dokumenTteId,
      ditandatanganiPada: row.ditandatanganiPada.toISOString(),
      peran: row.peran,
      ...(processApproval === null
        ? {}
        : {
            authority: processApproval.authority,
            authorityLabel,
          }),
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
        sopDetailId: row.dokumenTte.detailSopId ?? undefined,
      },
      qrVerificationUrl: qr.qrVerificationUrl,
      qrPayload: qr.qrPayload,
    };
  }
}
