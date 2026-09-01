import { useState } from 'react'
import { ArrowLeft, Asterisk, Eye, EyeOff } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { LoginRequestDto } from '@/types/dto/auth.dto'

export interface LoginFormProps {
  isSubmitting: boolean
  onSubmitLogin: (payload: LoginRequestDto) => Promise<unknown>
}

export function LoginForm({ isSubmitting, onSubmitLogin }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const validateForm = () => {
    let nextEmailError = ''
    let nextPasswordError = ''

    if (!email) {
      nextEmailError = 'Email wajib diisi'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        nextEmailError = 'Format email tidak valid'
      }
    }

    if (!password) {
      nextPasswordError = 'Kata sandi wajib diisi'
    } else if (password.length < 8) {
      nextPasswordError = 'Kata sandi minimal 8 karakter'
    }

    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    return nextEmailError === '' && nextPasswordError === ''
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) return

    try {
      await onSubmitLogin({ email, kataSandi: password })
    } catch (error: unknown) {
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        if (message.includes('email')) {
          setEmailError(error.message)
        } else if (message.includes('password') || message.includes('kata sandi')) {
          setPasswordError(error.message)
        }
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <Button asChild variant="ghost" size="sm" className="mb-10 -ml-3 text-primary hover:text-primary-hover">
        <Link to="/">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Kembali ke beranda
        </Link>
      </Button>

      <div className="mb-9">
        <span className="grid h-8 w-8 place-items-center text-primary" aria-hidden>
          <Asterisk className="h-7 w-7" strokeWidth={2.4} />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-[34px]">
          Masuk ke sistem
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-secondary-foreground">
          Gunakan akun yang telah didaftarkan administrator.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" required>Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@instansi.go.id"
            disabled={isSubmitting}
            autoComplete="email"
            errorMessage={emailError}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" required>Kata sandi</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan kata sandi"
              disabled={isSubmitting}
              autoComplete="current-password"
              errorMessage={passwordError}
              className="h-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-control text-muted-foreground transition-colors hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              disabled={isSubmitting}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </div>

        <Button type="submit" variant="default" size="default" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
              Memproses...
            </>
          ) : (
            'Masuk'
          )}
        </Button>
      </form>

      <p className="mt-8 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
        Butuh bantuan? Hubungi administrator instansi.
      </p>
    </div>
  )
}
