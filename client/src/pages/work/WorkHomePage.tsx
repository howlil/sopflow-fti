import { ClipboardCheck } from 'lucide-react'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { EmptyState } from '@/components/ui/empty-state'
import { useDocumentTitle } from '@/hooks/use-document-title'

export function WorkHomePage() {
  useDocumentTitle('Pekerjaan SOP')

  return (
    <ListPageLayout title="Pekerjaan SOP" breadcrumb={null}>
      <EmptyState
        icon={<ClipboardCheck />}
        title="Belum ada penugasan"
        description="Akun Anda aktif, tetapi belum mempunyai penugasan sebagai Penyusun SOP, Penanggung Jawab Proses Bisnis, atau Pejabat Berwenang. Hubungi Administrator Sistem FTI."
      />
    </ListPageLayout>
  )
}
