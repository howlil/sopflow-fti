import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

const loginPageSource = readSource('../login/LoginPage.tsx')
const loginHeroSource = readSource('../login/components/LoginHero.tsx')
const loginFormSource = readSource('../login/components/LoginForm.tsx')
const allSources = [loginPageSource, loginHeroSource, loginFormSource].join('\n')

describe('public auth design contract', () => {
  it('uses a true full-viewport split login shell', () => {
    expect(loginPageSource).toContain('min-h-screen')
    expect(loginPageSource).toContain('lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]')
    expect(loginPageSource).toContain('lg:min-h-screen')
    expect(loginPageSource).not.toContain('max-w-[1120px]')
    expect(loginPageSource).not.toContain('rounded-[22px]')
    expect(loginPageSource).not.toContain('shadow-raised')
    expect(loginPageSource).not.toContain('lg:place-items-center')
    expect(loginPageSource).not.toContain('lg:py-10')
    expect(loginPageSource).toContain('LoginForm isSubmitting={isLoggingIn} onSubmitLogin={login}')
  })

  it('uses FTI identity and the native lifecycle in the visual panel', () => {
    expect(loginHeroSource).toContain('Portal Internal SOP FTI')
    expect(loginHeroSource).toContain('Kelola SOP berdasarkan Proses Bisnis dan kewenangan organisasi')
    expect(loginHeroSource).toContain('Fakultas Teknologi Informasi · SOPFlow')
    expect(loginHeroSource).toContain("['Penyusunan', 'Review Proses', 'Persetujuan', 'TTE']")
    expect(loginHeroSource).toContain('linear-gradient')
    expect(loginHeroSource).toContain('radial-gradient')
    expect(loginHeroSource).toContain('lg:min-h-screen')
    expect(loginHeroSource).not.toContain('Pemerintah Provinsi Sumatera Barat')
    expect(loginHeroSource).not.toContain('Biro Organisasi')
    expect(loginHeroSource).not.toContain('Kepala OPD')
    expect(loginHeroSource).not.toContain('PJ Evaluator')
  })

  it('keeps the form clean and preserves login behavior', () => {
    expect(loginFormSource).toContain('Masuk ke sistem')
    expect(loginFormSource).toContain('Gunakan akun yang telah didaftarkan administrator.')
    expect(loginFormSource).toContain('Kembali ke beranda')
    expect(loginFormSource).toContain('Butuh bantuan? Hubungi administrator instansi.')
    expect(loginFormSource).not.toContain('Akun internal')
    expect(loginFormSource).not.toContain('Google')
    expect(loginFormSource).not.toContain('Apple')
    expect(loginFormSource).not.toContain('Daftar')
    expect(loginFormSource).toContain('await onSubmitLogin({ email, kataSandi: password })')
    expect(loginFormSource).toContain('Email wajib diisi')
    expect(loginFormSource).toContain('Kata sandi minimal 8 karakter')
    expect(loginFormSource).toContain('Tampilkan kata sandi')
    expect(loginFormSource).toContain('Sembunyikan kata sandi')
  })

  it('keeps form icons functional rather than decorative', () => {
    expect(loginFormSource).not.toMatch(/\bMail\b/)
    expect(loginFormSource).not.toMatch(/\bLock\b/)
    expect(loginFormSource).toMatch(/\bEye\b/)
    expect(loginFormSource).toMatch(/\bEyeOff\b/)
  })

  it('keeps the reference treatment restrained and domain-accurate', () => {
    for (const banned of [
      'Futuristic Hero',
      'blur-3xl',
      'shadow-xl',
      'rounded-3xl',
      'TTE BSRE',
      'TTE BSrE',
      'Komdigi certified',
    ]) {
      expect(allSources).not.toContain(banned)
    }
  })
})
