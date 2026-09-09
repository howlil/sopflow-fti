import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useProsesBisnisAdministration } from '@/api/administrasi-proses-bisnis'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FormDialog } from '@/components/ui/form-dialog'
import { Input } from '@/components/ui/input'
import { Table } from '@/components/ui/data-table'
import type {
  GrantKewenanganPenanggungJawabProsesBisnisPayload,
  LingkupOrganisasi,
} from '@/types/dto/proses-bisnis.dto'

const EMPTY_AUTHORITY: GrantKewenanganPenanggungJawabProsesBisnisPayload = {
  penggunaId: '',
  lingkup: 'FACULTY',
  departemenId: null,
}

export function HalamanPengelolaanProsesBisnis() {
  const {
    departemen,
    users,
    ownerAuthorities,
    isLoading,
    createDepartemen,
    updateDepartemen,
    grantOwnerAuthority,
    revokeOwnerAuthority,
    isSaving,
  } = useProsesBisnisAdministration()

  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false)
  const [editingDepartemenId, setEditingDepartemenId] = useState<string | null>(null)
  const [namaDepartemen, setNamaDepartemen] = useState('')
  const [authorityDialogOpen, setAuthorityDialogOpen] = useState(false)
  const [authority, setAuthority] = useState<GrantKewenanganPenanggungJawabProsesBisnisPayload>(EMPTY_AUTHORITY)
  const [revokingAuthorityId, setRevokingAuthorityId] = useState<string | null>(null)

  const eligibleUsers = useMemo(
    () => users.filter((user) => user.platformRole === 'USER' && !user.deletedAt),
    [users],
  )

  const canGrant =
    authority.penggunaId !== '' &&
    (authority.lingkup === 'FACULTY' || authority.departemenId !== null)

  const openCreateDepartemen = () => {
    setEditingDepartemenId(null)
    setNamaDepartemen('')
    setDepartmentDialogOpen(true)
  }

  const openEditDepartemen = (departemenId: string, nama: string) => {
    setEditingDepartemenId(departemenId)
    setNamaDepartemen(nama)
    setDepartmentDialogOpen(true)
  }

  const changeScope = (lingkup: LingkupOrganisasi) => {
    setAuthority((current) => ({
      ...current,
      lingkup,
      departemenId: lingkup === 'FACULTY' ? null : current.departemenId,
    }))
  }

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Administrasi Sistem' }, { label: 'Struktur & Kewenangan' }]}
      title="Struktur & Kewenangan"
      description="Kelola Departemen dan kewenangan pengguna yang dapat menjadi Penanggung Jawab Proses Bisnis. Proses Bisnis sehari-hari dikelola oleh Penanggung Jawabnya sendiri."
    >
      <section className="space-y-3" aria-labelledby="departemen-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="departemen-title" className="text-sm font-semibold text-foreground">Departemen</h2>
            <p className="mt-1 text-sm text-secondary-foreground">Struktur organisasi yang menjadi lingkup Proses Bisnis dan Kepala Departemen.</p>
          </div>
          <Button size="sm" onClick={openCreateDepartemen} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden />
            Tambah Departemen
          </Button>
        </div>

        <Table.Card>
          <Table.Root aria-label="Daftar Departemen FTI">
            <Table.Table>
              <thead>
                <Table.HeadRow>
                  <Table.Th>Departemen</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.ActionTh>Aksi</Table.ActionTh>
                </Table.HeadRow>
              </thead>
              <tbody>
                {isLoading ? (
                  <Table.BodyRow><Table.Td colSpan={3}>Memuat Departemen...</Table.Td></Table.BodyRow>
                ) : departemen.length === 0 ? (
                  <Table.BodyRow><Table.Td colSpan={3}>Belum ada Departemen.</Table.Td></Table.BodyRow>
                ) : departemen.map((department) => (
                  <Table.BodyRow key={department.departemenId}>
                    <Table.Td className="font-medium">{department.nama}</Table.Td>
                    <Table.Td><Badge variant="success">Aktif</Badge></Table.Td>
                    <Table.ActionTd>
                      <Button size="sm" variant="outline" onClick={() => openEditDepartemen(department.departemenId, department.nama)}>
                        Ubah
                      </Button>
                    </Table.ActionTd>
                  </Table.BodyRow>
                ))}
              </tbody>
            </Table.Table>
          </Table.Root>
        </Table.Card>
      </section>

      <section className="space-y-3" aria-labelledby="pj-authority-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="pj-authority-title" className="text-sm font-semibold text-foreground">Kewenangan Penanggung Jawab Proses Bisnis</h2>
            <p className="mt-1 text-sm text-secondary-foreground">Kewenangan ini menentukan siapa yang dapat membentuk dan mengelola Proses Bisnis pada lingkup tertentu.</p>
          </div>
          <Button size="sm" onClick={() => setAuthorityDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden />
            Tambah Kewenangan
          </Button>
        </div>

        <Table.Card>
          <Table.Root aria-label="Daftar kewenangan Penanggung Jawab Proses Bisnis">
            <Table.Table>
              <thead>
                <Table.HeadRow>
                  <Table.Th>Penanggung Jawab</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Lingkup</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.ActionTh>Aksi</Table.ActionTh>
                </Table.HeadRow>
              </thead>
              <tbody>
                {isLoading ? (
                  <Table.BodyRow><Table.Td colSpan={5}>Memuat kewenangan...</Table.Td></Table.BodyRow>
                ) : ownerAuthorities.length === 0 ? (
                  <Table.BodyRow><Table.Td colSpan={5}>Belum ada kewenangan Penanggung Jawab.</Table.Td></Table.BodyRow>
                ) : ownerAuthorities.map((row) => (
                  <Table.BodyRow key={row.kewenanganPenanggungJawabProsesBisnisId}>
                    <Table.Td className="font-medium">{row.user?.nama ?? 'Pengguna tidak tersedia'}</Table.Td>
                    <Table.Td>{row.user?.email ?? '—'}</Table.Td>
                    <Table.Td>{row.lingkup === 'FACULTY' ? 'Fakultas' : row.departemen?.nama ?? 'Departemen'}</Table.Td>
                    <Table.Td><Badge variant="success">Aktif</Badge></Table.Td>
                    <Table.ActionTd>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => setRevokingAuthorityId(row.kewenanganPenanggungJawabProsesBisnisId)}
                      >
                        Cabut
                      </Button>
                    </Table.ActionTd>
                  </Table.BodyRow>
                ))}
              </tbody>
            </Table.Table>
          </Table.Root>
        </Table.Card>
      </section>

      <FormDialog
        open={departmentDialogOpen}
        onOpenChange={(open) => {
          setDepartmentDialogOpen(open)
          if (!open) {
            setEditingDepartemenId(null)
            setNamaDepartemen('')
          }
        }}
        title={editingDepartemenId ? 'Ubah Departemen' : 'Tambah Departemen'}
        confirmLabel={editingDepartemenId ? 'Simpan Perubahan' : 'Tambah Departemen'}
        confirmDisabled={namaDepartemen.trim().length < 2 || isSaving}
        onConfirm={() => {
          const nama = namaDepartemen.trim()
          if (editingDepartemenId) {
            void updateDepartemen({ departemenId: editingDepartemenId, nama }).then(() => setDepartmentDialogOpen(false))
          } else {
            void createDepartemen(nama).then(() => setDepartmentDialogOpen(false))
          }
        }}
      >
        <label className="space-y-1.5 text-sm font-medium text-foreground">
          <span>Nama Departemen</span>
          <Input value={namaDepartemen} onChange={(event) => setNamaDepartemen(event.target.value)} placeholder="Nama Departemen" />
        </label>
      </FormDialog>

      <FormDialog
        open={authorityDialogOpen}
        onOpenChange={(open) => {
          setAuthorityDialogOpen(open)
          if (!open) setAuthority(EMPTY_AUTHORITY)
        }}
        title="Tambah Kewenangan Penanggung Jawab"
        description="Pengguna yang diberi kewenangan dapat membentuk dan mengelola Proses Bisnis pada lingkup ini, tetapi tidak otomatis memperoleh hak edit SOP."
        confirmLabel="Berikan Kewenangan"
        confirmDisabled={!canGrant || isSaving}
        onConfirm={() => {
          void grantOwnerAuthority(authority).then(() => {
            setAuthorityDialogOpen(false)
            setAuthority(EMPTY_AUTHORITY)
          })
        }}
      >
        <label className="space-y-1.5 text-sm font-medium text-foreground">
          <span>Pengguna</span>
          <select
            className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={authority.penggunaId}
            onChange={(event) => setAuthority((current) => ({ ...current, penggunaId: event.target.value }))}
          >
            <option value="">Pilih pengguna</option>
            {eligibleUsers.map((user) => <option key={user.penggunaId} value={user.penggunaId}>{user.nama} · {user.email}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-foreground">
          <span>Lingkup</span>
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
          <label className="space-y-1.5 text-sm font-medium text-foreground">
            <span>Departemen</span>
            <select
              className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={authority.departemenId ?? ''}
              onChange={(event) => setAuthority((current) => ({ ...current, departemenId: event.target.value || null }))}
            >
              <option value="">Pilih Departemen</option>
              {departemen.map((department) => <option key={department.departemenId} value={department.departemenId}>{department.nama}</option>)}
            </select>
          </label>
        ) : null}
      </FormDialog>

      <ConfirmDialog
        open={revokingAuthorityId !== null}
        onOpenChange={(open) => { if (!open) setRevokingAuthorityId(null) }}
        title="Cabut kewenangan Penanggung Jawab?"
        description="Kewenangan untuk membentuk Proses Bisnis baru pada lingkup ini akan dicabut. Proses Bisnis yang sudah dimiliki tetap mengikuti aturan server."
        confirmLabel="Cabut Kewenangan"
        destructive
        onConfirm={() => {
          if (!revokingAuthorityId) return
          void revokeOwnerAuthority(revokingAuthorityId).then(() => setRevokingAuthorityId(null))
        }}
      />
    </ListPageLayout>
  )
}
