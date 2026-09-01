import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  Plus,
  Edit,
  Trash2,
  History,
} from "lucide-react";
import { DataSurface } from "@/components/data/data-surface";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { LoadingState } from "@/components/ui/loading-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { RowActions } from "@/components/data/row-actions";
import { ExpandableGroupedTable } from "@/components/data/expandable-grouped-table";
import {
  PersonNameCell,
  PersonStatusCell,
  PersonTextCell,
} from "@/components/person/person-table-cells";
import { useOpd } from "@/api/opd";
import { usePenyusun } from "@/api/penyusun";
import { PenyusunFormDialog } from "./components/PenyusunFormDialog";
import { RiwayatOpdPenyusunDialog } from "./components/RiwayatOpdPenyusunDialog";
import type { PenyusunFormData } from "./components/PenyusunFormDialog";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/utils/constants";
import type { PenyusunPublikItem, TimPenyusunOpdGrup } from "@/types/dto/tim.dto";

type PenyusunBaris = PenyusunPublikItem & { opdId: string };

function flattenGrup(grup: TimPenyusunOpdGrup[]): PenyusunBaris[] {
  return grup.flatMap((g) =>
    g.penyusun.map((p) => ({ ...p, opdId: g.opdId })),
  );
}

const emptyForm = (): PenyusunFormData => ({
  namaLengkap: "",
  nip: "",
  jabatan: "",
  pangkat: "",
  email: "",
  nohp: "",
  peranTim: "PENYUSUN",
});

