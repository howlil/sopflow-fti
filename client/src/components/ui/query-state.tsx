import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'

interface QueryStateProps {
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
  loading?: ReactNode
  errorTitle?: string
  errorDescription?: string
  children: ReactNode
}

/**
 * Boundary untuk state jaringan yang tidak boleh jatuh menjadi empty state.
 * Empty state tetap dimiliki oleh surface karena konteks pencarian/filter berbeda.
 */
export function QueryState({
  isLoading,
  isError,
  onRetry,
  loading,
  errorTitle = 'Data tidak dapat dimuat',
  errorDescription = 'Periksa koneksi Anda lalu coba lagi.',
  children,
}: QueryStateProps) {
  if (isLoading) {
    return loading ?? <LoadingState />
  }

  if (isError) {
    return (
      <div role="alert" className="flex min-h-32 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-medium text-foreground">{errorTitle}</p>
        <p className="max-w-sm text-sm leading-5 text-muted-foreground">{errorDescription}</p>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" className="mt-1 gap-1.5" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Coba lagi
          </Button>
        ) : null}
      </div>
    )
  }

  return children
}
