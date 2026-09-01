/**
 * Auth store - Zustand
 * Store untuk auth state (user info, role)
 * Note: Token disimpan di HttpOnly cookie (backend-managed), bukan localStorage
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api/api-client";
import type {
  LoginApiResponse,
  PublicPenggunaLoginData,
  PublicPenggunaTteStatus,
} from "@/types/dto/auth.dto";
import type { PlatformRole } from "@/types/dto/access.dto";
import type { User } from "@/types/dto/users.dto";
import { ROUTES } from "@/utils/constants";
import { toNavigationRole } from "@/utils/role-key";

export type AuthUser = Pick<
  User,
  "id" | "email" | "nama" | "peran" | "opdId" | "nip" | "jabatan" | "nohp"
> & {
  pangkat: string;
  platformRole: PlatformRole;
  tte: PublicPenggunaTteStatus;
};

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

let hydrationPromise: Promise<void> | null = null;

export function mapPublicDataToAuthUser(u: PublicPenggunaLoginData): AuthUser {
  return {
    id: u.penggunaId,
    email: u.email,
    nama: u.nama,
    peran: u.peran,
    platformRole: u.platformRole,
    opdId: u.opdId,
    nip: u.nip,
    jabatan: u.jabatan,
    pangkat: u.pangkat,
    nohp: u.nohp,
    tte: u.tte,
  };
}

export function redirectToLogin(redirectHref?: string): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith(ROUTES.AUTH.LOGIN)) return;
  const href = redirectHref ?? window.location.href;
  const search = new URLSearchParams({ redirect: href });
  window.location.assign(`${ROUTES.AUTH.LOGIN}?${search.toString()}`);
}

export function handleUnauthorizedSession(redirectHref?: string): void {
  useAuthStore.getState().logout();
  redirectToLogin(redirectHref);
}

export async function syncAuthFromCookie(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await apiClient.get<LoginApiResponse>("/auth/me");
    useAuthStore.getState().setUser(mapPublicDataToAuthUser(res.data));
    return true;
  } catch {
    useAuthStore.getState().logout();
    return false;
  }
}

export async function ensureAuthHydrated(maxWait = 2000): Promise<void> {
  if (typeof window === "undefined") return;
  if (!useAuthStore.persist) return;
  if (useAuthStore.persist.hasHydrated()) return;

  if (!hydrationPromise) {
    hydrationPromise = new Promise((resolve) => {
      let resolved = false;
      const finish = () => {
        if (!resolved) {
          resolved = true;
          hydrationPromise = null;
          resolve();
        }
      };
      const timeout = setTimeout(finish, maxWait);
      useAuthStore.persist.onFinishHydration(() => {
        clearTimeout(timeout);
        finish();
      });
    });
  }

  await hydrationPromise;
}

export function getRole(): string | undefined {
  return useAuthStore.getState().user?.peran;
}

async function requireAuthenticatedUser(location: { href: string }): Promise<AuthUser> {
  await ensureAuthHydrated();
  await syncAuthFromCookie();
  const user = useAuthStore.getState().user;
  if (!user) {
    const { redirect } = await import("@tanstack/react-router");
    throw redirect({
      to: ROUTES.AUTH.LOGIN,
      search: { redirect: location.href },
    });
  }
  return user;
}

export function requireRoles(roles: string[]) {
  return async ({ location }: { location: { href: string } }) => {
    if (typeof window === "undefined") return;
    const user = await requireAuthenticatedUser(location);
    const navRole = toNavigationRole(user.peran);
    if (navRole === undefined || !roles.includes(navRole)) {
      const { redirect } = await import("@tanstack/react-router");
      throw redirect({ to: ROUTES.HOME });
    }
  };
}

/** Guard platform administration. Tidak memberi atau memeriksa workflow role. */
export function requirePlatformRole(platformRole: PlatformRole) {
  return async ({ location }: { location: { href: string } }) => {
    if (typeof window === "undefined") return;
    const user = await requireAuthenticatedUser(location);
    if (user.platformRole !== platformRole) {
      const { redirect } = await import("@tanstack/react-router");
      throw redirect({ to: ROUTES.HOME });
    }
  };
}
