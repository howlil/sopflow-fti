/**
 * Application Constants
 * Source of truth for shared client constants.
 */

import { SOP_STATUS_FILTER_OPTIONS } from "@/lib/status";

export const LOCALE_ID = "id-ID" as const;
export const DEFAULT_PAGE_SIZE = 10 as const;

export const STALE_TIME = {
  SHORT: 2 * 60 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 10 * 60 * 1000,
} as const;

export const ROUTES = {
  HOME: "/",
  ME: "/me",
  PROSES_BISNIS: "/proses-bisnis",
  VALIDASI: {
    PENGESAHAN_PREFIX: "/validasi/pengesahan",
    PDF: "/validasi/pdf",
  },
  ARSIP: {
    PREFIX: "/arsip",
  },
  AUTH: {
    LOGIN: "/login",
  },
  ADMIN: {
    ACCOUNTS: "/admin/akun-fti",
    PROCESSES: "/admin/proses-bisnis-organisasi",
    AUTHORITIES: "/admin/kewenangan-organisasi",
  },
  APPROVAL: {
    INBOX: "/persetujuan",
  },
  PEMERIKSAAN: "/pemeriksaan",
  TTE: {
    INBOX: "/tanda-tangan",
  },
  PERATURAN: "/peraturan",
  PELAKSANA: "/pelaksana",
  SOP: "/sop",
  DETAIL_SOP: "/sop/$id",
} as const;

export { SOP_STATUS_FILTER_OPTIONS };
