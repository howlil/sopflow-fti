import { useId, useState, type FormEvent, type ReactNode } from 'react'
import {
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useAuth } from '@/api/auth'
import { useMyOrganizationalAuthorities } from '@/api/pejabat-berwenang'
import { useTTEProfil } from '@/api/tte'
import { SetPageHeader } from '@/components/layout/PageHeaderProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { TteSetupSection } from '@/pages/akun/components/TteSetupSection'
import { useAuthStore } from '@/stores/authStore'
import { formatIndonesianMobileNumberForInput } from '@/utils/indonesian-mobile-number'

function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  describedBy,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  disabled?: boolean
  describedBy?: string
}) {
  const [show, setShow] = useState(false)

  return (
    <FormField label={label}>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="h-10 pr-10 text-sm"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-control text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          onClick={() => setShow((current) => !current)}
          aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          aria-pressed={show}
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </FormField>
  )
}

function MetadataItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-control border border-border/80 bg-surface/70 px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-secondary-foreground" strokeWidth={1.7} aria-hidden />
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 truncate text-sm text-foreground">{value}</dd>
      </div>
    </div>
  )
}

function ProfileSection({
  labelledBy,
  children,
  className = '',
}: {
  labelledBy: string
  children: ReactNode
  className?: string
}) {
  return (
    <section aria-labelledby={labelledBy} className={`rounded-surface border border-border bg-surface ${className}`}>
      {children}
    </section>
  )
}

function TteNotApplicableState() {
  return (
    <ProfileSection labelledBy="tte-not-applicable-title" className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-secondary-foreground">
          <ShieldCheck className="h-4.5 w-4.5" aria-hidden />
        </div>
        <div>
          <h2 id="tte-not-applicable-title" className="text-sm font-semibold text-foreground">Kesiapan TTE</h2>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Tanda tangan elektronik organisasi belum diperlukan untuk peran akun ini.</p>
        </div>
      </div>
      <p className="px-5 py-4 text-sm leading-6 text-secondary-foreground">
        Pengaturan TTE akan muncul ketika akun ditetapkan sebagai Dekan atau Kepala Departemen.
      </p>
    </ProfileSection>
  )
}

function TteAuthorityLoadingState() {
  return (
    <ProfileSection labelledBy="tte-loading-title" className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="space-y-2 px-5 py-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </ProfileSection>
  )
}

function TteAuthorityErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <ProfileSection labelledBy="tte-error-title" className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-subtle text-danger-foreground">
          <ShieldCheck className="h-4.5 w-4.5" aria-hidden />
        </div>
        <div>
          <h2 id="tte-error-title" className="text-sm font-semibold text-foreground">Kesiapan TTE</h2>
          <p className="mt-0.5 text-xs leading-5 text-danger-foreground">Status kewenangan TTE belum dapat dimuat.</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <p className="text-sm text-secondary-foreground">Coba muat ulang untuk memeriksa akses tanda tangan Anda.</p>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Coba lagi
        </Button>
      </div>
    </ProfileSection>
  )
}

