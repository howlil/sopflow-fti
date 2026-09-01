import { useEffect, useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import {
  STATUS_PENGAJUAN_SIAP_TTD_PJ_EVALUATOR,
  STATUS_RIWAYAT_FINAL_EVALUASI,
  usePengajuanEvaluasiRingkas,
} from '@/api/evaluasi'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { SearchInput } from '@/components/ui/search-input'
import { RowActions } from '@/components/data/row-actions'
import {
  EvaluasiFilterTabs,
  type EvaluasiFilterTab,
} from '@/components/evaluasi/evaluasi-filter-tabs'
import { EvaluasiPengajuanGroupedList } from '@/components/evaluasi/evaluasi-pengajuan-grouped-list'
import { readPaginationMeta } from '@/lib/api/pagination'
import { ROUTES, IA, DEFAULT_PAGE_SIZE } from '@/utils/constants'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

export function ManajemenEvaluasiSop() {
  useDocumentTitle(`${IA.NAV_BIRO_EVALUASI_REQUEST_EVALUATOR} — PJ Evaluator`)
  const [page, setPage] = useState(1)
  const [filterTab, setFilterTab] = useState<EvaluasiFilterTab>('pengajuan')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const ringkasParams = useMemo(() => {
    const search =
      debouncedSearch.trim() !== '' ? debouncedSearch.trim() : undefined
    const base = { page, limit: DEFAULT_PAGE_SIZE, search }
    if (filterTab === 'pengajuan') {
      return { ...base, statusIn: [...STATUS_PENGAJUAN_SIAP_TTD_PJ_EVALUATOR] }
    }
    return { ...base, statusIn: [...STATUS_RIWAYAT_FINAL_EVALUASI] }
  }, [page, debouncedSearch, filterTab])

  const { data, isLoading } = usePengajuanEvaluasiRingkas(ringkasParams)

  useEffect(() => {
    setPage(1)
  }, [filterTab, debouncedSearch])

  const items = data?.items ?? []
  const pagination = readPaginationMeta(data)

  return (
    <ListPageLayout
      breadcrumb={[{ label: IA.NAV_BIRO_BATCH_BA }]}
      title={IA.NAV_BIRO_BATCH_BA}
    >
      <DataSurface.Root>
        <DataSurface.Header>
          <DataSurface.Tabs>
            <EvaluasiFilterTabs value={filterTab} onValueChange={setFilterTab} />
          </DataSurface.Tabs>
          <DataSurface.Toolbar>
            <SearchInput
              placeholder="Cari OPD..."
              aria-label="Cari OPD..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </DataSurface.Toolbar>
        </DataSurface.Header>

        <EvaluasiPengajuanGroupedList
          rows={items}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={setPage}
          surfaceMode="embedded"
          renderAction={(row) => (
            <RowActions
              actions={[
                {
                  icon: Eye,
                  to: ROUTES.PJ_EVALUATOR.DETAIL_EVALUASI,
                  params: { id: row.pengajuanEvaluasiId },
                  title: 'Detail evaluasi',
                },
              ]}
            />
          )}
        />
      </DataSurface.Root>
    </ListPageLayout>
  )
}
