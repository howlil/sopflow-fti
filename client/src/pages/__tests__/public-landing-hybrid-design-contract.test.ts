import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

const landingSource = readSource('../LandingPage.tsx')
const headerSource = readSource('../landing/public-header.tsx')
const heroSource = readSource('../landing/identity-hero.tsx')
const productPreviewSource = readSource('../landing/landing-product-preview.tsx')
const gatewaySource = readSource('../landing/public-service-gateway.tsx')
const workflowSource = readSource('../landing/workflow-story.tsx')
const roleSource = readSource('../landing/role-workspace-showcase.tsx')
const closingSource = readSource('../landing/institutional-closing.tsx')
const footerSource = readSource('../landing/public-footer.tsx')

const allRenderedSources = [
  landingSource,
  headerSource,
  heroSource,
  productPreviewSource,
  gatewaySource,
  workflowSource,
  roleSource,
  closingSource,
  footerSource,
].join('\n')

describe('FTI public landing contract', () => {
  it('keeps FTI identity and the native lifecycle', () => {
    expect(landingSource).toContain('Fakultas Teknologi Informasi')
    expect(landingSource).toContain('SOPFlow FTI')

    for (const stage of ['Penyusunan', 'Review Proses', 'Persetujuan Akhir', 'TTE', 'Berlaku']) {
      expect(landingSource).toContain(stage)
    }

    expect(allRenderedSources).not.toContain('Pemerintah Provinsi Sumatera Barat')
    expect(allRenderedSources).not.toContain('Biro Organisasi')
    expect(allRenderedSources).not.toContain('Kepala OPD')
    expect(allRenderedSources).not.toContain('PJ Evaluator')
  })

  it('uses a centered light product-first hero with one primary action', () => {
    expect(heroSource).toContain('Kelola SOP dari Proses Bisnis sampai TTE dalam satu alur.')
    expect(heroSource).toContain('Sistem Lifecycle SOP Fakultas Teknologi Informasi')
    expect(heroSource).toContain('Masuk ke Sistem')
    expect(heroSource).toContain('LandingProductPreview')
    expect(heroSource).toContain('data-testid="landing-hero-copy"')
    expect(heroSource).toContain('text-center')
    expect(heroSource).not.toContain('Lihat Arsip SOP')
    expect(heroSource).not.toContain('bg-slate-950 text-white')
  })

  it('keeps the product preview illustrative and FTI-native', () => {
    expect(productPreviewSource).toContain('Review Proses Bisnis')
    expect(productPreviewSource).toContain('Contoh SOP FTI')
    expect(productPreviewSource).toContain('Pratinjau sistem')
    expect(productPreviewSource).toContain('Menunggu persetujuan akhir')
    expect(productPreviewSource).toContain('Kewenangan kontekstual')
    expect(productPreviewSource).not.toContain('Pengajuan Evaluasi')
    expect(productPreviewSource).not.toContain('Contoh paket SOP OPD')
    expect(productPreviewSource).not.toContain('Menunggu TTD PJ Evaluator')
  })

  it('keeps global navigation focused on public destinations and login', () => {
    expect(headerSource).not.toContain('Alur kerja')
    expect(headerSource).not.toContain('Peran')
    expect(headerSource).toContain('Arsip SOP')
    expect(headerSource).toContain('Validasi PDF')
    expect(headerSource).toContain('Masuk')
    expect(gatewaySource).toContain('Arsip SOP')
    expect(gatewaySource).toContain('Validasi PDF')
  })

  it('keeps one workflow, one responsibility section, and one public-service section', () => {
    expect(landingSource).toContain('<PublicServiceGateway />')
    expect(landingSource).toContain('<WorkflowStory stages={WORKFLOW_STAGES} />')
    expect(landingSource).toContain('<RoleWorkspaceShowcase roles={ROLE_PROFILES} />')
    expect(workflowSource).toContain('stages.map')
    expect(roleSource).toContain('Tiga tanggung jawab dalam lifecycle SOP FTI.')
    expect(roleSource).toContain('Kewenangan kontekstual')
    expect(roleSource).not.toContain('Lima peran dalam pengelolaan SOP.')
  })

  it('keeps role interaction accessible and motion restrained', () => {
    expect(roleSource).toContain('role="tablist"')
    expect(roleSource).toContain('role="tab"')
    expect(roleSource).toContain('aria-selected')
    expect(roleSource).toContain('role="tabpanel"')
    expect(roleSource).toContain('motion-reduce:transition-none')
    expect(closingSource).not.toContain('Kantor_Gubernur_Sumbar_belakang.jpg')
  })

  it('does not repeat lower-page actions or generic SaaS slogans', () => {
    expect(closingSource).toContain('Masuk ke Sistem')
    expect(closingSource).not.toContain('Jelajahi Arsip SOP')
    expect(footerSource).not.toContain('Navigasi footer')

    for (const banned of [
      'Satu sistem. Lima konteks kerja.',
      'Satu dokumen. Satu riwayat yang dapat ditelusuri.',
      'Dokumen SOP tidak berhenti di folder.',
      'blur-3xl',
      'shadow-xl',
      'rounded-3xl',
      'TTE BSRE',
      'TTE BSrE',
      'Komdigi certified',
    ]) {
      expect(allRenderedSources).not.toContain(banned)
    }
  })
})
