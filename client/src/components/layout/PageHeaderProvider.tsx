import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { BreadcrumbItem } from '@/components/ui/breadcrumb'

/**
 * Metadata halaman yang dibutuhkan global authenticated shell.
 * Business actions, descriptions, dan local navigation dimiliki page content.
 */
export interface PageHeaderContent {
  breadcrumb: BreadcrumbItem[]
  title: string
}

interface PageHeaderContextValue {
  headerContent: PageHeaderContent | null
  setHeaderContent: (content: PageHeaderContent | null) => void
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null)

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [headerContent, setHeaderContent] = useState<PageHeaderContent | null>(null)
  const stableSetter = useCallback((content: PageHeaderContent | null) => {
    setHeaderContent(content)
  }, [])
  const value = useMemo(
    () => ({ headerContent, setHeaderContent: stableSetter }),
    [headerContent, stableSetter],
  )

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  )
}

export function usePageHeaderContext() {
  return useContext(PageHeaderContext)
}

export interface SetPageHeaderProps {
  /** Item breadcrumb (urutan: parent → current). Item terakhir = halaman saat ini. */
  breadcrumb: BreadcrumbItem[]
  /** Judul semantik halaman; HeaderBar merendernya sebagai satu h1 sr-only. */
  title: string
}

/**
 * Mengirim metadata navigation context ke global shell tanpa merender UI lokal.
 */
export function SetPageHeader({ breadcrumb, title }: SetPageHeaderProps) {
  const ctx = usePageHeaderContext()
  const propsRef = useRef({ breadcrumb, title })
  propsRef.current = { breadcrumb, title }

  const breadcrumbKey = JSON.stringify(breadcrumb)
  const setHeader = ctx?.setHeaderContent
  const setHeaderRef = useRef(setHeader)
  setHeaderRef.current = setHeader

  useEffect(() => {
    if (!setHeaderRef.current) return
    setHeaderRef.current(propsRef.current)
    return () => {
      setHeaderRef.current?.(null)
    }
  }, [breadcrumbKey, title])

  return null
}
