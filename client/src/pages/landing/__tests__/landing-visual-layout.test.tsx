import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { LandingPage } from '../../LandingPage'
import { IdentityHero } from '../identity-hero'
import { PublicFooter } from '../public-footer'
import { PublicHeader } from '../public-header'
import { PublicServiceGateway } from '../public-service-gateway'
import { WorkflowStory } from '../workflow-story'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
}))

const stages = [
  { step: '01', title: 'Penyusunan' },
  { step: '02', title: 'Review Proses' },
  { step: '03', title: 'Persetujuan Akhir' },
  { step: '04', title: 'TTE' },
  { step: '05', title: 'Berlaku' },
]

describe('landing visual layout', () => {
  it('keeps the hero institutional, compact, and login-secondary', () => {
    render(<IdentityHero />)

    expect(screen.getByRole('heading', { name: 'Siklus SOP FTI dari penyusunan hingga berlaku.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Masuk ke Sistem' })).toBeInTheDocument()
    expect(screen.queryByText('Pratinjau sistem')).not.toBeInTheDocument()
  })

  it('exposes real public archive and PDF validation moves', () => {
    render(<PublicServiceGateway />)

    expect(screen.getByRole('link', { name: /Arsip SOP.*Buka arsip/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Validasi PDF.*Mulai validasi/i })).toBeInTheDocument()
  })

  it('keeps the workflow short and readable on small screens', () => {
    render(<WorkflowStory stages={stages} />)

    expect(screen.getByRole('list', { name: 'Tahapan pengelolaan SOP' })).toBeInTheDocument()
    for (const stage of stages) {
      expect(screen.getByText(stage.title)).toBeInTheDocument()
    }
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

  it('does not render the removed preview, role tabs, or duplicate closing CTA', () => {
    render(<LandingPage />)

    expect(screen.queryByText('Pratinjau sistem')).not.toBeInTheDocument()
    expect(screen.queryByText('Tiga peran dalam pengelolaan SOP FTI.')).not.toBeInTheDocument()
    expect(screen.queryByText('Lanjutkan pekerjaan pada Proses Bisnis Anda.')).not.toBeInTheDocument()
  })

  it('keeps the footer institutional without adding a second navigation', () => {
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
