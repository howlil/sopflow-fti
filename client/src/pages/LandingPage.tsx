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

const INSTITUTION_NAME = 'Fakultas Teknologi Informasi'
const PRODUCT_NAME = 'SOPFlow FTI'

const WORKFLOW_STAGES = [
  { step: '01', title: 'Penyusunan' },
  { step: '02', title: 'Review Proses' },
  { step: '03', title: 'Persetujuan Akhir' },
  { step: '04', title: 'TTE' },
  { step: '05', title: 'Berlaku' },
] as const

const ROLE_PROFILES: LandingRoleProfile[] = [
  {
    id: 'process-member',
    label: 'Penyusun SOP',
    responsibility: 'Menyusun dan memperbaiki SOP pada Proses Bisnis yang diberikan secara eksplisit.',
    output: 'Draft dan revisi SOP yang siap direview.',
  },
  {
    id: 'process-owner',
    label: 'Pemilik Proses',
    responsibility: 'Mengelola anggota Proses Bisnis, mereview SOP, dan meneruskan hasil review yang diterima ke pejabat berwenang.',
    output: 'Keputusan review Proses Bisnis yang dapat diaudit.',
  },
  {
    id: 'organizational-authority',
    label: 'Pejabat TTE',
    responsibility: 'Dekan atau Ketua Jurusan melakukan persetujuan akhir dan TTE sesuai lingkup organisasi Proses Bisnis.',
    output: 'SOP bertanda tangan elektronik yang berlaku.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-foreground">
      <PublicHeader institutionName={INSTITUTION_NAME} productName={PRODUCT_NAME} />

      <main>
        <IdentityHero stages={WORKFLOW_STAGES} />
        <PublicServiceGateway />
        <WorkflowStory stages={WORKFLOW_STAGES} />
        <RoleWorkspaceShowcase roles={ROLE_PROFILES} />
        <InstitutionalClosing institutionName={INSTITUTION_NAME} productName={PRODUCT_NAME} />
      </main>

      <PublicFooter institutionName={INSTITUTION_NAME} productName={PRODUCT_NAME} />
    </div>
  )
}
