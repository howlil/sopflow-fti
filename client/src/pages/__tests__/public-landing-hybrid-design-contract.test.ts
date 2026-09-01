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

describe('institutional public landing contract', () => {
  it('keeps official identity and complete SOP lifecycle', () => {
    expect(landingSource).toContain('Pemerintah Provinsi Sumatera Barat')
    expect(landingSource).toContain('Biro Organisasi')

    for (const stage of [
      'Penyusunan',
      'Pengajuan',
      'Evaluasi',
      'Perbaikan',
      'Berita Acara',
      'Pengesahan',
      'Arsip',
    ]) {
      expect(landingSource).toContain(stage)
    }
  })

  it('uses a centered light product-first hero with one primary action', () => {
    expect(heroSource).toContain('Pengelolaan SOP dari penyusunan hingga pengesahan dalam satu sistem.')
    expect(heroSource).toContain('Sistem Pengelolaan SOP Berbasis Web')
    expect(heroSource).toContain('Masuk ke Sistem')
    expect(heroSource).toContain('LandingProductPreview')
    expect(heroSource).toContain('data-testid="landing-hero-copy"')
    expect(heroSource).toContain('text-center')
    expect(heroSource).not.toContain('Lihat Arsip SOP')
    expect(heroSource).not.toContain('Berbasis peran')
    expect(heroSource).not.toContain('Evaluasi terdokumentasi')
    expect(heroSource).not.toContain('Arsip dan validasi terpusat')
    expect(heroSource).not.toContain('bg-slate-950 text-white')
    expect(heroSource).not.toContain('lg:grid-cols-[0.48fr_0.52fr]')
  })

  it('keeps the product preview clearly illustrative instead of presenting static metrics as live data', () => {
    expect(productPreviewSource).toContain('Pengajuan Evaluasi')
    expect(productPreviewSource).toContain('Contoh paket SOP OPD')
    expect(productPreviewSource).toContain('Pratinjau sistem')
    expect(productPreviewSource).toContain('Menunggu TTD PJ Evaluator')
    expect(productPreviewSource).not.toContain('OPD terhubung')
    expect(productPreviewSource).not.toContain('SOP dalam proses')
    expect(productPreviewSource).not.toContain('Validasi publik')
    expect(productPreviewSource).not.toContain('Kantor_Gubernur_Sumbar_belakang.jpg')
    expect(closingSource).toContain('Kantor_Gubernur_Sumbar_belakang.jpg')
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

  it('keeps one workflow, one role section, and one public-service section', () => {
    expect(landingSource).toContain('<PublicServiceGateway />')
    expect(landingSource).toContain('<WorkflowStory stages={WORKFLOW_STAGES} />')
    expect(landingSource).toContain('<RoleWorkspaceShowcase roles={ROLE_PROFILES} />')
    expect(landingSource).not.toContain('DocumentTraceability')
    expect(landingSource).not.toContain('Evaluasi & Perbaikan')
    expect(landingSource).not.toContain('Pengesahan & Arsip')
    expect(workflowSource).toContain('stages.map')
    expect(workflowSource).not.toContain('WorkflowPreview')
    expect(roleSource).toContain('Lima peran dalam pengelolaan SOP.')
    expect(roleSource).not.toContain('RoleWorkspacePreview')
  })

  it('keeps role interaction accessible and motion restrained', () => {
    expect(roleSource).toContain('role="tablist"')
    expect(roleSource).toContain('role="tab"')
    expect(roleSource).toContain('aria-selected')
    expect(roleSource).toContain('role="tabpanel"')
    expect(roleSource).toContain('motion-reduce:transition-none')
    expect(closingSource).toContain('alt="Kantor Gubernur Sumatera Barat"')
    expect(closingSource).toContain('loading="lazy"')
  })

  it('does not repeat lower-page actions or generic SaaS slogans', () => {
    expect(closingSource).toContain('Masuk ke Sistem')
    expect(closingSource).not.toContain('Jelajahi Arsip SOP')
    expect(footerSource).not.toContain('Navigasi footer')

    for (const banned of [
      'Satu sistem. Lima konteks kerja.',
      'Satu dokumen. Satu riwayat yang dapat ditelusuri.',
      'Dokumen SOP tidak berhenti di folder.',
      'bg-gradient',
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
