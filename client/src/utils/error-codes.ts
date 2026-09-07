export const ErrorCodes = {
  SINGLETON_CONSTRAINT_VIOLATION: 'SINGLETON_CONSTRAINT_VIOLATION',
  USER_EMAIL_EXISTS: 'USER_EMAIL_EXISTS',
  USER_NIP_EXISTS: 'USER_NIP_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TIM_ALREADY_EXISTS: 'TIM_ALREADY_EXISTS',
  TIM_NOT_FOUND: 'TIM_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  code: ErrorCode;
  message: string;
  errors?: string[];
  path: string;
  timestamp: string;
}

export function getUserFriendlyMessage(error: unknown): string {
  if (!error) return 'Terjadi kesalahan tidak diketahui';
  const apiError = error as ApiErrorResponse;

  if (apiError?.code) {
    switch (apiError.code) {
      case ErrorCodes.SINGLETON_CONSTRAINT_VIOLATION:
        return 'Penanggung jawab untuk scope ini sudah tersedia. Periksa struktur organisasi dan kewenangan yang aktif.';
      case ErrorCodes.USER_EMAIL_EXISTS:
        return 'Email sudah terdaftar. Gunakan email lain atau coba login.';
      case ErrorCodes.USER_NIP_EXISTS:
        return 'NIP sudah terdaftar. Gunakan NIP lain atau periksa kembali.';
      case ErrorCodes.TIM_ALREADY_EXISTS:
        return 'User sudah menjadi anggota Proses Bisnis ini.';
      case ErrorCodes.VALIDATION_ERROR:
        return 'Data yang Anda masukkan tidak valid. Periksa kembali form.';
      case ErrorCodes.FORBIDDEN:
        return 'Anda tidak memiliki akses ke fitur ini.';
      case ErrorCodes.UNAUTHORIZED:
        return 'Sesi Anda telah berakhir. Silakan login kembali.';
      default:
        return apiError.message || 'Terjadi kesalahan. Silakan coba lagi.';
    }
  }

  if (apiError?.message) return apiError.message;
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan tidak diketahui';
}

export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return (error as ApiErrorResponse)?.code === code;
}
