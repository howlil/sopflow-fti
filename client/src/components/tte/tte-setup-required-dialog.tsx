import { useNavigate } from "@tanstack/react-router";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ROUTES } from "@/utils/constants";

interface TteSetupRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TteSetupRequiredDialog({
  open,
  onOpenChange,
}: TteSetupRequiredDialogProps) {
  const navigate = useNavigate();

  const handleOpenProfile = () => {
    onOpenChange(false);
    navigate({ to: ROUTES.PENYUSUN.ME });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Setup TTE diperlukan"
      description="Anda perlu menyiapkan PIN dan sertifikat TTE terlebih dahulu sebelum menandatangani SOP."
      cancelLabel="Nanti"
      confirmLabel="Buka Setup TTE"
      onConfirm={handleOpenProfile}
    />
  );
}
