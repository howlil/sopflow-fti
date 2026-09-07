import type { PejabatBerwenang } from '../../../../generated/prisma';

export type {
  PdfSigningStatusResponse,
  SignPdfResponse,
  VerifyPdfResponse,
} from '../../penandatanganan/tte-pdf-signing.service';

/** Credential state only. Signing authority is resolved from Pejabat Berwenang. */
export type TteProfilResponse = {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly hasP12: boolean;
  readonly user?: {
    readonly id: string;
    readonly nama: string;
    readonly email: string;
    readonly nip: string;
    readonly jabatan: string;
    readonly pangkat: string;
  };
};

export type TtePengesahanPublicResponse = {
  readonly userId: string;
  readonly dokumenTteId: string;
  readonly ditandatanganiPada: string;
  readonly authority: PejabatBerwenang;
  readonly authorityLabel: 'Dekan' | 'Kepala Departemen';
  readonly penandatangan: {
    readonly nama: string;
    readonly nip: string;
    readonly jabatan: string;
  };
  readonly dokumen: {
    readonly dokumenTteId: string;
    readonly nomorDokumen: string;
    readonly judulDokumen: string;
    readonly jenisDokumen: string;
    readonly hashDokumen: string;
    readonly sopDetailId: string;
  };
  readonly qrVerificationUrl: string | null;
  readonly qrPayload: string;
};
