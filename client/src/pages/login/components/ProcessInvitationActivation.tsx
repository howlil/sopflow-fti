import { useEffect, useState } from 'react'
import { processInvitationApi } from '@/api/process-invitations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProcessInvitationPreviewDto } from '@/types/dto/process.dto'

export function ProcessInvitationActivation({ token }: { token: string }) {
  const [preview, setPreview] = useState<ProcessInvitationPreviewDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    processInvitationApi
      .preview(token)
      .then((data) => {
        if (!cancelled) setPreview(data)
      })
      .catch(() => {
        if (!cancelled) setError('Undangan tidak valid, sudah digunakan, atau kedaluwarsa.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const activate = async () => {
    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter.')
      return
    }
    if (password !== confirmation) {
      setError('Konfirmasi kata sandi tidak sama.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await processInvitationApi.accept(token, password)
      setCompleted(true)
    } catch {
      setError('Aktivasi gagal. Periksa kembali undangan atau identitas akun Anda.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-secondary-foreground">Memeriksa undangan…</p>
  }

  if (completed) {
    return (
      <div className="w-full max-w-md space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Akun berhasil diaktifkan</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Anda sudah menjadi Penyusun SOP</h1>
          <p className="text-sm leading-6 text-secondary-foreground">
            Akses hanya diberikan ke Process yang mengundang Anda. Masuk dengan email dan kata sandi yang baru dibuat.
          </p>
        </div>
        <Button className="w-full" onClick={() => window.location.assign('/login')}>
          Masuk ke SOPFlow
        </Button>
      </div>
    )
  }

  if (!preview) {
    return (
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Undangan tidak tersedia</h1>
        <p className="text-sm leading-6 text-secondary-foreground">{error}</p>
        <Button variant="outline" onClick={() => window.location.assign('/login')}>
          Kembali ke login
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Undangan Penyusun SOP</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Aktifkan akun Anda</h1>
        <p className="text-sm leading-6 text-secondary-foreground">
          {preview.nama}, Anda diundang ke Process <span className="font-medium text-foreground">{preview.process.nama}</span>.
          Buat kata sandi Anda sendiri untuk mengaktifkan akses.
        </p>
      </div>

      <div className="rounded-surface border border-border bg-surface-muted p-4 text-sm">
        <p className="font-medium text-foreground">{preview.email}</p>
        <p className="mt-1 text-secondary-foreground">
          Scope: {preview.process.scope === 'FACULTY' ? 'Fakultas' : 'Jurusan'}
        </p>
      </div>

      <div className="space-y-4">
        <label className="block space-y-1.5 text-sm font-medium text-foreground">
          Kata sandi baru
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimal 8 karakter"
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-foreground">
          Konfirmasi kata sandi
          <Input
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="w-full" disabled={submitting} onClick={activate}>
          {submitting ? 'Mengaktifkan…' : 'Aktifkan akun'}
        </Button>
      </div>
    </div>
  )
}
