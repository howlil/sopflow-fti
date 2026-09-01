import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { evaluasiApi } from "@/api/evaluasi-client";
import { queryKeys } from "@/config/query-keys";
import { SOP_EVALUASI_WORKFLOW_REFRESH_OPTIONS } from "@/lib/api/cache-invalidation";
import { mapEvaluasiShellToPengajuan } from "@/lib/evaluasi/evaluasi-mappers";
import type {
  EvaluasiGrafikTahunanQueryParams,
  EvaluasiListQueryParams,
  EvaluasiRingkasQueryParams,
  EvaluasiWorkspaceQueryParams,
} from "@/types/dto/evaluasi.dto";

/** Umpan balik evaluasi aktif untuk panel penyusun (alur revisi). */
export function useUmpanBalikEvaluasi(detailSopId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.evaluasiUmpanBalik(detailSopId ?? ''),
    queryFn: () => evaluasiApi.getUmpanBalikEvaluasi(detailSopId as string),
    enabled: Boolean(detailSopId) && enabled,
    ...SOP_EVALUASI_WORKFLOW_REFRESH_OPTIONS,
  })
}

// ==================== Evaluasi Hooks ====================
export function useEvaluasi(params?: EvaluasiListQueryParams & { enabled?: boolean }) {
  const enabled = params?.enabled ?? true;
  const listParams: EvaluasiListQueryParams | undefined =
    params === undefined
      ? undefined
      : {
          opdId: params.opdId,
          status: params.status,
          jenis: params.jenis,
          statusIn:
            params.statusIn !== undefined && params.statusIn.length > 0
              ? [...params.statusIn]
              : undefined,
        };
  const {
    data: list = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.evaluasiList(listParams),
    queryFn: () => evaluasiApi.findAll(listParams),
    ...SOP_EVALUASI_WORKFLOW_REFRESH_OPTIONS,
    enabled,
  });

  return { list, isLoading, error };
}

/** Workspace OPD pengguna (GET `/evaluasi/workspace/opd-saya`) — dialog buka pengajuan PJ Penyusun. */
export function useEvaluasiWorkspaceOpdSaya(
  params?: EvaluasiWorkspaceQueryParams & { enabled?: boolean },
) {
  const enabled = params?.enabled ?? true;
  const queryParams: EvaluasiWorkspaceQueryParams | undefined =
    params === undefined
      ? undefined
      : {
          detailSopId: params.detailSopId,
          expand: params.expand,
          riwayatLimit: params.riwayatLimit,
        };
  return useQuery({
    queryKey: queryKeys.evaluasiWorkspaceOpdSaya(queryParams),
    queryFn: () => evaluasiApi.workspaceOpdSaya(queryParams),
    enabled,
    ...SOP_EVALUASI_WORKFLOW_REFRESH_OPTIONS,
  });
}

/** Workspace evaluasi per OPD - satu GET agregat untuk halaman evaluator dan dialog PJ penyusun. */
export function useEvaluasiWorkspaceOpd(
  opdId: string,
  params?: EvaluasiWorkspaceQueryParams & { enabled?: boolean },
) {
  const enabled = params?.enabled ?? true;
  const queryParams: EvaluasiWorkspaceQueryParams | undefined =
    params === undefined
      ? undefined
      : {
          detailSopId: params.detailSopId,
          expand: params.expand,
          riwayatLimit: params.riwayatLimit,
        };
  return useQuery({
    queryKey: queryKeys.evaluasiWorkspaceOpd(opdId, queryParams),
    queryFn: () => evaluasiApi.workspaceOpd(opdId, queryParams),
    enabled: Boolean(opdId) && enabled,
    placeholderData: (previousData) => previousData,
    ...SOP_EVALUASI_WORKFLOW_REFRESH_OPTIONS,
  });
}

