import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import {
  usePlatformAccounts,
  type CreatePlatformAccountPayload,
  type PlatformAccountDto,
} from '@/api/platform-accounts'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FormDialog } from '@/components/ui/form-dialog'
import { Input } from '@/components/ui/input'
import { Table } from '@/components/ui/data-table'

const EMPTY_FORM: CreatePlatformAccountPayload = {
  nama: '',
  nip: '',
  email: '',
  jabatan: '',
  pangkat: '',
  nohp: '',
}

function AccountFields({
  value,
  onChange,
}: {
  value: CreatePlatformAccountPayload
  onChange: (field: keyof CreatePlatformAccountPayload, value: string) => void
}) {
  const fields: Array<{
    key: keyof CreatePlatformAccountPayload
    label: string
    placeholder: string
    type?: 'text' | 'email'
  }> = [
    { key: 'nama', label: 'Nama lengkap', placeholder: 'Nama lengkap' },
    { key: 'nip', label: 'NIP', placeholder: '198001012010011001' },
    { key: 'email', label: 'Email', placeholder: 'nama@fti.example', type: 'email' },
    { key: 'jabatan', label: 'Jabatan', placeholder: 'Jabatan' },
    { key: 'pangkat', label: 'Pangkat/Golongan', placeholder: 'III/a' },
    { key: 'nohp', label: 'Nomor HP', placeholder: '081234567890' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field.key} className="space-y-1.5 text-sm font-medium text-foreground">
          <span>{field.label}</span>
          <Input
            type={field.type ?? 'text'}
            value={value[field.key]}
            placeholder={field.placeholder}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        </label>
      ))}
    </div>
  )
}

function isValid(form: CreatePlatformAccountPayload) {
  return (
    form.nama.trim().length >= 2 &&
    form.nip.trim().length > 0 &&
    form.email.includes('@') &&
    form.jabatan.trim().length > 0 &&
    form.pangkat.trim().length > 0 &&
    form.nohp.trim().length > 0
  )
}

