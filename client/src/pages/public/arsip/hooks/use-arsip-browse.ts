import { useEffect, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  usePublicFtiSopGlobalList,
  usePublicProsesBisnisList,
  usePublicProsesBisnisSopList,
} from '@/api/sop-public'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { PublicProsesBisnisItem, PublicSopItem } from '@/types/dto/sop-public.dto'
import { ROUTES } from '@/utils/constants'
import {
  ARSIP_AUTO_SELECT_SOP_MAX,
  ARSIP_PROCESS_PAGE_SIZE,
  ARSIP_SOP_PAGE_SIZE,
  type ArsipBrowseSearch,
} from '../arsip-search-schema'
import type { ArsipBrowseWorkspaceProps } from '../components/arsip-browse-workspace'
import { arsipHomeCrumb, type ArsipBreadcrumbItem } from '../components/arsip-chrome'
import { formatSopContext } from '../components/arsip-sop-table'

const arsipRoute = getRouteApi('/arsip/')
const EMPTY_PUBLIC_SOP_ITEMS: PublicSopItem[] = []

export interface ArsipBrowseMobileState {
  showProsesBisnis: boolean
  showSopList: boolean
  showPreview: boolean
  isGlobalMode: boolean
  detailSopId?: string
}

function formatProsesBisnisContext(process: PublicProsesBisnisItem): string {
  return process.scope === 'DEPARTMENT' && process.namaDepartemen
    ? `${process.namaDepartemen} · ${process.nama}`
    : `Fakultas · ${process.nama}`
}

