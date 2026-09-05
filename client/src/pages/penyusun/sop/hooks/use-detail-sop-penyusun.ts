import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildSopHeaderSnapshot, useSopHeaderAutosave, type SopHeaderAutosaveStatus } from "@/pages/penyusun/sop/hooks/use-sop-header-autosave";
import { buildSopProsedurSnapshot, useSopProsedurAutosave, type SopProsedurAutosaveStatus } from "@/pages/penyusun/sop/hooks/use-sop-prosedur-autosave";
import { usePeraturan } from "@/api/peraturan";
import { usePenyusunWorkbench, useSop } from "@/api/sop-queries";
import { usePelaksana, useUpdateSopHeader, useUpdateSopProsedur } from "@/api/sop-mutations";
import { transformLangkahToProsedurRow, transformSopDetailToMetadata } from "@/lib/sop/detailSop.mappers";
import { DEFAULT_SOP_STATUS } from "@/types/dto/sop.dto";
import { canEditSop } from "@/lib/sop/sop-permissions";
import type { Peraturan } from "@/types/dto/peraturan.dto";
import type { PenyusunWorkbenchLogEdit, StatusSOP } from "@/types/dto/sop.dto";
import type { ProsedurRow, SOPDetailMetadata, SopEditorImplementer } from "@/types/ui/sop";
export interface UseDetailSopPenyusunDataResult {
  metadata: SOPDetailMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<SOPDetailMetadata>>;
  prosedurRows: ProsedurRow[];
  setProsedurRows: React.Dispatch<React.SetStateAction<ProsedurRow[]>>;
  implementers: SopEditorImplementer[];
  setImplementers: React.Dispatch<React.SetStateAction<SopEditorImplementer[]>>;
  auditLogs: PenyusunWorkbenchLogEdit[];
  activeTab: "flowchart" | "bpmn";
  setActiveTab: React.Dispatch<React.SetStateAction<"flowchart" | "bpmn">>;
  isEditingSteps: boolean;
  setIsEditingSteps: React.Dispatch<React.SetStateAction<boolean>>;
  isEditPanelCollapsed: boolean;
  setIsEditPanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  rightPanelTab: "edit" | "versi" | "aktivitas";
  setRightPanelTab: React.Dispatch<
    React.SetStateAction<"edit" | "versi" | "aktivitas">
  >;
  isLoading: boolean;
  masterPelaksanaOptions: { id: string; name: string }[];
  relatedPosOptions: string[];
  /** Opsi keterkaitan SOP id-aware (id = detailSopId terbaru per SOP). */
  relatedSopOptions: { id: string; label: string }[];
  peraturanList: Peraturan[];
  currentSopStatus: StatusSOP;
  currentSopStatusLabel: string;
  /** Paksa flush autosave header SOP (mis. sebelum aksi besar / pindah halaman). */
  flushHeaderAutosave: () => Promise<void>;
  /** Paksa flush autosave prosedur (swimlane + langkah). */
  flushProsedurAutosave: () => Promise<void>;
  /** Status autosave header (idle/pending/saving/saved/error) untuk indikator UI. */
  autosaveStatus: SopHeaderAutosaveStatus;
  /** Error autosave header terakhir; reference baru per error agar consumer bisa toast sekali. */
  autosaveError: Error | null;
  /** Status autosave prosedur (swimlane + langkah). */
  prosedurAutosaveStatus: SopProsedurAutosaveStatus;
  /** Error autosave prosedur terakhir. */
  prosedurAutosaveError: Error | null;
  /** True jika status SOP mengizinkan mengubah dokumen (autosave dan kontrol edit aktif). */
  canEditDetail: boolean;
}

