import { useMemo, useState } from 'react'
import { useProsesBisnisAdministration } from '@/api/administrasi-proses-bisnis'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GrantKewenanganPenanggungJawabProsesBisnisPayload, LingkupOrganisasi } from '@/types/dto/proses-bisnis.dto'

const EMPTY_AUTHORITY: GrantKewenanganPenanggungJawabProsesBisnisPayload = {
  penggunaId: '',
  lingkup: 'FACULTY',
  departemenId: null,
}

export function HalamanPengelolaanProsesBisnis() {
  const {
    departemen,
    users,
    prosesBisnis,
    ownerAuthorities,
    isLoading,
    createDepartemen,
    grantOwnerAuthority,
    revokeOwnerAuthority,
    isSaving,
  } = useProsesBisnisAdministration()
  const [namaDepartemen, setDepartemenName] = useState('')
  const [authority, setAuthority] = useState<GrantKewenanganPenanggungJawabProsesBisnisPayload>(EMPTY_AUTHORITY)

  const eligibleUsers = useMemo(
    () => users.filter((user) => user.platformRole === 'USER'),
    [users],
  )

  const canGrant =
    authority.penggunaId !== '' &&
    (authority.lingkup === 'FACULTY' || authority.departemenId !== null)

  const changeScope = (lingkup: LingkupOrganisasi) => {
    setAuthority((current) => ({
      ...current,
      lingkup,
      departemenId: lingkup === 'FACULTY' ? null : current.departemenId,
    }))
  }

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Administrasi' }, { label: 'Governance Proses Bisnis' }]}
      title="Governance Proses Bisnis"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <div className="space-y-5">
          <DataSurface.Root>
            <DataSurface.Header>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">Kewenangan ProsesBisnis Owner</h2>
                <p className="text-sm text-secondary-foreground">
                  Admin menetapkan lingkup sekali. Setelah itu ProsesBisnis Owner membuat ProsesBisnis dan mengelola Penyusun SOP sendiri.
                </p>
              </div>
            </DataSurface.Header>
            <div className="space-y-4 p-4">
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Pengguna
                <select
                  className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={authority.penggunaId}
                  onChange={(event) =>
                    setAuthority((current) => ({ ...current, penggunaId: event.target.value }))
                  }
                >
                  <option value="">Pilih calon ProsesBisnis Owner</option>
                  {eligibleUsers.map((user) => (
                    <option key={user.penggunaId} value={user.penggunaId}>
                      {user.nama} · {user.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Lingkup
                <select
                  className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={authority.lingkup}
                  onChange={(event) => changeScope(event.target.value as LingkupOrganisasi)}
                >
                  <option value="FACULTY">Fakultas</option>
                  <option value="DEPARTMENT">Jurusan</option>
                </select>
              </label>

              {authority.lingkup === 'DEPARTMENT' ? (
                <label className="block space-y-1.5 text-sm font-medium text-foreground">
                  Jurusan
                  <select
                    className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={authority.departemenId ?? ''}
                    onChange={(event) =>
                      setAuthority((current) => ({ ...current, departemenId: event.target.value || null }))
                    }
                  >
                    <option value="">Pilih jurusan</option>
                    {departemen.map((department) => (
                      <option key={department.departemenId} value={department.departemenId}>
                        {department.nama}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="flex justify-end">
                <Button
                  disabled={!canGrant || isSaving}
                  onClick={async () => {
                    try {
                      await grantOwnerAuthority(authority)
                      setAuthority(EMPTY_AUTHORITY)
                    } catch {
                      // Toast owns the error; keep input for correction.
                    }
                  }}
                >
                  Berikan kewenangan
                </Button>
              </div>
            </div>
            <div className="divide-y divide-border border-t border-border">
              {ownerAuthorities.length === 0 ? (
                <p className="p-4 text-sm text-secondary-foreground">Belum ada kewenangan ProsesBisnis Owner.</p>
              ) : (
                ownerAuthorities.map((row) => (
                  <div key={row.kewenanganPenanggungJawabProsesBisnisId} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {row.user?.nama ?? 'Pengguna tidak tersedia'}
                      </p>
                      <p className="text-xs text-secondary-foreground">
                        {row.lingkup === 'FACULTY' ? 'Fakultas' : row.departemen?.nama ?? 'Jurusan'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => revokeOwnerAuthority(row.kewenanganPenanggungJawabProsesBisnisId)}
                    >
                      Cabut
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DataSurface.Root>

          <DataSurface.Root>
            <DataSurface.Header>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">Oversight ProsesBisnis</h2>
                <p className="text-sm text-secondary-foreground">
                  Daftar ini untuk governance dan recovery. Operasi normal dilakukan oleh ProsesBisnis Owner.
                </p>
              </div>
            </DataSurface.Header>
            <div className="divide-y divide-border">
              {isLoading ? (
                <p className="p-4 text-sm text-secondary-foreground">Memuat ProsesBisnis...</p>
              ) : prosesBisnis.length === 0 ? (
                <p className="p-4 text-sm text-secondary-foreground">Belum ada ProsesBisnis.</p>
              ) : (
                prosesBisnis.map((process) => (
                  <div key={process.prosesBisnisId} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">{process.nama}</h3>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-secondary-foreground">
                        {process.lingkup === 'FACULTY' ? 'Fakultas' : process.departemen?.nama ?? 'Jurusan'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-secondary-foreground">
                      Owner: {process.penanggungJawab.nama} · {process.anggota.length} Penyusun SOP
                    </p>
                  </div>
                ))
              )}
            </div>
          </DataSurface.Root>
        </div>

        <DataSurface.Root>
          <DataSurface.Header>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-foreground">Struktur Jurusan</h2>
              <p className="text-sm text-secondary-foreground">
                Master data organisasi disiapkan Admin sebelum lingkup diberikan kepada ProsesBisnis Owner.
              </p>
            </div>
          </DataSurface.Header>
          <div className="space-y-3 p-4">
            <div className="flex gap-2">
              <Input
                value={namaDepartemen}
                onChange={(event) => setDepartemenName(event.target.value)}
                placeholder="Nama jurusan"
              />
              <Button
                variant="outline"
                disabled={namaDepartemen.trim().length < 2 || isSaving}
                onClick={async () => {
                  try {
                    await createDepartemen(namaDepartemen.trim())
                    setDepartemenName('')
                  } catch {
                    // Toast already reports the error.
                  }
                }}
              >
                Tambah
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {departemen.map((department) => (
                <span
                  key={department.departemenId}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-secondary-foreground"
                >
                  {department.nama}
                </span>
              ))}
            </div>
          </div>
        </DataSurface.Root>
      </div>
    </ListPageLayout>
  )
}
