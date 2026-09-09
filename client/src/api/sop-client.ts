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

export type CreateProsesBisnisSopRequestDto = CreateSopRequestDto & { prosesBisnisId: string }

async function unwrapWorkbench(
  request: Promise<ApiSuccessResponse<PenyusunWorkbenchData>>,
): Promise<PenyusunWorkbenchData> {
  return unwrapApiData(request)
}

export const sopApi = {
  findAll: (params?: SopListQueryParams) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<SopDaftarRow[]>>(`/prosesBisnis-sop${buildQueryString(params)}`),
    ),

  create: (payload: CreateProsesBisnisSopRequestDto) =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<SopDaftarRow>>('/prosesBisnis-sop', payload)),

  getPenyusunWorkbench: (detailSopId: string, params?: PenyusunWorkbenchQueryParams) =>
    unwrapWorkbench(
      apiClient.get<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/prosesBisnis-sop/workbench/${detailSopId}${buildQueryString(params)}`,
      ),
    ),

  updateSopHeader: (detailSopId: string, payload: UpdateSopHeaderDto) =>
    unwrapWorkbench(
      apiClient.patch<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/prosesBisnis-sop/header/${detailSopId}`,
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
        `/prosesBisnis-sop/${detailSopId}/version${buildQueryString(params)}`,
      ),
    ),

  getRiwayatVersi: (sopId: string) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<SopRiwayatVersiRow[]>>(`/prosesBisnis-sop/${sopId}/history`),
    ),

  hapusVersiDraft: (detailSopId: string) =>
    unwrapApiData(
      apiClient.delete<ApiSuccessResponse<null>>(`/prosesBisnis-sop/${detailSopId}/versi-draft`),
    ),

  hapusSopDraftAwal: (detailSopId: string) =>
    unwrapApiData(apiClient.delete<ApiSuccessResponse<null>>(`/prosesBisnis-sop/${detailSopId}/draft`)),

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