/** Workspace evaluasi untuk satu pengajuan (`GET /evaluasi/workspace/pengajuan/:id`). */
export function useEvaluasiWorkspacePengajuan(
  pengajuanEvaluasiId: string,
  params?: EvaluasiWorkspaceQueryParams & { enabled?: boolean },
) {
  const enabled = params?.enabled ?? true;
  const queryParams: EvaluasiWorkspaceQueryParams | undefined =
    params === undefined
      ? undefined
      : {
          detailSopId: params.detailSopId,
          expand: params.expand,
          riwayatLimit: params.riwayatLimit,
        };
  return useQuery({
    queryKey: queryKeys.evaluasiWorkspacePengajuan(pengajuanEvaluasiId, queryParams),
    queryFn: () => evaluasiApi.workspacePengajuan(pengajuanEvaluasiId, queryParams),
    enabled: Boolean(pengajuanEvaluasiId) && enabled,
    placeholderData: (previousData) => previousData,
    ...SOP_EVALUASI_WORKFLOW_REFRESH_OPTIONS,
  });
}

/** Daftar ringkas terpaginasi (`GET /evaluasi/ringkas`). */
export function usePengajuanEvaluasiRingkas(
  params: EvaluasiRingkasQueryParams & { enabled?: boolean },
) {
  const enabled = params.enabled ?? true;
  const ringkasParams: EvaluasiRingkasQueryParams = {
    page: params.page,
    limit: params.limit,
    opdId: params.opdId,
    status: params.status,
    jenis: params.jenis,
    search: params.search,
    statusIn: params.statusIn,
  };
  return useQuery({
    queryKey: queryKeys.evaluasiRingkas(ringkasParams),
    queryFn: () => evaluasiApi.findRingkas(ringkasParams),
    ...SOP_EVALUASI_WORKFLOW_REFRESH_OPTIONS,
    enabled,
  });
}

export function useEvaluasiGrafikTahunan(params?: EvaluasiGrafikTahunanQueryParams) {
  return useQuery({
    queryKey: queryKeys.evaluasiGrafikTahunan(params),
    queryFn: () => evaluasiApi.grafikTahunan(params),
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== Pengajuan Evaluasi ====================

/** Batas log workbench di panel pratinjau PJ evaluator. */
const PJ_EVAL_PREVIEW_WORKBENCH_LOGS = 100

export function usePengajuanEvaluasiDetail(pengajuanId?: string) {
  const { data: shell, isLoading: loading } = useQuery({
    queryKey: queryKeys.evaluasiPengajuanShell(pengajuanId || ''),
    queryFn: () => evaluasiApi.findPengajuanShell(pengajuanId || ''),
    enabled: !!pengajuanId,
    ...SOP_EVALUASI_WORKFLOW_REFRESH_OPTIONS,
  })

  const pengajuan = useMemo(
    () => (shell ? mapEvaluasiShellToPengajuan(shell) : null),
    [shell],
  )

  const isVerified = pengajuan?.status === 'DITANDATANGANI_PJ_EVALUATOR'
  const canVerify = pengajuan?.status === 'SELESAI_DIEVALUASI'

  return {
    pengajuan: pengajuan || null,
    shell: shell ?? null,
    isVerified,
    canVerify,
    loading,
  }
}

export function usePengajuanSopDokumenWorkbench(
  pengajuanId?: string,
  detailSopId?: string | null,
  opts?: { enabled?: boolean },
) {
  const enabled = !!(pengajuanId && detailSopId) && (opts?.enabled ?? true)
  const pid = pengajuanId || ''
  const dsid = detailSopId || ''
  return useQuery({
    queryKey: queryKeys.evaluasiPengajuanSopDokumen(pid, dsid, PJ_EVAL_PREVIEW_WORKBENCH_LOGS),
    queryFn: () =>
      evaluasiApi.findPengajuanSopDokumen(pid, dsid, PJ_EVAL_PREVIEW_WORKBENCH_LOGS),
    enabled,
    ...SOP_EVALUASI_WORKFLOW_REFRESH_OPTIONS,
  })
}

export function usePengajuanBeritaAcaraView(pengajuanId?: string, opts?: { enabled?: boolean }) {
  const enabled = !!pengajuanId && (opts?.enabled ?? true)
  return useQuery({
    queryKey: queryKeys.evaluasiPengajuanBeritaAcara(pengajuanId || ''),
    queryFn: () => evaluasiApi.findPengajuanBeritaAcara(pengajuanId || ''),
    enabled,
    ...SOP_EVALUASI_WORKFLOW_REFRESH_OPTIONS,
  })
}
