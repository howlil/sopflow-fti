import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { LandingPage } from '../../LandingPage'
import { IdentityHero } from '../identity-hero'
import { InstitutionalClosing } from '../institutional-closing'
import { LandingProductPreview } from '../landing-product-preview'
import { PublicFooter } from '../public-footer'
import { PublicHeader } from '../public-header'
import { RoleWorkspaceShowcase, type LandingRoleProfile } from '../role-workspace-showcase'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}))

const stages = [
  { step: '01', title: 'Penyusunan' },
  { step: '02', title: 'Pengajuan' },
  { step: '03', title: 'Evaluasi' },
  { step: '04', title: 'Perbaikan' },
  { step: '05', title: 'Berita Acara' },
  { step: '06', title: 'Pengesahan' },
  { step: '07', title: 'Arsip' },
]

const roles: LandingRoleProfile[] = [
  {
    id: 'penyusun',
    label: 'Penyusun',
    responsibility: 'Menyusun dan memperbaiki SOP.',
    output: 'Draft dan revisi SOP.',
  },
  {
    id: 'pj-penyusun',
    label: 'PJ Penyusun',
    responsibility: 'Mengoordinasikan pengajuan SOP.',
    output: 'Paket pengajuan evaluasi.',
  },
  {
    id: 'evaluator',
    label: 'Evaluator',
    responsibility: 'Melakukan evaluasi SOP.',
    output: 'Hasil evaluasi.',
  },
  {
    id: 'pj-evaluator',
    label: 'PJ Evaluator Organisasi',
    responsibility: 'Mengoordinasikan proses evaluasi.',
    output: 'Berita acara evaluasi.',
  },
  {
    id: 'kepala-opd',
    label: 'Kepala OPD',
    responsibility: 'Melakukan pengesahan internal.',
    output: 'SOP yang disahkan.',
  },
]

describe('landing visual layout', () => {
  it('centers the hero copy instead of using a left-right split layout', () => {
    render(<IdentityHero stages={stages} />)

    expect(screen.getByTestId('landing-hero-copy')).toHaveClass('text-center')
  })

  it('keeps the hero product preview focused without companion cards or static operational metrics', () => {
    render(<LandingProductPreview />)

    expect(screen.queryByText('Arsip dan validasi dokumen')).not.toBeInTheDocument()
    expect(screen.queryByText('Identitas institusi')).not.toBeInTheDocument()
    expect(screen.queryByText('OPD terhubung')).not.toBeInTheDocument()
    expect(screen.queryByText('SOP dalam proses')).not.toBeInTheDocument()
    expect(screen.queryByText('Validasi publik')).not.toBeInTheDocument()
  })

  it('keeps global navigation focused on public destinations and login', () => {
    render(
      <PublicHeader
        governmentName="Pemerintah Provinsi Sumatera Barat"
        officeName="Biro Organisasi"
      />,
    )

    expect(screen.queryByText('Alur kerja')).not.toBeInTheDocument()
    expect(screen.queryByText('Peran')).not.toBeInTheDocument()
    expect(screen.getByText('Arsip SOP')).toBeInTheDocument()
    expect(screen.getByText('Validasi PDF')).toBeInTheDocument()
    expect(screen.getByText('Masuk')).toBeInTheDocument()
  })

  it('does not repeat archive and validation as a second dedicated section', () => {
    render(<LandingPage />)

    expect(screen.queryByText('Arsip dan validasi dokumen dalam satu tempat.')).not.toBeInTheDocument()
  })

  it('keeps role information concise without a second workspace mockup', () => {
    render(<RoleWorkspaceShowcase roles={roles} />)

    expect(screen.queryByText('Satu sistem. Lima konteks kerja.')).not.toBeInTheDocument()
    expect(screen.queryByText('Draft SOP')).not.toBeInTheDocument()
  })

  it('uses a direct institutional closing with one action', () => {
    render(
      <InstitutionalClosing
        governmentName="Pemerintah Provinsi Sumatera Barat"
        officeName="Biro Organisasi"
      />,
    )

    expect(screen.queryByText('Dokumen SOP tidak berhenti di folder.')).not.toBeInTheDocument()
    expect(screen.queryByText('Jelajahi Arsip SOP →')).not.toBeInTheDocument()
    expect(screen.getByText('Masuk ke Sistem')).toBeInTheDocument()
  })

  it('keeps the footer institutional without repeating public navigation', () => {
    render(
      <PublicFooter
        governmentName="Pemerintah Provinsi Sumatera Barat"
        officeName="Biro Organisasi"
      />,
    )

    expect(screen.queryByRole('navigation', { name: 'Navigasi footer' })).not.toBeInTheDocument()
  })
})
