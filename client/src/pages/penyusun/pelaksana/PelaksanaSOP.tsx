import { useMemo, useState } from "react";
import { UserCog, Plus, Edit, Trash2 } from "lucide-react";
import {
  useCreatePelaksana,
  useDeletePelaksana,
  usePelaksana,
  useUpdatePelaksana,
} from "@/api/sop";
import { DataSurface } from "@/components/data/data-surface";
import { RowActions } from "@/components/data/row-actions";
import { SingleTextFieldDialog } from "@/components/forms/single-text-field-dialog";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { useToast } from "@/hooks/useToast";
import { hasRequiredStringFields } from "@/lib/forms/validation";
import { useAuthStore } from "@/stores/authStore";
import type { Pelaksana } from "@/types/dto/sop.dto";

const REQUIRED_PELAKSANA_FIELDS = ["namaPelaksana"] as const;

export function PelaksanaSOP() {
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const { list } = usePelaksana();
  const { mutateAsync: addPelaksana } = useCreatePelaksana();
  const { mutateAsync: updatePelaksana } = useUpdatePelaksana();
  const { mutateAsync: removePelaksana } = useDeletePelaksana();
  const userOpdId = user?.opdId;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Pelaksana | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ namaPelaksana: "" });
  const isFormValid = hasRequiredStringFields(formData, REQUIRED_PELAKSANA_FIELDS);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter((item) =>
      String(item.namaPelaksana ?? "")
        .toLowerCase()
        .includes(query),
    );
  }, [list, searchQuery]);

  if (!userOpdId) {
    return (
      <ListPageLayout
        breadcrumb={[{ label: "Manajemen Pelaksana SOP" }]}
        title="Manajemen Pelaksana SOP"
      >
        <EmptyState
          icon={<UserCog className="w-8 h-8" />}
          title="OPD tidak ditemukan"
          description="Anda belum ditetapkan ke OPD tertentu. Silakan hubungi administrator untuk ditetapkan ke OPD."
        />
      </ListPageLayout>
    );
  }

  const openEdit = (pelaksana: Pelaksana) => {
    setEditing(pelaksana);
    setFormData({ namaPelaksana: pelaksana.namaPelaksana ?? "" });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ namaPelaksana: "" });
    setEditing(null);
  };

  const handleCreate = async () => {
    if (!isFormValid) {
      showToast("Nama pelaksana wajib diisi", "error");
      return;
    }
    try {
      await addPelaksana({
        namaPelaksana: formData.namaPelaksana.trim(),
        opdId: userOpdId,
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch {
      // Toast ditangani useCreatePelaksana.
    }
  };

  const handleEdit = async () => {
    if (!editing) return;
    if (!isFormValid) {
      showToast("Nama pelaksana wajib diisi", "error");
      return;
    }
    try {
      await updatePelaksana({
        id: editing.id,
        namaPelaksana: formData.namaPelaksana.trim(),
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch {
      // Toast ditangani useUpdatePelaksana.
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await removePelaksana(deleteId);
      setDeleteId(null);
    } catch {
      // Toast ditangani useDeletePelaksana.
    }
  };

  return (
    <ListPageLayout
      breadcrumb={[{ label: "Manajemen Pelaksana SOP" }]}
      title="Manajemen Pelaksana SOP"
    >
      <DataSurface.Root>
        <DataSurface.Header>
          <DataSurface.Toolbar>
            <SearchInput
              placeholder="Cari nama pelaksana..."
              aria-label="Cari nama pelaksana..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <DataSurface.Actions>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Pelaksana
              </Button>
            </DataSurface.Actions>
          </DataSurface.Toolbar>
        </DataSurface.Header>

        <Table.Paginated data={filteredList} label="pelaksana" surfaceMode="embedded">
          {(pageData) => (
            <Table.Root>
              <Table.Table>
                <thead>
                  <Table.HeadRow>
                    <Table.Th>Nama Pelaksana</Table.Th>
                    <Table.ActionTh>Aksi</Table.ActionTh>
                  </Table.HeadRow>
                </thead>
                <tbody>
                  {pageData.length === 0 ? (
                    <EmptyState
                      asTableRow
                      colSpan={2}
                      icon={<UserCog className="w-8 h-8" />}
                      title={searchQuery.trim() ? `Tidak ada pelaksana yang cocok dengan “${searchQuery.trim()}”` : "Belum ada pelaksana"}
                      description={searchQuery.trim() ? "Ubah atau hapus kata kunci pencarian." : "Tambah pelaksana agar bisa dipilih di edit SOP (prosedur)"}
                    />
                  ) : (
                    pageData.map((pelaksana) => (
                      <Table.BodyRow key={pelaksana.id}>
                        <Table.Td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-amber-100 rounded-md flex items-center justify-center">
                              <UserCog className="w-3.5 h-3.5 text-amber-600" />
                            </div>
                            <p className="font-medium text-foreground">{pelaksana.namaPelaksana}</p>
                          </div>
                        </Table.Td>
                        <Table.ActionTd>
                          <RowActions
                            actions={[
                              { icon: Edit, title: "Edit", onClick: () => openEdit(pelaksana) },
                              {
                                icon: Trash2,
                                title: "Hapus",
                                destructive: true,
                                onClick: () => setDeleteId(pelaksana.id),
                              },
                            ]}
                          />
                        </Table.ActionTd>
                      </Table.BodyRow>
                    ))
                  )}
                </tbody>
              </Table.Table>
            </Table.Root>
          )}
        </Table.Paginated>
      </DataSurface.Root>

      <SingleTextFieldDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Tambah Pelaksana SOP"
        description="Pelaksana ini akan muncul di dropdown kolom pelaksana saat menyusun prosedur SOP"
        confirmLabel="Simpan"
        cancelLabel="Batal"
        onConfirm={handleCreate}
        confirmDisabled={!isFormValid}
        size="lg"
        label="Nama Pelaksana"
        placeholder="Contoh: Staf Administrasi"
        value={formData.namaPelaksana}
        onValueChange={(namaPelaksana) => setFormData({ ...formData, namaPelaksana })}
      />

      <SingleTextFieldDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Pelaksana SOP"
        description="Perbarui data pelaksana"
        confirmLabel="Simpan Perubahan"
        cancelLabel="Batal"
        onConfirm={handleEdit}
        confirmDisabled={!isFormValid}
        size="lg"
        label="Nama Pelaksana"
        value={formData.namaPelaksana}
        onValueChange={(namaPelaksana) => setFormData({ ...formData, namaPelaksana })}
      />

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus pelaksana SOP?"
        description="Pelaksana yang sudah dipakai di prosedur tidak dapat dihapus. Lanjutkan?"
        onConfirm={handleDeleteConfirm}
      />
    </ListPageLayout>
  );
}
