import { useState } from 'react'
import { usePlatformAccounts, type CreatePlatformAccountPayload } from '@/api/platform-accounts'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Button } from '@/components/ui/button'
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
  const { accounts, isLoading, createAccount, isSaving } = usePlatformAccounts()
  const [form, setForm] = useState<CreatePlatformAccountPayload>(EMPTY_FORM)

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
              <h2 className="text-sm font-semibold text-foreground">Akun aktif</h2>
              <p className="text-sm text-secondary-foreground">
                Akun tidak memperoleh Process atau kewenangan organisasi sampai ditugaskan secara eksplisit.
              </p>
            </div>
          </DataSurface.Header>
          <div className="divide-y divide-border">
            {isLoading ? (
              <p className="p-4 text-sm text-secondary-foreground">Memuat akun...</p>
            ) : accounts.length === 0 ? (
              <p className="p-4 text-sm text-secondary-foreground">Belum ada akun aktif.</p>
            ) : (
              accounts.map((account) => (
                <div key={account.penggunaId} className="space-y-1 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">{account.nama}</h3>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-secondary-foreground">
                      {account.platformRole === 'SUPER_ADMIN' ? 'Platform Admin' : 'User'}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-foreground">
                    {account.email} · NIP {account.nip}
                  </p>
                  <p className="text-xs text-secondary-foreground">
                    {account.jabatan} · {account.pangkat}
                  </p>
                </div>
              ))
            )}
          </div>
        </DataSurface.Root>

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
    </ListPageLayout>
  )
}
