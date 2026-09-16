import { useState, useMemo } from "react";
import { Eye, Edit, Plus, FileText, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { ActiveFilterChips } from "@/components/data/active-filter-chips";
import { DataSurface } from "@/components/data/data-surface";
import { FilterDropdownButton } from "@/components/data/filter-dropdown-button";
import { DateRangeFilterFields } from "@/pages/sop/components/date-range-filter-fields";
import { RowActions } from "@/components/data/row-actions";
import {
  SopNumberCell,
  SopPrimaryCell,
  SopStatusCell,
  SopUpdatedByCell,
  SopVersionCell,
} from "@/components/sop/sop-table-cells";
import { ROUTES } from "@/utils/constants";
import type { StatusSOP } from "@/types/dto/sop.dto";
import { SOPStatusFilterSelect } from "@/components/sop/sop-status-filter-select";
import { SOP_STATUS_FILTER_OPTIONS } from "@/lib/status/sop-status.config";
import { BuatSOPDialog } from "@/pages/sop/components/BuatSOPDialog";
import {
  canEditSop,
  useDaftarSopData,
  useSopSuspense,
} from "@/api/sop";
import type { SopListQueryParams } from "@/types/dto/sop.dto";
import { useDaftarSopFilters } from "@/pages/sop/hooks/use-daftar-sop-filters";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { SopDaftarRow } from "@/types/dto/sop.dto";
import { canHapusSopDraftAwal, useHapusSopDraftAwal } from "@/api/sop";
import { useMyProsesBisnises } from "@/api/konteks-proses-bisnis";
import { useAuthStore } from "@/stores/authStore";
import { useSubmitPaketPemeriksaanProsesBisnis } from "@/api/pemeriksaan-proses-bisnis";

type ProsesBisnisAwareSopRow = SopDaftarRow & { namaProsesBisnis?: string | null };

const formatFilterDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

export function ManajemenSOP() {
  useDocumentTitle("SOP");
  const filterStatusId = "filter-status-sop";
  const filterTanggalDariId = "filter-tanggal-dari-sop";
  const filterTanggalSampaiId = "filter-tanggal-sampai-sop";
  const filters = useDaftarSopFilters();
  const sopListParams = useMemo((): SopListQueryParams | undefined => {
    const status =
      filters.filterStatus && filters.filterStatus !== "all"
        ? filters.filterStatus
        : undefined;
    const tanggalDari = filters.filterTanggalDari?.trim() || undefined;
    const tanggalSampai = filters.filterTanggalSampai?.trim() || undefined;
    if (!status && !tanggalDari && !tanggalSampai) {
      return undefined;
    }
    return { status, tanggalDari, tanggalSampai };
  }, [filters.filterStatus, filters.filterTanggalDari, filters.filterTanggalSampai]);
  const { list: listFilteredByServer, create } = useSopSuspense(sopListParams);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { data: prosesBisnisSaya = [], isLoading: isLoadingProsesBisnis } = useMyProsesBisnises();
  const prosesBisnisYangDimiliki = useMemo(
    () => prosesBisnisSaya.filter((prosesBisnis) => prosesBisnis.penanggungJawabId === currentUserId),
    [currentUserId, prosesBisnisSaya],
  );
  const { filteredList } = useDaftarSopData({
    list: listFilteredByServer,
    searchQuery: filters.searchQuery,
  });

  const [isBuatSOPDialogOpen, setIsBuatSOPDialogOpen] = useState(false);
  const [sopDraftToDelete, setSopDraftToDelete] = useState<SopDaftarRow | null>(null);
  const [selectedDetailSopIds, setSelectedDetailSopIds] = useState<string[]>([]);
  const hapusSopDraft = useHapusSopDraftAwal();
  const submitPaket = useSubmitPaketPemeriksaanProsesBisnis();
  const selectedProsesBisnisId = useMemo(() => {
    const selected = new Set(selectedDetailSopIds);
    return listFilteredByServer.find((sop) => sop.detailSopId && selected.has(sop.detailSopId))?.prosesBisnisId;
  }, [listFilteredByServer, selectedDetailSopIds]);
  const canSubmitStatus = (status: string) => status === "DRAFT" || status === "REVISION_REQUIRED";
  const isSelectable = (sop: SopDaftarRow) =>
    sop.detailSopId !== null &&
    canSubmitStatus(sop.status) &&
    (selectedProsesBisnisId === undefined || selectedProsesBisnisId === sop.prosesBisnisId);
  const toggleSelection = (sop: SopDaftarRow) => {
    if (!isSelectable(sop) || sop.detailSopId === null) return;
    setSelectedDetailSopIds((current) =>
      current.includes(sop.detailSopId!)
        ? current.filter((id) => id !== sop.detailSopId)
        : [...current, sop.detailSopId!],
    );
  };

  const statusLabel = filters.filterStatus
    ? SOP_STATUS_FILTER_OPTIONS.find((option) => option.value === filters.filterStatus)?.label ??
      filters.filterStatus
    : null;
  const activeFilterItems = [
    ...(filters.filterStatus && filters.filterStatus !== "all"
      ? [
          {
            id: "status",
            label: `Status: ${statusLabel}`,
            onRemove: () => filters.setStatusFilter(null),
          },
        ]
      : []),
    ...(filters.filterTanggalDari
      ? [
          {
            id: "tanggal-dari",
            label: `Dari: ${formatFilterDate(filters.filterTanggalDari)}`,
            onRemove: () => filters.setFilterTanggalDari(null),
          },
        ]
      : []),
    ...(filters.filterTanggalSampai
      ? [
          {
            id: "tanggal-sampai",
            label: `Sampai: ${formatFilterDate(filters.filterTanggalSampai)}`,
            onRemove: () => filters.setFilterTanggalSampai(null),
          },
        ]
      : []),
  ];
  const hasSearch = filters.searchQuery.trim().length > 0;
  const hasAdvancedFilters = filters.activeFilterCount > 0;

  return (
    <ListPageLayout
      breadcrumb={[{ label: "SOP" }]}
      title="SOP"
    >
      <DataSurface.Root>
        <DataSurface.Header>
          <DataSurface.Toolbar>
            <SearchInput
              placeholder="Cari judul atau nomor SOP..."
              aria-label="Cari judul atau nomor SOP..."
              value={filters.searchQuery}
              onChange={(event) => filters.setSearchQuery(event.target.value)}
            />
            <FilterDropdownButton
              open={filters.isFilterOpen}
              onOpenChange={filters.setIsFilterOpen}
              activeCount={filters.activeFilterCount}
            >
              <div className="space-y-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">
                    Penyaringan SOP
                  </p>
                  {filters.activeFilterCount > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={filters.clearFilters}
                    >
                      Atur ulang
                    </Button>
                  ) : null}
                </div>
                <FormField label="Status" htmlFor={filterStatusId}>
                  <SOPStatusFilterSelect
                    id={filterStatusId}
                    value={filters.filterStatus ?? "all"}
                    onValueChange={filters.setStatusFilter}
                  />
                </FormField>
                <FormField label="Terakhir diperbarui">
                  <DateRangeFilterFields
                    fromId={filterTanggalDariId}
                    toId={filterTanggalSampaiId}
                    fromValue={filters.filterTanggalDari ?? ""}
                    toValue={filters.filterTanggalSampai ?? ""}
                    onFromChange={filters.setFilterTanggalDari}
                    onToChange={filters.setFilterTanggalSampai}
                  />
                </FormField>
              </div>
            </FilterDropdownButton>
            {selectedDetailSopIds.length > 0 ? (
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={submitPaket.isPending}
                onClick={() => {
                  submitPaket.mutate(selectedDetailSopIds, {
                    onSuccess: () => setSelectedDetailSopIds([]),
                  });
                }}
              >
                <Send className="h-3.5 w-3.5" />
                Ajukan untuk Pemeriksaan ({selectedDetailSopIds.length})
              </Button>
            ) : null}
            {prosesBisnisYangDimiliki.length > 0 ? (
              <DataSurface.Actions>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setIsBuatSOPDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambahkan SOP Baru
                </Button>
              </DataSurface.Actions>
            ) : null}
          </DataSurface.Toolbar>
          {activeFilterItems.length > 0 ? (
            <DataSurface.FilterRow>
              <ActiveFilterChips
                items={activeFilterItems}
                onClearAll={filters.clearFilters}
              />
            </DataSurface.FilterRow>
          ) : null}
        </DataSurface.Header>

        <Table.Paginated data={filteredList} label="SOP" surfaceMode="embedded">
          {(pageData) => (
            <Table.Root>
              <Table.Table>
                <thead>
                  <Table.HeadRow>
                    <Table.Th className="w-10">
                      <span className="sr-only">Pilih</span>
                    </Table.Th>
                    <Table.Th>Judul SOP</Table.Th>
                    <Table.Th>Nomor SOP</Table.Th>
                    <Table.Th>Versi</Table.Th>
                    <Table.Th>Pembuat</Table.Th>
                    <Table.Th>Terakhir diedit</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.ActionTh>Aksi</Table.ActionTh>
                  </Table.HeadRow>
                </thead>
                <tbody>
                  {pageData.length === 0 ? (
                    <EmptyState
                      asTableRow
                      colSpan={8}
                      icon={<FileText />}
                      title={
                        hasSearch
                          ? `Tidak ada SOP yang cocok dengan “${filters.searchQuery.trim()}”`
                          : hasAdvancedFilters
                            ? "Tidak ada SOP dengan penyaringan yang dipilih"
                            : "Belum ada SOP"
                      }
                      description={
                        hasSearch
                          ? "Ubah atau hapus kata kunci pencarian."
                          : hasAdvancedFilters
                            ? "Hapus atau ubah penyaringan untuk memperluas hasil."
                            : prosesBisnisYangDimiliki.length > 0
                              ? "Tambahkan SOP baru dari Proses Bisnis yang menjadi tanggung jawab Anda."
                              : "SOP akan tampil setelah diinisiasi oleh Penanggung Jawab Proses Bisnis."
                      }
                    />
                  ) : (
                    pageData.map((sop) => {
                      const namaProsesBisnis = (sop as ProsesBisnisAwareSopRow).namaProsesBisnis;
                      return (
                        <Table.BodyRow key={sop.id}>
                          <Table.Td>
                            <input
                              type="checkbox"
                              aria-label={`Pilih ${sop.judul}`}
                              checked={sop.detailSopId !== null && selectedDetailSopIds.includes(sop.detailSopId)}
                              disabled={!isSelectable(sop)}
                              onChange={() => toggleSelection(sop)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                          </Table.Td>
                          <Table.Td>
                            <div className="space-y-0.5">
                              <SopPrimaryCell title={sop.judul} />
                              {namaProsesBisnis ? (
                                <p className="text-xs text-secondary-foreground">
                                  Proses Bisnis: {namaProsesBisnis}
                                </p>
                              ) : null}
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <SopNumberCell value={sop.nomorSop} />
                          </Table.Td>
                          <Table.Td>
                            <SopVersionCell value={sop.versi} />
                          </Table.Td>
                          <Table.Td>
                            <p className="text-secondary-foreground">{sop.pembuat ?? "—"}</p>
                          </Table.Td>
                          <Table.Td>
                            <SopUpdatedByCell
                              name={sop.terakhirDiedit.nama}
                              date={sop.terakhirDiedit.waktu}
                            />
                          </Table.Td>
                          <Table.Td>
                            <SopStatusCell
                              status={sop.status}
                              label={sop.statusLabel}
                            />
                          </Table.Td>
                          <Table.ActionTd>
                            <RowActions
                              actions={[
                                sop.status && canEditSop(sop.status as StatusSOP)
                                  ? {
                                      icon: Edit,
                                      to: ROUTES.DETAIL_SOP,
                                      params: { id: sop.detailSopId ?? sop.id },
                                      title: "Ubah",
                                    }
                                  : {
                                      icon: Eye,
                                      to: ROUTES.DETAIL_SOP,
                                      params: { id: sop.detailSopId ?? sop.id },
                                      title: "Lihat",
                                    },
                                ...(canHapusSopDraftAwal(sop)
                                  ? [
                                      {
                                        icon: Trash2,
                                        title: "Hapus rancangan SOP",
                                        destructive: true,
                                        onClick: () => setSopDraftToDelete(sop),
                                      },
                                    ]
                                  : []),
                              ]}
                            />
                          </Table.ActionTd>
                        </Table.BodyRow>
                      );
                    })
                  )}
                </tbody>
              </Table.Table>
            </Table.Root>
          )}
        </Table.Paginated>
      </DataSurface.Root>

      <BuatSOPDialog
        open={isBuatSOPDialogOpen && prosesBisnisYangDimiliki.length > 0}
        onOpenChange={setIsBuatSOPDialogOpen}
        prosesBisnis={prosesBisnisYangDimiliki}
        isLoadingProsesBisnis={isLoadingProsesBisnis}
        onCreate={async (data) => {
          await create({
            prosesBisnisId: data.prosesBisnisId,
            judul: data.judul,
            nomorSop: data.nomorSop,
          });
        }}
      />

      <ConfirmDialog
        open={sopDraftToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSopDraftToDelete(null);
        }}
        title="Hapus rancangan SOP?"
        description="Rancangan SOP akan dihapus permanen beserta data yang sudah diisi. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus rancangan"
        destructive
        onConfirm={() => {
          if (sopDraftToDelete?.detailSopId == null) return;
          hapusSopDraft.mutate(sopDraftToDelete.detailSopId, {
            onSuccess: () => setSopDraftToDelete(null),
          });
        }}
      />
    </ListPageLayout>
  );
}
