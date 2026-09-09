import { IdentityHero } from '@/pages/landing/identity-hero'
import { PublicFooter } from '@/pages/landing/public-footer'
import { PublicHeader } from '@/pages/landing/public-header'
import { PublicServiceGateway } from '@/pages/landing/public-service-gateway'
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

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-foreground">
      <PublicHeader institutionName={INSTITUTION_NAME} productName={PRODUCT_NAME} />

      <main>
        <IdentityHero />
        <PublicServiceGateway />
        <WorkflowStory stages={WORKFLOW_STAGES} />
      </main>

      <PublicFooter institutionName={INSTITUTION_NAME} productName={PRODUCT_NAME} />
    </div>
  )
}
