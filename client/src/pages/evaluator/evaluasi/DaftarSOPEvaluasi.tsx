/**
 * Evaluasi SOP: daftar pengajuan evaluasi (ringkas + paginasi server).
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Eye } from 'lucide-react'
import { ActiveFilterChips } from '@/components/data/active-filter-chips'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { SearchInput } from '@/components/ui/search-input'
import { RowActions } from '@/components/data/row-actions'
import {
  EvaluasiFilterTabs,
  type EvaluasiFilterTab,
} from '@/components/evaluasi/evaluasi-filter-tabs'
import { EvaluasiPengajuanGroupedList } from '@/components/evaluasi/evaluasi-pengajuan-grouped-list'
import { ROUTES } from '@/utils/constants'
import {
  STATUS_PENGAJUAN_BERJALAN_EVALUATOR,
  STATUS_RIWAYAT_FINAL_EVALUASI,
  usePengajuanEvaluasiRingkas,
} from '@/api/evaluasi'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { readPaginationMeta } from '@/lib/api/pagination'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'

export function DaftarSOPEvaluasi() {
  const navigate = useNavigate()
  const { opdId: opdIdFilter } = useSearch({
    from: '/evaluator/evaluasi/',
  })

  const [page, setPage] = useState(1)
  const [filterTab, setFilterTab] = useState<EvaluasiFilterTab>('pengajuan')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const ringkasParams = useMemo(() => {
    const search =
      debouncedSearch.trim() !== '' ? debouncedSearch.trim() : undefined
    const base = {
      page,
      limit: DEFAULT_PAGE_SIZE,
      search,
      opdId: opdIdFilter,
    }
    if (filterTab === 'pengajuan') {
      return { ...base, statusIn: [...STATUS_PENGAJUAN_BERJALAN_EVALUATOR] }
    }
    return { ...base, statusIn: [...STATUS_RIWAYAT_FINAL_EVALUASI] }
  }, [page, debouncedSearch, opdIdFilter, filterTab])

  const { data, isLoading } = usePengajuanEvaluasiRingkas(ringkasParams)

  useEffect(() => {
    setPage(1)
  }, [filterTab, debouncedSearch, opdIdFilter])

  const items = data?.items ?? []
  const pagination = readPaginationMeta(data)

  const clearOpdFilter = () =>
    navigate({
      to: ROUTES.EVALUATOR.EVALUASI,
      search: {},
      replace: true,
    })

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Evaluasi SOP' }]}
      title="Evaluasi SOP"
    >
      <DataSurface.Root>
        <DataSurface.Header>
          <DataSurface.Tabs>
            <EvaluasiFilterTabs value={filterTab} onValueChange={setFilterTab} />
          </DataSurface.Tabs>
          <DataSurface.Toolbar>
            <SearchInput
              placeholder="Cari nama OPD..."
              aria-label="Cari nama OPD..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </DataSurface.Toolbar>
          {opdIdFilter ? (
            <DataSurface.FilterRow>
              <ActiveFilterChips
                items={[
                  {
                    id: 'opd',
                    label: 'Filter OPD aktif',
                    onRemove: clearOpdFilter,
                  },
                ]}
                onClearAll={clearOpdFilter}
              />
            </DataSurface.FilterRow>
          ) : null}
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
                  to: ROUTES.EVALUATOR.DETAIL_EVALUASI_PENGAJUAN,
                  params: { id: row.pengajuanEvaluasiId },
                  title: 'Buka penilaian',
                },
              ]}
            />
          )}
        />
      </DataSurface.Root>
    </ListPageLayout>
  )
}