export function useDetailSopPenyusunData(
  sopDetailId: string | undefined,
  sopStatusOverride: StatusSOP | undefined,
): UseDetailSopPenyusunDataResult {
  const { list: sopList } = useSop();
  const { list: peraturanList } = usePeraturan();
  const { list: pelaksanaList } = usePelaksana();
  const { data: workbench, isLoading: isLoadingWorkbench } = usePenyusunWorkbench(sopDetailId);
  const updateSopHeaderMutation = useUpdateSopHeader(sopDetailId ?? "");
  const updateSopProsedurMutation = useUpdateSopProsedur(sopDetailId ?? "");

  const [metadata, setMetadata] = useState<SOPDetailMetadata>({});
  const [prosedurRows, setProsedurRows] = useState<ProsedurRow[]>([]);
  const [implementers, setImplementers] = useState<SopEditorImplementer[]>([]);
  const [activeTab, setActiveTab] = useState<"flowchart" | "bpmn">("flowchart");
  const [isEditingSteps, setIsEditingSteps] = useState(false);
  const [isEditPanelCollapsed, setIsEditPanelCollapsed] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<
    "edit" | "versi" | "aktivitas"
  >("edit");

  const sopDetail = workbench?.detail;
  const langkahList = useMemo(() => workbench?.langkah ?? [], [workbench?.langkah]);
  const auditLogs = workbench?.logEdit ?? [];
  const resolvedStatusForEdit = useMemo(
    (): StatusSOP =>
      (workbench?.detail.status ?? sopStatusOverride ?? DEFAULT_SOP_STATUS) as StatusSOP,
    [workbench?.detail.status, sopStatusOverride],
  );
  const canEditDetail = canEditSop(resolvedStatusForEdit);
  /* Sinkron state lokal HANYA saat berganti DetailSOP (mis. masuk halaman /:id baru).
     PATCH yang dipicu autosave akan update cache TanStack lewat setQueryData, tapi
     TIDAK boleh menimpa metadata UI yang sedang diketik user. Identitas: detailSopId. */
  const lastSyncedDetailIdRef = useRef<string | null>(null);

  const headerSnapshot = useMemo(() => buildSopHeaderSnapshot(metadata), [metadata]);
  const headerAutosave = useSopHeaderAutosave({
    detailSopId: sopDetailId,
    snapshot: headerSnapshot,
    save: updateSopHeaderMutation.mutateAsync,
    enabled: Boolean(sopDetailId) && Boolean(sopDetail) && canEditDetail,
  });

  const prosedurSnapshot = useMemo(
    () => buildSopProsedurSnapshot(implementers, prosedurRows),
    [implementers, prosedurRows],
  );
  const prosedurAutosave = useSopProsedurAutosave({
    detailSopId: sopDetailId,
    snapshot: prosedurSnapshot,
    save: updateSopProsedurMutation.mutateAsync,
    enabled: Boolean(sopDetailId) && Boolean(sopDetail) && canEditDetail,
  });

  const resetHeaderBaselineRef = useRef(headerAutosave.resetBaseline)
  resetHeaderBaselineRef.current = headerAutosave.resetBaseline
  const resetProsedurBaselineRef = useRef(prosedurAutosave.resetBaseline)
  resetProsedurBaselineRef.current = prosedurAutosave.resetBaseline

  useEffect(() => {
    if (!sopDetail) {
      return;
    }
    /* Hanya sinkron sekali per identitas DetailSOP. Jika `id` sama dengan terakhir di-sync,
       artinya kita masih di SOP yang sama dan local state adalah source of truth. */
    if (lastSyncedDetailIdRef.current === sopDetail.id) {
      return;
    }
    lastSyncedDetailIdRef.current = sopDetail.id;
    const nextMetadata = transformSopDetailToMetadata(sopDetail);
    setMetadata(nextMetadata);
    resetHeaderBaselineRef.current(buildSopHeaderSnapshot(nextMetadata));
    let nextRows: ProsedurRow[] = [];
    if (langkahList.length > 0) {
      nextRows = [...langkahList]
        .sort((a, b) => a.urutan - b.urutan)
        .map(transformLangkahToProsedurRow);
    }
    /* Sumber kebenaran kolom PELAKSANA = swimlane (DetailSOPPelaksana) yang dikembalikan
       API. Aktor di langkah yang belum di-swimlane tetap dimasukkan untuk back-compat
       data lama. Urutan: swimlane.urutan asc, lalu langkah pelaksanaIds yang baru. */
    const nextImplementers: SopEditorImplementer[] = [];
    const seenImplementerIds = new Set<string>();
    const swimlanes = sopDetail.swimlanes ?? [];
    for (const sw of [...swimlanes].sort((a, b) => a.urutan - b.urutan)) {
      if (!sw.pelaksanaId || seenImplementerIds.has(sw.pelaksanaId)) continue;
      seenImplementerIds.add(sw.pelaksanaId);
      const name =
        sw.pelaksana?.namaPelaksana ??
        pelaksanaList.find((p) => p.id === sw.pelaksanaId)?.namaPelaksana ??
        sw.pelaksanaId;
      nextImplementers.push({ id: sw.pelaksanaId, name });
    }
    for (const row of nextRows) {
      if (!row.pelaksana || seenImplementerIds.has(row.pelaksana)) continue;
      seenImplementerIds.add(row.pelaksana);
      const name =
        pelaksanaList.find((p) => p.id === row.pelaksana)?.namaPelaksana ?? row.pelaksana;
      nextImplementers.push({ id: row.pelaksana, name });
    }
    setProsedurRows(nextRows);
    setImplementers(nextImplementers);
    resetProsedurBaselineRef.current(buildSopProsedurSnapshot(nextImplementers, nextRows));
  }, [sopDetail, langkahList, pelaksanaList]);

  const masterPelaksanaOptions = useMemo(
    () =>
      pelaksanaList.map((pelaksana) => ({
        id: pelaksana.id,
        name: pelaksana.namaPelaksana,
      })),
    [pelaksanaList],
  );
  const relatedPosOptions = useMemo(
    () => sopList.map((sop) => sop.judul).filter(Boolean),
    [sopList],
  );
  const relatedSopOptions = useMemo(
    () =>
      sopList
        .filter((sop) => Boolean(sop.detailSopId) && sop.id !== sopDetail?.sopId)
        .map((sop) => ({
          id: sop.detailSopId as string,
          label: sop.judul,
        })),
    [sopList, sopDetail?.sopId],
  );

  const currentSopStatus: StatusSOP = resolvedStatusForEdit;
  const currentSopStatusLabel =
    workbench?.detail.statusLabel ?? currentSopStatus;
  const isLoading = isLoadingWorkbench;

  return {
    metadata,
    setMetadata,
    prosedurRows,
    setProsedurRows,
    implementers,
    setImplementers,
    auditLogs,
    activeTab,
    setActiveTab,
    isEditingSteps,
    setIsEditingSteps,
    isEditPanelCollapsed,
    setIsEditPanelCollapsed,
    rightPanelTab,
    setRightPanelTab,
    isLoading,
    masterPelaksanaOptions,
    relatedPosOptions,
    relatedSopOptions,
    peraturanList,
    currentSopStatus,
    currentSopStatusLabel,
    flushHeaderAutosave: headerAutosave.flush,
    flushProsedurAutosave: prosedurAutosave.flush,
    autosaveStatus: headerAutosave.status,
    autosaveError: headerAutosave.lastError,
    prosedurAutosaveStatus: prosedurAutosave.status,
    prosedurAutosaveError: prosedurAutosave.lastError,
    canEditDetail,
  };
}

