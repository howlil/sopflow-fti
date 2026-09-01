/**
 * Dialog Buat SOP Baru — Process + judul + nomor SOP; server membuat header + DetailSOP v1 (DRAFT).
 */
import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { useMyProcesses } from "@/api/process-context";

export interface BuatSOPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pemanggilan mutasi create SOP (toast/error di parent). */
  onCreate: (data: { processId: string; judul: string; nomorSop: string }) => Promise<void>;
}

const EMPTY_FORM = {
  processId: "",
  judulSOP: "",
  nomorSop: "",
};

export function BuatSOPDialog({
  open,
  onOpenChange,
  onCreate,
}: BuatSOPDialogProps) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const { data: processes = [], isLoading: isLoadingProcesses } = useMyProcesses();
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!formData.processId || !formData.judulSOP?.trim() || !formData.nomorSop?.trim()) {
      showToast("Mohon pilih Process dan lengkapi Judul serta Nomor SOP", "error");
      return;
    }

    const data = {
      processId: formData.processId,
      judul: formData.judulSOP.trim(),
      nomorSop: formData.nomorSop.trim(),
    };

    try {
      await onCreate(data);
      onOpenChange(false);
      setFormData(EMPTY_FORM);
    } catch {
      // Error toast sudah ditangani useMutationWithToast di parent
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setFormData(EMPTY_FORM);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Buat SOP Baru</DialogTitle>
          <DialogDescription className="text-xs">
            SOP harus dibuat di Process tempat Anda menjadi Process Owner atau Member.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <FormField label="Process" required>
            <select
              className="h-9 w-full rounded-control border border-border bg-surface px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.processId}
              disabled={isLoadingProcesses}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, processId: event.target.value }))
              }
            >
              <option value="">
                {isLoadingProcesses ? "Memuat Process..." : "Pilih Process"}
              </option>
              {processes.map((process) => (
                <option key={process.processId} value={process.processId}>
                  {process.nama} · {process.scope === "FACULTY" ? "Faculty" : process.department?.nama ?? "Department"}
                </option>
              ))}
            </select>
            {!isLoadingProcesses && processes.length === 0 ? (
              <p className="mt-1 text-xs text-secondary-foreground">
                Anda belum ditugaskan sebagai Process Owner atau Member.
              </p>
            ) : null}
          </FormField>
          <FormField label="Judul SOP" required>
            <Input
              className="h-9 text-xs"
              placeholder="Contoh: SOP Pelayanan Tugas Akhir"
              value={formData.judulSOP}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, judulSOP: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Nomor SOP" required>
            <Input
              className="h-9 text-xs"
              placeholder="Contoh: FTI/TA/001/2026"
              value={formData.nomorSop}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nomorSop: e.target.value }))
              }
            />
          </FormField>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => handleOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleSubmit}
            disabled={processes.length === 0}
          >
            <FileText className="w-3.5 h-3.5" />
            Buat SOP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
