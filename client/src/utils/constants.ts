/**
 * Application Constants
 * Source of truth for all constants
 * Note: Types are imported from @/types/common
 */

import type { RoleKey } from "@/types/dto/access.dto";
import { SOP_STATUS_FILTER_OPTIONS } from "@/lib/status";

// ==================== CONSTANTS ====================

export const LOCALE_ID = "id-ID" as const;

export const DEFAULT_PAGE_SIZE = 10 as const;

// ==================== QUERY DEFAULTS ====================

export const STALE_TIME = {
  SHORT: 2 * 60 * 1000, // Volatile data (detail SOP, drafts)
  MEDIUM: 5 * 60 * 1000, // Moderate changes (SOP lists, teams, OPD)
  LONG: 10 * 60 * 1000, // Data stabil (grafik tahunan, referensi)
} as const;

/** Konstanta string — sama dengan enum Prisma `PeranPengguna`. */
export const ROLES = {
  PJ_EVALUATOR: "PJ_EVALUATOR",
  EVALUATOR: "EVALUATOR",
  KEPALA_OPD: "KEPALA_OPD",
  PJ_PENYUSUN: "PJ_PENYUSUN",
  PENYUSUN: "PENYUSUN",
} as const;

export const ROLE_LABELS: Record<RoleKey, string> = {
  PJ_EVALUATOR: "PJ Evaluator",
  EVALUATOR: "Evaluator",
  KEPALA_OPD: "Kepala OPD",
  PJ_PENYUSUN: "PJ Penyusun",
  PENYUSUN: "Penyusun",
} as const;

export const ROUTES = {
  HOME: "/",
  WORK: "/work",
  WORK_QUEUE: "/work/queue",
  /** Halaman publik verifikasi pengesahan TTE (scan QR, tanpa login). */
  VALIDASI: {
    PENGESAHAN_PREFIX: "/validasi/pengesahan",
    PDF: "/validasi/pdf",
  },
  /** Arsip SOP berlaku — akses tanpa login. */
  ARSIP: {
    PREFIX: "/arsip",
  },
  AUTH: {
    LOGIN: "/login",
  },
  /** Platform administration; independent from legacy workflow role routes. */
  ADMIN: {
    ACCOUNTS: "/admin/accounts",
    PROCESSES: "/admin/processes",
    AUTHORITIES: "/admin/authorities",
  },
  APPROVAL: {
    INBOX: "/approval",
  },
  PENYUSUN: {
    ME: "/penyusun/me",
    SOP: "/penyusun/sop",
    DETAIL_SOP: "/penyusun/sop/$id",
    PELAKSANA: "/penyusun/pelaksana",
    PERATURAN: "/penyusun/peraturan",
  },
} as const;

export const IA = {
  NAV_BIRO_EVALUASI_REQUEST_EVALUATOR: "Evaluasi Request Evaluator",
  NAV_BIRO_BATCH_BA: "Manajemen Evaluasi SOP",
  NAV_BIRO_VERIFIKASI_BA: "Tanda Tangan BA",
  NAV_TP_BA_KOORDINATOR: "Berita Acara PJ Penyusun",
  NAV_KO_BA_PENGESAHAN: "Berita Acara Pengesahan",
  NAV_TE_EVALUASI: "Evaluasi SOP",
  BERITA_ACARA: "Berita Acara",
  PENGAJUAN_EVALUASI_OPD: "Pengajuan evaluasi OPD",
  REQUEST_EVALUATOR_EVALUASI_OPD: "Request Evaluator Evaluasi OPD",
  VERIFIKASI_BA_BIRO: "Tanda Tangan Berita Acara oleh PJ Evaluator",
  VERIFIKASI_BA_KOORDINATOR: "Tanda Tangan Berita Acara oleh PJ Penyusun",
  PENGESAHAN_SOP: "Pengesahan SOP",
} as const;

export { SOP_STATUS_FILTER_OPTIONS };
