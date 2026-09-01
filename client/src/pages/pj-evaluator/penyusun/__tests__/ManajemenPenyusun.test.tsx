import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ManajemenPenyusun } from '../ManajemenPenyusun'

vi.mock('@/hooks/use-debounced-value', () => ({
  useDebouncedValue: (value: string) => value,
}))

vi.mock('@/api/opd', () => ({
  useOpd: () => ({
    list: [{ id: 'opd-1', nama: 'Dinas Kesehatan Provinsi' }],
  }),
}))

vi.mock('@/api/penyusun', () => ({
  usePenyusun: () => ({
    grup: [
      {
        opdId: 'opd-1',
        namaOpd: 'Dinas Kesehatan Provinsi',
        penyusun: [
          {
            id: 'penyusun-1',
            nama: 'Budi Santoso, A.Md.Kep',
            nip: '198501012009011004',
            jabatan: 'Analis SOP Dinkes',
            pangkat: 'Penata',
            email: 'penyusun.dinkes@gmail.com',
            nohp: '6281234567894',
            peran: 'PENYUSUN',
            status: 'AKTIF',
          },
        ],
      },
    ],
    isLoading: false,
    tambah: vi.fn(),
    update: vi.fn(),
    pindah: vi.fn(),
    hapusPermanen: vi.fn(),
    isAdding: false,
    isUpdating: false,
    isPindah: false,
    isDeletingPermanent: false,
  }),
}))

vi.mock('@/components/layout/ListPageLayout', () => ({
  ListPageLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))

vi.mock('../components/PenyusunFormDialog', () => ({
  PenyusunFormDialog: () => null,
}))

vi.mock('../components/RiwayatOpdPenyusunDialog', () => ({
  RiwayatOpdPenyusunDialog: () => null,
}))

describe('ManajemenPenyusun', () => {
  it('groups identity and contact metadata into a compact five-column row', async () => {
    render(<ManajemenPenyusun />)

    expect(await screen.findByRole('columnheader', { name: 'Penyusun' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Jabatan' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Kontak' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Aksi' })).toBeInTheDocument()

    expect(screen.queryByRole('columnheader', { name: 'NIP' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Email' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'No. HP' })).not.toBeInTheDocument()

    expect(screen.getByText('Budi Santoso, A.Md.Kep')).toBeInTheDocument()
    expect(screen.getByText('198501012009011004')).toBeInTheDocument()
    expect(screen.getByText('penyusun.dinkes@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('6281234567894')).toBeInTheDocument()
  })
})
