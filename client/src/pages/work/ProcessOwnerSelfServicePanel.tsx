import { useMemo, useState } from 'react'
import { useProcessOwnerSelfService } from '@/api/process-owner'
import { DataSurface } from '@/components/data/data-surface'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { InviteProcessMemberPayload } from '@/types/dto/process.dto'

const EMPTY_INVITE: InviteProcessMemberPayload = {
  nama: '',
  nip: '',
  email: '',
  jabatan: '',
  pangkat: '',
  nohp: '',
}

export function ProcessOwnerSelfServicePanel() {
  const {
    scopes,
    processes,
    users,
    isLoading,
    createProcess,
    renameProcess,
    addMember,
    removeMember,
    inviteMember,
    archiveProcess,
    isSaving,
  } = useProcessOwnerSelfService()
  const [processName, setProcessName] = useState('')
  const [scopeKey, setScopeKey] = useState('')
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null)
  const [memberId, setMemberId] = useState('')
  const [invite, setInvite] = useState(EMPTY_INVITE)
  const [activationPath, setActivationPath] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [archiveReason, setArchiveReason] = useState('')

  const selected = useMemo(
    () => processes.find((process) => process.processId === selectedProcessId) ?? null,
    [processes, selectedProcessId],
  )
  const selectedMemberIds = new Set(selected?.members.map((member) => member.penggunaId) ?? [])
  const availableUsers = users.filter(
    (user) => user.penggunaId !== selected?.ownerId && !selectedMemberIds.has(user.penggunaId),
  )

  if (!isLoading && scopes.length === 0 && processes.length === 0) return null

  const selectedAuthority = scopes.find((scope) => scope.scopeKey === scopeKey) ?? null
  const canCreate = processName.trim().length >= 2 && selectedAuthority !== null
  const activationUrl = activationPath
    ? `${typeof window === 'undefined' ? '' : window.location.origin}${activationPath}`
    : null

  return (
    <section className="space-y-4" aria-labelledby="process-owner-self-service-title">
      <div>
        <h2 id="process-owner-self-service-title" className="text-base font-semibold text-foreground">
          Kelola Process
        </h2>
        <p className="mt-1 text-sm text-secondary-foreground">
          Buat Process pada scope yang diberikan Admin, lalu kelola Penyusun SOP tanpa tiket administrasi.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          {scopes.length > 0 ? (
            <DataSurface.Root>
              <DataSurface.Header>
                <h3 className="text-sm font-semibold text-foreground">Process baru</h3>
              </DataSurface.Header>
              <div className="space-y-3 p-4">
                <Input
                  value={processName}
                  onChange={(event) => setProcessName(event.target.value)}
                  placeholder="Nama Process"
                />
                <select
                  className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={scopeKey}
                  onChange={(event) => setScopeKey(event.target.value)}
                >
                  <option value="">Pilih scope</option>
                  {scopes.map((scope) => (
                    <option key={scope.processOwnerAuthorityId} value={scope.scopeKey}>
                      {scope.scope === 'FACULTY' ? 'Fakultas' : scope.department?.nama ?? 'Jurusan'}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end">
                  <Button
                    disabled={!canCreate || isSaving}
                    onClick={async () => {
                      if (!selectedAuthority) return
                      try {
                        const created = await createProcess({
                          nama: processName.trim(),
                          scope: selectedAuthority.scope,
                          departmentId: selectedAuthority.departmentId,
                        })
                        setProcessName('')
                        setSelectedProcessId(created.processId)
                      } catch {
                        // Toast owns error reporting.
                      }
                    }}
                  >
                    Buat Process
                  </Button>
                </div>
              </div>
            </DataSurface.Root>
          ) : null}

          <DataSurface.Root>
            <DataSurface.Header>
              <h3 className="text-sm font-semibold text-foreground">Process milik Anda</h3>
            </DataSurface.Header>
            <div className="divide-y divide-border">
              {isLoading ? (
                <p className="p-4 text-sm text-secondary-foreground">Memuat Process...</p>
              ) : processes.length === 0 ? (
                <p className="p-4 text-sm text-secondary-foreground">Belum ada Process.</p>
              ) : (
                processes.map((process) => (
                  <button
                    type="button"
                    key={process.processId}
                    className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-surface-muted"
                    onClick={() => {
                      setSelectedProcessId(process.processId)
                      setRenameValue(process.nama)
                      setActivationPath(null)
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">{process.nama}</span>
                      <span className="mt-0.5 block text-xs text-secondary-foreground">
                        {process.scope === 'FACULTY' ? 'Fakultas' : process.department?.nama ?? 'Jurusan'} · {process.members.length} Penyusun
                      </span>
                    </span>
                    <span className="text-xs text-secondary-foreground">
                      {process.lifecycleStatus === 'ARCHIVED' ? 'Diarsipkan' : 'Aktif'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </DataSurface.Root>
        </div>

        {selected ? (
          <DataSurface.Root>
            <DataSurface.Header>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-foreground">{selected.nama}</h3>
                <p className="text-sm text-secondary-foreground">
                  {selected.lifecycleStatus === 'ARCHIVED'
                    ? 'Process read-only. Riwayat dan bukti workflow tetap dipertahankan.'
                    : 'Kelola identitas Process dan Penyusun SOP yang memiliki akses eksplisit.'}
                </p>
              </div>
            </DataSurface.Header>

            <div className="divide-y divide-border">
              {selected.lifecycleStatus !== 'ARCHIVED' ? (
                <div className="space-y-3 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-foreground">Identitas</p>
                  <div className="flex gap-2">
                    <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
                    <Button
                      variant="outline"
                      disabled={renameValue.trim().length < 2 || renameValue.trim() === selected.nama || isSaving}
                      onClick={() => renameProcess({ processId: selected.processId, nama: renameValue.trim() })}
                    >
                      Simpan
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-foreground">Penyusun SOP</p>
                {selected.members.length === 0 ? (
                  <p className="text-sm text-secondary-foreground">Belum ada Penyusun SOP.</p>
                ) : (
                  <div className="space-y-1">
                    {selected.members.map((membership) => (
                      <div key={membership.penggunaId} className="flex items-center justify-between gap-3 py-1.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">{membership.pengguna.nama}</p>
                          <p className="truncate text-xs text-secondary-foreground">{membership.pengguna.email}</p>
                        </div>
                        {selected.lifecycleStatus !== 'ARCHIVED' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isSaving}
                            onClick={() => removeMember({ processId: selected.processId, penggunaId: membership.penggunaId })}
                          >
                            Cabut
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                {selected.lifecycleStatus !== 'ARCHIVED' ? (
                  <div className="flex gap-2 border-t border-border pt-3">
                    <select
                      className="h-9 min-w-0 flex-1 rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={memberId}
                      onChange={(event) => setMemberId(event.target.value)}
                    >
                      <option value="">Tambahkan akun aktif...</option>
                      {availableUsers.map((user) => (
                        <option key={user.penggunaId} value={user.penggunaId}>
                          {user.nama} · {user.email}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      disabled={!memberId || isSaving}
                      onClick={async () => {
                        try {
                          await addMember({ processId: selected.processId, penggunaId: memberId })
                          setMemberId('')
                        } catch {
                          // Toast owns error reporting.
                        }
                      }}
                    >
                      Tambah
                    </Button>
                  </div>
                ) : null}
              </div>

              {selected.lifecycleStatus !== 'ARCHIVED' ? (
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary-foreground">Undang akun baru</p>
                    <p className="mt-1 text-xs text-secondary-foreground">
                      Owner tidak menetapkan password. Calon Penyusun membuat password sendiri dari link onboarding.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="Nama" value={invite.nama} onChange={(event) => setInvite((current) => ({ ...current, nama: event.target.value }))} />
                    <Input placeholder="NIP" value={invite.nip} onChange={(event) => setInvite((current) => ({ ...current, nip: event.target.value }))} />
                    <Input placeholder="Email" type="email" value={invite.email} onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} />
                    <Input placeholder="No. HP" value={invite.nohp} onChange={(event) => setInvite((current) => ({ ...current, nohp: event.target.value }))} />
                    <Input placeholder="Jabatan" value={invite.jabatan} onChange={(event) => setInvite((current) => ({ ...current, jabatan: event.target.value }))} />
                    <Input placeholder="Pangkat" value={invite.pangkat} onChange={(event) => setInvite((current) => ({ ...current, pangkat: event.target.value }))} />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      disabled={Object.values(invite).some((value) => value.trim() === '') || isSaving}
                      onClick={async () => {
                        try {
                          const result = await inviteMember({ processId: selected.processId, payload: invite })
                          setInvite(EMPTY_INVITE)
                          setActivationPath(result.kind === 'INVITATION_CREATED' ? result.activationPath : null)
                        } catch {
                          // Toast owns error reporting.
                        }
                      }}
                    >
                      Buat onboarding
                    </Button>
                  </div>
                  {activationUrl ? (
                    <div className="space-y-2 rounded-control border border-border bg-surface-muted p-3">
                      <p className="text-xs font-medium text-foreground">Link onboarding satu kali</p>
                      <Input readOnly value={activationUrl} />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigator.clipboard?.writeText(activationUrl)}
                      >
                        Salin link
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {selected.lifecycleStatus !== 'ARCHIVED' ? (
                <div className="space-y-3 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-foreground">Arsipkan Process</p>
                  <p className="text-xs text-secondary-foreground">
                    Hanya dapat diarsipkan jika tidak ada draft atau workflow SOP yang masih berjalan.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={archiveReason}
                      onChange={(event) => setArchiveReason(event.target.value)}
                      placeholder="Alasan arsip"
                    />
                    <Button
                      variant="outline"
                      disabled={archiveReason.trim().length < 3 || isSaving}
                      onClick={async () => {
                        try {
                          await archiveProcess({ processId: selected.processId, reason: archiveReason.trim() })
                          setArchiveReason('')
                        } catch {
                          // Toast owns error reporting.
                        }
                      }}
                    >
                      Arsipkan
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </DataSurface.Root>
        ) : (
          <div className="rounded-surface border border-dashed border-border bg-surface p-5 text-sm text-secondary-foreground">
            Pilih Process untuk mengelola Penyusun SOP.
          </div>
        )}
      </div>
    </section>
  )
}
