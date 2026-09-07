import { targetUsers, type E2eUser } from '../fixtures/users'
import type { RoleApiFactory } from '../fixtures/business-test'
import { apiGet, apiPost } from './api'
import { ensureTteReady } from './e2e-flow'
import type {
  ProsesBisnisSopSeedOptions,
  ReadyProsesBisnisSopFixture,
} from './fti-process-preconditions'
import { seedProsesBisnisSopReadyForTte } from './fti-tte-preconditions'
import { e2ePin, validPdfBase64 } from './test-data'

export interface ProsesBisnisVersionWorkbench {
  detail: {
    id: string
    sopId: string
    status: string
    versi: number
    nomorSOP: string
    revisiDariDetailSopId?: string | null
  }
}

export interface ProsesBisnisVersionHistoryRow {
  detailSopId: string
  versi: number
  nomorSOP: string
  status: string
  revisiDariDetailSopId: string | null
}

export interface PublishedProsesBisnisSopFixture extends ReadyProsesBisnisSopFixture {
  authorityUser: E2eUser
}

export interface ReplacementReadyFixture {
  v1: PublishedProsesBisnisSopFixture
  v2: ProsesBisnisVersionWorkbench['detail']
}

interface PublishedSeedOptions extends ProsesBisnisSopSeedOptions {
  authorityUser?: E2eUser
}

/** Publish V1 through the real ProsesBisnis TTE endpoint. This is a precondition for version journeys. */
export async function seedPublishedProsesBisnisSop(
  apiFor: RoleApiFactory,
  prefix: string,
  options: PublishedSeedOptions = {},
): Promise<PublishedProsesBisnisSopFixture> {
  const authorityUser = options.authorityUser ?? targetUsers.dean
  const sop = await seedProsesBisnisSopReadyForTte(apiFor, prefix, {
    ...options,
    authorityUser,
  })
  const authorityApi = await apiFor(authorityUser)
  await apiPost(authorityApi, `/tte-proses-bisnis/${sop.detailSopId}/sign`, {
    pin: e2ePin,
    nomorDokumen: sop.number,
    judulDokumen: sop.title,
    pdfBase64: validPdfBase64,
  })

  const actorApi = await apiFor(options.actor ?? targetUsers.anggotaProsesBisnis)
  const workbench = await apiGet<ProsesBisnisVersionWorkbench>(
    actorApi,
    `/sop-proses-bisnis/workbench/${sop.detailSopId}`,
  )
  if (workbench.detail.status !== 'EFFECTIVE') {
    throw new Error(`Precondition V1 harus BERLAKU, ditemukan ${workbench.detail.status}`)
  }

  return { ...sop, authorityUser }
}

export async function createProsesBisnisVersion(
  apiFor: RoleApiFactory,
  actor: E2eUser,
  sourceDetailSopId: string,
): Promise<ProsesBisnisVersionWorkbench> {
  const api = await apiFor(actor)
  return apiPost<ProsesBisnisVersionWorkbench>(api, `/sop-proses-bisnis/${sourceDetailSopId}/version`)
}

/** Prepare V2 through submit, Owner ACCEPT, and contextual final approval; signing stays the journey action. */
export async function seedReplacementReadyForTte(
  apiFor: RoleApiFactory,
  prefix: string,
  options: PublishedSeedOptions = {},
): Promise<ReplacementReadyFixture> {
  const actor = options.actor ?? targetUsers.anggotaProsesBisnis
  const authorityUser = options.authorityUser ?? targetUsers.dean
  const v1 = await seedPublishedProsesBisnisSop(apiFor, prefix, { ...options, authorityUser })
  const v2Workbench = await createProsesBisnisVersion(apiFor, actor, v1.detailSopId)
  const actorApi = await apiFor(actor)
  const ownerApi = await apiFor(targetUsers.penanggungJawabProsesBisnis)
  const authorityApi = await apiFor(authorityUser)

  await apiPost(actorApi, `/sop-proses-bisnis/${v2Workbench.detail.id}/submit-review`)
  await apiPost(ownerApi, `/sop-proses-bisnis/${v2Workbench.detail.id}/review`, { decision: 'ACCEPT' })
  await apiPost(authorityApi, `/persetujuan-akhir-sop/${v2Workbench.detail.id}/approve`)
  await ensureTteReady(authorityApi)

  const ready = await apiGet<ProsesBisnisVersionWorkbench>(
    actorApi,
    `/sop-proses-bisnis/workbench/${v2Workbench.detail.id}`,
  )
  if (ready.detail.status !== 'TTE_PENDING') {
    throw new Error(`Precondition V2 harus siap TTE, ditemukan ${ready.detail.status}`)
  }

  return { v1, v2: ready.detail }
}

export async function getProsesBisnisVersionHistory(
  apiFor: RoleApiFactory,
  actor: E2eUser,
  sopId: string,
): Promise<ProsesBisnisVersionHistoryRow[]> {
  const api = await apiFor(actor)
  return apiGet<ProsesBisnisVersionHistoryRow[]>(api, `/sop-proses-bisnis/${sopId}/history`)
}
