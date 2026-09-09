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
    updateDepartemen,
    grantOwnerAuthority,
    revokeOwnerAuthority,
    isSaving,
  } = useProsesBisnisAdministration()
  const [namaDepartemen, setDepartemenName] = useState('')
  const [editingDepartemenId, setEditingDepartemenId] = useState<string | null>(null)
  const [editingDepartemenName, setEditingDepartemenName] = useState('')
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
      breadcrumb={[{ label: 'Administrasi' }, { label: 'Proses Bisnis & organisasi' }]}
      title="Proses Bisnis & organisasi"
    >
      <section className="rounded-surface border border-border bg-surface p-5 shadow-surface">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
          Setup administrasi
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          Atur struktur dan kewenangan FTI
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-secondary-foreground">
          Atur tiga hal ini sebelum Owner membuat Proses Bisnis dan Penyusun menyusun SOP.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ['01', 'Struktur organisasi', 'Buat dan rapikan Departemen.'],
            ['02', 'Kewenangan Owner', 'Pilih lingkup kerja Penanggung Jawab Proses Bisnis.'],
            ['03', 'Pemantauan', 'Pantau Proses Bisnis yang sudah berjalan.'],
          ].map(([number, label, description]) => (
            <div key={number} className="rounded-control border border-border bg-surface-subtle p-3">
              <p className="text-xs font-semibold text-primary">{number}</p>
              <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
              <p className="mt-1 text-xs leading-5 text-secondary-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="contents">
          <DataSurface.Root className="order-2">
            <DataSurface.Header>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">Kewenangan Owner Proses Bisnis</h2>
                <p className="text-sm text-secondary-foreground">
                  Admin menetapkan lingkup sekali. Setelah itu Owner membuat Proses Bisnis dan mengelola Penyusun SOP.
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
                  <option value="">Pilih calon Owner Proses Bisnis</option>
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
                  <option value="DEPARTMENT">Departemen</option>
                </select>
              </label>

              {authority.lingkup === 'DEPARTMENT' ? (
                <label className="block space-y-1.5 text-sm font-medium text-foreground">
                  Departemen
                  <select
                    className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={authority.departemenId ?? ''}
                    onChange={(event) =>
                      setAuthority((current) => ({ ...current, departemenId: event.target.value || null }))
                    }
                  >
                    <option value="">Pilih Departemen</option>
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
                <p className="p-4 text-sm text-secondary-foreground">Belum ada kewenangan Owner Proses Bisnis.</p>
              ) : (
                ownerAuthorities.map((row) => (
                  <div key={row.kewenanganPenanggungJawabProsesBisnisId} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {row.user?.nama ?? 'Pengguna tidak tersedia'}
                      </p>
                      <p className="text-xs text-secondary-foreground">
                        {row.lingkup === 'FACULTY' ? 'Fakultas' : row.departemen?.nama ?? 'Departemen'}
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

          <DataSurface.Root className="order-3 xl:col-span-2">
            <DataSurface.Header>
              <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-foreground">Pemantauan Proses Bisnis</h2>
                <p className="text-sm text-secondary-foreground">
                  Admin memakai daftar ini untuk memantau dan memulihkan data. Pengelolaan sehari-hari dilakukan Owner.
                </p>
              </div>
            </DataSurface.Header>
            <div className="divide-y divide-border">
              {isLoading ? (
                <p className="p-4 text-sm text-secondary-foreground">Memuat Proses Bisnis...</p>
              ) : prosesBisnis.length === 0 ? (
                <p className="p-4 text-sm text-secondary-foreground">Belum ada Proses Bisnis.</p>
              ) : (
                prosesBisnis.map((process) => (
                  <div key={process.prosesBisnisId} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">{process.nama}</h3>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-secondary-foreground">
                        {process.lingkup === 'FACULTY' ? 'Fakultas' : process.departemen?.nama ?? 'Departemen'}
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

        <DataSurface.Root className="order-1">
          <DataSurface.Header>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-foreground">Struktur Departemen</h2>
              <p className="text-sm text-secondary-foreground">
                Data organisasi disiapkan Admin sebelum lingkup diberikan kepada Owner Proses Bisnis.
              </p>
            </div>
          </DataSurface.Header>
          <div className="space-y-3 p-4">
            <div className="flex gap-2">
              <Input
                value={namaDepartemen}
                onChange={(event) => setDepartemenName(event.target.value)}
                placeholder="Nama Departemen"
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
            <div className="divide-y divide-border border-y border-border">
              {departemen.length === 0 ? (
                <p className="py-4 text-sm text-secondary-foreground">Belum ada Departemen.</p>
              ) : departemen.map((department) => (
                <div key={department.departemenId} className="flex items-center justify-between gap-3 py-3">
                  {editingDepartemenId === department.departemenId ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Input
                        className="min-w-0"
                        value={editingDepartemenName}
                        onChange={(event) => setEditingDepartemenName(event.target.value)}
                        aria-label={`Nama ${department.nama}`}
                      />
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{department.nama}</p>
                      <p className="mt-0.5 text-xs text-secondary-foreground">Departemen FTI</p>
                    </div>
                  )}
                  {editingDepartemenId === department.departemenId ? (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={editingDepartemenName.trim().length < 2 || isSaving}
                        onClick={async () => {
                          try {
                            await updateDepartemen({
                              departemenId: department.departemenId,
                              nama: editingDepartemenName.trim(),
                            })
                            setEditingDepartemenId(null)
                          } catch {
                            // Toast already reports the error.
                          }
                        }}
                      >
                        Simpan
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setEditingDepartemenId(null)}
                      >
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setEditingDepartemenId(department.departemenId)
                        setEditingDepartemenName(department.nama)
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DataSurface.Root>
      </div>
    </ListPageLayout>
  )
}
