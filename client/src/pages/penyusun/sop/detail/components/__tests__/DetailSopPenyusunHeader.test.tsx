import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SOPDetailMetadata } from '@/types/ui/sop'

const retryAutosave = vi.fn()
const onBuatVersiBaru = vi.fn()
const decideReview = vi.fn()
let workbenchData: Record<string, unknown> | null = null

vi.mock('@/api/sop', () => ({
  usePenyusunWorkbench: () => ({ data: workbenchData, isLoading: false }),
}))

vi.mock('@/api/pemeriksaan-proses-bisnis', () => ({
  pemeriksaanProsesBisnisApi: {
    submit: vi.fn(),
    decide: (...args: unknown[]) => decideReview(...args),
  },
}))

vi.mock('@/pages/penyusun/sop/detail/SopEditorContext', () => ({
  useSopEditor: () => ({
    sopDetailId: 'detail-1',
    flushHeaderAutosave: vi.fn(),
    flushProsedurAutosave: vi.fn(),
  }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

vi.mock('@/lib/print/pengajuan-print', () => ({
  printSopArsipFromPreviewProps: vi.fn(),
}))

vi.mock('@/lib/sop/detailSop.mappers', () => ({
  mapPenyusunWorkbenchToPreviewProps: vi.fn(),
}))

import { DetailSOPPenyusunHeader } from '@/pages/penyusun/sop/detail/components/DetailSopPenyusunHeader'

function renderHeader(
  overrides: Partial<React.ComponentProps<typeof DetailSOPPenyusunHeader>> = {},
) {
  const props: React.ComponentProps<typeof DetailSOPPenyusunHeader> = {
    metadata: {
      nama: 'SOP Pelayanan Administrasi',
      version: 2,
    } as SOPDetailMetadata,
    currentSopStatus: 'DRAFT',
    currentSopStatusLabel: 'Draft',
    autosaveStatus: 'saved',
    onRetryAutosave: retryAutosave,
    isReadOnly: false,
    canBuatVersiBaru: false,
    onBuatVersiBaru,
    ...overrides,
  }
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <DetailSOPPenyusunHeader {...props} />
    </QueryClientProvider>,
  )
}

describe('DetailSOPPenyusunHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    workbenchData = null
  })

  it('menjadikan identitas SOP sebagai fokus command bar', () => {
    renderHeader()

    expect(screen.getByText('SOP Pelayanan Administrasi')).toBeInTheDocument()
    expect(screen.getByText('v2')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Selesai' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Tersimpan')
    expect(screen.queryByText('Dokumen SOP')).not.toBeInTheDocument()
  })

  it('mempertahankan retry autosave saat penyimpanan gagal', () => {
    renderHeader({ autosaveStatus: 'error' })

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(retryAutosave).toHaveBeenCalledTimes(1)
  })

  it('menaruh aksi dokumen sekunder di menu yang sama', async () => {
    renderHeader({
      currentSopStatus: 'EFFECTIVE',
      currentSopStatusLabel: 'Berlaku',
      canBuatVersiBaru: true,
      onBuatVersiBaru,
    })

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Aksi dokumen lainnya' }), {
      button: 0,
      ctrlKey: false,
    })

    expect(await screen.findByText('Cetak PDF')).toBeInTheDocument()
    expect(screen.getByText('Buat versi baru')).toBeInTheDocument()
  })

  it('mewajibkan catatan revisi dan mengirimkannya sebagai bukti evaluasi', async () => {
    workbenchData = {
      detail: { sop: { prosesBisnisId: 'process-1' } },
      siklus: {
        stage: 'PROCESS_REVIEW',
        stateLabel: 'Menunggu review',
        responsibility: { type: 'CURRENT_USER', name: 'Owner' },
      },
    }
    decideReview.mockResolvedValue(workbenchData)
    renderHeader({ isReadOnly: true, currentSopStatus: 'PROCESS_REVIEW' })

    fireEvent.click(screen.getByRole('button', { name: 'Minta revisi' }))
    const confirm = screen.getByRole('button', { name: 'Kirim permintaan revisi' })
    expect(confirm).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/Catatan evaluasi/), {
      target: { value: 'Lengkapi keluaran langkah 2.' },
    })
    fireEvent.click(confirm)

    await waitFor(() => {
      expect(decideReview).toHaveBeenCalledWith(
        'detail-1',
        'REVISION',
        'Lengkapi keluaran langkah 2.',
      )
    })
  })
})
