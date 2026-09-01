import { apiClient, buildQueryString } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  BeritaAcaraEvaluasiView,
  CreatePengajuanEvaluasiDto,
  EvaluasiGrafikTahunanData,
  EvaluasiGrafikTahunanQueryParams,
  EvaluasiListQueryParams,
  EvaluasiRingkasQueryParams,
  EvaluasiWorkspaceOpdResponse,
  EvaluasiWorkspaceQueryParams,
  IsiNilaiEvaluasiDto,
  NilaiEvaluasi,
  PengajuanEvaluasi,
  PengajuanEvaluasiRingkasPage,
  PengajuanEvaluasiShell,
  PengajuanSopWorkbenchResponse,
  SelesaiEvaluasiDto,
  TolakPengajuanEvaluasiDto,
  UmpanBalikEvaluasiDetail,
} from '@/types/dto/evaluasi.dto'

export const evaluasiApi = {
  findAll: (params?: EvaluasiListQueryParams) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<PengajuanEvaluasi[]>>(
        `/evaluasi${buildQueryString(params)}`,
      ),
    ),

  findById: (id: string) =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<PengajuanEvaluasi>>(`/evaluasi/${id}`)),

  findPengajuanShell: (id: string) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<PengajuanEvaluasiShell>>(`/evaluasi/pengajuan/${id}`),
    ),

  findPengajuanSopDokumen: (
    pengajuanId: string,
    detailSopId: string,
    logsLimit?: number,
    opts?: { arsip?: boolean },
  ) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<PengajuanSopWorkbenchResponse>>(
        `/evaluasi/pengajuan/${pengajuanId}/sop-dokumen/${detailSopId}${buildQueryString({
          logsLimit,
          arsip: opts?.arsip === true ? true : undefined,
        })}`,
      ),
    ),

  findPengajuanBeritaAcara: (pengajuanId: string, opts?: { arsip?: boolean }) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<BeritaAcaraEvaluasiView>>(
        `/evaluasi/pengajuan/${pengajuanId}/berita-acara${buildQueryString({
          arsip: opts?.arsip === true ? true : undefined,
        })}`,
      ),
    ),

  create: (payload: CreatePengajuanEvaluasiDto) =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<PengajuanEvaluasi>>('/evaluasi', payload)),

  isiNilai: (
    pengajuanEvaluasiId: string,
    sopDetailId: string,
    payload: IsiNilaiEvaluasiDto,
  ) =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<NilaiEvaluasi>>(
        `/evaluasi/${pengajuanEvaluasiId}/nilai/${sopDetailId}`,
        payload,
      ),
    ),

  getUmpanBalikEvaluasi: (detailSopId: string) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<UmpanBalikEvaluasiDetail | null>>(
        `/evaluasi/umpan-balik/detail/${detailSopId}`,
      ),
    ),

  tandaiTindakLanjutSelesai: (pengajuanEvaluasiId: string, detailSopId: string) =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<NilaiEvaluasi>>(
        `/evaluasi/${pengajuanEvaluasiId}/nilai/${detailSopId}/tindak-lanjut-selesai`,
      ),
    ),

  selesai: (pengajuanEvaluasiId: string, payload: SelesaiEvaluasiDto) =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<PengajuanEvaluasi>>(
        `/evaluasi/${pengajuanEvaluasiId}/selesai`,
        payload,
      ),
    ),

  tolak: (pengajuanEvaluasiId: string, payload: TolakPengajuanEvaluasiDto) =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<PengajuanEvaluasi>>(
        `/evaluasi/${pengajuanEvaluasiId}/tolak`,
        payload,
      ),
    ),

  grafikTahunan: (params?: EvaluasiGrafikTahunanQueryParams) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<EvaluasiGrafikTahunanData>>(
        `/evaluasi/laporan/grafik-tahunan${buildQueryString(params)}`,
      ),
    ),

  workspaceOpd: (opdId: string, params?: EvaluasiWorkspaceQueryParams) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<EvaluasiWorkspaceOpdResponse>>(
        `/evaluasi/workspace/opd/${opdId}${buildQueryString(params)}`,
      ),
    ),

  workspaceOpdSaya: (params?: EvaluasiWorkspaceQueryParams) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<EvaluasiWorkspaceOpdResponse>>(
        `/evaluasi/workspace/opd-saya${buildQueryString(params)}`,
      ),
    ),

  workspacePengajuan: (pengajuanEvaluasiId: string, params?: EvaluasiWorkspaceQueryParams) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<EvaluasiWorkspaceOpdResponse>>(
        `/evaluasi/workspace/pengajuan/${pengajuanEvaluasiId}${buildQueryString(params)}`,
      ),
    ),

  findRingkas: (params?: EvaluasiRingkasQueryParams) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<PengajuanEvaluasiRingkasPage>>(
        `/evaluasi/ringkas${buildQueryString({
          ...params,
          search: params?.search?.trim() || undefined,
        })}`,
      ),
    ),
}
