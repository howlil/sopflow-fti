import { targetUsers, type E2eUser } from '../fixtures/users'
import type { RoleApiFactory } from '../fixtures/business-test'
import { apiGet, apiPost } from './api'
import { ensureTteReady } from './e2e-flow'
import type {
  ProcessSopSeedOptions,
  ReadyProcessSopFixture,
} from './fti-process-preconditions'
import { seedProcessSopReadyForTte } from './fti-tte-preconditions'
import { e2ePin, validPdfBase64 } from './test-data'

export interface ProcessVersionWorkbench {
  detail: {
    id: string
    sopId: string
    status: string
    versi: number
    nomorSOP: string
    revisiDariDetailSopId?: string | null
  }
}

export interface ProcessVersionHistoryRow {
  detailSopId: string
  versi: number
  nomorSOP: string
  status: string
  revisiDariDetailSopId: string | null
}

export interface PublishedProcessSopFixture extends ReadyProcessSopFixture {
  authorityUser: E2eUser
}

export interface ReplacementReadyFixture {
  v1: PublishedProcessSopFixture
  v2: ProcessVersionWorkbench['detail']
}

interface PublishedSeedOptions extends ProcessSopSeedOptions {
  authorityUser?: E2eUser
}

/** Publish V1 through the real Process TTE endpoint. This is a precondition for version journeys. */
export async function seedPublishedProcessSop(
  apiFor: RoleApiFactory,
  prefix: string,
  options: PublishedSeedOptions = {},
): Promise<PublishedProcessSopFixture> {
  const authorityUser = options.authorityUser ?? targetUsers.dean
  const sop = await seedProcessSopReadyForTte(apiFor, prefix, {
    ...options,
    authorityUser,
  })
  const authorityApi = await apiFor(authorityUser)
  await apiPost(authorityApi, `/process-tte/${sop.detailSopId}/sign`, {
    pin: e2ePin,
    nomorDokumen: sop.number,
    judulDokumen: sop.title,
    pdfBase64: validPdfBase64,
  })

  const actorApi = await apiFor(options.actor ?? targetUsers.processMember)
  const workbench = await apiGet<ProcessVersionWorkbench>(
    actorApi,
    `/process-sop/workbench/${sop.detailSopId}`,
  )
  if (workbench.detail.status !== 'BERLAKU') {
    throw new Error(`Precondition V1 harus BERLAKU, ditemukan ${workbench.detail.status}`)
  }

  return { ...sop, authorityUser }
}

export async function createProcessVersion(
  apiFor: RoleApiFactory,
  actor: E2eUser,
  sourceDetailSopId: string,
): Promise<ProcessVersionWorkbench> {
  const api = await apiFor(actor)
  return apiPost<ProcessVersionWorkbench>(api, `/process-sop/${sourceDetailSopId}/version`)
}

/** Prepare V2 through submit, Owner ACCEPT, and contextual final approval; signing stays the journey action. */
export async function seedReplacementReadyForTte(
  apiFor: RoleApiFactory,
  prefix: string,
  options: PublishedSeedOptions = {},
): Promise<ReplacementReadyFixture> {
  const actor = options.actor ?? targetUsers.processMember
  const authorityUser = options.authorityUser ?? targetUsers.dean
  const v1 = await seedPublishedProcessSop(apiFor, prefix, { ...options, authorityUser })
  const v2Workbench = await createProcessVersion(apiFor, actor, v1.detailSopId)
  const actorApi = await apiFor(actor)
  const ownerApi = await apiFor(targetUsers.processOwner)
  const authorityApi = await apiFor(authorityUser)

  await apiPost(actorApi, `/process-sop/${v2Workbench.detail.id}/submit-review`)
  await apiPost(ownerApi, `/process-sop/${v2Workbench.detail.id}/review`, { decision: 'ACCEPT' })
  await apiPost(authorityApi, `/process-approval/${v2Workbench.detail.id}/approve`)
  await ensureTteReady(authorityApi)

  const ready = await apiGet<ProcessVersionWorkbench>(
    actorApi,
    `/process-sop/workbench/${v2Workbench.detail.id}`,
  )
  if (ready.detail.status !== 'MENUNGGU_TTD_PJ_EVALUATOR') {
    throw new Error(`Precondition V2 harus siap TTE, ditemukan ${ready.detail.status}`)
  }

  return { v1, v2: ready.detail }
}

export async function getProcessVersionHistory(
  apiFor: RoleApiFactory,
  actor: E2eUser,
  sopId: string,
): Promise<ProcessVersionHistoryRow[]> {
  const api = await apiFor(actor)
  return apiGet<ProcessVersionHistoryRow[]>(api, `/process-sop/${sopId}/history`)
}
