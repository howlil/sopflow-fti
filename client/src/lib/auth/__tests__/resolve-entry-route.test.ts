import { beforeEach, describe, expect, it, vi } from 'vitest'

const { ensureQueryData } = vi.hoisted(() => ({ ensureQueryData: vi.fn() }))

vi.mock('@/config/query-client', () => ({
  queryClient: { ensureQueryData },
}))

vi.mock('@/api/konteks-proses-bisnis', () => ({
  processContextApi: { mine: vi.fn() },
}))

vi.mock('@/api/penanggung-jawab-proses-bisnis', () => ({
  processOwnerApi: { scopes: vi.fn(), prosesBisnis: vi.fn() },
}))

vi.mock('@/api/pejabat-berwenang', () => ({
  authorityQueryKeys: { mine: ['pejabat-berwenang', 'mine'] },
  organizationalAuthorityApi: { mine: vi.fn() },
}))

import { resolveAuthenticatedEntryPath } from '@/lib/auth/resolve-entry-route'

describe('resolveAuthenticatedEntryPath', () => {
  beforeEach(() => {
    ensureQueryData.mockReset()
  })

  it('sends SUPER_ADMIN directly to Akun FTI without capability probes', async () => {
    await expect(resolveAuthenticatedEntryPath({ platformRole: 'SUPER_ADMIN' })).resolves.toBe('/admin/akun-fti')
    expect(ensureQueryData).not.toHaveBeenCalled()
  })

  it('prioritizes Proses Bisnis for an assigned owner', async () => {
    ensureQueryData.mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) =>
      Promise.resolve(queryKey[1] === 'scopes' ? [{}] : []),
    )

    await expect(resolveAuthenticatedEntryPath({ platformRole: 'USER' })).resolves.toBe(
      '/proses-bisnis',
    )
  })

  it('sends organizational authorities to final approval', async () => {
    ensureQueryData.mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) =>
      Promise.resolve(queryKey[0] === 'pejabat-berwenang' ? [{}] : []),
    )

    await expect(resolveAuthenticatedEntryPath({ platformRole: 'USER' })).resolves.toBe('/persetujuan')
  })

  it('sends process members to SOP authoring', async () => {
    ensureQueryData.mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) =>
      Promise.resolve(queryKey[0] === 'processContext' ? [{}] : []),
    )

    await expect(resolveAuthenticatedEntryPath({ platformRole: 'USER' })).resolves.toBe('/sop')
  })

  it('sends an unassigned account to its profile instead of a neutral dashboard', async () => {
    ensureQueryData.mockResolvedValue([])

    await expect(resolveAuthenticatedEntryPath({ platformRole: 'USER' })).resolves.toBe('/me')
  })
})