export interface UseDetailSopPenyusunReturn {
  metadata: SOPDetailMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<SOPDetailMetadata>>;
  prosedurRows: ProsedurRow[];
  setProsedurRows: React.Dispatch<React.SetStateAction<ProsedurRow[]>>;
  implementers: SopEditorImplementer[];
  setImplementers: React.Dispatch<React.SetStateAction<SopEditorImplementer[]>>;
  auditLogs: PenyusunWorkbenchLogEdit[];
  activeTab: "flowchart" | "bpmn";
  setActiveTab: React.Dispatch<React.SetStateAction<"flowchart" | "bpmn">>;
  isEditingSteps: boolean;
  setIsEditingSteps: React.Dispatch<React.SetStateAction<boolean>>;
  isEditPanelCollapsed: boolean;
  setIsEditPanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  rightPanelTab: "edit" | "versi" | "aktivitas";
  setRightPanelTab: React.Dispatch<
    React.SetStateAction<"edit" | "versi" | "aktivitas">
  >;
  isLoading: boolean;
  masterPelaksanaOptions: { id: string; name: string }[];
  relatedPosOptions: string[];
  /** Opsi keterkaitan SOP id-aware (id = detailSopId terbaru per SOP). */
  relatedSopOptions: { id: string; label: string }[];
  peraturanList: Peraturan[];
  currentSopStatus: StatusSOP;
  currentSopStatusLabel: string;
  handleMetadataChange: <K extends keyof SOPDetailMetadata>(
    field: K,
    value: SOPDetailMetadata[K],
  ) => void;
  /** Status autosave header (idle/pending/saving/saved/error) untuk indikator UI. */
  autosaveStatus: SopHeaderAutosaveStatus;
  /** Error autosave header terakhir; reference baru per error agar consumer bisa toast sekali. */
  autosaveError: Error | null;
  /** Status autosave prosedur (swimlane + langkah) untuk indikator UI gabungan. */
  prosedurAutosaveStatus: SopProsedurAutosaveStatus;
  /** Error autosave prosedur terakhir; reference baru per error. */
  prosedurAutosaveError: Error | null;
  /** Paksa flush autosave header SOP (mis. sebelum aksi besar / pindah halaman). */
  flushHeaderAutosave: () => Promise<void>;
  /** Paksa flush autosave prosedur SOP. */
  flushProsedurAutosave: () => Promise<void>;
  /** Status dokumen mengizinkan penyuntingan header dan langkah. */
  canEditDetail: boolean;
}

