import { useState, useMemo } from "react";
import { Eye, Edit, Plus, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { ActiveFilterChips } from "@/components/data/active-filter-chips";
import { DataSurface } from "@/components/data/data-surface";
import { FilterDropdownButton } from "@/components/data/filter-dropdown-button";
import { DateRangeFilterFields } from "@/pages/penyusun/sop/components/date-range-filter-fields";
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
import { BuatSOPDialog } from "@/pages/penyusun/sop/components/BuatSOPDialog";
import {
  canEditSop,
  useDaftarSopData,
  useSopSuspense,
} from "@/api/sop";
import type { SopListQueryParams } from "@/types/dto/sop.dto";
import { useDaftarSopFilters } from "@/pages/penyusun/sop/hooks/use-daftar-sop-filters";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { SopDaftarRow } from "@/types/dto/sop.dto";
import { canHapusSopDraftAwal, useHapusSopDraftAwal } from "@/api/sop";

type ProcessAwareSopRow = SopDaftarRow & { processNama?: string | null };

const formatFilterDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

export function ManajemenSOP() {
  useDocumentTitle("Manajemen SOP — Penyusun");
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
  const { filteredList } = useDaftarSopData({
    list: listFilteredByServer,
    searchQuery: filters.searchQuery,
  });

  const [isBuatSOPDialogOpen, setIsBuatSOPDialogOpen] = useState(false);
  const [sopDraftToDelete, setSopDraftToDelete] = useState<SopDaftarRow | null>(null);
  const hapusSopDraft = useHapusSopDraftAwal();

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
      breadcrumb={[{ label: "Manajemen SOP" }]}
      title="Manajemen SOP"
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
                    Filter SOP
                  </p>
                  {filters.activeFilterCount > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={filters.clearFilters}
                    >
                      Reset
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
            <DataSurface.Actions>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setIsBuatSOPDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Buat SOP Baru
              </Button>
            </DataSurface.Actions>
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
                      colSpan={7}
                      icon={<FileText />}
                      title={
                        hasSearch
                          ? `Tidak ada SOP yang cocok dengan “${filters.searchQuery.trim()}”`
                          : hasAdvancedFilters
                            ? "Tidak ada SOP dengan filter yang dipilih"
                            : "Belum ada SOP"
                      }
                      description={
                        hasSearch
                          ? "Ubah atau hapus kata kunci pencarian."
                          : hasAdvancedFilters
                            ? "Hapus atau ubah filter untuk memperluas hasil."
                            : "Buat SOP baru untuk mulai menyusun dokumen."
                      }
                    />
                  ) : (
                    pageData.map((sop) => {
                      const processNama = (sop as ProcessAwareSopRow).processNama;
                      return (
                        <Table.BodyRow key={sop.id}>
                          <Table.Td>
                            <div className="space-y-0.5">
                              <SopPrimaryCell title={sop.judul} />
                              {processNama ? (
                                <p className="text-xs text-secondary-foreground">
                                  Process: {processNama}
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
                                      to: ROUTES.PENYUSUN.DETAIL_SOP,
                                      params: { id: sop.detailSopId ?? sop.id },
                                      title: "Edit",
                                    }
                                  : {
                                      icon: Eye,
                                      to: ROUTES.PENYUSUN.DETAIL_SOP,
                                      params: { id: sop.detailSopId ?? sop.id },
                                      title: "Lihat",
                                    },
                                ...(canHapusSopDraftAwal(sop)
                                  ? [
                                      {
                                        icon: Trash2,
                                        title: "Hapus draft SOP",
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
        open={isBuatSOPDialogOpen}
        onOpenChange={setIsBuatSOPDialogOpen}
        onCreate={async (data) => {
          await create({
            processId: data.processId,
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
        title="Hapus draft SOP?"
        description="Draft SOP akan dihapus permanen beserta data yang sudah diisi. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus draft"
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