export function ProfilSayaPage() {
  const user = useAuthStore((state) => state.user)
  const { changePassword, isChangingPassword } = useAuth()
  const authoritiesQuery = useMyOrganizationalAuthorities()
  const myAuthorities = authoritiesQuery.data ?? []
  const hasTteAuthority = myAuthorities.length > 0
  const profileQuery = useTTEProfil({ enabled: hasTteAuthority && !authoritiesQuery.isLoading && !authoritiesQuery.isError })

  const [isPasswordFormOpen, setPasswordFormOpen] = useState(false)
  const [kataSandiLama, setKataSandiLama] = useState('')
  const [kataSandiBaru, setKataSandiBaru] = useState('')
  const [kataSandiKonfirmasi, setKataSandiKonfirmasi] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const passwordFeedbackId = useId()

  const displayName = user?.nama?.trim() || 'Pengguna FTI'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'FTI'
  const platformLabel = user?.platformRole === 'SUPER_ADMIN' ? 'Administrator Platform' : 'Pengguna FTI'
  const formattedPhone = formatIndonesianMobileNumberForInput(user?.nohp) ?? 'Belum diatur'

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    if (kataSandiBaru.length < 8) {
      setPasswordError('Kata sandi baru minimal 8 karakter.')
      return
    }
    if (kataSandiBaru !== kataSandiKonfirmasi) {
      setPasswordError('Konfirmasi kata sandi tidak cocok.')
      return
    }
    try {
      await changePassword({ kataSandiLama, kataSandiBaru })
      setKataSandiLama('')
      setKataSandiBaru('')
      setKataSandiKonfirmasi('')
      setPasswordSuccess(true)
    } catch (error: unknown) {
      setPasswordError(error instanceof Error ? error.message : 'Gagal mengubah kata sandi')
    }
  }

  const togglePasswordForm = () => {
    setPasswordFormOpen((current) => !current)
    setPasswordError(null)
    setPasswordSuccess(false)
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <SetPageHeader breadcrumb={[{ label: 'Profil Saya' }]} title="Profil Saya" />

      <section className="relative overflow-hidden rounded-surface border border-border bg-gradient-to-br from-primary-subtle via-surface to-surface px-5 py-5 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground shadow-surface">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{displayName}</h2>
                <Badge variant="outline">{platformLabel}</Badge>
              </div>
              <p className="mt-1 text-sm text-secondary-foreground">Kelola identitas, keamanan, dan kesiapan tanda tangan akun Anda.</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" aria-hidden />{user?.email ?? 'Email belum diatur'}</span>
                <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden />{user?.jabatan?.trim() || 'Jabatan belum diatur'}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-control border border-success/30 bg-success-subtle px-3 py-2 text-xs font-medium text-success-foreground">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Akun aktif
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <ProfileSection labelledBy="identity-title" className="overflow-hidden">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <UserRound className="h-4 w-4 text-secondary-foreground" aria-hidden />
              <div>
                <h2 id="identity-title" className="text-sm font-semibold text-foreground">Identitas & kontak</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Informasi akun yang digunakan dalam layanan FTI.</p>
              </div>
            </div>
          </div>
          <dl className="grid gap-2.5 p-4 sm:grid-cols-2 sm:p-5">
            <MetadataItem icon={UserRound} label="Nama" value={displayName} />
            <MetadataItem icon={BriefcaseBusiness} label="NIP" value={user?.nip || 'Belum diatur'} />
            <MetadataItem icon={Mail} label="Email" value={user?.email || 'Belum diatur'} />
            <MetadataItem icon={Phone} label="Nomor HP" value={formattedPhone} />
            <MetadataItem icon={BriefcaseBusiness} label="Jabatan" value={user?.jabatan?.trim() || 'Belum diatur'} />
            <MetadataItem icon={ShieldCheck} label="Pangkat" value={user?.pangkat?.trim() || 'Belum diatur'} />
          </dl>
          <div className="border-t border-border px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kewenangan organisasi</h3>
                <p className="mt-1 text-xs text-secondary-foreground">Peran yang sedang melekat pada akun Anda.</p>
              </div>
              <Badge variant={myAuthorities.length > 0 ? 'success' : 'secondary'}>
                {myAuthorities.length > 0 ? `${myAuthorities.length} aktif` : 'Tidak ada'}
              </Badge>
            </div>
            {authoritiesQuery.isLoading ? (
              <div className="mt-3 flex gap-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-36" /></div>
            ) : authoritiesQuery.isError ? (
              <p className="mt-3 text-xs text-danger-foreground">Kewenangan belum dapat dimuat.</p>
            ) : myAuthorities.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Daftar kewenangan organisasi">
                {myAuthorities.map((assignment) => (
                  <li key={assignment.kunciPejabatBerwenang}>
                    <Badge variant="outline">
                      {assignment.authority === 'DEAN' ? 'Dekan' : 'Kepala Departemen'}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-secondary-foreground">Belum ada kewenangan organisasi aktif.</p>
            )}
          </div>
        </ProfileSection>

        <div className="space-y-5">
          <ProfileSection labelledBy="security-title" className="overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-muted text-secondary-foreground">
                  <Lock className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <h2 id="security-title" className="text-sm font-semibold text-foreground">Keamanan akun</h2>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Kata sandi menjaga akses ke layanan FTI.</p>
                </div>
              </div>
              <Badge variant="success">Terlindungi</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <div>
                <p className="text-sm font-medium text-foreground">Kata sandi akun</p>
                <p className="mt-0.5 text-xs text-muted-foreground">••••••••••••</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={togglePasswordForm} aria-expanded={isPasswordFormOpen}>
                <KeyRound className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {isPasswordFormOpen ? 'Tutup' : 'Ubah kata sandi'}
              </Button>
            </div>
            {isPasswordFormOpen ? (
              <form onSubmit={handleChangePassword} className="space-y-3 border-t border-border bg-surface-subtle/40 px-5 py-5 sm:px-6">
                <PasswordInput label="Kata sandi lama" value={kataSandiLama} onChange={setKataSandiLama} autoComplete="current-password" disabled={isChangingPassword} describedBy={passwordError || passwordSuccess ? passwordFeedbackId : undefined} />
                <PasswordInput label="Kata sandi baru" value={kataSandiBaru} onChange={setKataSandiBaru} autoComplete="new-password" disabled={isChangingPassword} describedBy={passwordError || passwordSuccess ? passwordFeedbackId : undefined} />
                <PasswordInput label="Konfirmasi kata sandi baru" value={kataSandiKonfirmasi} onChange={setKataSandiKonfirmasi} autoComplete="new-password" disabled={isChangingPassword} describedBy={passwordError || passwordSuccess ? passwordFeedbackId : undefined} />
                {passwordError ? <p id={passwordFeedbackId} role="alert" className="rounded-control border border-danger/20 bg-danger-subtle px-3 py-2 text-xs text-danger-foreground">{passwordError}</p> : null}
                {passwordSuccess ? <p id={passwordFeedbackId} role="status" className="rounded-control border border-success/30 bg-success-subtle px-3 py-2 text-xs text-success-foreground">Kata sandi berhasil diperbarui.</p> : null}
                <div className="flex justify-end pt-1">
                  <Button type="submit" size="sm" disabled={isChangingPassword || !kataSandiLama || !kataSandiBaru || !kataSandiKonfirmasi}>
                    {isChangingPassword ? 'Menyimpan...' : 'Simpan kata sandi'}
                  </Button>
                </div>
              </form>
            ) : null}
          </ProfileSection>

          {authoritiesQuery.isLoading ? <TteAuthorityLoadingState /> : null}
          {authoritiesQuery.isError ? <TteAuthorityErrorState onRetry={() => void authoritiesQuery.refetch()} /> : null}
          {!authoritiesQuery.isLoading && !authoritiesQuery.isError && !hasTteAuthority ? <TteNotApplicableState /> : null}
          {!authoritiesQuery.isLoading && !authoritiesQuery.isError && hasTteAuthority ? (
            <TteSetupSection
              profile={profileQuery.data}
              isLoading={profileQuery.isLoading}
              isError={profileQuery.isError}
              onRetry={() => void profileQuery.refetch()}
              displayName={displayName}
              displayNip={user?.nip || 'Belum diatur'}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
