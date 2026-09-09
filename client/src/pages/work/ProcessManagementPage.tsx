import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { PanelLayananMandiriPenanggungJawabProsesBisnis } from './PanelLayananMandiriPenanggungJawabProsesBisnis'

export function ProcessManagementPage() {
  useDocumentTitle('Kelola Proses Bisnis')
  return (
    <ListPageLayout
      title="Kelola Proses Bisnis"
      description="Kelola proses dan Penyusun SOP di dalam lingkup kewenangan Anda."
      breadcrumb={null}
    >
      <PanelLayananMandiriPenanggungJawabProsesBisnis />
    </ListPageLayout>
  )
}
