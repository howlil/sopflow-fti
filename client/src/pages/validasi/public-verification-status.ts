import type { TtePublicStatus } from "@/types/dto/tte.dto";

export type PublicVerificationPresentation = {
  variant: "success" | "warning";
  title: string;
  description: string;
  statusLabel: string;
  isCurrent: boolean;
};

export function getPublicVerificationPresentation(
  status: TtePublicStatus,
): PublicVerificationPresentation {
  switch (status) {
    case "CURRENT":
      return {
        variant: "success",
        title: "Pengesahan terverifikasi",
        description:
          "Tanda tangan elektronik cocok dengan data sistem dan SOP ini masih berlaku secara publik.",
        statusLabel: "Berlaku",
        isCurrent: true,
      };
    case "REVOKED":
      return {
        variant: "warning",
        title: "Tanda tangan valid, SOP sudah dicabut",
        description:
          "Bukti tanda tangan tetap tersedia sebagai histori, tetapi SOP ini tidak lagi berlaku secara publik.",
        statusLabel: "Dicabut",
        isCurrent: false,
      };
    case "SUPERSEDED":
      return {
        variant: "warning",
        title: "Tanda tangan valid, SOP sudah digantikan",
        description:
          "Bukti tanda tangan tetap tersedia sebagai histori, tetapi versi ini bukan versi publik terkini.",
        statusLabel: "Digantikan",
        isCurrent: false,
      };
    case "NOT_PUBLIC":
      return {
        variant: "warning",
        title: "Tanda tangan tercatat, SOP tidak tersedia publik",
        description:
          "Bukti tanda tangan tersedia, tetapi dokumen ini bukan SOP publik yang sedang berlaku.",
        statusLabel: "Tidak tersedia publik",
        isCurrent: false,
      };
  }
}
