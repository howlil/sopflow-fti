import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { PanelLayananMandiriPenanggungJawabProsesBisnis } from './PanelLayananMandiriPenanggungJawabProsesBisnis'

export function ProcessManagementPage() {
  useDocumentTitle('Proses Bisnis')
  return (
    <ListPageLayout
      title="Proses Bisnis"
      breadcrumb={null}
    >
      <PanelLayananMandiriPenanggungJawabProsesBisnis />
    </ListPageLayout>
  )
}
