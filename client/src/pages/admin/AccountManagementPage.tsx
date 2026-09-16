import { useState } from 'react'
import { Edit, UserCheck, UserX } from 'lucide-react'
import {
  usePlatformAccounts,
  type CreatePlatformAccountPayload,
  type PlatformAccountDto,
} from '@/api/platform-accounts'
import { DataSurface } from '@/components/data/data-surface'
import { FormDialog } from '@/components/ui/form-dialog'
import { FormField } from '@/components/ui/form-field'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FormDialog } from '@/components/ui/form-dialog'
import { Input } from '@/components/ui/input'
import { LoadingState } from '@/components/ui/loading-state'
import { QueryState } from '@/components/ui/query-state'
import { Table } from '@/components/ui/data-table'
import { RowActions } from '@/components/data/row-actions'
import { AccountStatusBadge } from '@/components/status/account-status-badge'

const EMPTY_FORM: CreatePlatformAccountPayload = {
  nama: '',
  nip: '',
  email: '',
  jabatan: '',
  pangkat: '',
  nohp: '',
}

const ACCOUNT_FIELDS: Array<{
  key: keyof CreatePlatformAccountPayload
  title: string
  placeholder: string
  type?: 'text' | 'email'
}> = [
  { key: 'nama', title: 'Nama', placeholder: 'Contoh: Dwi Pratama' },
  { key: 'nip', title: 'NIP', placeholder: '198001012010011001' },
  { key: 'email', title: 'Email', placeholder: 'dwi@fti.example', type: 'email' },
  { key: 'jabatan', title: 'Jabatan', placeholder: 'Dosen' },
  { key: 'pangkat', title: 'Pangkat', placeholder: 'III/a' },
  { key: 'nohp', title: 'Nomor HP', placeholder: '081234567890' },
]