export function AccountManagementPage() {
  const { accounts, isLoading, createAccount, updateAccount, isSaving } = usePlatformAccounts()
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreatePlatformAccountPayload>(EMPTY_FORM)
  const [editingAccount, setEditingAccount] = useState<PlatformAccountDto | null>(null)
  const [editForm, setEditForm] = useState<CreatePlatformAccountPayload>(EMPTY_FORM)
  const [deactivatingAccount, setDeactivatingAccount] = useState<PlatformAccountDto | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return accounts
    return accounts.filter((account) =>
      [account.nama, account.nip, account.email, account.jabatan, account.pangkat]
        .some((value) => value.toLowerCase().includes(needle)),
    )
  }, [accounts, query])

  const openEdit = (account: PlatformAccountDto) => {
    setEditingAccount(account)
    setEditForm({
      nama: account.nama,
      nip: account.nip,
      email: account.email,
      jabatan: account.jabatan,
      pangkat: account.pangkat,
      nohp: account.nohp,
    })
  }

  const normalize = (form: CreatePlatformAccountPayload): CreatePlatformAccountPayload => ({
    nama: form.nama.trim(),
    nip: form.nip.trim(),
    email: form.email.trim().toLowerCase(),
    jabatan: form.jabatan.trim(),
    pangkat: form.pangkat.trim(),
    nohp: form.nohp.trim(),
  })

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Administrasi Sistem' }, { label: 'Pengguna' }]}
      title="Pengguna"
      description="Kelola identitas pengguna FTI. Hak workflow diberikan terpisah melalui penugasan Proses Bisnis atau Pejabat Berwenang."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, NIP, email, atau jabatan"
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden />
          Tambah Pengguna
        </Button>
      </div>

      <Table.Card>
        <Table.Root aria-label="Daftar pengguna FTI">
          <Table.Table>
            <thead>
              <Table.HeadRow>
                <Table.Th>Nama</Table.Th>
                <Table.Th>NIP</Table.Th>
                <Table.Th>Jabatan</Table.Th>
                <Table.Th>Kontak</Table.Th>
                <Table.Th>Akses Sistem</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.ActionTh>Aksi</Table.ActionTh>
              </Table.HeadRow>
            </thead>
            <tbody>
              {isLoading ? (
                <Table.BodyRow><Table.Td colSpan={7}>Memuat pengguna...</Table.Td></Table.BodyRow>
              ) : filtered.length === 0 ? (
                <Table.BodyRow><Table.Td colSpan={7}>Tidak ada pengguna yang sesuai.</Table.Td></Table.BodyRow>
              ) : filtered.map((account) => (
                <Table.BodyRow key={account.penggunaId}>
                  <Table.Td>
                    <p className="font-medium text-foreground">{account.nama}</p>
                    <p className="text-xs text-secondary-foreground">{account.pangkat}</p>
                  </Table.Td>
                  <Table.Td>{account.nip}</Table.Td>
                  <Table.Td>{account.jabatan}</Table.Td>
                  <Table.Td>
                    <p>{account.email}</p>
                    <p className="text-xs text-secondary-foreground">{account.nohp}</p>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="outline">
                      {account.platformRole === 'SUPER_ADMIN' ? 'Administrator Sistem' : 'Pengguna'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant={account.deletedAt ? 'secondary' : 'success'}>
                      {account.deletedAt ? 'Nonaktif' : 'Aktif'}
                    </Badge>
                  </Table.Td>
                  <Table.ActionTd>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(account)}>Ubah</Button>
                      <Button
                        size="sm"
                        variant={account.deletedAt ? 'outline' : 'ghost'}
                        disabled={isSaving}
                        onClick={() => {
                          if (account.deletedAt) {
                            void updateAccount({ penggunaId: account.penggunaId, payload: { status: 'AKTIF' } })
                          } else {
                            setDeactivatingAccount(account)
                          }
                        }}
                      >
                        {account.deletedAt ? 'Aktifkan' : 'Nonaktifkan'}
                      </Button>
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
          if (!open) setCreateForm(EMPTY_FORM)
        }}
        title="Tambah Pengguna"
        description="Buat identitas pengguna FTI. Penugasan workflow dilakukan terpisah."
        confirmLabel="Tambah Pengguna"
        confirmDisabled={!isValid(createForm) || isSaving}
        size="lg"
        onConfirm={() => {
          void createAccount(normalize(createForm)).then(() => {
            setCreateOpen(false)
            setCreateForm(EMPTY_FORM)
          })
        }}
      >
        <AccountFields
          value={createForm}
          onChange={(field, value) => setCreateForm((current) => ({ ...current, [field]: value }))}
        />
      </FormDialog>

      <FormDialog
        open={editingAccount !== null}
        onOpenChange={(open) => { if (!open) setEditingAccount(null) }}
        title="Ubah Pengguna"
        description="Perubahan ini hanya mengubah profil pengguna, bukan kewenangan workflow."
        confirmLabel="Simpan Perubahan"
        confirmDisabled={!isValid(editForm) || isSaving}
        size="lg"
        onConfirm={() => {
          if (!editingAccount) return
          void updateAccount({ penggunaId: editingAccount.penggunaId, payload: normalize(editForm) })
            .then(() => setEditingAccount(null))
        }}
      >
        <AccountFields
          value={editForm}
          onChange={(field, value) => setEditForm((current) => ({ ...current, [field]: value }))}
        />
      </FormDialog>

      <ConfirmDialog
        open={deactivatingAccount !== null}
        onOpenChange={(open) => { if (!open) setDeactivatingAccount(null) }}
        title="Nonaktifkan pengguna?"
        description="Pengguna tidak dapat masuk ke sistem. Server akan menolak jika kewenangan aktif masih harus dialihkan terlebih dahulu."
        confirmLabel="Nonaktifkan"
        destructive
        onConfirm={() => {
          if (!deactivatingAccount) return
          void updateAccount({
            penggunaId: deactivatingAccount.penggunaId,
            payload: { status: 'NONAKTIF' },
          }).then(() => setDeactivatingAccount(null))
        }}
      />
    </ListPageLayout>
  )
}