export function ManajemenPenyusun() {
  const { list: opdOptions } = useOpd();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const penyusunSearch =
    debouncedSearch.trim() !== "" ? debouncedSearch.trim() : undefined;
  const {
    grup,
    isLoading,
    tambah,
    update,
    pindah,
    hapusPermanen,
    isAdding,
    isUpdating,
    isPindah,
    isDeletingPermanent,
  } = usePenyusun(penyusunSearch);

  const opdList = opdOptions.map((o) => ({ id: o.id, name: o.nama }));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hapusPermanenId, setHapusPermanenId] = useState<string | null>(null);
  const [riwayatFor, setRiwayatFor] = useState<PenyusunBaris | null>(null);
  const [editingOpdId, setEditingOpdId] = useState<string | null>(null);
  const [opdTujuanId, setOpdTujuanId] = useState("");
  const [createOpdId, setCreateOpdId] = useState<string | undefined>();
  const [formData, setFormData] = useState<PenyusunFormData>(emptyForm());

  const barisFlat = useMemo(() => flattenGrup(grup), [grup]);

  const isFormValid =
    formData.namaLengkap.trim() !== "" &&
    formData.nip.trim() !== "" &&
    formData.jabatan.trim() !== "" &&
    formData.pangkat.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.nohp.trim() !== "";

  const handleCreate = async () => {
    if (!createOpdId || !isFormValid) return;
    try {
      await tambah({
        opdId: createOpdId,
        nama: formData.namaLengkap.trim(),
        nip: formData.nip.trim(),
        peran: formData.peranTim,
        pangkat: formData.pangkat.trim(),
        jabatan: formData.jabatan.trim(),
        email: formData.email.trim(),
        nohp: formData.nohp.trim(),
      });
      setIsCreateOpen(false);
      setFormData(emptyForm());
      setCreateOpdId(undefined);
    } catch {
      /* Toast error dari usePenyusun → useMutationWithToast.onError */
    }
  };

  const handleEdit = async () => {
    if (!editingId || !isFormValid) return;
    try {
      await update({
        id: editingId,
        payload: {
          nama: formData.namaLengkap.trim(),
          nip: formData.nip.trim(),
          email: formData.email.trim(),
          jabatan: formData.jabatan.trim(),
          pangkat: formData.pangkat.trim(),
          nohp: formData.nohp.trim(),
          peran: formData.peranTim,
          status: formData.statusAkun ?? "AKTIF",
        },
      });
      setIsEditOpen(false);
      setEditingId(null);
      setEditingOpdId(null);
      setFormData(emptyForm());
    } catch {
      /* Toast error dari useMutationWithToast */
    }
  };

  const handleHapusPermanen = async () => {
    if (!hapusPermanenId) return;
    try {
      await hapusPermanen(hapusPermanenId);
      setHapusPermanenId(null);
    } catch {
      /* Toast error dari useMutationWithToast */
    }
  };

  const handlePindahFromEdit = async () => {
    if (!editingId || !opdTujuanId) return;
    try {
      await pindah({ id: editingId, opdId: opdTujuanId });
      setIsEditOpen(false);
      setEditingId(null);
      setEditingOpdId(null);
      setFormData(emptyForm());
      setOpdTujuanId("");
    } catch {
      /* Toast error dari useMutationWithToast */
    }
  };

  const openEdit = (p: PenyusunBaris) => {
    setEditingId(p.id);
    setEditingOpdId(p.opdId);
    setOpdTujuanId(
      opdList.find((o) => o.id !== p.opdId)?.id ?? "",
    );
    setFormData({
      namaLengkap: p.nama,
      nip: p.nip,
      jabatan: p.jabatan,
      pangkat: p.pangkat,
      email: p.email,
      nohp: p.nohp,
      peranTim: p.peran,
      statusAkun: p.status,
    });
    setIsEditOpen(true);
  };

  return (
    <ListPageLayout
      breadcrumb={[
        {
          label: "Manajemen penyusun",
          to: ROUTES.PJ_EVALUATOR.PENYUSUN,
        },
      ]}
      title="Manajemen penyusun"
    >
      <DataSurface.Root>
        <DataSurface.Header>
          <DataSurface.Toolbar>
            <SearchInput
              placeholder="Cari nama, NIP, atau email..."
              aria-label="Cari nama, NIP, atau email..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <DataSurface.Actions>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  setFormData(emptyForm());
                  setCreateOpdId(undefined);
                  setIsCreateOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Penyusun
              </Button>
            </DataSurface.Actions>
          </DataSurface.Toolbar>
        </DataSurface.Header>

        {isLoading ? (
          <div className="p-card">
            <LoadingState message="Memuat data penyusun…" />
          </div>
        ) : (
          <>
            <ExpandableGroupedTable
              groups={grup}
              getGroupId={(g) => g.opdId}
              renderGroupTitle={(g) => g.namaOpd}
              renderGroupMeta={(g) => `${g.penyusun.length} penyusun`}
              surfaceMode="embedded"
              renderRows={(g) => (
                <Table.Table>
                  <thead>
                    <Table.HeadRow>
                      <Table.Th>Penyusun</Table.Th>
                      <Table.Th>Jabatan</Table.Th>
                      <Table.Th>Kontak</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.ActionTh>Aksi</Table.ActionTh>
                    </Table.HeadRow>
                  </thead>
                  <tbody>
                    {g.penyusun.map((p) => {
                      const row: PenyusunBaris = { ...p, opdId: g.opdId };
                      return (
                        <Table.BodyRow key={p.id}>
                          <Table.Td className="min-w-[15rem]">
                            <PersonNameCell name={p.nama} avatarText={p.nama[0]}>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className="h-5 w-fit px-1.5 text-[10px]">
                                  {p.peran === "PJ_PENYUSUN"
                                    ? "PJ Penyusun"
                                    : "Penyusun"}
                                </Badge>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {p.nip}
                                </span>
                              </div>
                            </PersonNameCell>
                          </Table.Td>
                          <Table.Td className="min-w-[12rem] max-w-[18rem]">
                            <PersonTextCell value={p.jabatan} />
                          </Table.Td>
                          <Table.Td className="min-w-[15rem] max-w-[20rem]">
                            <div className="min-w-0 space-y-0.5">
                              <p
                                className="truncate text-secondary-foreground"
                                title={p.email}
                              >
                                {p.email}
                              </p>
                              <p
                                className="truncate font-mono text-[11px] text-muted-foreground"
                                title={p.nohp}
                              >
                                {p.nohp}
                              </p>
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <PersonStatusCell status={p.status} />
                          </Table.Td>
                          <Table.ActionTd>
                            <RowActions
                              align="end"
                              actions={[
                                {
                                  icon: History,
                                  title: "Riwayat OPD",
                                  onClick: () => setRiwayatFor(row),
                                },
                                {
                                  icon: Edit,
                                  title: "Edit",
                                  onClick: () => openEdit(row),
                                },
                                {
                                  icon: Trash2,
                                  title: "Hapus permanen",
                                  destructive: true,
                                  onClick: () => setHapusPermanenId(p.id),
                                },
                              ]}
                            />
                          </Table.ActionTd>
                        </Table.BodyRow>
                      );
                    })}
                  </tbody>
                </Table.Table>
              )}
            />

            {barisFlat.length === 0 ? (
              <div className="px-card py-8 text-center text-sm text-muted-foreground">
                {searchQuery.trim()
                  ? `Tidak ada penyusun yang cocok dengan “${searchQuery.trim()}”.`
                  : "Belum ada data penyusun. Klik Tambah Penyusun untuk menambah."}
              </div>
            ) : null}
          </>
        )}
      </DataSurface.Root>

      <PenyusunFormDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setFormData(emptyForm());
            setCreateOpdId(undefined);
          }
        }}
        formData={formData}
        setFormData={setFormData}
        createOpdId={createOpdId ?? ""}
        setCreateOpdId={(id) => setCreateOpdId(id || undefined)}
        opdList={opdList}
        isFormValid={isFormValid}
        onConfirm={handleCreate}
        confirmDisabled={isAdding}
        confirmLabel={isAdding ? "Menyimpan..." : "Simpan"}
      />

      <PenyusunFormDialog
        mode="edit"
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditingId(null);
            setEditingOpdId(null);
            setFormData(emptyForm());
            setOpdTujuanId("");
          }
        }}
        formData={formData}
        setFormData={setFormData}
        createOpdId={createOpdId ?? ""}
        setCreateOpdId={(id) => setCreateOpdId(id || undefined)}
        opdList={opdList}
        isFormValid={isFormValid}
        onConfirm={handleEdit}
        confirmDisabled={isUpdating}
        confirmLabel={isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
        editingOpdId={editingOpdId ?? undefined}
        opdTujuanId={opdTujuanId}
        setOpdTujuanId={setOpdTujuanId}
        onConfirmPindah={handlePindahFromEdit}
        pindahConfirmDisabled={isPindah}
      />

      <ConfirmDialog
        open={hapusPermanenId != null}
        onOpenChange={(open) => !open && setHapusPermanenId(null)}
        title="Hapus penyusun permanen?"
        description="Hanya dapat dihapus jika tidak ada data SOP, komentar, evaluasi, atau jabatan OPD yang masih mereferensi pengguna ini."
        onConfirm={handleHapusPermanen}
        confirmLabel={
          isDeletingPermanent ? "Menghapus..." : "Hapus permanen"
        }
      />

      <RiwayatOpdPenyusunDialog
        open={riwayatFor != null}
        onOpenChange={(open) => !open && setRiwayatFor(null)}
        penggunaId={riwayatFor?.id ?? null}
        namaPenyusun={riwayatFor?.nama ?? ""}
      />
    </ListPageLayout>
  );
}
