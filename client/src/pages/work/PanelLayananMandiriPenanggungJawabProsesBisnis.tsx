import { useMemo, useState } from 'react'
import { Check, ChevronDown, Copy, Edit, MailPlus, UserRoundPlus, UserRoundX, X } from 'lucide-react'
import { useProsesBisnisOwnerSelfService } from '@/api/penanggung-jawab-proses-bisnis'
import { DataSurface } from '@/components/data/data-surface'
import { FormDialog } from '@/components/ui/form-dialog'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table } from '@/components/ui/data-table'
import { IconActionButton } from '@/components/ui/icon-action-button'
import { SearchableSelectDialog } from '@/components/ui/searchable-select-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  InviteAnggotaProsesBisnisPayload,
  KewenanganPenanggungJawabProsesBisnisDto,
} from '@/types/dto/proses-bisnis.dto'

const EMPTY_INVITE: InviteAnggotaProsesBisnisPayload = {
  nama: '',
  nip: '',
  email: '',
  jabatan: '',
  pangkat: '',
  nohp: '',
}

const selectClassName =
  'h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'

export function PanelLayananMandiriPenanggungJawabProsesBisnis() {
  const {
    scopes,
    prosesBisnis,
    memberDirectory,
    users,
    isLoading,
    createProsesBisnis,
    renameProsesBisnis,
    addMembers,
    hapusAnggota,
    undangAnggota,
    reissueInvitation,
    isSaving,
  } = useProsesBisnisOwnerSelfService()
  const [namaProsesBisnis, setProsesBisnisName] = useState('')
  const [memberDialogProcessId, setMemberDialogProcessId] = useState<string | null>(null)
  const [inviteDialogProcessId, setInviteDialogProcessId] = useState<string | null>(null)
  const [anggotaIds, setMemberIds] = useState<string[]>([])
  const [invite, setInvite] = useState(EMPTY_INVITE)
  const [activationPath, setActivationPath] = useState<string | null>(null)
  const [renameProcessId, setRenameProcessId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
  const [isRenameDialogOpen, setRenameDialogOpen] = useState(false)
  const [isMemberDialogOpen, setMemberDialogOpen] = useState(false)
  const [isMemberPickerOpen, setMemberPickerOpen] = useState(false)
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'processes' | 'members'>('processes')

  const memberProcess = useMemo(
    () => prosesBisnis.find((process) => process.prosesBisnisId === memberDialogProcessId) ?? null,
    [prosesBisnis, memberDialogProcessId],
  )
  const inviteProcess = useMemo(
    () => prosesBisnis.find((process) => process.prosesBisnisId === inviteDialogProcessId) ?? null,
    [prosesBisnis, inviteDialogProcessId],
  )
  const renameProcess = useMemo(
    () => prosesBisnis.find((process) => process.prosesBisnisId === renameProcessId) ?? null,
    [prosesBisnis, renameProcessId],
  )
  const selectedMemberIds = new Set(memberProcess?.anggota.map((anggota) => anggota.penggunaId) ?? [])
  const availableUsers = users.filter(
    (user) => user.penggunaId !== memberProcess?.penanggungJawabId && !selectedMemberIds.has(user.penggunaId),
  )
  const selectedAuthority = scopes.length === 1 ? scopes[0] : null
  const hasInvalidScopeConfiguration = scopes.length > 1
  const canCreate = namaProsesBisnis.trim().length >= 2 && selectedAuthority !== null
  const canInvite = Object.values(invite).every((value) => value.trim() !== '')
  const activationUrl = activationPath
    ? `${typeof window === 'undefined' ? '' : window.location.origin}${activationPath}`
    : null
  const directoryRows = useMemo(
    () => memberDirectory.flatMap((process) => [
      ...process.anggota.map((member) => ({
        key: `member-${process.prosesBisnisId}-${member.penggunaId}`,
        process,
        nama: member.pengguna.nama,
        email: member.pengguna.email,
        kind: 'member' as const,
        status: 'AKTIF',
        invitationId: null,
      })),
      ...process.undangan.map((invitation) => ({
        key: `invitation-${invitation.undanganAnggotaProsesBisnisId}`,
        process,
        nama: invitation.nama,
        email: invitation.email,
        kind: 'invitation' as const,
        status: invitation.status,
        invitationId: invitation.undanganAnggotaProsesBisnisId,
      })),
    ]),
    [memberDirectory],
  )

  const authorityLabel = (authority: KewenanganPenanggungJawabProsesBisnisDto) =>
    authority.lingkup === 'FACULTY' ? 'Fakultas' : authority.departemen?.nama ?? 'Departemen'

  const openCreateDialog = () => {
    setProsesBisnisName('')
    setCreateDialogOpen(true)
  }

  const handleCreate = async () => {
    if (!selectedAuthority || !canCreate) return
    try {
      const created = await createProsesBisnis({
        nama: namaProsesBisnis.trim(),
        kewenanganPenanggungJawabProsesBisnisId: selectedAuthority.kewenanganPenanggungJawabProsesBisnisId,
      })
      setProsesBisnisName('')
      setCreateDialogOpen(false)
      setMemberDialogProcessId(created.prosesBisnisId)
      setMemberDialogOpen(true)
    } catch {
      // Toast owns error reporting.
    }
  }

  const openRenameDialog = (processId: string, nama: string) => {
    setRenameProcessId(processId)
    setRenameValue(nama)
    setRenameDialogOpen(true)
  }

  const handleRename = async () => {
    if (!renameProcess || renameValue.trim().length < 2 || renameValue.trim() === renameProcess.nama) return
    try {
      await renameProsesBisnis({ prosesBisnisId: renameProcess.prosesBisnisId, nama: renameValue.trim() })
      setRenameDialogOpen(false)
      setRenameProcessId(null)
    } catch {
      // Toast owns error reporting.
    }
  }

  const openMemberDialog = (processId: string) => {
    setMemberDialogProcessId(processId)
    setMemberIds([])
    setMemberDialogOpen(true)
  }

  const handleAddMember = async () => {
    if (!memberDialogProcessId || anggotaIds.length === 0) return
    try {
      await addMembers({ prosesBisnisId: memberDialogProcessId, penggunaIds: anggotaIds })
      setMemberIds([])
      setMemberDialogOpen(false)
    } catch {
      // Toast owns error reporting.
    }
  }

  const selectedMembers = availableUsers.filter((user) => anggotaIds.includes(user.penggunaId))

  const openInviteDialog = (processId: string) => {
    setInviteDialogProcessId(processId)
    setInvite(EMPTY_INVITE)
    setInviteDialogOpen(true)
  }

  const handleInvite = async () => {
    if (!inviteDialogProcessId || !canInvite) return
    try {
      const result = await undangAnggota({ prosesBisnisId: inviteDialogProcessId, payload: invite })
      setInvite(EMPTY_INVITE)
      setInviteDialogOpen(false)
      setActivationPath(result.kind === 'INVITATION_CREATED' ? result.activationPath : null)
    } catch {
      // Toast owns error reporting.
    }
  }

  const handleReissueInvitation = async (invitationId: string) => {
    try {
      const result = await reissueInvitation(invitationId)
      setActivationPath(result.activationPath)
      const url = `${typeof window === 'undefined' ? '' : window.location.origin}${result.activationPath}`
      await navigator.clipboard?.writeText(url)
    } catch {
      // Toast owns error reporting.
    }
  }

  return (
    <DataSurface.Root>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'processes' | 'members')}>
        <DataSurface.Header>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {activeTab === 'processes' ? 'Proses Bisnis' : 'Tim Penyusun SOP dan Undangan'}
              </h2>
              <p className="mt-1 text-xs text-secondary-foreground">
                {activeTab === 'processes'
                  ? 'Kelola Proses Bisnis dalam lingkup kewenangan Anda.'
                  : 'Seluruh akun dan riwayat undangan ditampilkan sesuai Proses Bisnis yang Anda kelola.'}
              </p>
            </div>
            {activeTab === 'processes' && scopes.length === 1 ? (
              <Button size="sm" onClick={openCreateDialog} disabled={isSaving}>
                Buat Proses Bisnis
              </Button>
            ) : null}
          </div>
          <TabsList
            variant="segmented"
            className="grid h-11 w-full grid-cols-2 gap-0.5 rounded-control border-0 bg-surface-muted/70 p-1 shadow-none"
            aria-label="Kelola Proses Bisnis dan Tim Penyusun SOP"
          >
            <TabsTrigger
              variant="segmented"
              className="w-full min-w-0 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/70"
              value="processes"
            >
              Proses Bisnis
            </TabsTrigger>
            <TabsTrigger
              variant="segmented"
              className="w-full min-w-0 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/70"
              value="members"
            >
              Tim Penyusun SOP dan Undangan
            </TabsTrigger>
          </TabsList>
        </DataSurface.Header>

        <TabsContent value="processes" className="mt-0">
        <Table.Root>
        <Table.Table>
          <thead>
            <Table.HeadRow>
              <Table.Th>Proses Bisnis</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Tim Penyusun SOP</Table.Th>
              <Table.ActionTh>Aksi</Table.ActionTh>
            </Table.HeadRow>
          </thead>
          <tbody>
            {isLoading ? (
              <Table.BodyRow><Table.Td colSpan={4}>Memuat Proses Bisnis...</Table.Td></Table.BodyRow>
            ) : prosesBisnis.length === 0 ? (
              <Table.BodyRow><Table.Td colSpan={4}>Belum ada Proses Bisnis.</Table.Td></Table.BodyRow>
            ) : (
              prosesBisnis.map((process) => {
                const isArchived = process.siklusStatus === 'ARCHIVED'
                return (
                  <Table.BodyRow key={process.prosesBisnisId}>
                    <Table.Td className="font-medium text-foreground">{process.nama}</Table.Td>
                    <Table.Td>
                      <Badge variant={isArchived ? 'secondary' : 'success'}>
                        {isArchived ? 'Diarsipkan' : 'Aktif'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{process.anggota.length}</Table.Td>
                    <Table.ActionTd>
                      <IconActionButton
                        icon={UserRoundPlus}
                        title={`Tambah anggota Tim Penyusun SOP pada ${process.nama}`}
                        disabled={isArchived || isSaving}
                        onClick={() => openMemberDialog(process.prosesBisnisId)}
                      />
                      <IconActionButton
                        icon={MailPlus}
                        title={`Undang anggota Tim Penyusun SOP pada ${process.nama}`}
                        disabled={isArchived || isSaving}
                        onClick={() => openInviteDialog(process.prosesBisnisId)}
                      />
                      <IconActionButton
                        icon={Edit}
                        title={`Ubah nama ${process.nama}`}
                        disabled={isArchived || isSaving}
                        onClick={() => openRenameDialog(process.prosesBisnisId, process.nama)}
                      />
                    </Table.ActionTd>
                  </Table.BodyRow>
                )
              })
            )}
          </tbody>
      </Table.Table>
        </Table.Root>
      </TabsContent>

      <TabsContent value="members" className="mt-0">
        <Table.Root>
          <Table.Table>
            <thead>
              <Table.HeadRow>
              <Table.Th>Nama / Alamat Email</Table.Th>
                <Table.Th>Proses Bisnis</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.ActionTh>Aksi</Table.ActionTh>
              </Table.HeadRow>
            </thead>
            <tbody>
              {isLoading ? (
                <Table.BodyRow><Table.Td colSpan={4}>Memuat katalog penyusun...</Table.Td></Table.BodyRow>
              ) : directoryRows.length === 0 ? (
                <Table.BodyRow><Table.Td colSpan={4}>Belum ada penyusun atau undangan.</Table.Td></Table.BodyRow>
              ) : directoryRows.map((row) => {
                const isExpired = row.kind === 'invitation' && row.status === 'PENDING' && new Date(memberDirectory.find((process) => process.prosesBisnisId === row.process.prosesBisnisId)?.undangan.find((invitation) => invitation.undanganAnggotaProsesBisnisId === row.invitationId)?.expiresAt ?? 0) <= new Date()
                const statusLabel = row.kind === 'member'
                  ? 'Anggota Tim aktif'
                  : isExpired
                    ? 'Kedaluwarsa'
                    : row.status === 'PENDING'
                      ? 'Menunggu aktivasi keanggotaan'
                      : row.status === 'ACCEPTED'
                        ? 'Undangan diterima'
                        : row.status === 'REVOKED'
                          ? 'Dicabut'
                          : 'Kedaluwarsa'
                return (
                  <Table.BodyRow key={row.key}>
                    <Table.Td>
                      <p className="font-medium text-foreground">{row.nama}</p>
                      <p className="text-xs text-secondary-foreground">{row.email}</p>
                    </Table.Td>
                    <Table.Td>{row.process.nama}</Table.Td>
                    <Table.Td><Badge variant={row.kind === 'member' ? 'success' : row.status === 'PENDING' && !isExpired ? 'outline' : 'secondary'}>{statusLabel}</Badge></Table.Td>
                    <Table.ActionTd>
                      {row.kind === 'invitation' && row.invitationId && (row.status === 'PENDING' || row.status === 'EXPIRED') ? (
                        <IconActionButton
                          icon={Copy}
                          title="Terbitkan dan salin ulang tautan undangan"
                          disabled={isSaving || row.process.siklusStatus === 'ARCHIVED'}
                          onClick={() => handleReissueInvitation(row.invitationId as string)}
                        />
                      ) : null}
                    </Table.ActionTd>
                  </Table.BodyRow>
                )
              })}
            </tbody>
          </Table.Table>
        </Table.Root>
      </TabsContent>
      </Tabs>

      <FormDialog
        open={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Buat Proses Bisnis"
        confirmLabel="Buat Proses Bisnis"
        onConfirm={handleCreate}
        confirmDisabled={!canCreate || isSaving}
      >
        <FormField label="Nama Proses Bisnis" required>
          <Input
            autoFocus
            value={namaProsesBisnis}
            onChange={(event) => setProsesBisnisName(event.target.value)}
            placeholder="Contoh: Pengelolaan Akademik"
          />
        </FormField>
        {scopes.length === 1 ? (
          <div className="flex items-center justify-between gap-3 rounded-control border border-border bg-surface-muted px-3 py-2">
            <span className="text-xs font-medium text-secondary-foreground">Lingkup kewenangan</span>
            <Badge variant="outline">{authorityLabel(scopes[0])}</Badge>
          </div>
        ) : hasInvalidScopeConfiguration ? (
          <div className="rounded-control border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            Konfigurasi akun memiliki lebih dari satu lingkup Penanggung Jawab Proses Bisnis aktif. Minta Administrator memperbaikinya sebelum membuat Proses Bisnis.
          </div>
        ) : null}
      </FormDialog>

      <FormDialog
        open={isRenameDialogOpen}
        onOpenChange={(open) => {
          setRenameDialogOpen(open)
          if (!open) setRenameProcessId(null)
        }}
        title="Ubah Nama Proses Bisnis"
        confirmLabel="Simpan"
        onConfirm={handleRename}
        confirmDisabled={!renameProcess || renameValue.trim().length < 2 || renameValue.trim() === renameProcess.nama || isSaving}
      >
        <FormField label="Nama Proses Bisnis" required>
          <Input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
        </FormField>
      </FormDialog>

      <FormDialog
        open={isMemberDialogOpen}
        onOpenChange={(open) => {
          setMemberDialogOpen(open)
          if (!open) {
            setMemberDialogProcessId(null)
            setMemberIds([])
          }
        }}
        title={`Kelola Tim Penyusun SOP${memberProcess ? ` — ${memberProcess.nama}` : ''}`}
        confirmLabel="Tambahkan"
        onConfirm={handleAddMember}
        confirmDisabled={anggotaIds.length === 0 || isSaving}
      >
        <FormField label="Anggota Tim Penyusun SOP baru" required>
          <button
            type="button"
            className={`${selectClassName} flex items-center justify-between gap-3 text-left`}
            onClick={() => setMemberPickerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isMemberPickerOpen}
          >
            <span className={anggotaIds.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
              {anggotaIds.length > 0 ? `${anggotaIds.length} akun dipilih` : 'Pilih satu atau beberapa akun'}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </FormField>

        {selectedMembers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5" aria-label="Akun yang akan ditambahkan">
            {selectedMembers.map((user) => (
              <span key={user.penggunaId} className="inline-flex max-w-full items-center gap-1 rounded-control border border-primary/30 bg-primary-subtle px-2 py-1 text-xs text-primary-hover">
                <Check className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{user.nama}</span>
                <button
                  type="button"
                  className="ml-0.5 rounded-full p-0.5 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => setMemberIds((current) => current.filter((id) => id !== user.penggunaId))}
                  aria-label={`Hapus ${user.nama} dari pilihan`}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {memberProcess?.anggota.length ? (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-secondary-foreground">Anggota Tim Penyusun SOP saat ini</p>
            <div className="divide-y divide-border rounded-control border border-border">
              {memberProcess.anggota.map((keanggotaan) => (
                <div key={keanggotaan.penggunaId} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{keanggotaan.pengguna.nama}</p>
                    <p className="truncate text-xs text-secondary-foreground">{keanggotaan.pengguna.email}</p>
                  </div>
                  <IconActionButton
                    icon={UserRoundX}
                    title={`Cabut ${keanggotaan.pengguna.nama} dari Penyusun SOP`}
                    destructive
                    disabled={isSaving}
                    onClick={() => hapusAnggota({ prosesBisnisId: memberProcess.prosesBisnisId, penggunaId: keanggotaan.penggunaId })}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </FormDialog>

      <SearchableSelectDialog
        open={isMemberPickerOpen}
        onOpenChange={setMemberPickerOpen}
        title="Pilih Penyusun SOP"
        description="Pilih satu atau beberapa akun aktif untuk ditambahkan ke Proses Bisnis ini."
        searchPlaceholder="Cari nama atau email..."
        items={availableUsers}
        initialSelectedIds={anggotaIds}
        getId={(user) => user.penggunaId}
        getSearchText={(user) => `${user.nama} ${user.email} ${user.nip ?? ''}`}
        renderItem={(user) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{user.nama}</p>
            <p className="truncate text-xs text-secondary-foreground">{user.email}</p>
          </div>
        )}
        emptyMessage="Belum ada akun aktif yang dapat ditambahkan."
        emptySearchMessage="Tidak ada akun yang cocok dengan pencarian."
        confirmLabel="Simpan pilihan"
        onConfirm={setMemberIds}
      />

      <FormDialog
        open={isInviteDialogOpen}
        onOpenChange={(open) => {
          setInviteDialogOpen(open)
          if (!open) setInviteDialogProcessId(null)
        }}
        title={`Undang Penyusun SOP${inviteProcess ? ` — ${inviteProcess.nama}` : ''}`}
        confirmLabel="Undang Penyusun"
        onConfirm={handleInvite}
        confirmDisabled={!canInvite || isSaving}
        size="lg"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nama" required><Input value={invite.nama} onChange={(event) => setInvite((current) => ({ ...current, nama: event.target.value }))} /></FormField>
          <FormField label="NIP" required><Input value={invite.nip} onChange={(event) => setInvite((current) => ({ ...current, nip: event.target.value }))} /></FormField>
          <FormField label="Email" required><Input type="email" value={invite.email} onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} /></FormField>
          <FormField label="Nomor HP" required><Input value={invite.nohp} onChange={(event) => setInvite((current) => ({ ...current, nohp: event.target.value }))} /></FormField>
          <FormField label="Jabatan" required><Input value={invite.jabatan} onChange={(event) => setInvite((current) => ({ ...current, jabatan: event.target.value }))} /></FormField>
          <FormField label="Pangkat" required><Input value={invite.pangkat} onChange={(event) => setInvite((current) => ({ ...current, pangkat: event.target.value }))} /></FormField>
        </div>
      </FormDialog>

      <FormDialog
        open={activationUrl !== null}
        onOpenChange={(open) => {
          if (!open) setActivationPath(null)
        }}
        title="Tautan Undangan"
        confirmLabel="Tutup"
        onConfirm={() => setActivationPath(null)}
      >
        <FormField label="Tautan undangan" required>
          <Input readOnly value={activationUrl ?? ''} />
        </FormField>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => activationUrl && navigator.clipboard?.writeText(activationUrl)}
        >
          Salin Tautan
        </Button>
      </FormDialog>
    </DataSurface.Root>
  )
}
