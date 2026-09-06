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
import type { TTESignaturePayload } from '@/types/dto/tte.dto'

export type CreateProcessSopRequestDto = CreateSopRequestDto & { processId: string }

type NativeSigningAuthority = {
  authority: 'DEAN' | 'HEAD_OF_DEPARTMENT'
  nama: string | null
  nip: string | null
  jabatan: string | null
}

type NativeWorkbenchData = Omit<
  PenyusunWorkbenchData,
  'detail' | 'tteSignaturePayloadKepalaOpd'
> & {
  detail: Omit<PenyusunWorkbenchData['detail'], 'kepalaOpd'> & {
    signingAuthority?: NativeSigningAuthority | null
  }
  tteSignaturePayload?: TTESignaturePayload
}

/**
 * Transitional adapter for the protected SOP workspace UI.
 * The wire contract is FTI-native; only this boundary aliases contextual
 * authority/signature data to old local property names until the protected
 * document component contract is migrated separately.
 */
function adaptNativeWorkbench(data: NativeWorkbenchData): PenyusunWorkbenchData {
  const authority = data.detail.signingAuthority
  return {
    ...data,
    detail: {
      ...data.detail,
      kepalaOpd:
        authority == null
          ? null
          : {
              nama: authority.nama,
              nip: authority.nip,
            },
    },
    tteSignaturePayloadKepalaOpd: data.tteSignaturePayload,
  }
}

async function unwrapWorkbench(
  request: Promise<ApiSuccessResponse<NativeWorkbenchData>>,
): Promise<PenyusunWorkbenchData> {
  return adaptNativeWorkbench(await unwrapApiData(request))
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
      apiClient.get<ApiSuccessResponse<NativeWorkbenchData>>(
        `/process-sop/workbench/${detailSopId}${buildQueryString(params)}`,
      ),
    ),

  updateSopHeader: (detailSopId: string, payload: UpdateSopHeaderDto) =>
    unwrapWorkbench(
      apiClient.patch<ApiSuccessResponse<NativeWorkbenchData>>(
        `/process-sop/header/${detailSopId}`,
        payload,
      ),
    ),

  updateSopProsedur: (detailSopId: string, payload: UpdateSopProsedurDto) =>
    unwrapWorkbench(
      apiClient.patch<ApiSuccessResponse<NativeWorkbenchData>>(
        `/process-sop/langkah/${detailSopId}`,
        payload,
      ),
    ),

  updateSopDiagram: (detailSopId: string, payload: UpdateSopDiagramDto) =>
    unwrapWorkbench(
      apiClient.patch<ApiSuccessResponse<NativeWorkbenchData>>(
        `/process-sop/diagram/${detailSopId}`,
        payload,
      ),
    ),

  buatVersiBaru: (detailSopId: string, params?: PenyusunWorkbenchQueryParams) =>
    unwrapWorkbench(
      apiClient.post<ApiSuccessResponse<NativeWorkbenchData>>(
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