export function useDetailSopPenyusun(
  sopDetailId: string | undefined,
  sopStatusOverride: StatusSOP | undefined,
  _isRevisionFlowOverride?: boolean,
): UseDetailSopPenyusunReturn {
  const data = useDetailSopPenyusunData(sopDetailId, sopStatusOverride);
  const setMetadata = data.setMetadata;

  const handleMetadataChange = useCallback(
    <K extends keyof SOPDetailMetadata>(field: K, value: SOPDetailMetadata[K]) => {
      setMetadata((prev) => ({ ...prev, [field]: value }));
    },
    [setMetadata],
  );

  return {
    metadata: data.metadata,
    setMetadata,
    prosedurRows: data.prosedurRows,
    setProsedurRows: data.setProsedurRows,
    implementers: data.implementers,
    setImplementers: data.setImplementers,
    auditLogs: data.auditLogs,
    activeTab: data.activeTab,
    setActiveTab: data.setActiveTab,
    isEditingSteps: data.isEditingSteps,
    setIsEditingSteps: data.setIsEditingSteps,
    isEditPanelCollapsed: data.isEditPanelCollapsed,
    setIsEditPanelCollapsed: data.setIsEditPanelCollapsed,
    rightPanelTab: data.rightPanelTab,
    setRightPanelTab: data.setRightPanelTab,
    isLoading: data.isLoading,
    masterPelaksanaOptions: data.masterPelaksanaOptions,
    relatedPosOptions: data.relatedPosOptions,
    relatedSopOptions: data.relatedSopOptions,
    peraturanList: data.peraturanList,
    currentSopStatus: data.currentSopStatus,
    currentSopStatusLabel: data.currentSopStatusLabel,
    handleMetadataChange,
    autosaveStatus: data.autosaveStatus,
    autosaveError: data.autosaveError,
    prosedurAutosaveStatus: data.prosedurAutosaveStatus,
    prosedurAutosaveError: data.prosedurAutosaveError,
    flushHeaderAutosave: data.flushHeaderAutosave,
    flushProsedurAutosave: data.flushProsedurAutosave,
    canEditDetail: data.canEditDetail,
  };
}