function isValidAccountForm(form: CreatePlatformAccountPayload) {
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
  const { accounts, isLoading, isError, refetch, createAccount, updateAccount, isSaving } = usePlatformAccounts()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<CreatePlatformAccountPayload>(EMPTY_FORM)
  const [editingAccount, setEditingAccount] = useState<PlatformAccountDto | null>(null)
  const [editForm, setEditForm] = useState<CreatePlatformAccountPayload>(EMPTY_FORM)
  const [deactivatingAccount, setDeactivatingAccount] = useState<PlatformAccountDto | null>(null)

  const submit = async () => {
    if (!isValidAccountForm(form)) return
    try {
      await createAccount({
        nama: form.nama.trim(),
        nip: form.nip.trim(),
        email: form.email.trim().toLowerCase(),
        jabatan: form.jabatan.trim(),
        pangkat: form.pangkat.trim(),
        nohp: form.nohp.trim(),
      })
      setForm(EMPTY_FORM)
      setCreateOpen(false)
    } catch {
      // Toast mutation owns error presentation; preserve entered values for correction.
    }
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setCreateOpen(true)
  }

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

  const submitEdit = async () => {
    if (editingAccount === null || !isValidAccountForm(editForm)) return
    try {
      await updateAccount({
        penggunaId: editingAccount.penggunaId,
        payload: {
          ...editForm,
          nama: editForm.nama.trim(),
          nip: editForm.nip.trim(),
          email: editForm.email.trim().toLowerCase(),
          jabatan: editForm.jabatan.trim(),
          pangkat: editForm.pangkat.trim(),
          nohp: editForm.nohp.trim(),
        },
      })
      setEditingAccount(null)
    } catch {
      // Toast mutation owns error presentation; preserve entered values for correction.
    }
  }

  const setEditField = (field: keyof CreatePlatformAccountPayload, value: string) => {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Administrasi Sistem' }, { label: 'Pengguna' }]}
      title="Pengguna"
      description="Kelola identitas pengguna FTI. Hak workflow diberikan terpisah melalui penugasan Proses Bisnis atau Pejabat Berwenang."
    >
      <DataSurface.Root>
        <DataSurface.Header>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Akun FTI</h2>
            </div>
            <Button type="button" onClick={openCreate}>Tambah Akun</Button>
          </div>
        </DataSurface.Header>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          loading={<LoadingState message="Memuat akun…" />}
        >
          {accounts.length === 0 ? (
            <p className="p-4 text-sm text-secondary-foreground">Belum ada akun.</p>
          ) : (
            <Table.Root>
              <Table.Table>
                <thead>
                  <Table.HeadRow>
                    <Table.Th>Nama</Table.Th>
                    <Table.Th>Email / NIP</Table.Th>
                    <Table.Th>Jabatan / Pangkat</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.ActionTh>Aksi</Table.ActionTh>
                  </Table.HeadRow>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <Table.BodyRow key={account.penggunaId}>
                      <Table.Td>
                        <p className="font-medium text-foreground">{account.nama}</p>
                        <p className="text-xs text-secondary-foreground">
                          {account.platformRole === 'SUPER_ADMIN' ? 'Administrator Platform' : 'Pengguna'}
                        </p>
                      </Table.Td>
                      <Table.Td>
                        <p>{account.email}</p>
                        <p className="text-xs text-secondary-foreground">NIP {account.nip}</p>
                      </Table.Td>
                      <Table.Td>
                        <p>{account.jabatan}</p>
                        <p className="text-xs text-secondary-foreground">{account.pangkat}</p>
                      </Table.Td>
                      <Table.Td>
                        <AccountStatusBadge status={account.deletedAt ? 'NONAKTIF' : 'AKTIF'} />
                      </Table.Td>
                      <Table.ActionTd>
                        <RowActions
                          actions={[
                            {
                              icon: Edit,
                              title: `Ubah akun ${account.nama}`,
                              onClick: () => openEdit(account),
                              disabled: isSaving,
                            },
                            account.deletedAt
                              ? {
                                  icon: UserCheck,
                                  title: `Aktifkan akun ${account.nama}`,
                                  onClick: () => {
                                    void updateAccount({
                                      penggunaId: account.penggunaId,
                                      payload: { status: 'AKTIF' },
                                    })
                                  },
                                  disabled: isSaving,
                                }
                              : {
                                  icon: UserX,
                                  title: `Nonaktifkan akun ${account.nama}`,
                                  onClick: () => setDeactivatingAccount(account),
                                  disabled: isSaving,
                                  destructive: true,
                                },
                          ]}
                        />
                      </Table.ActionTd>
                    </Table.BodyRow>
                  ))}
                </tbody>
              </Table.Table>
            </Table.Root>
          )}
        </QueryState>
      </DataSurface.Root>

      <FormDialog
        open={isCreateOpen}
        onOpenChange={setCreateOpen}
        title="Tambah Akun FTI"
        description="Akun dibuat sebagai Pengguna FTI aktif dengan sandi awal yang dikelola sistem."
        confirmLabel="Buat Akun"
        onConfirm={submit}
        confirmDisabled={!isValidAccountForm(form) || isSaving}
        size="lg"
      >
        {ACCOUNT_FIELDS.map((field) => (
          <FormField key={field.key} label={field.title} required>
            <Input
              type={field.type ?? 'text'}
              value={form[field.key]}
              placeholder={field.placeholder}
              onChange={(event) =>
                setForm((current) => ({ ...current, [field.key]: event.target.value }))
              }
            />
          </FormField>
        ))}
      </FormDialog>

      <FormDialog
        open={editingAccount !== null}
        onOpenChange={(open) => {
          if (!open) setEditingAccount(null)
        }}
        title="Ubah profil pengguna"
        description="Platform role dikelola sistem dan tidak dapat diubah dari sini."
        confirmLabel={isSaving ? 'Menyimpan...' : 'Simpan Profil'}
        onConfirm={submitEdit}
        confirmDisabled={!isValidAccountForm(editForm) || isSaving}
        size="lg"
      >
        {ACCOUNT_FIELDS.map((field) => (
          <FormField key={field.key} label={field.title} required>
            <Input
              type={field.type ?? 'text'}
              value={editForm[field.key]}
              placeholder={field.placeholder}
              onChange={(event) => setEditField(field.key, event.target.value)}
            />
          </FormField>
        ))}
      </FormDialog>

      <ConfirmDialog
        open={deactivatingAccount !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivatingAccount(null)
        }}
        title="Nonaktifkan akun?"
        description="Akun tidak dapat masuk ke sistem lagi. Jika masih menjadi Penanggung Jawab atau pemegang kewenangan aktif, sistem akan menolak tindakan ini sampai dialihkan atau dicabut."
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
