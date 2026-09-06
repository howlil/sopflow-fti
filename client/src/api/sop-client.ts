import { apiClient, buildQueryString } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
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
} from '@/types/dto/sop.dto'

export type CreateProcessSopRequestDto = CreateSopRequestDto & { processId: string }

async function unwrapWorkbench(
  request: Promise<ApiSuccessResponse<PenyusunWorkbenchData>>,
): Promise<PenyusunWorkbenchData> {
  return unwrapApiData(request)
}

export const sopApi = {
  findAll: (params?: SopListQueryParams) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<SopDaftarRow[]>>(`/process-sop${buildQueryString(params)}`),
    ),

  create: (payload: CreateProcessSopRequestDto) =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<SopDaftarRow>>('/process-sop', payload)),

  getPenyusunWorkbench: (detailSopId: string, params?: PenyusunWorkbenchQueryParams) =>
    unwrapWorkbench(
      apiClient.get<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/process-sop/workbench/${detailSopId}${buildQueryString(params)}`,
      ),
    ),

  updateSopHeader: (detailSopId: string, payload: UpdateSopHeaderDto) =>
    unwrapWorkbench(
      apiClient.patch<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/process-sop/header/${detailSopId}`,
        payload,
      ),
    ),

  updateSopProsedur: (detailSopId: string, payload: UpdateSopProsedurDto) =>
    unwrapWorkbench(
      apiClient.patch<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/process-sop/langkah/${detailSopId}`,
        payload,
      ),
    ),

  updateSopDiagram: (detailSopId: string, payload: UpdateSopDiagramDto) =>
    unwrapWorkbench(
      apiClient.patch<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/process-sop/diagram/${detailSopId}`,
        payload,
      ),
    ),

  buatVersiBaru: (detailSopId: string, params?: PenyusunWorkbenchQueryParams) =>
    unwrapWorkbench(
      apiClient.post<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/process-sop/${detailSopId}/version${buildQueryString(params)}`,
      ),
    ),

  getRiwayatVersi: (sopId: string) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<SopRiwayatVersiRow[]>>(`/process-sop/${sopId}/history`),
    ),

  hapusVersiDraft: (detailSopId: string) =>
    unwrapApiData(
      apiClient.delete<ApiSuccessResponse<null>>(`/process-sop/${detailSopId}/versi-draft`),
    ),

  hapusSopDraftAwal: (detailSopId: string) =>
    unwrapApiData(apiClient.delete<ApiSuccessResponse<null>>(`/process-sop/${detailSopId}/draft`)),

  findPelaksana: () =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<Pelaksana[]>>('/pelaksana')),

  createPelaksana: (namaPelaksana: string) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<Pelaksana>>('/pelaksana', { namaPelaksana }),
    ),

  updatePelaksana: (id: string, namaPelaksana: string) =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<Pelaksana>>(`/pelaksana/${id}`, { namaPelaksana }),
    ),

  deletePelaksana: (id: string) =>
    unwrapApiData(apiClient.delete<ApiSuccessResponse<null>>(`/pelaksana/${id}`)),
}
