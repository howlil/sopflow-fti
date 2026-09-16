import { Fragment, useMemo, useState } from 'react'
import { ArrowRightLeft, ChevronDown, ChevronUp, Edit, UserRoundPlus, UserRoundX } from 'lucide-react'
import { useProsesBisnisAdministration } from '@/api/administrasi-proses-bisnis'
import { DataSurface } from '@/components/data/data-surface'
import { FormDialog } from '@/components/ui/form-dialog'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table } from '@/components/ui/data-table'
import { IconActionButton } from '@/components/ui/icon-action-button'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const selectClassName =
  'h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'

type AuthorityDialogState =
  | { lingkup: 'FACULTY'; departemenId: null; title: string }
  | { lingkup: 'DEPARTMENT'; departemenId: string; title: string }
  | null

const scopeKey = (lingkup: 'FACULTY' | 'DEPARTMENT', departemenId: string | null) =>
  lingkup === 'FACULTY' ? 'FACULTY' : `DEPARTMENT:${departemenId}`

const contentId = (key: string) => `proses-bisnis-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-content`

export function HalamanPengelolaanProsesBisnis() {
  const {
    departemen,
    users,
    ownerAuthorities,
    memberDirectory,
    isLoading,
    createDepartemen,
    updateDepartemen,
    grantOwnerAuthority,
    revokeOwnerAuthority,
    transferMember,
    isSaving,
  } = useProsesBisnisAdministration()
  const [isStructureExpanded, setStructureExpanded] = useState(true)
  const [expandedScopes, setExpandedScopes] = useState<Record<string, boolean>>({})
  const [isDepartemenDialogOpen, setDepartemenDialogOpen] = useState(false)
  const [namaDepartemen, setDepartemenName] = useState('')
  const [editingDepartemenId, setEditingDepartemenId] = useState<string | null>(null)
  const [editingDepartemenName, setEditingDepartemenName] = useState('')
  const [authorityDialog, setAuthorityDialog] = useState<AuthorityDialogState>(null)
  const [selectedAuthorityUserId, setSelectedAuthorityUserId] = useState('')
  const [transferState, setTransferState] = useState<{ penggunaId: string; nama: string; sourceProsesBisnisId: string } | null>(null)
  const [targetProsesBisnisId, setTargetProsesBisnisId] = useState('')

  const eligibleUsers = useMemo(
    () => users.filter((user) => user.platformRole === 'USER' && !user.deletedAt),
    [users],
  )
  const authoritiesByScope = useMemo(() => {
    const grouped = new Map<string, typeof ownerAuthorities>()
    for (const authority of ownerAuthorities) {
      const key = scopeKey(authority.lingkup, authority.departemenId)
      grouped.set(key, [...(grouped.get(key) ?? []), authority])
    }
    return grouped
  }, [ownerAuthorities])
  const memberDirectoryRows = useMemo(
    () => memberDirectory.flatMap((process) => [
      ...process.anggota.map((member) => ({
        key: `member-${process.prosesBisnisId}-${member.penggunaId}`,
        process,
        nama: member.pengguna.nama,
        email: member.pengguna.email,
        penggunaId: member.penggunaId,
        status: 'Anggota aktif',
        invitation: false,
      })),
      ...process.undangan.map((invitation) => ({
        key: `invitation-${invitation.undanganAnggotaProsesBisnisId}`,
        process,
        nama: invitation.nama,
        email: invitation.email,
        penggunaId: null,
        status: invitation.status === 'PENDING' && new Date(invitation.expiresAt) <= new Date()
          ? 'Kedaluwarsa'
          : invitation.status === 'PENDING'
            ? 'Menunggu aktivasi'
            : invitation.status === 'ACCEPTED'
              ? 'Diterima'
              : invitation.status === 'REVOKED'
                ? 'Dicabut'
                : 'Kedaluwarsa',
        invitation: true,
      })),
    ]),
    [memberDirectory],
  )

  const toggleScope = (key: string) => {
    setExpandedScopes((current) => ({ ...current, [key]: !current[key] }))
  }

  const openFacultyAuthorityDialog = () => {
    setSelectedAuthorityUserId('')
    setAuthorityDialog({
      lingkup: 'FACULTY',
      departemenId: null,
      title: 'Tetapkan Penanggung Jawab Fakultas',
    })
  }

  const openDepartmentAuthorityDialog = (departemenId: string, namaDepartemen: string) => {
    const key = scopeKey('DEPARTMENT', departemenId)
    setExpandedScopes((current) => ({ ...current, [key]: true }))
    setSelectedAuthorityUserId('')
    setAuthorityDialog({
      lingkup: 'DEPARTMENT',
      departemenId,
      title: `Tetapkan Penanggung Jawab ${namaDepartemen}`,
    })
  }

  const handleCreateDepartemen = async () => {
    try {
      await createDepartemen(namaDepartemen.trim())
      setDepartemenDialogOpen(false)
      setDepartemenName('')
    } catch {
      // Toast already reports the error.
    }
  }

  const handleGrantAuthority = async () => {
    if (!authorityDialog || !selectedAuthorityUserId) return

    try {
      await grantOwnerAuthority({
        penggunaId: selectedAuthorityUserId,
        lingkup: authorityDialog.lingkup,
        departemenId: authorityDialog.departemenId,
      })
      setAuthorityDialog(null)
      setSelectedAuthorityUserId('')
    } catch {
      // Toast already reports the error.
    }
  }

  const handleUpdateDepartemen = async () => {
    if (editingDepartemenId === null || editingDepartemenName.trim().length < 2) return
    try {
      await updateDepartemen({
        departemenId: editingDepartemenId,
        nama: editingDepartemenName.trim(),
      })
      setEditingDepartemenId(null)
    } catch {
      // Toast already reports the error.
    }
  }

  const openTransferDialog = (penggunaId: string, nama: string, sourceProsesBisnisId: string) => {
    setTransferState({ penggunaId, nama, sourceProsesBisnisId })
    setTargetProsesBisnisId('')
  }

  const handleTransfer = async () => {
    if (!transferState || !targetProsesBisnisId) return
    try {
      await transferMember({
        penggunaId: transferState.penggunaId,
        sourceProsesBisnisId: transferState.sourceProsesBisnisId,
        targetProsesBisnisId,
      })
      setTransferState(null)
      setTargetProsesBisnisId('')
    } catch {
      // Toast already reports the error.
    }
  }

  const targetProcesses = memberDirectory.filter(
    (process) => process.prosesBisnisId !== transferState?.sourceProsesBisnisId && process.siklusStatus !== 'ARCHIVED',
  )

  const renderAuthorityDetails = (key: string) => {
    if (!expandedScopes[key]) return null
    const assignments = authoritiesByScope.get(key) ?? []

    return (
      <Table.BodyRow key={`${key}-detail`}>
        <Table.Td id={contentId(key)} colSpan={3} className="bg-surface-subtle">
          {assignments.length === 0 ? (
            <p className="text-sm text-secondary-foreground">Belum ada Penanggung Jawab.</p>
          ) : (
            <div className="divide-y divide-border rounded-control border border-border bg-surface">
              {assignments.map((assignment) => (
                <div
                  key={assignment.kewenanganPenanggungJawabProsesBisnisId}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {assignment.user?.nama ?? 'Pengguna tidak tersedia'}
                    </p>
                    <p className="truncate text-xs text-secondary-foreground">
                      {assignment.user?.email ?? 'Akun tidak tersedia'}
                    </p>
                  </div>
                  <IconActionButton
                    icon={UserRoundX}
                    title={`Cabut kewenangan ${assignment.user?.nama ?? 'Penanggung Jawab'}`}
                    destructive
                    disabled={isSaving}
                    onClick={() => revokeOwnerAuthority(assignment.kewenanganPenanggungJawabProsesBisnisId)}
                  />
                </div>
              ))}
            </div>
          )}
        </Table.Td>
      </Table.BodyRow>
    )
  }

  const renderScopeTrigger = (key: string, label: string) => {
    const isExpanded = expandedScopes[key] ?? false
    const ExpandIcon = isExpanded ? ChevronUp : ChevronDown
    return (
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-control text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`${isExpanded ? 'Tutup' : 'Buka'} data ${label}`}
        aria-expanded={isExpanded}
        aria-controls={contentId(key)}
        title={`${isExpanded ? 'Tutup' : 'Buka'} data ${label}`}
        onClick={() => toggleScope(key)}
      >
        <ExpandIcon className="h-4 w-4 shrink-0 text-secondary-foreground" aria-hidden />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Administrasi' }, { label: 'Proses Bisnis dan Organisasi' }]}
      title="Proses Bisnis dan Organisasi"
    >
      <Tabs defaultValue="structure" className="space-y-4">
        <TabsList
          variant="segmented"
          className="grid h-11 w-full grid-cols-2 gap-0.5 rounded-control border-0 bg-surface-muted/70 p-1 shadow-none"
            aria-label="Kelola struktur organisasi dan Tim Penyusun SOP"
        >
          <TabsTrigger
            variant="segmented"
            className="w-full min-w-0 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/70"
            value="structure"
          >
            Struktur Organisasi
          </TabsTrigger>
          <TabsTrigger
            variant="segmented"
            className="w-full min-w-0 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/70"
            value="directory"
          >
            Tim Penyusun SOP dan Undangan
          </TabsTrigger>
        </TabsList>

      <TabsContent value="structure" className="mt-0">
      <DataSurface.Root>
        <section>
          <DataSurface.Header>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-expanded={isStructureExpanded}
                aria-controls="proses-bisnis-struktur-content"
                onClick={() => setStructureExpanded((current) => !current)}
              >
                <h2 className="text-sm font-semibold text-foreground">Struktur Organisasi</h2>
                {isStructureExpanded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
              </button>
              <Button
                onClick={() => {
                  setDepartemenName('')
                  setDepartemenDialogOpen(true)
                }}
              >
                Tambah Departemen
              </Button>
            </div>
          </DataSurface.Header>

          {isStructureExpanded ? (
            <div id="proses-bisnis-struktur-content">
              <Table.Root>
                <Table.Table>
                  <thead>
                    <Table.HeadRow>
                      <Table.Th>Lingkup</Table.Th>
                      <Table.Th>Penanggung Jawab</Table.Th>
                      <Table.ActionTh>Aksi</Table.ActionTh>
                    </Table.HeadRow>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <Table.BodyRow><Table.Td colSpan={3}>Memuat struktur organisasi...</Table.Td></Table.BodyRow>
                    ) : (
                      <>
                        {(() => {
                          const key = scopeKey('FACULTY', null)
                          const assignments = authoritiesByScope.get(key) ?? []
                          return (
                            <>
                              <Table.BodyRow>
                                <Table.Td className="font-medium text-foreground">
                                  {renderScopeTrigger(key, 'Fakultas')}
                                </Table.Td>
                                <Table.Td>{assignments.length > 0 ? `${assignments.length} orang` : 'Belum ada'}</Table.Td>
                                <Table.ActionTd>
                                  <IconActionButton
                                    icon={UserRoundPlus}
                                    title="Tetapkan Penanggung Jawab Fakultas"
                                    disabled={isSaving}
                                    onClick={openFacultyAuthorityDialog}
                                  />
                                </Table.ActionTd>
                              </Table.BodyRow>
                              {renderAuthorityDetails(key)}
                            </>
                          )
                        })()}
                        {departemen.length === 0 ? (
                          <Table.BodyRow>
                            <Table.Td colSpan={3}>Belum ada Departemen.</Table.Td>
                          </Table.BodyRow>
                        ) : (
                          departemen.map((department) => {
                            const key = scopeKey('DEPARTMENT', department.departemenId)
                            const assignments = authoritiesByScope.get(key) ?? []
                            return (
                              <Fragment key={department.departemenId}>
                                <Table.BodyRow>
                                  <Table.Td className="font-medium text-foreground">
                                    {renderScopeTrigger(key, department.nama)}
                                  </Table.Td>
                                  <Table.Td>{assignments.length > 0 ? `${assignments.length} orang` : 'Belum ada'}</Table.Td>
                                  <Table.ActionTd>
                                    <IconActionButton
                                      icon={UserRoundPlus}
                                      title={`Tetapkan Penanggung Jawab ${department.nama}`}
                                      disabled={isSaving}
                                      onClick={() => openDepartmentAuthorityDialog(department.departemenId, department.nama)}
                                    />
                                    <IconActionButton
                                      icon={Edit}
                                      title={`Ubah departemen ${department.nama}`}
                                      onClick={() => {
                                        setEditingDepartemenId(department.departemenId)
                                        setEditingDepartemenName(department.nama)
                                      }}
                                    />
                                  </Table.ActionTd>
                                </Table.BodyRow>
                                {renderAuthorityDetails(key)}
                              </Fragment>
                            )
                          })
                        )}
                      </>
                    )}
                  </tbody>
                </Table.Table>
              </Table.Root>
            </div>
          ) : null}
        </section>
      </DataSurface.Root>

      </TabsContent>

      <TabsContent value="directory" className="mt-0">
      <DataSurface.Root>
        <DataSurface.Header>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Tim Penyusun SOP dan Undangan</h2>
            <p className="mt-1 text-xs text-secondary-foreground">
              Katalog lintas Proses Bisnis untuk pemantauan dan pemindahan anggota oleh Administrator Platform.
            </p>
          </div>
        </DataSurface.Header>
        <Table.Root>
          <Table.Table>
            <thead>
              <Table.HeadRow>
                <Table.Th>Proses Bisnis</Table.Th>
                <Table.Th>Lingkup</Table.Th>
                <Table.Th>Penanggung Jawab</Table.Th>
                <Table.Th>Penyusun / Undangan</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.ActionTh>Aksi</Table.ActionTh>
              </Table.HeadRow>
            </thead>
            <tbody>
              {isLoading ? (
                <Table.BodyRow><Table.Td colSpan={6}>Memuat katalog penyusun...</Table.Td></Table.BodyRow>
              ) : memberDirectoryRows.length === 0 ? (
                <Table.BodyRow><Table.Td colSpan={6}>Belum ada penyusun atau undangan.</Table.Td></Table.BodyRow>
              ) : memberDirectoryRows.map((row) => (
                <Table.BodyRow key={row.key}>
                  <Table.Td className="font-medium text-foreground">{row.process.nama}</Table.Td>
                  <Table.Td>{row.process.lingkup === 'FACULTY' ? 'Fakultas' : row.process.departemen?.nama ?? 'Departemen'}</Table.Td>
                  <Table.Td>
                    <p className="font-medium text-foreground">{row.process.penanggungJawab.nama}</p>
                    <p className="text-xs text-secondary-foreground">{row.process.penanggungJawab.email}</p>
                  </Table.Td>
                  <Table.Td>
                    <p className="font-medium text-foreground">{row.nama}</p>
                    <p className="text-xs text-secondary-foreground">{row.email}</p>
                  </Table.Td>
                  <Table.Td><Badge variant={row.invitation ? 'outline' : 'success'}>{row.status}</Badge></Table.Td>
                  <Table.ActionTd>
                    {!row.invitation && row.penggunaId ? (
                      <IconActionButton
                        icon={ArrowRightLeft}
                        title={`Pindahkan ${row.nama} ke Proses Bisnis lain`}
                        disabled={isSaving}
                        onClick={() => openTransferDialog(row.penggunaId as string, row.nama, row.process.prosesBisnisId)}
                      />
                    ) : null}
                  </Table.ActionTd>
                </Table.BodyRow>
              ))}
            </tbody>
          </Table.Table>
        </Table.Root>
      </DataSurface.Root>

      </TabsContent>
      </Tabs>

      <FormDialog
        open={isDepartemenDialogOpen}
        onOpenChange={setDepartemenDialogOpen}
        title="Tambah Departemen"
        description="Masukkan nama departemen yang akan digunakan dalam struktur organisasi."
        confirmLabel="Tambahkan"
        onConfirm={handleCreateDepartemen}
        confirmDisabled={namaDepartemen.trim().length < 2 || isSaving}
      >
        <FormField label="Nama Departemen" required>
          <Input
            autoFocus
            value={namaDepartemen}
            onChange={(event) => setDepartemenName(event.target.value)}
            placeholder="Contoh: Informatika"
          />
        </FormField>
      </FormDialog>

      <FormDialog
        open={transferState !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTransferState(null)
            setTargetProsesBisnisId('')
          }
        }}
        title={`Pindahkan Penyusun SOP${transferState ? ` — ${transferState.nama}` : ''}`}
        description="Akses anggota akan dicabut dari Proses Bisnis asal dan dipindahkan ke tujuan secara atomik. SOP yang sudah ada tidak ikut dipindahkan."
        confirmLabel="Pindahkan"
        onConfirm={handleTransfer}
        confirmDisabled={!targetProsesBisnisId || isSaving}
      >
        <FormField label="Proses Bisnis tujuan" required>
          <select
            className={selectClassName}
            value={targetProsesBisnisId}
            onChange={(event) => setTargetProsesBisnisId(event.target.value)}
          >
            <option value="">Pilih Proses Bisnis aktif</option>
            {targetProcesses.map((process) => (
              <option key={process.prosesBisnisId} value={process.prosesBisnisId}>
                {process.nama} — {process.lingkup === 'FACULTY' ? 'Fakultas' : process.departemen?.nama ?? 'Departemen'}
              </option>
            ))}
          </select>
        </FormField>
      </FormDialog>

      <FormDialog
        open={editingDepartemenId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingDepartemenId(null)
        }}
        title="Ubah Departemen"
        description="Perbarui nama departemen pada struktur organisasi."
        confirmLabel="Simpan"
        onConfirm={handleUpdateDepartemen}
        confirmDisabled={editingDepartemenName.trim().length < 2 || isSaving}
      >
        <FormField label="Nama Departemen" required>
          <Input
            autoFocus
            value={editingDepartemenName}
            onChange={(event) => setEditingDepartemenName(event.target.value)}
          />
        </FormField>
      </FormDialog>

      <FormDialog
        open={authorityDialog !== null}
        onOpenChange={(open) => {
          if (!open) setAuthorityDialog(null)
        }}
        title={authorityDialog?.title ?? 'Tetapkan Penanggung Jawab'}
        confirmLabel="Tetapkan"
        onConfirm={handleGrantAuthority}
        confirmDisabled={!selectedAuthorityUserId || isSaving}
      >
        <FormField label="Pengguna" required>
          <select
            className={selectClassName}
            value={selectedAuthorityUserId}
            onChange={(event) => setSelectedAuthorityUserId(event.target.value)}
          >
            <option value="">Pilih pengguna</option>
            {eligibleUsers.map((user) => (
              <option key={user.penggunaId} value={user.penggunaId}>
                {user.nama}
              </option>
            ))}
          </select>
        </FormField>
      </FormDialog>
    </ListPageLayout>
  )
}
