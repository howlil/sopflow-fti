import type { PlatformRole } from "@/types/dto/access.dto";

export interface LoginRequest {
  email: string;
  kataSandi: string;
}

/** Bungkus respons API standar server */
export interface ApiSuccessResponse<T> {
  message: string;
  success: boolean;
  data: T;
}

export interface PublicPenggunaTteStatus {
  configured: boolean;
  pinSetAt?: string;
}

/** Payload `data` dari auth first-party FTI. Workflow capability berasal dari Process/Authority API. */
export interface PublicPenggunaLoginData {
  penggunaId: string;
  email: string;
  nama: string;
  platformRole: PlatformRole;
  nip: string;
  jabatan: string;
  pangkat: string;
  nohp: string;
  tte: PublicPenggunaTteStatus;
}

export type LoginApiResponse = ApiSuccessResponse<PublicPenggunaLoginData>;

export interface LoginRequestDto {
  email: string;
  kataSandi: string;
}

export interface ChangePasswordDto {
  kataSandiLama: string;
  kataSandiBaru: string;
}

export interface UpdateMyPhoneDto {
  nohp: string;
}
