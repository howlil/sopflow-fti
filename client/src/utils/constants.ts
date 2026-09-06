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
  WORK: "/work",
  WORK_QUEUE: "/work/queue",
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
    ACCOUNTS: "/admin/accounts",
    PROCESSES: "/admin/processes",
    AUTHORITIES: "/admin/authorities",
  },
  APPROVAL: {
    INBOX: "/approval",
  },
  /** Existing authoring route names are retained; access is Process-native. */
  PENYUSUN: {
    ME: "/penyusun/me",
    SOP: "/penyusun/sop",
    DETAIL_SOP: "/penyusun/sop/$id",
    PELAKSANA: "/penyusun/pelaksana",
    PERATURAN: "/penyusun/peraturan",
  },
} as const;

export { SOP_STATUS_FILTER_OPTIONS };
