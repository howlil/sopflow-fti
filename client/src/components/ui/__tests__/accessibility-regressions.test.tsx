import { useState } from 'react'
import { Eye } from 'lucide-react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SopStatusBadge } from '@/components/status/sop-status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTableActionTd, DataTableActionTh, DataTableHeaderRow, DataTableRoot, DataTableTable, DataTableTh } from '@/components/ui/data-table'
import { RowActions } from '@/components/data/row-actions'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { OptionCardPicker } from '@/components/ui/option-card-picker'
import { Pagination } from '@/components/ui/pagination'
import { LoadingState } from '@/components/ui/loading-state'
import { Toast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

describe('regresi aksesibilitas komponen UI', () => {
  it('menggunakan warna primer yang kontras untuk tombol utama', () => {
    render(<Button>Simpan</Button>)
    const button = screen.getByRole('button', { name: 'Simpan' })
    expect(button).toHaveClass('bg-primary', 'text-white', 'hover:bg-primary-hover')
    expect(button).toHaveAttribute('data-button-appearance', 'solid')
    expect(button).not.toHaveClass('bg-blue-500')
  })

  it('menjaga label putih pada varian tombol solid', () => {
    const { rerender } = render(<Button>Tambah</Button>)
    expect(screen.getByRole('button', { name: 'Tambah' })).toHaveClass('text-white')
    rerender(<Button variant="destructive">Hapus</Button>)
    expect(screen.getByRole('button', { name: 'Hapus' })).toHaveClass('text-white')
    rerender(<Button variant="outline">Batal</Button>)
    expect(screen.getByRole('button', { name: 'Batal' })).toHaveAttribute('data-button-appearance', 'non-solid')
  })

  it('memberi batas kontrol netral yang terlihat jelas pada input', () => {
    render(<Input aria-label="Nama" />)
    expect(screen.getByRole('textbox', { name: 'Nama' })).toHaveClass('rounded-control', 'border-border', 'bg-surface', 'focus:ring-primary')
  })

  it('mempertahankan ukuran badge dan status panjang yang terbaca', () => {
    render(<><Badge variant="default">Aktif</Badge><SopStatusBadge status="DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI" label="Menunggu pengesahan Kepala OPD" showDomain={false} /></>)
    expect(screen.getByText('Aktif')).toHaveClass('min-h-6', 'text-primary-hover')
    expect(screen.getByText('Menunggu pengesahan Kepala OPD')).toHaveClass('whitespace-nowrap', 'rounded-full')
  })

  it('menggunakan peran visual semantik pada kartu dan tabel', () => {
    render(<Card>Ringkasan</Card>)
    expect(screen.getByText('Ringkasan')).toHaveClass('rounded-surface', 'border', 'border-border', 'bg-surface')
    render(<DataTableRoot aria-label="Daftar pengguna"><DataTableTable><thead><DataTableHeaderRow><DataTableTh align="right">Jumlah</DataTableTh><DataTableActionTh>Aksi</DataTableActionTh></DataTableHeaderRow></thead><tbody><tr><DataTableActionTd><RowActions actions={[{ icon: Eye, title: 'Lihat detail', onClick: vi.fn() }]} /></DataTableActionTd></tr></tbody></DataTableTable></DataTableRoot>)
    expect(screen.getByRole('region', { name: 'Daftar pengguna' })).toHaveClass('overscroll-x-contain')
    expect(screen.getByRole('columnheader', { name: 'Jumlah' })).toHaveClass('whitespace-nowrap', 'text-right')
    expect(screen.getByRole('button', { name: 'Lihat detail' })).not.toHaveClass('border')
  })

  it('mengumumkan loading, feedback, dan error input secara eksplisit', () => {
    const { rerender } = render(<LoadingState message="Memuat daftar SOP…" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    rerender(<Toast type="info" message="Data sedang disinkronkan" />)
    expect(screen.getByRole('status')).toHaveClass('bg-info-subtle')
    rerender(<Input aria-label="Email" errorMessage="Email wajib diisi" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Email wajib diisi')
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('menghubungkan FormField, pilihan kartu, dan pagination ke kontrolnya', () => {
    render(<FormField label="Nomor SOP" required><Input /></FormField>)
    expect(screen.getByRole('textbox', { name: /Nomor SOP/ })).toHaveAttribute('aria-required', 'true')
    const onChange = vi.fn()
    render(<OptionCardPicker label="Hasil" options={[{ value: 'sesuai', label: 'Sesuai' }, { value: 'perbaikan', label: 'Perlu perbaikan' }]} value="sesuai" onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Perlu perbaikan' }))
    expect(onChange).toHaveBeenCalledWith('perbaikan')
    const onPageChange = vi.fn()
    render(<Pagination totalItems={40} currentPage={2} pageSize={10} onPageChange={onPageChange} label="SOP" />)
    expect(screen.getByText('Halaman 2 dari 4')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByRole('button', { name: 'Selanjutnya' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('mendukung navigasi keyboard pada pilihan kartu', () => {
    function PickerHarness() {
      const [value, setValue] = useState('sesuai')
      return <OptionCardPicker label="Hasil" options={[{ value: 'sesuai', label: 'Sesuai' }, { value: 'perbaikan', label: 'Perlu perbaikan' }]} value={value} onChange={setValue} />
    }
    render(<PickerHarness />)
    const first = screen.getByRole('radio', { name: 'Sesuai' })
    const second = screen.getByRole('radio', { name: 'Perlu perbaikan' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(second).toHaveFocus()
    expect(second).toHaveAttribute('aria-checked', 'true')
  })

  it('menyediakan tombol tutup dialog', () => {
    render(<Dialog open><DialogContent><DialogTitle>Konfirmasi</DialogTitle><DialogDescription>Periksa data sebelum melanjutkan.</DialogDescription></DialogContent></Dialog>)
    expect(screen.getByRole('dialog', { name: 'Konfirmasi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tutup dialog' })).toBeInTheDocument()
  })
})
