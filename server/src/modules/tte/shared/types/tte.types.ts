import type { OrganizationalAuthority, PeranPengguna } from '../../../../generated/prisma';

export type {
  PdfSigningStatusResponse,
  SignPdfResponse,
  VerifyPdfResponse,
} from '../../penandatanganan/tte-pdf-signing.service';

/** Credential state only. Signing authority is resolved from Organizational Authority. */
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
  /** Historical compatibility evidence only; never authorization for Process TTE. */
  readonly peran: PeranPengguna;
  readonly authority?: OrganizationalAuthority;
  readonly authorityLabel?: 'Dekan' | 'Kepala Departemen';
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
    readonly sopDetailId?: string;
  };
  readonly qrVerificationUrl: string | null;
  readonly qrPayload: string;
};
