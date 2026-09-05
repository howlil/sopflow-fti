/**
 * Deprecated UI compatibility shim.
 *
 * First-party FTI capability must come from Process relationships,
 * Organizational Authority, or Platform Role. Auth state intentionally has no
 * legacy workflow role. Keep these helpers temporarily only for old consumers
 * while they are retired; no native surface should branch on them.
 */
import { useAuthStore } from "@/stores/authStore";
import { ROLES, ROLE_LABELS } from "@/utils/constants";
import type { RoleKey } from "@/types/dto/access.dto";

export { ROLES };

export function useAppRole() {
  const user = useAuthStore((state) => state.user);
  const role: RoleKey | undefined = undefined;

  const getRoleLabel = (r: RoleKey) => ROLE_LABELS[r] ?? r;
  const getRoleNip = () => user?.nip ?? "";
  const getRoleUserName = () => user?.nama ?? "";
  const getRoleDisplayName = () => user?.nama ?? "";

  return {
    role,
    user,
    getRoleLabel,
    getRoleNip,
    getRoleUserName,
    getRoleDisplayName,
    isPjEvaluator: false,
    isEvaluator: false,
    isKepalaOPD: false,
    isPenyusun: false,
    isPjPenyusun: false,
  };
}
