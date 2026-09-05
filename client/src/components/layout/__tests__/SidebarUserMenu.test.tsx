import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const navigate = vi.fn()
const logout = vi.fn().mockResolvedValue(undefined)
const user = {
  penggunaId: 'u-1',
  email: 'user@fti.test',
  nama: 'Pengguna Uji',
  platformRole: 'USER' as const,
  nip: '123456789',
  jabatan: 'Staf',
  pangkat: 'III/a',
  nohp: null,
  tte: { configured: false },
}

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { user: typeof user }) => unknown) => selector({ user }),
}))

vi.mock('@/api/auth', () => ({
  useAuth: () => ({ logout }),
}))

import { SidebarUserMenu } from '@/components/layout/SidebarUserMenu'

function openProfileMenu() {
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Menu profil Pengguna Uji' }), {
    button: 0,
    ctrlKey: false,
  })
}

describe('SidebarUserMenu', () => {
  it('menampilkan identitas first-party FTI dan detail akun', async () => {
    render(<SidebarUserMenu />)

    expect(screen.getByText('Pengguna Uji')).toBeInTheDocument()
    expect(screen.getByText('Pengguna FTI')).toBeInTheDocument()

    openProfileMenu()

    expect(await screen.findByText('NIP. 123456789')).toBeInTheDocument()
    expect(screen.getByText('Profil Saya')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('tetap dapat diakses saat sidebar collapsed tanpa menampilkan label visual', () => {
    render(<SidebarUserMenu collapsed />)

    expect(screen.getByRole('button', { name: 'Menu profil Pengguna Uji' })).toBeInTheDocument()
    expect(screen.getByText('Pengguna Uji')).toHaveClass('sr-only')
  })

  it('menavigasi ke profil dan menjalankan logout melalui menu yang sama', async () => {
    const onNavigate = vi.fn()
    render(<SidebarUserMenu onNavigate={onNavigate} />)

    openProfileMenu()
    fireEvent.click(await screen.findByText('Profil Saya'))
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith({ to: '/penyusun/me' })

    openProfileMenu()
    fireEvent.click(await screen.findByText('Logout'))

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1))
    expect(onNavigate).toHaveBeenCalledTimes(2)
    expect(navigate).toHaveBeenLastCalledWith({
      to: '/',
      search: { denied: undefined, redirect: undefined },
    })
  })
})