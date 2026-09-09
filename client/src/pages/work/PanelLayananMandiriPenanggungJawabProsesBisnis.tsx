import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  useProsesBisnisOwnerSelfService,
  useProsesBisnisSopAssignments,
} from '@/api/penanggung-jawab-proses-bisnis'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormDialog } from '@/components/ui/form-dialog'
import { Input } from '@/components/ui/input'
import { Table } from '@/components/ui/data-table'
import type { InviteAnggotaProsesBisnisPayload } from '@/types/dto/proses-bisnis.dto'

const EMPTY_INVITE: InviteAnggotaProsesBisnisPayload = {
  nama: '',
  nip: '',
  email: '',
  jabatan: '',
  pangkat: '',
  nohp: '',
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PROCESS_REVIEW: 'Dalam pemeriksaan',
  REVISION_REQUIRED: 'Perlu revisi',
  FINAL_APPROVAL: 'Menunggu pengesahan',
  TTE_PENDING: 'Menunggu TTE',
  EFFECTIVE: 'Berlaku',
  SUPERSEDED: 'Digantikan',
  REVOKED: 'Dicabut',
}

export function PanelLayananMandiriPenanggungJawabProsesBisnis() {
  const {
    scopes,
    prosesBisnis,
    users,
    isLoading,
    createProsesBisnis,
    renameProsesBisnis,
    addMember,
    hapusAnggota,
    undangAnggota,
    archiveProsesBisnis,
    isSaving,
  } = useProsesBisnisOwnerSelfService()

  const [createOpen, setCreateOpen] = useState(false)
  const [namaBaru, setNamaBaru] = useState('')
  const [kunciLingkup, setKunciLingkup] = useState('')
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [membersProcessId, setMembersProcessId] = useState<string | null>(null)
  const [memberId, setMemberId] = useState('')
  const [inviteProcessId, setInviteProcessId] = useState<string | null>(null)
  const [invite, setInvite] = useState<InviteAnggotaProsesBisnisPayload>(EMPTY_INVITE)
  const [activationPath, setActivationPath] = useState<string | null>(null)
  const [assignmentProcessId, setAssignmentProcessId] = useState<string | null>(null)
  const [assignmentDraft, setAssignmentDraft] = useState<Record<string, string>>({})
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const [archiveReason, setArchiveReason] = useState('')

  const assignment = useProsesBisnisSopAssignments(assignmentProcessId)

  const selectedMembersProcess = useMemo(
    () => prosesBisnis.find((row) => row.prosesBisnisId === membersProcessId) ?? null,
    [prosesBisnis, membersProcessId],
  )
  const inviteProcess = useMemo(
    () => prosesBisnis.find((row) => row.prosesBisnisId === inviteProcessId) ?? null,
    [prosesBisnis, inviteProcessId],
  )
  const assignmentProcess = useMemo(
    () => prosesBisnis.find((row) => row.prosesBisnisId === assignmentProcessId) ?? null,
    [prosesBisnis, assignmentProcessId],
  )
  const renameProcess = useMemo(
    () => prosesBisnis.find((row) => row.prosesBisnisId === renameId) ?? null,
    [prosesBisnis, renameId],
  )
  const archiveProcess = useMemo(
    () => prosesBisnis.find((row) => row.prosesBisnisId === archiveId) ?? null,
    [prosesBisnis, archiveId],
  )

  const selectedMemberIds = new Set(
    selectedMembersProcess?.anggota.map((anggota) => anggota.penggunaId) ?? [],
  )
  const availableUsers = users.filter(
    (user) =>
      user.penggunaId !== selectedMembersProcess?.penanggungJawabId &&
      !selectedMemberIds.has(user.penggunaId) &&
      !user.deletedAt,
  )
  const selectedScope = scopes.find((scope) => scope.kunciLingkup === kunciLingkup) ?? null
  const canCreate = namaBaru.trim().length >= 2 && selectedScope !== null
  const activationUrl = activationPath
    ? `${typeof window === 'undefined' ? '' : window.location.origin}${activationPath}`
    : null

  if (!isLoading && scopes.length === 0 && prosesBisnis.length === 0) {
    return (
      <p className="text-sm text-secondary-foreground">
        Anda belum mempunyai kewenangan Penanggung Jawab Proses Bisnis.
      </p>
    )
  }

  return (
    <section className="space-y-4" aria-labelledby="process-owner-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="process-owner-title" className="text-sm font-semibold text-foreground">
            Proses Bisnis yang Anda tanggung
          </h2>
          <p className="mt-1 text-sm text-secondary-foreground">
            Atur tim Penyusun dan penugasan SOP. Penanggung Jawab memeriksa hasil, bukan mengedit isi SOP.
          </p>
        </div>
        {scopes.length > 0 ? (
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Tambah Proses Bisnis
          </Button>
        ) : null}
      </div>

      <Table.Card>
        <Table.Root aria-label="Daftar Proses Bisnis yang ditanggung">
          <Table.Table>
            <thead>
              <Table.HeadRow>
                <Table.Th>Proses Bisnis</Table.Th>
                <Table.Th>Lingkup</Table.Th>
                <Table.Th>Penyusun</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.ActionTh>Aksi</Table.ActionTh>
              </Table.HeadRow>
            </thead>
            <tbody>
              {isLoading ? (
                <Table.BodyRow><Table.Td colSpan={5}>Memuat Proses Bisnis...</Table.Td></Table.BodyRow>
              ) : prosesBisnis.length === 0 ? (
                <Table.BodyRow><Table.Td colSpan={5}>Belum ada Proses Bisnis.</Table.Td></Table.BodyRow>
              ) : prosesBisnis.map((process) => (
                <Table.BodyRow key={process.prosesBisnisId}>
                  <Table.Td className="font-medium">{process.nama}</Table.Td>
                  <Table.Td>
                    {process.lingkup === 'FACULTY' ? 'Fakultas' : process.departemen?.nama ?? 'Departemen'}
                  </Table.Td>
                  <Table.Td>{process.anggota.length} Penyusun</Table.Td>
                  <Table.Td>
                    <Badge variant={process.siklusStatus === 'ARCHIVED' ? 'secondary' : 'success'}>
                      {process.siklusStatus === 'ARCHIVED' ? 'Diarsipkan' : 'Aktif'}
                    </Badge>
                  </Table.Td>
                  <Table.ActionTd>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMembersProcessId(process.prosesBisnisId)}
                      >
                        Penyusun
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignmentProcessId(process.prosesBisnisId)}
                      >
                        Penugasan SOP
                      </Button>
                      {process.siklusStatus !== 'ARCHIVED' ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRenameId(process.prosesBisnisId)
                              setRenameValue(process.nama)
                            }}
                          >
                            Ubah
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setArchiveId(process.prosesBisnisId)}>
                            Arsipkan
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </Table.ActionTd>
                </Table.BodyRow>
              ))}
            </tbody>
          </Table.Table>
        </Table.Root>
      </Table.Card>

      <FormDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            setNamaBaru('')
            setKunciLingkup('')
          }
        }}
        title="Tambah Proses Bisnis"
        description="Pilih lingkup sesuai kewenangan yang diberikan Administrator Sistem."
        confirmLabel="Tambah Proses Bisnis"
        confirmDisabled={!canCreate || isSaving}
        onConfirm={() => {
          if (!selectedScope) return
          void createProsesBisnis({
            nama: namaBaru.trim(),
            lingkup: selectedScope.lingkup,
            departemenId: selectedScope.departemenId,
          }).then(() => {
            setCreateOpen(false)
            setNamaBaru('')
            setKunciLingkup('')
          })
        }}
      >
        <label className="space-y-1.5 text-sm font-medium text-foreground">
          <span>Nama Proses Bisnis</span>
          <Input value={namaBaru} onChange={(event) => setNamaBaru(event.target.value)} />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-foreground">
          <span>Lingkup</span>
          <select
            className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm"
            value={kunciLingkup}
            onChange={(event) => setKunciLingkup(event.target.value)}
          >
            <option value="">Pilih lingkup</option>
            {scopes.map((scope) => (
              <option key={scope.kewenanganPenanggungJawabProsesBisnisId} value={scope.kunciLingkup}>
                {scope.lingkup === 'FACULTY' ? 'Fakultas' : scope.departemen?.nama ?? 'Departemen'}
              </option>
            ))}
          </select>
        </label>
      </FormDialog>

      <FormDialog
        open={renameProcess !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameId(null)
            setRenameValue('')
          }
        }}
        title="Ubah Proses Bisnis"
        confirmLabel="Simpan Perubahan"
        confirmDisabled={renameValue.trim().length < 2 || renameValue.trim() === renameProcess?.nama || isSaving}
        onConfirm={() => {
          if (!renameProcess) return
          void renameProsesBisnis({
            prosesBisnisId: renameProcess.prosesBisnisId,
            nama: renameValue.trim(),
          }).then(() => {
            setRenameId(null)
            setRenameValue('')
          })
        }}
      >
        <label className="space-y-1.5 text-sm font-medium text-foreground">
          <span>Nama Proses Bisnis</span>
          <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
        </label>
      </FormDialog>

      <Dialog
        open={selectedMembersProcess !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMembersProcessId(null)
            setMemberId('')
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Penyusun — {selectedMembersProcess?.nama}</DialogTitle>
          </DialogHeader>
          {selectedMembersProcess ? (
            <div className="space-y-4">
              {selectedMembersProcess.siklusStatus !== 'ARCHIVED' ? (
                <div className="flex flex-wrap gap-2">
                  <select
                    className="h-9 min-w-64 flex-1 rounded-control border border-border bg-surface px-3 text-sm"
                    value={memberId}
                    onChange={(event) => setMemberId(event.target.value)}
                  >
                    <option value="">Pilih pengguna aktif</option>
                    {availableUsers.map((user) => (
                      <option key={user.penggunaId} value={user.penggunaId}>
                        {user.nama} · {user.email}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={!memberId || isSaving}
                    onClick={() => void addMember({
                      prosesBisnisId: selectedMembersProcess.prosesBisnisId,
                      penggunaId: memberId,
                    }).then(() => setMemberId(''))}
                  >
                    Tambah Penyusun
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setInviteProcessId(selectedMembersProcess.prosesBisnisId)
                      setMembersProcessId(null)
                    }}
                  >
                    Undang Pengguna Baru
                  </Button>
                </div>
              ) : null}

              <Table.Card>
                <Table.Root aria-label={`Penyusun ${selectedMembersProcess.nama}`}>
                  <Table.Table>
                    <thead>
                      <Table.HeadRow>
                        <Table.Th>Nama</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>NIP</Table.Th>
                        <Table.ActionTh>Aksi</Table.ActionTh>
                      </Table.HeadRow>
                    </thead>
                    <tbody>
                      {selectedMembersProcess.anggota.length === 0 ? (
                        <Table.BodyRow><Table.Td colSpan={4}>Belum ada Penyusun.</Table.Td></Table.BodyRow>
                      ) : selectedMembersProcess.anggota.map((anggota) => (
                        <Table.BodyRow key={anggota.penggunaId}>
                          <Table.Td className="font-medium">{anggota.pengguna.nama}</Table.Td>
                          <Table.Td>{anggota.pengguna.email}</Table.Td>
                          <Table.Td>{anggota.pengguna.nip ?? '—'}</Table.Td>
                          <Table.ActionTd>
                            {selectedMembersProcess.siklusStatus !== 'ARCHIVED' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isSaving}
                                onClick={() => void hapusAnggota({
                                  prosesBisnisId: selectedMembersProcess.prosesBisnisId,
                                  penggunaId: anggota.penggunaId,
                                })}
                              >
                                Cabut
                              </Button>
                            ) : null}
                          </Table.ActionTd>
                        </Table.BodyRow>
                      ))}
                    </tbody>
                  </Table.Table>
                </Table.Root>
              </Table.Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <FormDialog
        open={inviteProcess !== null}
        onOpenChange={(open) => {
          if (!open) {
            setInviteProcessId(null)
            setInvite(EMPTY_INVITE)
            setActivationPath(null)
          }
        }}
        title={`Undang Penyusun SOP${inviteProcess ? ` — ${inviteProcess.nama}` : ''}`}
        description="Akun baru akan menjadi Anggota Proses Bisnis ini setelah menyelesaikan aktivasi."
        confirmLabel="Buat Undangan"
        confirmDisabled={
          !inviteProcess ||
          Object.values(invite).some((value) => value.trim() === '') ||
          isSaving
        }
        onConfirm={() => {
          if (!inviteProcess) return
          void undangAnggota({
            prosesBisnisId: inviteProcess.prosesBisnisId,
            payload: invite,
          }).then((result) => {
            setInvite(EMPTY_INVITE)
            setActivationPath(result.kind === 'INVITATION_CREATED' ? result.activationPath : null)
            if (result.kind === 'MEMBER_ADDED') setInviteProcessId(null)
          })
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Nama" value={invite.nama} onChange={(event) => setInvite((current) => ({ ...current, nama: event.target.value }))} />
          <Input placeholder="NIP" value={invite.nip} onChange={(event) => setInvite((current) => ({ ...current, nip: event.target.value }))} />
          <Input placeholder="Email" type="email" value={invite.email} onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} />
          <Input placeholder="Nomor HP" value={invite.nohp} onChange={(event) => setInvite((current) => ({ ...current, nohp: event.target.value }))} />
          <Input placeholder="Jabatan" value={invite.jabatan} onChange={(event) => setInvite((current) => ({ ...current, jabatan: event.target.value }))} />
          <Input placeholder="Pangkat/Golongan" value={invite.pangkat} onChange={(event) => setInvite((current) => ({ ...current, pangkat: event.target.value }))} />
        </div>
        {activationUrl ? (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-sm font-medium">Tautan aktivasi satu kali</p>
            <Input readOnly value={activationUrl} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void navigator.clipboard?.writeText(activationUrl)}
            >
              Salin tautan
            </Button>
          </div>
        ) : null}
      </FormDialog>

      <Dialog
        open={assignmentProcess !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAssignmentProcessId(null)
            setAssignmentDraft({})
          }
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Penugasan SOP — {assignmentProcess?.nama}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-secondary-foreground">
            Tetapkan Penyusun utama untuk koordinasi. Assignment tidak mengubah hak edit; hak edit tetap milik Anggota Proses Bisnis.
          </p>
          <Table.Card>
            <Table.Root aria-label="Penugasan Penyusun SOP">
              <Table.Table>
                <thead>
                  <Table.HeadRow>
                    <Table.Th>Nomor</Table.Th>
                    <Table.Th>SOP</Table.Th>
                    <Table.Th>Tahap</Table.Th>
                    <Table.Th>Penyusun Utama</Table.Th>
                    <Table.ActionTh>Aksi</Table.ActionTh>
                  </Table.HeadRow>
                </thead>
                <tbody>
                  {assignment.isLoading ? (
                    <Table.BodyRow><Table.Td colSpan={5}>Memuat penugasan...</Table.Td></Table.BodyRow>
                  ) : assignment.rows.length === 0 ? (
                    <Table.BodyRow><Table.Td colSpan={5}>Belum ada SOP pada Proses Bisnis ini.</Table.Td></Table.BodyRow>
                  ) : assignment.rows.map((row) => {
                    const selected = assignmentDraft[row.sopId] ?? row.penyusun?.penggunaId ?? ''
                    const assignable =
                      row.status === 'DRAFT' ||
                      row.status === 'REVISION_REQUIRED' ||
                      row.status === 'PROCESS_REVIEW'
                    return (
                      <Table.BodyRow key={row.sopId}>
                        <Table.Td>{row.nomorSOP ?? '—'}</Table.Td>
                        <Table.Td className="font-medium">{row.judul}</Table.Td>
                        <Table.Td>{row.status ? STATUS_LABEL[row.status] ?? row.status : '—'}</Table.Td>
                        <Table.Td>
                          {assignable && assignmentProcess ? (
                            <select
                              className="h-8 min-w-48 rounded-control border border-border bg-surface px-2 text-sm"
                              value={selected}
                              onChange={(event) => setAssignmentDraft((current) => ({
                                ...current,
                                [row.sopId]: event.target.value,
                              }))}
                            >
                              <option value="">Belum ditugaskan</option>
                              {assignmentProcess.anggota.map((anggota) => (
                                <option key={anggota.penggunaId} value={anggota.penggunaId}>
                                  {anggota.pengguna.nama}
                                </option>
                              ))}
                            </select>
                          ) : row.penyusun?.nama ?? 'Belum ditugaskan'}
                        </Table.Td>
                        <Table.ActionTd>
                          {assignable ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!selected || selected === row.penyusun?.penggunaId || assignment.isSaving}
                              onClick={() => void assignment.assign({ sopId: row.sopId, penggunaId: selected })}
                            >
                              Tetapkan
                            </Button>
                          ) : null}
                        </Table.ActionTd>
                      </Table.BodyRow>
                    )
                  })}
                </tbody>
              </Table.Table>
            </Table.Root>
          </Table.Card>
        </DialogContent>
      </Dialog>

      <FormDialog
        open={archiveProcess !== null}
        onOpenChange={(open) => {
          if (!open) {
            setArchiveId(null)
            setArchiveReason('')
          }
        }}
        title="Arsipkan Proses Bisnis"
        description="Proses Bisnis hanya dapat diarsipkan jika tidak ada SOP aktif yang masih berjalan."
        confirmLabel="Arsipkan"
        confirmVariant="destructive"
        confirmDisabled={archiveReason.trim().length < 3 || isSaving}
        onConfirm={() => {
          if (!archiveProcess) return
          void archiveProsesBisnis({
            prosesBisnisId: archiveProcess.prosesBisnisId,
            reason: archiveReason.trim(),
          }).then(() => {
            setArchiveId(null)
            setArchiveReason('')
          })
        }}
      >
        <label className="space-y-1.5 text-sm font-medium text-foreground">
          <span>Alasan arsip</span>
          <Input value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} />
        </label>
      </FormDialog>
    </section>
  )
}
