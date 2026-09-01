import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const editor = vi.hoisted(() => ({
  metadata: {
    nama: 'SOP Uji',
    judul: 'SOP Uji',
    nomorSOP: '001/SOP/2026',
    institutionLines: ['Pemprov Sumbar', 'Sekretariat Daerah'],
    lawBasis: ['PermenPANRB 35/2012'],
    lawBasisIds: ['law-1'],
    relatedSop: ['SOP Surat Masuk'],
    relatedSopDetailIds: ['sop-2'],
    warning: ['Periksa kelengkapan'],
    implementQualification: ['Memahami administrasi'],
    equipment: ['Komputer'],
    recordData: ['Buku agenda'],
  },
  handleMetadataChange: vi.fn(),
  implementers: [{ id: 'impl-1', name: 'Staf' }],
  setImplementers: vi.fn(),
  isReadOnly: false,
}))

vi.mock('@/pages/penyusun/sop/detail/SopEditorContext', () => ({
  useSopEditor: () => editor,
}))

import { SOPHeaderSection } from '@/pages/penyusun/sop/detail/components/SOPHeaderSection'

const openLaw = vi.fn()
const openRelated = vi.fn()
const openImplementer = vi.fn()

function renderSection() {
  return render(
    <SOPHeaderSection
      onOpenLawBasisDialog={openLaw}
      onOpenRelatedPosDialog={openRelated}
      onOpenPelaksanaDialog={openImplementer}
    />,
  )
}

describe('SOPHeaderSection property inspector', () => {
  beforeEach(() => {
    editor.isReadOnly = false
    vi.clearAllMocks()
  })

  it('menampilkan semua kelompok metadata sebagai bagian inspector', () => {
    renderSection()

    for (const heading of [
      'Identitas lembaga',
      'Identitas SOP',
      'Dasar hukum',
      'Keterkaitan dengan SOP',
      'Peringatan',
      'Kualifikasi pelaksanaan',
      'Peralatan dan perlengkapan',
      'Pencatatan dan pendataan',
      'Aktor pelaksana',
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }

    expect(screen.getByDisplayValue('SOP Uji')).toBeInTheDocument()
    expect(screen.getByDisplayValue('001/SOP/2026')).toBeInTheDocument()
    expect(screen.getByText(/PermenPANRB 35\/2012/)).toBeInTheDocument()
    expect(screen.getByText(/SOP Surat Masuk/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tambah dasar hukum' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tambah keterkaitan SOP' })).toBeInTheDocument()
  })

  it('menampilkan nilai sebagai informasi tanpa add controls ketika read-only', () => {
    editor.isReadOnly = true
    renderSection()

    expect(screen.getByText('SOP Uji')).toBeInTheDocument()
    expect(screen.getByText('001/SOP/2026')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tambah dasar hukum' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tambah keterkaitan SOP' })).not.toBeInTheDocument()
  })
})
