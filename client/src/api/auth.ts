import { apiClient } from "@/lib/api/api-client";
import type {
  ApiSuccessResponse,
  ChangePasswordDto,
  LoginApiResponse,
  LoginRequestDto,
  UpdateMyPhoneDto,
} from "@/types/dto/auth.dto";

export const authApi = {
  login: (payload: LoginRequestDto) =>
    apiClient.post<LoginApiResponse>("/auth/login", {
      email: payload.email,
      password: payload.kataSandi,
    }),
  me: () => apiClient.get<LoginApiResponse>("/auth/me"),
  updateMyPhone: (payload: UpdateMyPhoneDto) =>
    apiClient.patch<LoginApiResponse>("/auth/me/nohp", payload),
  refresh: () =>
    apiClient.post<{ message: string; success: boolean; data: { success: true } }>("/auth/refresh"),
  changePassword: (payload: ChangePasswordDto) =>
    apiClient.patch<ApiSuccessResponse<{ success: true }>>("/auth/change-password", payload),
  logout: async () => {
    try {
      await apiClient.post<{ message: string }>("/auth/logout");
    } catch {
      // Continue with local cleanup even if server call fails.
    }
  },
};

import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/config/query-client";
import { useAuthStore, ensureAuthHydrated, mapPublicDataToAuthUser } from "@/stores/authStore";
import { useToast, showErrorMessages } from "@/hooks/useToast";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { navigateToAppPath, resolvePostLoginPath } from "@/utils/app-routing";
import { ROUTES } from "@/utils/constants";

export function useAuth() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ strict: false }) as { redirect?: string };
  const { showToast } = useToast();
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequestDto) => authApi.login(payload),
    onSuccess: async (response) => {
      const u = response.data;
      queryClient.clear();
      setUser(mapPublicDataToAuthUser(u));
      showToast(`Selamat datang, ${u.nama}!`, "success");
      const resolveLanding = () => (redirect ? resolvePostLoginPath(redirect) : ROUTES.WORK);
      try {
        await ensureAuthHydrated(1000);
        navigateToAppPath(navigate, resolveLanding());
      } catch {
        setTimeout(() => navigateToAppPath(navigate, resolveLanding()), 100);
      }
    },
    onError: (error: Error) => showErrorMessages(error, "Login gagal"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordDto) => authApi.changePassword(payload),
    onSuccess: () => showToast("Kata sandi berhasil diubah", "success"),
    onError: (error: Error) => showErrorMessages(error, "Gagal mengubah kata sandi"),
  });

  const updateMyPhoneMutation = useMutation({
    mutationFn: (payload: UpdateMyPhoneDto) => authApi.updateMyPhone(payload),
    onSuccess: (response) => {
      setUser(mapPublicDataToAuthUser(response.data));
      showToast("Nomor HP berhasil diperbarui", "success");
    },
    onError: (error: Error) => showErrorMessages(error, "Gagal memperbarui nomor HP"),
  });

  const logoutHandler = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue client cleanup even if the server call fails.
    }
    logout();
    queryClient.clear();
  };

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    updateMyPhone: updateMyPhoneMutation.mutateAsync,
    isUpdatingMyPhone: updateMyPhoneMutation.isPending,
    logout: logoutHandler,
  };
}
