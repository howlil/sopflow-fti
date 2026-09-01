import { IdentityHero } from '@/pages/landing/identity-hero'
import { InstitutionalClosing } from '@/pages/landing/institutional-closing'
import { PublicFooter } from '@/pages/landing/public-footer'
import { PublicHeader } from '@/pages/landing/public-header'
import { PublicServiceGateway } from '@/pages/landing/public-service-gateway'
import {
  RoleWorkspaceShowcase,
  type LandingRoleProfile,
} from '@/pages/landing/role-workspace-showcase'
import { WorkflowStory } from '@/pages/landing/workflow-story'

const GOVERNMENT_NAME = 'Pemerintah Provinsi Sumatera Barat'
const OFFICE_NAME = 'Biro Organisasi'

const WORKFLOW_STAGES = [
  { step: '01', title: 'Penyusunan' },
  { step: '02', title: 'Pengajuan' },
  { step: '03', title: 'Evaluasi' },
  { step: '04', title: 'Perbaikan' },
  { step: '05', title: 'Berita Acara' },
  { step: '06', title: 'Pengesahan' },
  { step: '07', title: 'Arsip' },
] as const

const ROLE_PROFILES: LandingRoleProfile[] = [
  {
    id: 'penyusun',
    label: 'Penyusun',
    responsibility: 'Menyusun isi SOP dan menindaklanjuti catatan evaluasi.',
    output: 'Draft dan revisi SOP.',
  },
  {
    id: 'pj-penyusun',
    label: 'PJ Penyusun',
    responsibility: 'Mengoordinasikan SOP pada OPD dan mengajukan dokumen yang siap dievaluasi.',
    output: 'Paket pengajuan evaluasi.',
  },
  {
    id: 'evaluator',
    label: 'Evaluator',
    responsibility: 'Memeriksa substansi SOP, memberi penilaian, dan mencatat perbaikan.',
    output: 'Hasil evaluasi dan catatan perbaikan.',
  },
  {
    id: 'pj-evaluator',
    label: 'PJ Evaluator Organisasi',
    responsibility: 'Mengoordinasikan evaluasi lintas OPD, penugasan evaluator, dan berita acara.',
    output: 'Berita acara hasil evaluasi.',
  },
  {
    id: 'kepala-opd',
    label: 'Kepala OPD',
    responsibility: 'Meninjau dan mengesahkan SOP setelah evaluasi dan berita acara selesai.',
    output: 'SOP yang disahkan dan siap diarsipkan.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-foreground">
      <PublicHeader governmentName={GOVERNMENT_NAME} officeName={OFFICE_NAME} />

      <main>
        <IdentityHero stages={WORKFLOW_STAGES} />
        <PublicServiceGateway />
        <WorkflowStory stages={WORKFLOW_STAGES} />
        <RoleWorkspaceShowcase roles={ROLE_PROFILES} />
        <InstitutionalClosing governmentName={GOVERNMENT_NAME} officeName={OFFICE_NAME} />
      </main>

      <PublicFooter governmentName={GOVERNMENT_NAME} officeName={OFFICE_NAME} />
    </div>
  )
}
