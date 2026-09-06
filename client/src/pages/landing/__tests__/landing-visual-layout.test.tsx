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
  { step: '02', title: 'Review Proses' },
  { step: '03', title: 'Persetujuan Akhir' },
  { step: '04', title: 'TTE' },
  { step: '05', title: 'Berlaku' },
]

const roles: LandingRoleProfile[] = [
  {
    id: 'process-member',
    label: 'Penyusun SOP',
    responsibility: 'Menyusun dan memperbaiki SOP.',
    output: 'Draft dan revisi SOP.',
  },
  {
    id: 'process-owner',
    label: 'Pemilik Proses',
    responsibility: 'Mereview SOP dalam Process.',
    output: 'Keputusan review Process.',
  },
  {
    id: 'organizational-authority',
    label: 'Pejabat TTE',
    responsibility: 'Melakukan persetujuan akhir dan TTE.',
    output: 'SOP yang berlaku.',
  },
]

describe('landing visual layout', () => {
  it('centers the hero copy instead of using a left-right split layout', () => {
    render(<IdentityHero stages={stages} />)
    expect(screen.getByTestId('landing-hero-copy')).toHaveClass('text-center')
  })

  it('keeps the hero product preview focused without legacy operational metrics', () => {
    render(<LandingProductPreview />)
    expect(screen.getByText('Review Proses Bisnis')).toBeInTheDocument()
    expect(screen.getByText('Contoh SOP FTI')).toBeInTheDocument()
    expect(screen.queryByText('OPD terhubung')).not.toBeInTheDocument()
    expect(screen.queryByText('Pengajuan Evaluasi')).not.toBeInTheDocument()
    expect(screen.queryByText('Menunggu TTD PJ Evaluator')).not.toBeInTheDocument()
  })

  it('keeps global navigation focused on public destinations and login', () => {
    render(
      <PublicHeader
        institutionName="Fakultas Teknologi Informasi"
        productName="SOPFlow FTI"
      />,
    )

    expect(screen.getByText('Fakultas Teknologi Informasi · SOPFlow FTI')).toBeInTheDocument()
    expect(screen.getByText('Arsip SOP')).toBeInTheDocument()
    expect(screen.getByText('Validasi PDF')).toBeInTheDocument()
    expect(screen.getByText('Masuk')).toBeInTheDocument()
  })

  it('does not repeat archive and validation as a second dedicated section', () => {
    render(<LandingPage />)
    expect(screen.queryByText('Arsip dan validasi dokumen dalam satu tempat.')).not.toBeInTheDocument()
  })

  it('keeps responsibility information concise without a legacy role matrix', () => {
    render(<RoleWorkspaceShowcase roles={roles} />)
    expect(screen.getByText('Tiga tanggung jawab dalam lifecycle SOP FTI.')).toBeInTheDocument()
    expect(screen.queryByText('Kepala OPD')).not.toBeInTheDocument()
    expect(screen.queryByText('PJ Evaluator')).not.toBeInTheDocument()
  })

  it('uses a direct FTI closing with one action', () => {
    render(
      <InstitutionalClosing
        institutionName="Fakultas Teknologi Informasi"
        productName="SOPFlow FTI"
      />,
    )

    expect(screen.getByText('Lanjutkan pekerjaan pada Proses Bisnis Anda.')).toBeInTheDocument()
    expect(screen.getByText('Masuk ke Sistem')).toBeInTheDocument()
    expect(screen.queryByAltText('Kantor Gubernur Sumatera Barat')).not.toBeInTheDocument()
  })

  it('keeps the footer institutional without repeating public navigation', () => {
    render(
      <PublicFooter
        institutionName="Fakultas Teknologi Informasi"
        productName="SOPFlow FTI"
      />,
    )

    expect(screen.getByText('Fakultas Teknologi Informasi · SOPFlow FTI')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Navigasi footer' })).not.toBeInTheDocument()
  })
})
