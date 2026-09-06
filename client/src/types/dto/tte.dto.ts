/** Profil kredensial TTE. Authority tanda tangan berasal dari Process scope. */
export interface TteProfil {
  id: string;
  userId: string;
  hasP12?: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    nama: string;
    email: string;
    nip: string;
    jabatan: string;
    pangkat: string;
  };
}

export interface TTESignaturePayload {
  id: string;
  dokumenTteId: string;
  userId: string;
  nip: string;
  namaLengkap: string;
  jabatan?: string;
  signedAt?: string;
}

export type JenisDokumenTte = "SOP_BERLAKU";
export type TteAuthority = "DEAN" | "HEAD_OF_DEPARTMENT";

export interface SignPdfDto {
  pin: string;
  dokumenTteId: string;
  userId: string;
  jenisDokumen: JenisDokumenTte;
  pdfBase64: string;
}

export interface GenerateP12Dto { pin: string; }
export interface UploadP12Dto { pin: string; p12Passphrase: string; }
export interface SetupTteGenerateDto { pin: string; }
export interface SetupTteUploadDto { pin: string; p12Passphrase: string; }

export interface PdfCertificateInfo {
  subject: string;
  issuer: string;
  serialNumber: string;
  fingerprint: string;
  validFrom: string;
  validTo: string;
}

export interface SignPdfResponse {
  signed: boolean;
  signedPdfBase64: string;
  sha256SignedPdf: string;
  signatureFormat: "PKCS7_DETACHED" | "UNSIGNED_DISABLED" | "UNSIGNED_NOT_REQUIRED";
  certificate: PdfCertificateInfo | null;
}

export interface PdfSigningStatus {
  enabled: boolean;
  trustedCaSubject: string | null;
  trustedSignerSubject: string | null;
  verificationPath: string;
  configError?: string;
}

export interface PdfSignatureChecks {
  digestMatch: boolean;
  chainTrusted: boolean;
  certificatePeriodValid: boolean;
}

export interface PdfSignatureVerificationEntry {
  index: number;
  valid: boolean;
  reason: string;
  signatureValue: string;
  signerSubject: string;
  signerIssuer: string;
  signedAt: string | null;
  binding: { dokumenTteId: string; userId: string; jenisDokumen: string } | null;
  certificate: {
    validFrom: string;
    validTo: string;
    fingerprint: string;
    serialNumber: string;
  };
  checks: PdfSignatureChecks;
  tteMatch: {
    matched: boolean;
    reason: string;
    dokumenTteId?: string;
    userId?: string;
    authority?: TteAuthority;
    jenisDokumen?: string;
    nomorDokumen?: string;
    judulDokumen?: string;
    ditandatanganiPada?: string;
  };
}

export interface VerifyPdfResponse {
  pdfSigningEnabled: boolean;
  trustedCaSubject: string | null;
  hasSignatures: boolean;
  allValid: boolean;
  signatures: PdfSignatureVerificationEntry[];
  disclaimer: string;
}

export interface TtePengesahanPublic {
  userId: string;
  dokumenTteId: string;
  ditandatanganiPada: string;
  authority: TteAuthority;
  authorityLabel?: string;
  penandatangan: { nama: string; nip: string; jabatan: string };
  dokumen: {
    dokumenTteId: string;
    nomorDokumen: string;
    judulDokumen: string;
    jenisDokumen: JenisDokumenTte;
    hashDokumen: string;
    sopDetailId: string;
  };
  qrVerificationUrl: string | null;
  qrPayload: string;
}

export interface RegisterTteDto { pin: string; }
export interface UpdateTtePinDto { pinLama: string; pinBaru: string; }

export interface TandaTanganiProcessSopDto {
  pin: string;
  nomorDokumen: string;
  judulDokumen: string;
  pdfBase64: string;
}

export interface TandaTanganiProcessSopMutationDto {
  detailSopId: string;
  payload: TandaTanganiProcessSopDto;
}

export interface TandaTanganiProcessSopResponse {
  detailSopId: string;
  dokumenTteId: string;
  authority: TteAuthority;
  authorityKey: string;
  status: 'EFFECTIVE';
  ditandatanganiPada: string;
  tanggalEfektif: string;
}
