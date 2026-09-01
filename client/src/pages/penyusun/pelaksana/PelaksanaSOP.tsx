import { useMemo, useState } from "react";
import { UserCog, Plus, Edit, Trash2 } from "lucide-react";
import {
  type GlobalPelaksana,
  useCreateGlobalPelaksana,
  useDeleteGlobalPelaksana,
  useGlobalPelaksana,
  useUpdateGlobalPelaksana,
} from "@/api/pelaksana";
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

const REQUIRED_PELAKSANA_FIELDS = ["namaPelaksana"] as const;

function formatAuditTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PelaksanaSOP() {
  const { showToast } = useToast();
  const { list } = useGlobalPelaksana();
  const { mutateAsync: addPelaksana } = useCreateGlobalPelaksana();
  const { mutateAsync: updatePelaksana } = useUpdateGlobalPelaksana();
  const { mutateAsync: removePelaksana } = useDeleteGlobalPelaksana();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GlobalPelaksana | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ namaPelaksana: "" });
  const isFormValid = hasRequiredStringFields(formData, REQUIRED_PELAKSANA_FIELDS);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter((item) => item.namaPelaksana.toLowerCase().includes(query));
  }, [list, searchQuery]);

  const openEdit = (pelaksana: GlobalPelaksana) => {
    setEditing(pelaksana);
    setFormData({ namaPelaksana: pelaksana.namaPelaksana });
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
      await addPelaksana(formData.namaPelaksana.trim());
      setIsCreateDialogOpen(false);
      resetForm();
    } catch {
      // Toast ditangani hook mutation.
    }
  };

  const handleEdit = async () => {
    if (!editing) return;
    if (!isFormValid) {
      showToast("Nama pelaksana wajib diisi", "error");
      return;
    }
    try {
      await updatePelaksana({ id: editing.id, namaPelaksana: formData.namaPelaksana.trim() });
      setIsEditDialogOpen(false);
      resetForm();
    } catch {
      // Toast ditangani hook mutation.
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await removePelaksana(deleteId);
      setDeleteId(null);
    } catch {
      // Toast ditangani hook mutation.
    }
  };

  return (
    <ListPageLayout
      breadcrumb={[{ label: "Katalog Pelaksana" }]}
      title="Katalog Pelaksana"
      description="Actor SOP reusable lintas Process dan Departemen. Perubahan master tidak mengubah label pada versi SOP yang sudah tersimpan."
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
                    <Table.Th>Dibuat Oleh</Table.Th>
                    <Table.Th>Terakhir Diedit</Table.Th>
                    <Table.ActionTh>Aksi</Table.ActionTh>
                  </Table.HeadRow>
                </thead>
                <tbody>
                  {pageData.length === 0 ? (
                    <EmptyState
                      asTableRow
                      colSpan={4}
                      icon={<UserCog className="w-8 h-8" />}
                      title={searchQuery.trim() ? `Tidak ada pelaksana yang cocok dengan “${searchQuery.trim()}”` : "Belum ada pelaksana"}
                      description={searchQuery.trim() ? "Ubah atau hapus kata kunci pencarian." : "Tambahkan actor reusable untuk dipilih pada prosedur SOP."}
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
                        <Table.Td>
                          <div className="text-sm">
                            <div>{pelaksana.createdBy?.nama ?? "Data legacy"}</div>
                            <div className="text-xs text-muted-foreground">{formatAuditTime(pelaksana.createdAt)}</div>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <div className="text-sm">
                            <div>{pelaksana.updatedBy?.nama ?? "Belum tercatat"}</div>
                            <div className="text-xs text-muted-foreground">{formatAuditTime(pelaksana.updatedAt)}</div>
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
        title="Tambah Pelaksana"
        description="Actor ini tersedia untuk seluruh Process dan SOP."
        confirmLabel="Simpan"
        cancelLabel="Batal"
        onConfirm={handleCreate}
        confirmDisabled={!isFormValid}
        size="lg"
        label="Nama Pelaksana"
        placeholder="Contoh: Dosen"
        value={formData.namaPelaksana}
        onValueChange={(namaPelaksana) => setFormData({ ...formData, namaPelaksana })}
      />

      <SingleTextFieldDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Pelaksana"
        description="Perubahan berlaku untuk pemilihan berikutnya; versi SOP menyimpan label snapshot."
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
        title="Hapus pelaksana?"
        description="Pelaksana yang sudah dipakai di prosedur tidak dapat dihapus. Lanjutkan?"
        onConfirm={handleDeleteConfirm}
      />
    </ListPageLayout>
  );
}