export function useArsipBrowse() {
  const search = arsipRoute.useSearch()
  const navigate = arsipRoute.useNavigate()
  const prosesBisnisId = search.prosesBisnisId
  const detailSopId = search.detailSopId
  const q = search.q?.trim() ?? ''
  const sopSearchParam = search.sopSearch?.trim() ?? ''
  const processPage = search.processPage ?? 1
  const sopPage = search.sopPage ?? 1
  const isGlobalMode = q.length > 0

  const [globalInput, setGlobalInput] = useState(q)
  const [processFilter, setProsesBisnisFilter] = useState('')
  const [sopFilterInput, setSopFilterInput] = useState(sopSearchParam)
  const debouncedGlobal = useDebouncedValue(globalInput, 350)
  const debouncedProsesBisnisFilter = useDebouncedValue(processFilter, 350)
  const debouncedSopSearch = useDebouncedValue(sopFilterInput, 350)

  useEffect(() => setGlobalInput(q), [q])
  useEffect(() => setSopFilterInput(sopSearchParam), [sopSearchParam])

  useEffect(() => {
    const next = debouncedGlobal.trim()
    if (next === q) return
    void navigate({
      search: (prev: ArsipBrowseSearch) => ({
        ...prev,
        q: next || undefined,
        prosesBisnisId: next ? undefined : prev.prosesBisnisId,
        detailSopId: undefined,
        sopPage: 1,
        sopSearch: undefined,
      }),
    })
  }, [debouncedGlobal, navigate, q])

  useEffect(() => {
    const next = debouncedSopSearch.trim()
    if (next === sopSearchParam || isGlobalMode || !prosesBisnisId) return
    void navigate({
      search: (prev: ArsipBrowseSearch) => ({
        ...prev,
        sopSearch: next || undefined,
        sopPage: 1,
        detailSopId: undefined,
      }),
    })
  }, [debouncedSopSearch, sopSearchParam, isGlobalMode, prosesBisnisId, navigate])

  const processQuery = usePublicProsesBisnisList({
    page: processPage,
    limit: ARSIP_PROCESS_PAGE_SIZE,
    search: debouncedProsesBisnisFilter || undefined,
  })
  const sopByProsesBisnisQuery = usePublicProsesBisnisSopList(prosesBisnisId ?? '', {
    page: sopPage,
    limit: ARSIP_SOP_PAGE_SIZE,
    search: debouncedSopSearch || undefined,
  })
  const globalSopQuery = usePublicFtiSopGlobalList({
    page: sopPage,
    limit: ARSIP_SOP_PAGE_SIZE,
    search: q,
  })

  const processItems = processQuery.data?.items ?? []
  const processPagination = processQuery.data?.pagination
  const selectedProsesBisnis =
    sopByProsesBisnisQuery.data?.process ?? processItems.find((item) => item.prosesBisnisId === prosesBisnisId)
  const selectedProsesBisnisName = selectedProsesBisnis ? formatProsesBisnisContext(selectedProsesBisnis) : undefined

  const sopItems = useMemo(
    () =>
      isGlobalMode
        ? (globalSopQuery.data?.items ?? EMPTY_PUBLIC_SOP_ITEMS)
        : (sopByProsesBisnisQuery.data?.items ?? EMPTY_PUBLIC_SOP_ITEMS),
    [globalSopQuery.data?.items, isGlobalMode, sopByProsesBisnisQuery.data?.items],
  )
  const sopPagination = isGlobalMode
    ? globalSopQuery.data?.pagination
    : sopByProsesBisnisQuery.data?.pagination
  const sopLoading = isGlobalMode
    ? globalSopQuery.isLoading
    : Boolean(prosesBisnisId) && sopByProsesBisnisQuery.isLoading
  const sopError = isGlobalMode
    ? globalSopQuery.isError
    : Boolean(prosesBisnisId) && sopByProsesBisnisQuery.isError
  const sopFetching = isGlobalMode
    ? globalSopQuery.isFetching
    : Boolean(prosesBisnisId) && sopByProsesBisnisQuery.isFetching
  const sopListReady = isGlobalMode
    ? globalSopQuery.isSuccess
    : Boolean(prosesBisnisId) && sopByProsesBisnisQuery.isSuccess
  const totalSopCount = sopPagination?.totalItems ?? 0
  const hasSopSearchFilter = sopSearchParam.length > 0

  useEffect(() => {
    if (detailSopId || isGlobalMode || !prosesBisnisId || !sopListReady || sopItems.length === 0) return
    if (totalSopCount > ARSIP_AUTO_SELECT_SOP_MAX) return
    const first = sopItems[0]
    if (!first) return
    void navigate({
      search: (prev: ArsipBrowseSearch) => ({ ...prev, detailSopId: first.detailSopId }),
      replace: true,
    })
  }, [detailSopId, isGlobalMode, prosesBisnisId, sopListReady, sopItems, totalSopCount, navigate])

  function handleSelectProsesBisnis(id: string) {
    setGlobalInput('')
    setSopFilterInput('')
    void navigate({
      search: (prev: ArsipBrowseSearch) => ({
        ...prev,
        prosesBisnisId: id,
        q: undefined,
        detailSopId: undefined,
        sopPage: 1,
        sopSearch: undefined,
      }),
    })
  }

  function handleChangeProsesBisnis() {
    setSopFilterInput('')
    void navigate({
      search: (prev: ArsipBrowseSearch) => ({
        ...prev,
        prosesBisnisId: undefined,
        detailSopId: undefined,
        sopPage: undefined,
        sopSearch: undefined,
      }),
    })
  }

  function handleSelectSop(sop: PublicSopItem) {
    void navigate({
      search: (prev: ArsipBrowseSearch) => ({
        ...prev,
        detailSopId: sop.detailSopId,
        prosesBisnisId: isGlobalMode ? prev.prosesBisnisId : (sop.prosesBisnisId ?? prev.prosesBisnisId),
      }),
    })
  }

  function handleClosePreview() {
    void navigate({ search: (prev: ArsipBrowseSearch) => ({ ...prev, detailSopId: undefined }) })
  }

  function handleMobileBackToProsesBisnis() {
    setGlobalInput('')
    setSopFilterInput('')
    void navigate({ search: { processPage } })
  }

  function handleProsesBisnisPageChange(page: number) {
    void navigate({ search: (prev: ArsipBrowseSearch) => ({ ...prev, processPage: page }) })
  }

  function handleSopPageChange(page: number) {
    void navigate({ search: (prev: ArsipBrowseSearch) => ({ ...prev, sopPage: page }) })
  }

  function handleSopSearchChange(value: string) {
    setSopFilterInput(value)
  }

  function handleProsesBisnisFilterChange(value: string) {
    setProsesBisnisFilter(value)
    void navigate({ search: (prev: ArsipBrowseSearch) => ({ ...prev, processPage: 1 }) })
  }

  const panelTitle = isGlobalMode
    ? 'Hasil pencarian'
    : prosesBisnisId
      ? (selectedProsesBisnis?.nama ?? 'Daftar SOP')
      : 'Daftar SOP'
  const panelSubtitle = isGlobalMode
    ? `Kata kunci: “${q}”`
    : prosesBisnisId
      ? (selectedProsesBisnisName ?? 'Dokumen berstatus Berlaku')
      : undefined
  const sopEmptyTitle = isGlobalMode
    ? 'Tidak ada SOP ditemukan'
    : hasSopSearchFilter
      ? 'Tidak ada SOP cocok'
      : 'Tidak ada SOP berlaku'
  const sopEmptyHint = isGlobalMode
    ? 'Coba judul, nomor SOP, nama Proses Bisnis, atau Departemen lain.'
    : hasSopSearchFilter
      ? 'Coba kata kunci lain pada filter di atas.'
      : 'Belum ada dokumen resmi berlaku pada Proses Bisnis ini.'

  const selectedSop = detailSopId
    ? sopItems.find((item) => item.detailSopId === detailSopId)
    : undefined
  const selectedSopContext = selectedSop ? formatSopContext(selectedSop) : selectedProsesBisnisName

  const breadcrumbItems = useMemo((): ArsipBreadcrumbItem[] => {
    const items: ArsipBreadcrumbItem[] = [arsipHomeCrumb()]
    if (prosesBisnisId && selectedProsesBisnis) {
      items.push({
        label:
          selectedProsesBisnis.scope === 'DEPARTMENT' && selectedProsesBisnis.namaDepartemen
            ? selectedProsesBisnis.namaDepartemen
            : 'Fakultas',
      })
      items.push({
        label: selectedProsesBisnis.nama,
        to: ROUTES.ARSIP.PREFIX,
        search: {
          prosesBisnisId,
          sopPage: sopPage > 1 ? String(sopPage) : undefined,
          sopSearch: sopSearchParam || undefined,
        },
      })
    }
    if (detailSopId) items.push({ label: selectedSop?.judul ?? 'Dokumen SOP' })
    return items
  }, [prosesBisnisId, selectedProsesBisnis, detailSopId, selectedSop?.judul, sopPage, sopSearchParam])

  const workspaceProps: ArsipBrowseWorkspaceProps = {
    isGlobalMode,
    prosesBisnisId,
    selectedProsesBisnisName,
    detailSopId,
    selectedSop,
    selectedSopContext,
    processItems,
    processFilter,
    onProsesBisnisFilterChange: handleProsesBisnisFilterChange,
    onSelectProsesBisnis: handleSelectProsesBisnis,
    onChangeProsesBisnis: handleChangeProsesBisnis,
    processLoading: processQuery.isLoading,
    processError: processQuery.isError,
    processFetching: processQuery.isFetching,
    processPagination,
    processPage,
    onProsesBisnisPageChange: handleProsesBisnisPageChange,
    sopPanelTitle: panelTitle,
    sopPanelSubtitle: panelSubtitle,
    sopItems,
    sopPagination,
    sopPage,
    onSopPageChange: handleSopPageChange,
    sopLoading,
    sopError,
    sopFetching,
    showContextColumn: isGlobalMode,
    showSopSearchFilter: Boolean(prosesBisnisId) && !isGlobalMode,
    sopSearch: sopFilterInput,
    onSopSearchChange: handleSopSearchChange,
    onSelectSop: handleSelectSop,
    onClosePreview: handleClosePreview,
    onRefreshPreview: () => void (isGlobalMode ? globalSopQuery.refetch() : sopByProsesBisnisQuery.refetch()),
    sopEmptyTitle,
    sopEmptyHint,
  }

  const mobile: ArsipBrowseMobileState = {
    showProsesBisnis: !isGlobalMode && !prosesBisnisId && !detailSopId,
    showSopList: (isGlobalMode || Boolean(prosesBisnisId)) && !detailSopId,
    showPreview: Boolean(detailSopId),
    isGlobalMode,
    detailSopId,
  }

  return {
    globalInput,
    setGlobalInput,
    breadcrumbItems,
    showBreadcrumb: Boolean(prosesBisnisId || detailSopId),
    workspaceProps,
    mobile,
    handleSelectProsesBisnis,
    handleMobileBackToProsesBisnis,
    handleSelectSop,
    handleClosePreview,
    handleProsesBisnisPageChange,
    handleSopPageChange,
    handleSopSearchChange,
    processQuery,
    panelTitle,
    panelSubtitle,
    sopItems,
    selectedSop,
    selectedSopContext,
    sopPagination,
    sopPage,
    sopLoading,
    sopError,
    sopFetching,
    sopEmptyTitle,
    sopEmptyHint,
    sopFilterInput,
    prosesBisnisId,
    isGlobalMode,
  }
}
