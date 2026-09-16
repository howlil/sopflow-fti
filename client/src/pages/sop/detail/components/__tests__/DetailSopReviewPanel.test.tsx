import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const decideReview = vi.fn()

vi.mock('@/api/pemeriksaan-proses-bisnis', () => ({
  pemeriksaanProsesBisnisApi: {
    decide: (...args: unknown[]) => decideReview(...args),
  },
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

import { DetailSopReviewPanel } from '../DetailSopReviewPanel'

describe('DetailSopReviewPanel', () => {
  it('requires a comment for revision and sends it with the decision', async () => {
    decideReview.mockResolvedValue({ detail: { status: 'REVISION_REQUIRED' } })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <DetailSopReviewPanel detailSopId="detail-1" canReview />
      </QueryClientProvider>,
    )

    const revisionButton = screen.getByRole('button', { name: 'Kembalikan untuk perbaikan' })
    expect(revisionButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/Catatan pemeriksaan SOP/), {
      target: { value: 'Lengkapi keluaran langkah 2.' },
    })
    fireEvent.click(revisionButton)
    fireEvent.click(screen.getByRole('button', { name: 'Kirim permintaan perbaikan' }))

    await waitFor(() => {
      expect(decideReview).toHaveBeenCalledWith(
        'detail-1',
        'REVISION',
        'Lengkapi keluaran langkah 2.',
      )
    })
  })
})
