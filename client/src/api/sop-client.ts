import { apiClient, buildQueryString } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  CreatePelaksanaDto,
  CreateSopRequestDto,
  Pelaksana,
  PenyusunWorkbenchData,
  PenyusunWorkbenchQueryParams,
  SopDaftarRow,
  SopListQueryParams,
  SopRiwayatVersiRow,
  UpdateSopHeaderDto,
  UpdateSopProsedurDto,
  UpdateSopDiagramDto,
  UpdateStatusDto,
} from '@/types/dto/sop.dto'

export const sopApi = {
  findAll: (params?: SopListQueryParams) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<SopDaftarRow[]>>(`/sop${buildQueryString(params)}`),
    ),

  create: (payload: CreateSopRequestDto) =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<SopDaftarRow>>('/sop', payload)),

  getPenyusunWorkbench: (detailSopId: string, params?: PenyusunWorkbenchQueryParams) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/sop/penyusun-workbench/${detailSopId}${buildQueryString(params)}`,
      ),
    ),

  updateSopHeader: (detailSopId: string, payload: UpdateSopHeaderDto) =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/sop/header/${detailSopId}`,
        payload,
      ),
    ),

  updateSopProsedur: (detailSopId: string, payload: UpdateSopProsedurDto) =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/sop/langkah/${detailSopId}`,
        payload,
      ),
    ),

  updateSopDiagram: (detailSopId: string, payload: UpdateSopDiagramDto) =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/sop/diagram/${detailSopId}`,
        payload,
      ),
    ),

  updateStatus: (id: string, payload: UpdateStatusDto) =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<PenyusunWorkbenchData>>(`/sop/status/${id}`, payload),
    ),

  cabutSop: (id: string, params?: PenyusunWorkbenchQueryParams) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/sop/cabut/${id}${buildQueryString(params)}`,
      ),
    ),

  kirimUlangEvaluasiSetelahRevisi: (detailSopId: string, params?: PenyusunWorkbenchQueryParams) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/sop/penyusun-workbench/${detailSopId}/kirim-ulang-evaluasi${buildQueryString(params)}`,
      ),
    ),

  buatVersiBaru: (detailSopId: string, params?: PenyusunWorkbenchQueryParams) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/sop/${detailSopId}/buat-versi-baru${buildQueryString(params)}`,
      ),
    ),

  getRiwayatVersi: (sopId: string) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<SopRiwayatVersiRow[]>>(`/sop/${sopId}/riwayat-versi`),
    ),

  hapusVersiDraft: (detailSopId: string) =>
    unwrapApiData(
      apiClient.delete<ApiSuccessResponse<null>>(`/sop/${detailSopId}/versi-draft`),
    ),

  hapusSopDraftAwal: (detailSopId: string) =>
    unwrapApiData(apiClient.delete<ApiSuccessResponse<null>>(`/sop/${detailSopId}/draft`)),

  findPelaksana: (opdId: string) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<Pelaksana[]>>(`/pelaksana?opdId=${encodeURIComponent(opdId)}`),
    ),

  createPelaksana: (payload: CreatePelaksanaDto) =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<Pelaksana>>('/pelaksana', payload)),

  updatePelaksana: (id: string, namaPelaksana: string) =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<Pelaksana>>(`/pelaksana/${id}`, { namaPelaksana }),
    ),

  deletePelaksana: (id: string) =>
    unwrapApiData(apiClient.delete<ApiSuccessResponse<null>>(`/pelaksana/${id}`)),
}
