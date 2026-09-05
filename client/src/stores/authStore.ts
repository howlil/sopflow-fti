import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api/api-client";
import type {
  LoginApiResponse,
  PublicPenggunaLoginData,
  PublicPenggunaTteStatus,
} from "@/types/dto/auth.dto";
import type { PlatformRole } from "@/types/dto/access.dto";
import { ROUTES } from "@/utils/constants";

/**
 * First-party FTI identity only. Workflow capability is intentionally absent:
 * Process relationship and Organizational Authority are resolved by their APIs.
 */
export type AuthUser = {
  id: string;
  email: string;
  nama: string;
  platformRole: PlatformRole;
  nip: string;
  jabatan: string;
  pangkat: string;
  nohp: string;
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
      logout: () => set({ user: null }),
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
    platformRole: u.platformRole,
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

export function requirePlatformRole(platformRole: PlatformRole) {
  return async ({ location }: { location: { href: string } }) => {
    if (typeof window === "undefined") return;
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
    if (user.platformRole !== platformRole) {
      const { redirect } = await import("@tanstack/react-router");
      throw redirect({ to: ROUTES.HOME });
    }
  };
}
