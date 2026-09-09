import { Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { PejabatBerwenang } from '../../../generated/prisma';
import { TteRepository } from '../shared/repository/tte.repository';
import type { TtePengesahanPublicResponse } from '../shared/types/tte.types';
import { buildTteQrPayload } from '../shared/utils/tte-verifikasi-qr.util';
import { TtePublicUrlResolver } from '../shared/utils/tte-public-url.resolver';
import { ProsesBisnisTteVerificationRepository } from './tte-proses-bisnis-verification.repository';

@Injectable()
export class TteVerifikasiService {
  constructor(
    private readonly tteRepository: TteRepository,
    private readonly publicUrlResolver: TtePublicUrlResolver,
    private readonly processVerificationRepository: ProsesBisnisTteVerificationRepository,
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
    const approval = await this.processVerificationRepository.findApprovalForSignedDetail(
      detailSopId,
      row.userId,
      prosesBisnisId,
    );
    if (approval === null || approval.authority !== row.authority) {
      throw new NotFoundException('Evidence authority pengesahan tidak valid');
    }

    const authorityLabel =
      row.authority === PejabatBerwenang.DEAN ? ('Dekan' as const) : ('Kepala Departemen' as const);
    const qr = buildTteQrPayload({
      publicVerifyBaseUrl: this.publicUrlResolver.resolveDocumentVerifyBaseUrl(req),
      dokumenTteId: row.dokumenTte.dokumenTteId,
      hashDokumen: row.dokumenTte.hashDokumen,
    });

    return {
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
}
