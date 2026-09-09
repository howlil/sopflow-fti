/**
 * Dialog Buat SOP Baru — hanya untuk Anggota Proses Bisnis/Penyusun SOP.
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
import { useMyAuthoringProsesBisnises } from "@/api/konteks-proses-bisnis";

export interface BuatSOPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { prosesBisnisId: string; judul: string; nomorSop: string }) => Promise<void>;
}

const EMPTY_FORM = {
  prosesBisnisId: "",
  judulSOP: "",
  nomorSop: "",
};

export function BuatSOPDialog({ open, onOpenChange, onCreate }: BuatSOPDialogProps) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const { data: prosesBisnis = [], isLoading: isLoadingProsesBisnises } = useMyAuthoringProsesBisnises();
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!formData.prosesBisnisId || !formData.judulSOP.trim() || !formData.nomorSop.trim()) {
      showToast("Pilih Proses Bisnis dan lengkapi Judul serta Nomor SOP", "error");
      return;
    }

    try {
      await onCreate({
        prosesBisnisId: formData.prosesBisnisId,
        judul: formData.judulSOP.trim(),
        nomorSop: formData.nomorSop.trim(),
      });
      onOpenChange(false);
      setFormData(EMPTY_FORM);
    } catch {
      // Mutation toast owns error presentation.
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setFormData(EMPTY_FORM);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Buat SOP</DialogTitle>
          <DialogDescription className="text-xs">
            Hanya Penyusun SOP yang terdaftar sebagai Anggota Proses Bisnis yang dapat membuat dan mengedit SOP.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <FormField label="Proses Bisnis" required>
            <select
              className="h-9 w-full rounded-control border border-border bg-surface px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.prosesBisnisId}
              disabled={isLoadingProsesBisnises}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, prosesBisnisId: event.target.value }))
              }
            >
              <option value="">
                {isLoadingProsesBisnises ? "Memuat Proses Bisnis..." : "Pilih Proses Bisnis"}
              </option>
              {prosesBisnis.map((process) => (
                <option key={process.prosesBisnisId} value={process.prosesBisnisId}>
                  {process.nama} · {process.lingkup === "FACULTY" ? "Fakultas" : process.departemen?.nama ?? "Departemen"}
                </option>
              ))}
            </select>
            {!isLoadingProsesBisnises && prosesBisnis.length === 0 ? (
              <p className="mt-1 text-xs text-secondary-foreground">
                Anda belum terdaftar sebagai Penyusun SOP pada Proses Bisnis aktif.
              </p>
            ) : null}
          </FormField>
          <FormField label="Judul SOP" required>
            <Input
              className="h-9 text-xs"
              placeholder="Contoh: SOP Pelayanan Tugas Akhir"
              value={formData.judulSOP}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, judulSOP: event.target.value }))
              }
            />
          </FormField>
          <FormField label="Nomor SOP" required>
            <Input
              className="h-9 text-xs"
              placeholder="Contoh: FTI/TA/001/2026"
              value={formData.nomorSop}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, nomorSop: event.target.value }))
              }
            />
          </FormField>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleOpenChange(false)}>
            Batal
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleSubmit} disabled={prosesBisnis.length === 0}>
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Buat SOP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
