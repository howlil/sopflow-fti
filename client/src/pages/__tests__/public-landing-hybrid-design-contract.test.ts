import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

const landingSource = readSource('../LandingPage.tsx')
const headerSource = readSource('../landing/public-header.tsx')
const heroSource = readSource('../landing/identity-hero.tsx')
const gatewaySource = readSource('../landing/public-service-gateway.tsx')
const workflowSource = readSource('../landing/workflow-story.tsx')
const footerSource = readSource('../landing/public-footer.tsx')
const allRenderedSources = [landingSource, headerSource, heroSource, gatewaySource, workflowSource, footerSource].join('\n')

describe('FTI public landing contract', () => {
  it('keeps FTI identity and the native siklus', () => {
    expect(landingSource).toContain('Fakultas Teknologi Informasi')
    expect(landingSource).toContain('SOPFlow FTI')

    for (const stage of ['Penyusunan', 'Review Proses', 'Persetujuan Akhir', 'TTE', 'Berlaku']) {
      expect(landingSource).toContain(stage)
    }

    expect(allRenderedSources).not.toContain('Pemerintah Provinsi Sumatera Barat')
    expect(allRenderedSources).not.toContain('Biro Organisasi')
  })

  it('uses an institutional hero with login as the secondary move', () => {
    expect(heroSource).toContain('Siklus SOP FTI dari penyusunan hingga berlaku.')
    expect(heroSource).toContain('Masuk ke Sistem')
    expect(heroSource).toContain('data-testid="landing-hero-copy"')
    expect(heroSource).not.toContain('LandingProductPreview')
  })

  it('makes the public archive and PDF validation the primary moves', () => {
    expect(gatewaySource).toContain('ROUTES.ARSIP.PREFIX')
    expect(gatewaySource).toContain('ROUTES.VALIDASI.PDF')
    expect(gatewaySource).toContain('Cari SOP yang sudah berlaku')
    expect(gatewaySource).toContain('Periksa PDF yang diterbitkan sistem')
    expect(gatewaySource).toContain('tanpa masuk ke ruang kerja pengguna')
  })

  it('keeps one short workflow and removes fake interactive surfaces', () => {
    expect(landingSource).toContain('<PublicServiceGateway />')
    expect(landingSource).toContain('<WorkflowStory stages={WORKFLOW_STAGES} />')
    expect(workflowSource).toContain('stages.map')

    for (const removed of ['LandingProductPreview', 'RoleWorkspaceShowcase', 'InstitutionalClosing', 'ROLE_PROFILES']) {
      expect(landingSource).not.toContain(removed)
    }
  })

  it('uses restrained semantic styling without decorative effects or unsupported claims', () => {
    expect(headerSource).toContain('ROUTES.ARSIP.PREFIX')
    expect(headerSource).toContain('ROUTES.VALIDASI.PDF')
    expect(footerSource).toContain('Sistem siklus SOP berbasis Proses Bisnis')

    for (const banned of [
      'radial-gradient',
      'linear-gradient',
      'shadow-',
      'rounded-[',
      'Catatan review',
      'Pratinjau sistem',
      'Tiga peran dalam pengelolaan SOP FTI.',
      'Jelajahi Arsip SOP',
      'TTE BSRE',
      'TTE BSrE',
      'Komdigi certified',
    ]) {
      expect(allRenderedSources).not.toContain(banned)
    }
  })
})
