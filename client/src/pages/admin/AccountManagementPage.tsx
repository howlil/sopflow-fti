import { useState } from 'react'
import {
  usePlatformAccounts,
  type CreatePlatformAccountPayload,
  type PlatformAccountDto,
} from '@/api/platform-accounts'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'

const EMPTY_FORM: CreatePlatformAccountPayload = {
  nama: '',
  nip: '',
  email: '',
  jabatan: '',
  pangkat: '',
  nohp: '',
}

export function AccountManagementPage() {
  const { accounts, isLoading, createAccount, updateAccount, isSaving } = usePlatformAccounts()
  const [form, setForm] = useState<CreatePlatformAccountPayload>(EMPTY_FORM)
  const [editingAccount, setEditingAccount] = useState<PlatformAccountDto | null>(null)
  const [editForm, setEditForm] = useState<CreatePlatformAccountPayload>(EMPTY_FORM)
  const [deactivatingAccount, setDeactivatingAccount] = useState<PlatformAccountDto | null>(null)

  const canSubmit =
    form.nama.trim().length >= 2 &&
    form.nip.trim().length > 0 &&
    form.email.includes('@') &&
    form.jabatan.trim().length > 0 &&
    form.pangkat.trim().length > 0 &&
    form.nohp.trim().length > 0

  const submit = async () => {
    if (!canSubmit) return
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
    } catch {
      // Toast mutation owns error presentation; preserve entered values for correction.
    }
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
    if (editingAccount === null) return
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

  const field = (
    label: keyof CreatePlatformAccountPayload,
    title: string,
    placeholder: string,
    type: 'text' | 'email' = 'text',
  ) => (
    <label className="block space-y-1.5 text-sm font-medium text-foreground">
      {title}
      <Input
        type={type}
        value={form[label]}
        placeholder={placeholder}
        onChange={(event) =>
          setForm((current) => ({ ...current, [label]: event.target.value }))
        }
      />
    </label>
  )

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Administrasi' }, { label: 'Akun FTI' }]}
      title="Akun FTI"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
        <DataSurface.Root>
          <DataSurface.Header>
            <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">Akun FTI</h2>
              <p className="text-sm text-secondary-foreground">
                Akun tidak memperoleh akses Proses Bisnis atau kewenangan organisasi sampai ditugaskan secara eksplisit.
              </p>
            </div>
          </DataSurface.Header>
          <div className="divide-y divide-border">
            {isLoading ? (
              <p className="p-4 text-sm text-secondary-foreground">Memuat akun...</p>
            ) : accounts.length === 0 ? (
              <p className="p-4 text-sm text-secondary-foreground">Belum ada akun.</p>
            ) : (
              accounts.map((account) => (
                <div key={account.penggunaId} className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-foreground">{account.nama}</h3>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-secondary-foreground">
                        {account.platformRole === 'SUPER_ADMIN' ? 'Platform Admin' : 'User'}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${account.deletedAt ? 'border-danger/30 text-danger' : 'border-border text-secondary-foreground'}`}>
                        {account.deletedAt ? 'Nonaktif' : 'Aktif'}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-foreground">
                      {account.email} · NIP {account.nip}
                    </p>
                    <p className="text-xs text-secondary-foreground">
                      {account.jabatan} · {account.pangkat}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEdit(account)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={account.deletedAt ? 'outline' : 'destructive'}
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
                </div>
              ))
            )}
          </div>
        </DataSurface.Root>

        {editingAccount ? (
          <DataSurface.Root>
            <DataSurface.Header>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">Edit profil</h2>
                <p className="text-sm text-secondary-foreground">
                  Platform role dikelola sistem dan tidak dapat diubah dari sini.
                </p>
              </div>
            </DataSurface.Header>
            <div className="space-y-4 p-4">
              {(['nama', 'nip', 'email', 'jabatan', 'pangkat', 'nohp'] as const).map((field) => (
                <label key={field} className="block space-y-1.5 text-sm font-medium text-foreground">
                  {field === 'nohp' ? 'Nomor HP' : field[0].toUpperCase() + field.slice(1)}
                  <Input
                    type={field === 'email' ? 'email' : 'text'}
                    value={editForm[field]}
                    onChange={(event) => setEditField(field, event.target.value)}
                  />
                </label>
              ))}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingAccount(null)}>
                  Batal
                </Button>
                <Button type="button" disabled={isSaving} onClick={submitEdit}>
                  {isSaving ? 'Menyimpan...' : 'Simpan profil'}
                </Button>
              </div>
            </div>
          </DataSurface.Root>
        ) : null}

        <DataSurface.Root>
          <DataSurface.Header>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-foreground">Tambah akun</h2>
              <p className="text-sm text-secondary-foreground">
                Akun dibuat sebagai User FTI aktif dengan sandi awal yang dikelola server.
              </p>
            </div>
          </DataSurface.Header>
          <div className="space-y-4 p-4">
            {field('nama', 'Nama', 'Contoh: Dwi Pratama')}
            {field('nip', 'NIP', '198001012010011001')}
            {field('email', 'Email', 'dwi@fti.example', 'email')}
            {field('jabatan', 'Jabatan', 'Dosen')}
            {field('pangkat', 'Pangkat', 'III/a')}
            {field('nohp', 'Nomor HP', '081234567890')}
            <Button type="button" disabled={!canSubmit || isSaving} onClick={submit} className="w-full">
              {isSaving ? 'Menyimpan...' : 'Buat Akun'}
            </Button>
          </div>
        </DataSurface.Root>
      </div>
      <ConfirmDialog
        open={deactivatingAccount !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivatingAccount(null)
        }}
        title="Nonaktifkan akun?"
        description="Akun tidak dapat login lagi. Jika masih menjadi Owner atau pemegang kewenangan aktif, server akan menolak tindakan ini sampai dialihkan atau dicabut."
        confirmLabel="Nonaktifkan"
        destructive
        onConfirm={() => {
          if (deactivatingAccount === null) return
          void updateAccount({
            penggunaId: deactivatingAccount.penggunaId,
            payload: { status: 'NONAKTIF' },
          }).then(() => setDeactivatingAccount(null))
        }}
      />
    </ListPageLayout>
  )
}
