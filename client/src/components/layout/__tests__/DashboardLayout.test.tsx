import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>{children}</a>
  ),
  Outlet: () => <div>Konten halaman</div>,
  useLocation: () => ({ pathname: '/penyusun/sop' }),
}))

vi.mock('@/components/layout/HeaderBar', () => ({ HeaderBar: () => <div>Header</div> }))
vi.mock('@/components/layout/PageHeaderProvider', () => ({
  PageHeaderProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/layout/SidebarUserMenu', () => ({
  SidebarUserMenu: ({ collapsed = false }: { collapsed?: boolean }) => (
    <button
      type="button"
      aria-label={collapsed ? 'Menu profil uji collapsed' : 'Menu profil uji'}
    >
      Profil
    </button>
  ),
}))
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { user: { peran: string } }) => unknown) =>
    selector({ user: { peran: 'PENYUSUN' } }),
}))
vi.mock('@/utils/role-key', () => ({ toNavigationRole: () => 'PENYUSUN' }))

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useUIStore } from '@/stores/uiStore'

const STORAGE_KEY = 'ui:desktop-sidebar-collapsed'

describe('DashboardLayout desktop sidebar', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useUIStore.setState({ sidebarOpen: true })
  })

  it('dapat ditutup, tetap menamai menu, dan dapat dibuka kembali', () => {
    render(<DashboardLayout />)
    const sidebar = document.querySelector('#desktop-sidebar')

    expect(sidebar).toHaveAttribute('data-state', 'expanded')
    expect(sidebar).toHaveClass('w-[248px]')

    fireEvent.click(screen.getByRole('button', { name: 'Ciutkan navigasi' }))
    expect(sidebar).toHaveAttribute('data-state', 'collapsed')
    expect(sidebar).toHaveClass('w-[var(--sidebar-width)]')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')
    expect(useUIStore.getState().sidebarOpen).toBe(false)
    expect(screen.getAllByRole('link', { name: 'SOP' })).not.toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Perluas navigasi' }))
    expect(sidebar).toHaveAttribute('data-state', 'expanded')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false')
  })

  it('memulihkan preferensi sidebar yang tersimpan', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'true')
    render(<DashboardLayout />)

    await waitFor(() => {
      expect(document.querySelector('#desktop-sidebar')).toHaveAttribute('data-state', 'collapsed')
    })
    expect(screen.getByRole('button', { name: 'Perluas navigasi' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('menampilkan label lengkap dengan separator panel yang netral', () => {
    render(<DashboardLayout />)
    const sidebar = document.querySelector('#desktop-sidebar')
    const activeLink = sidebar?.querySelector('a[aria-current="page"]')

    expect(sidebar).toHaveClass('border-r', 'border-border', 'bg-surface')
    expect(activeLink?.className).not.toContain('before:left-0')
    expect(activeLink?.querySelector('span')).not.toHaveClass('truncate')
  })

  it('menaruh menu profil di footer sidebar desktop dan drawer mobile', () => {
    render(<DashboardLayout />)

    const desktopSidebar = document.querySelector('#desktop-sidebar')
    expect(
      desktopSidebar?.querySelector('[aria-label^="Menu profil"]'),
    ).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Buka navigasi' }))
    const mobileDrawer = document.querySelector('#mobile-main-navigation')
    expect(
      mobileDrawer?.querySelector('[aria-label^="Menu profil"]'),
    ).not.toBeNull()
  })

  it('menaruh gutter fluid di dalam scroll container', () => {
    render(<DashboardLayout />)
    const main = document.querySelector('#main-content')
    const scrollContent = document.querySelector('[data-scroll-content]')

    expect(main).not.toHaveClass('p-4', 'md:p-5', 'lg:p-6')
    expect(scrollContent).toHaveClass('p-4', 'md:p-5', 'lg:p-6')
  })
})
