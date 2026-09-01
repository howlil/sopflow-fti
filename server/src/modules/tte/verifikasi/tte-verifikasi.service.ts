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
    private readonly processVerificationRepository: ProcessTteVerificationRepository,
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

    const processApproval = row.dokumenTte.detailSopId
      ? await this.processVerificationRepository.findApprovalForSignedDetail(
          row.dokumenTte.detailSopId,
          row.userId,
        )
      : null;
    const authorityLabel = processApproval === null
      ? undefined
      : processApproval.authority === OrganizationalAuthority.DEAN
        ? 'Dekan' as const
        : 'Kepala Departemen' as const;

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
        pengajuanEvaluasiId: row.dokumenTte.pengajuanEvaluasiId ?? undefined,
      },
      qrVerificationUrl: qr.qrVerificationUrl,
      qrPayload: qr.qrPayload,
    };
  }
}
