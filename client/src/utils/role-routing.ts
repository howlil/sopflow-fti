import type { RoleKey } from "@/types/dto/access.dto";
import { ROUTES } from "@/utils/constants";

/**
 * Halaman pertama sidebar per peran (indeks 0) — dipakai untuk redirect `/` dan setelah login.
 */
/** Prefiks area aplikasi yang dibatasi per peran (guard kasar untuk redirect aman). */

/** Peran yang boleh mengatur PIN / memanggil API `/tte` (selaras server `TteController`). */
export const ROLES_DENGAN_TTE = [
  "PJ_EVALUATOR",
  "PJ_PENYUSUN",
  "KEPALA_OPD",
] as const satisfies readonly RoleKey[];

export function roleMendukungTte(role: RoleKey | undefined): boolean {
  if (role === undefined) {
    return false;
  }
  return (ROLES_DENGAN_TTE as readonly RoleKey[]).includes(role);
}

/** Route profil akun native; tetap dipakai oleh dialog setup TTE legacy. */
export function getMeRoute(role: RoleKey | undefined): string | undefined {
  switch (role) {
    case "PJ_EVALUATOR":
    case "KEPALA_OPD":
    case "EVALUATOR":
    case "PENYUSUN":
    case "PJ_PENYUSUN":
      return ROUTES.PENYUSUN.ME;
    default:
      return undefined;
  }
}

/**
 * Ekstrak path internal dari query `redirect` (hanya origin yang sama; cegah open redirect).
 */
export function parseSafeInternalRedirect(redirect: string | undefined): string | null {
  if (redirect == null || String(redirect).trim() === "") {
    return null;
  }
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = redirect.trim();
    const url = raw.startsWith("http") ? new URL(raw) : new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) {
      return null;
    }
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (path === "/" || path.startsWith("/login")) {
      return null;
    }
    return path;
  } catch {
    return null;
  }
}

/**
 * Tujuan setelah login memakai redirect internal yang aman; capability-specific
 * route/API guards tetap menjadi sumber keputusan akses setelah router memuat route.
 */
export function resolvePostLoginPath(redirect: string | undefined): string {
  const internal = parseSafeInternalRedirect(redirect);
  if (internal) {
    return internal;
  }
  return ROUTES.WORK;
}

type NavigateLike = (opts: {
  to: string;
  search?: Record<string, string>;
  hash?: `#${string}`;
}) => void;

/** Navigasi ke path yang bisa berisi query/hash (hasil `resolvePostLoginPath`). */
export function navigateToAppPath(navigate: NavigateLike, pathWithQueryHash: string): void {
  const url = new URL(pathWithQueryHash, window.location.origin);
  const search: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    search[key] = value;
  });
  navigate({
    to: url.pathname,
    ...(Object.keys(search).length > 0 ? { search } : {}),
    ...(url.hash ? { hash: url.hash as `#${string}` } : {}),
  });
}

/** Argumen untuk `redirect()` — sama dengan pola `navigateToAppPath` (untuk beforeLoad). */
export function redirectArgsFromAppPath(pathWithQueryHash: string): {
  to: string;
  search?: Record<string, string>;
  hash?: `#${string}`;
} {
  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(pathWithQueryHash, base);
  const search: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    search[key] = value;
  });
  return {
    to: url.pathname,
    ...(Object.keys(search).length > 0 ? { search } : {}),
    ...(url.hash ? { hash: url.hash as `#${string}` } : {}),
  };
}
