import { useEffect, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  usePublicFtiSopGlobalList,
  usePublicProcessList,
  usePublicProcessSopList,
} from '@/api/sop-public'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { PublicProcessItem, PublicSopItem } from '@/types/dto/sop-public.dto'
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
  showProcess: boolean
  showSopList: boolean
  showPreview: boolean
  isGlobalMode: boolean
  detailSopId?: string
}

function formatProcessContext(process: PublicProcessItem): string {
  return process.scope === 'DEPARTMENT' && process.departmentName
    ? `${process.departmentName} · ${process.nama}`
    : `Fakultas · ${process.nama}`
}

export function useArsipBrowse() {
  const search = arsipRoute.useSearch()
  const navigate = arsipRoute.useNavigate()
  const processId = search.processId
  const detailSopId = search.detailSopId
  const q = search.q?.trim() ?? ''
  const sopSearchParam = search.sopSearch?.trim() ?? ''
  const processPage = search.processPage ?? 1
  const sopPage = search.sopPage ?? 1
  const isGlobalMode = q.length > 0

  const [globalInput, setGlobalInput] = useState(q)
  const [processFilter, setProcessFilter] = useState('')
  const [sopFilterInput, setSopFilterInput] = useState(sopSearchParam)
  const debouncedGlobal = useDebouncedValue(globalInput, 350)
  const debouncedProcessFilter = useDebouncedValue(processFilter, 350)
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
        processId: next ? undefined : prev.processId,
        detailSopId: undefined,
        sopPage: 1,
        sopSearch: undefined,
        opdId: undefined,
        opdPage: undefined,
      }),
    })
  }, [debouncedGlobal, navigate, q])

  useEffect(() => {
    const next = debouncedSopSearch.trim()
    if (next === sopSearchParam || isGlobalMode || !processId) return
    void navigate({
      search: (prev: ArsipBrowseSearch) => ({
        ...prev,
        sopSearch: next || undefined,
        sopPage: 1,
        detailSopId: undefined,
      }),
    })
  }, [debouncedSopSearch, sopSearchParam, isGlobalMode, processId, navigate])

  const processQuery = usePublicProcessList({
    page: processPage,
    limit: ARSIP_PROCESS_PAGE_SIZE,
    search: debouncedProcessFilter || undefined,
  })
  const sopByProcessQuery = usePublicProcessSopList(processId ?? '', {
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
  const selectedProcess =
    sopByProcessQuery.data?.process ?? processItems.find((item) => item.processId === processId)
  const selectedProcessName = selectedProcess ? formatProcessContext(selectedProcess) : undefined

  const sopItems = useMemo(
    () =>
      isGlobalMode
        ? (globalSopQuery.data?.items ?? EMPTY_PUBLIC_SOP_ITEMS)
        : (sopByProcessQuery.data?.items ?? EMPTY_PUBLIC_SOP_ITEMS),
    [globalSopQuery.data?.items, isGlobalMode, sopByProcessQuery.data?.items],
  )
  const sopPagination = isGlobalMode
    ? globalSopQuery.data?.pagination
    : sopByProcessQuery.data?.pagination
  const sopLoading = isGlobalMode
    ? globalSopQuery.isLoading
    : Boolean(processId) && sopByProcessQuery.isLoading
  const sopError = isGlobalMode
    ? globalSopQuery.isError
    : Boolean(processId) && sopByProcessQuery.isError
  const sopFetching = isGlobalMode
    ? globalSopQuery.isFetching
    : Boolean(processId) && sopByProcessQuery.isFetching
  const sopListReady = isGlobalMode
    ? globalSopQuery.isSuccess
    : Boolean(processId) && sopByProcessQuery.isSuccess
  const totalSopCount = sopPagination?.totalItems ?? 0
  const hasSopSearchFilter = sopSearchParam.length > 0

  useEffect(() => {
    if (detailSopId || isGlobalMode || !processId || !sopListReady || sopItems.length === 0) return
    if (totalSopCount > ARSIP_AUTO_SELECT_SOP_MAX) return
    const first = sopItems[0]
    if (!first) return
    void navigate({
      search: (prev: ArsipBrowseSearch) => ({ ...prev, detailSopId: first.detailSopId }),
      replace: true,
    })
  }, [detailSopId, isGlobalMode, processId, sopListReady, sopItems, totalSopCount, navigate])

  function handleSelectProcess(id: string) {
    setGlobalInput('')
    setSopFilterInput('')
    void navigate({
      search: (prev: ArsipBrowseSearch) => ({
        ...prev,
        processId: id,
        q: undefined,
        detailSopId: undefined,
        sopPage: 1,
        sopSearch: undefined,
        opdId: undefined,
        opdPage: undefined,
      }),
    })
  }

  function handleChangeProcess() {
    setSopFilterInput('')
    void navigate({
      search: (prev: ArsipBrowseSearch) => ({
        ...prev,
        processId: undefined,
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
        processId: isGlobalMode ? prev.processId : (sop.processId ?? prev.processId),
      }),
    })
  }

  function handleClosePreview() {
    void navigate({ search: (prev: ArsipBrowseSearch) => ({ ...prev, detailSopId: undefined }) })
  }

  function handleMobileBackToProcess() {
    setGlobalInput('')
    setSopFilterInput('')
    void navigate({ search: { processPage } })
  }

  function handleProcessPageChange(page: number) {
    void navigate({ search: (prev: ArsipBrowseSearch) => ({ ...prev, processPage: page }) })
  }

  function handleSopPageChange(page: number) {
    void navigate({ search: (prev: ArsipBrowseSearch) => ({ ...prev, sopPage: page }) })
  }

  function handleSopSearchChange(value: string) {
    setSopFilterInput(value)
  }

  function handleProcessFilterChange(value: string) {
    setProcessFilter(value)
    void navigate({ search: (prev: ArsipBrowseSearch) => ({ ...prev, processPage: 1 }) })
  }

  const panelTitle = isGlobalMode
    ? 'Hasil pencarian'
    : processId
      ? (selectedProcess?.nama ?? 'Daftar SOP')
      : 'Daftar SOP'
  const panelSubtitle = isGlobalMode
    ? `Kata kunci: “${q}”`
    : processId
      ? (selectedProcessName ?? 'Dokumen berstatus Berlaku')
      : undefined
  const sopEmptyTitle = isGlobalMode
    ? 'Tidak ada SOP ditemukan'
    : hasSopSearchFilter
      ? 'Tidak ada SOP cocok'
      : 'Tidak ada SOP berlaku'
  const sopEmptyHint = isGlobalMode
    ? 'Coba judul, nomor SOP, nama Process, atau Departemen lain.'
    : hasSopSearchFilter
      ? 'Coba kata kunci lain pada filter di atas.'
      : 'Belum ada dokumen resmi berlaku pada Process ini.'

  const selectedSop = detailSopId
    ? sopItems.find((item) => item.detailSopId === detailSopId)
    : undefined
  const selectedSopContext = selectedSop ? formatSopContext(selectedSop) : selectedProcessName

  const breadcrumbItems = useMemo((): ArsipBreadcrumbItem[] => {
    const items: ArsipBreadcrumbItem[] = [arsipHomeCrumb()]
    if (processId && selectedProcess) {
      items.push({
        label:
          selectedProcess.scope === 'DEPARTMENT' && selectedProcess.departmentName
            ? selectedProcess.departmentName
            : 'Fakultas',
      })
      items.push({
        label: selectedProcess.nama,
        to: ROUTES.ARSIP.PREFIX,
        search: {
          processId,
          sopPage: sopPage > 1 ? String(sopPage) : undefined,
          sopSearch: sopSearchParam || undefined,
        },
      })
    }
    if (detailSopId) items.push({ label: selectedSop?.judul ?? 'Dokumen SOP' })
    return items
  }, [processId, selectedProcess, detailSopId, selectedSop?.judul, sopPage, sopSearchParam])

  const workspaceProps: ArsipBrowseWorkspaceProps = {
    isGlobalMode,
    processId,
    selectedProcessName,
    detailSopId,
    selectedSop,
    selectedSopContext,
    processItems,
    processFilter,
    onProcessFilterChange: handleProcessFilterChange,
    onSelectProcess: handleSelectProcess,
    onChangeProcess: handleChangeProcess,
    processLoading: processQuery.isLoading,
    processError: processQuery.isError,
    processFetching: processQuery.isFetching,
    processPagination,
    processPage,
    onProcessPageChange: handleProcessPageChange,
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
    showSopSearchFilter: Boolean(processId) && !isGlobalMode,
    sopSearch: sopFilterInput,
    onSopSearchChange: handleSopSearchChange,
    onSelectSop: handleSelectSop,
    onClosePreview: handleClosePreview,
    onRefreshPreview: () => void (isGlobalMode ? globalSopQuery.refetch() : sopByProcessQuery.refetch()),
    sopEmptyTitle,
    sopEmptyHint,
  }

  const mobile: ArsipBrowseMobileState = {
    showProcess: !isGlobalMode && !processId && !detailSopId,
    showSopList: (isGlobalMode || Boolean(processId)) && !detailSopId,
    showPreview: Boolean(detailSopId),
    isGlobalMode,
    detailSopId,
  }

  return {
    globalInput,
    setGlobalInput,
    breadcrumbItems,
    showBreadcrumb: Boolean(processId || detailSopId),
    workspaceProps,
    mobile,
    handleSelectProcess,
    handleMobileBackToProcess,
    handleSelectSop,
    handleClosePreview,
    handleProcessPageChange,
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
    processId,
    isGlobalMode,
  }
}
