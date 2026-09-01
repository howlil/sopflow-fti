import { useMemo, useState } from "react";
import { Ban, Eye, FileText } from "lucide-react";
import { ActiveFilterChips } from "@/components/data/active-filter-chips";
import { DataSurface } from "@/components/data/data-surface";
import { Table } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { SOPStatusFilterSelect } from "@/components/sop/sop-status-filter-select";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { EmptyState } from "@/components/ui/empty-state";
import { CabutSopDialog } from "@/components/sop/CabutSopDialog";
import { Button } from "@/components/ui/button";
import {
  SopDateCell,
  SopNumberCell,
  SopPrimaryCell,
  SopStatusCell,
} from "@/components/sop/sop-table-cells";
import { SOP_STATUS_FILTER_OPTIONS } from "@/lib/status/sop-status.config";
import { ROUTES } from "@/utils/constants";
import { useCabutSop, useSop } from "@/api/sop";
import type { SopDaftarRow } from "@/types/dto/sop.dto";
import { canShowCabutSopAction, getCabutSopBlockingReason } from "@/lib/sop/cabut-sop.util";

export function PantauSOP() {
  const [filterStatus, setFilterStatus] = useState("all");
  const { list: mergedList } = useSop();
  const { cabutSopAsync, isCabutPending } = useCabutSop();
  const [cabutTarget, setCabutTarget] = useState<SopDaftarRow | null>(null);

  const listByStatus = useMemo(
    () =>
      filterStatus === "all"
        ? mergedList
        : mergedList.filter((s) => s.status === filterStatus),
    [mergedList, filterStatus],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listByStatus;
    return listByStatus.filter((s) =>
      [s.judul, s.nomorSop ?? ""].join(" ").toLowerCase().includes(q),
    );
  }, [listByStatus, searchQuery]);

  const statusLabel = SOP_STATUS_FILTER_OPTIONS.find(
    (option) => option.value === filterStatus,
  )?.label;
  const hasStatusFilter = filterStatus !== "all";
  const hasSearch = searchQuery.trim().length > 0;
  const resultLabel = `${filteredList.length} dokumen`;

  async function handleConfirmCabutFromList() {
    if (cabutTarget == null) return;
    await cabutSopAsync(cabutTarget.id);
    setCabutTarget(null);
  }

  return (
    <>
      <ListPageLayout
        breadcrumb={[{ label: "Pantau SOP" }]}
        title="Pantau SOP"
      >
        <DataSurface.Root>
          <DataSurface.Header>
            <div className="space-y-1 px-card pt-4">
              <p className="text-sm text-secondary-foreground">
                Lihat status SOP yang sedang dinilai, berlaku, draft, atau perlu tindakan.
              </p>
            </div>
            <DataSurface.Toolbar>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <SearchInput
                  placeholder="Cari judul atau nomor SOP..."
                  aria-label="Cari judul atau nomor SOP..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <SOPStatusFilterSelect
                  value={filterStatus}
                  onValueChange={setFilterStatus}
                  className="h-9 w-full sm:w-[200px]"
                />
              </div>
              <div className="text-xs font-medium text-muted-foreground" aria-live="polite">
                {resultLabel}
              </div>
            </DataSurface.Toolbar>
            {hasStatusFilter ? (
              <DataSurface.FilterRow>
                <ActiveFilterChips
                  items={[
                    {
                      id: "status",
                      label: `Status: ${statusLabel ?? filterStatus}`,
                      onRemove: () => setFilterStatus("all"),
                    },
                  ]}
                  onClearAll={() => setFilterStatus("all")}
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
                      <Table.Th>Terakhir diperbarui</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.ActionTh>Aksi</Table.ActionTh>
                    </Table.HeadRow>
                  </thead>
                  <tbody>
                    {pageData.length === 0 ? (
                      <EmptyState
                        asTableRow
                        colSpan={5}
                        icon={<FileText />}
                        title={
                          hasSearch
                            ? `Tidak ada SOP yang cocok dengan “${searchQuery.trim()}”`
                            : hasStatusFilter
                              ? "Tidak ada SOP dengan status yang dipilih"
                              : "Belum ada SOP"
                        }
                        description={
                          hasSearch
                            ? "Ubah atau hapus kata kunci pencarian."
                            : hasStatusFilter
                              ? "Hapus atau ubah filter status untuk memperluas hasil."
                              : "Belum ada SOP yang tercatat untuk OPD Anda."
                        }
                      />
                    ) : (
                      pageData.map((sop) => {
                        const showCabut = canShowCabutSopAction(sop) && sop.versiBerlaku?.status !== "DICABUT";
                        const cabutBlockReason = getCabutSopBlockingReason(sop);
                        return (
                          <Table.BodyRow key={sop.id}>
                            <Table.Td>
                              <SopPrimaryCell title={sop.judul} />
                            </Table.Td>
                            <Table.Td>
                              <SopNumberCell value={sop.nomorSop} />
                            </Table.Td>
                            <Table.Td>
                              <SopDateCell date={sop.terakhirDiperbarui} />
                            </Table.Td>
                            <Table.Td>
                              <SopStatusCell
                                status={sop.status}
                                label={sop.statusLabel}
                              />
                            </Table.Td>
                            <Table.ActionTd>
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1.5 px-2 text-xs"
                                >
                                  <a href={ROUTES.KEPALA_OPD.DETAIL_SOP.replace('$id', sop.id)}>
                                    <Eye className="h-3.5 w-3.5" />
                                    Lihat
                                  </a>
                                </Button>
                                {showCabut ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 px-2 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                    disabled={isCabutPending || cabutBlockReason != null}
                                    title={cabutBlockReason ?? "Cabut SOP"}
                                    onClick={() => setCabutTarget(sop)}
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                    Cabut
                                  </Button>
                                ) : null}
                              </div>
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
      </ListPageLayout>
      <CabutSopDialog
        open={cabutTarget != null}
        onOpenChange={(open) => {
          if (!open) setCabutTarget(null);
        }}
        sopJudul={cabutTarget?.judul ?? ""}
        nomorSop={cabutTarget?.versiBerlaku?.nomorSop ?? cabutTarget?.nomorSop ?? ""}
        onConfirm={() => void handleConfirmCabutFromList()}
        isPending={isCabutPending}
      />
    </>
  );
}
