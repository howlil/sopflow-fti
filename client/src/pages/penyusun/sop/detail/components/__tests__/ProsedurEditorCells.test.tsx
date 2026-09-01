import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  KegiatanCell,
  MutuWaktuCell,
} from '@/pages/penyusun/sop/detail/components/ProsedurEditorCells'

describe('ProsedurEditorCells', () => {
  it('memulai field kegiatan sebagai textarea satu baris yang tetap mendukung multiline', () => {
    const onChange = vi.fn()
    render(<KegiatanCell value="Terima dokumen" onChange={onChange} />)

    const field = screen.getByRole('textbox', { name: 'Kegiatan' })
    expect(field).toHaveAttribute('rows', '1')

    fireEvent.change(field, { target: { value: 'Terima dan verifikasi dokumen' } })
    expect(onChange).toHaveBeenCalledWith('Terima dan verifikasi dokumen')
  })

  it('menampilkan jumlah dan satuan waktu sebagai satu compound control yang tetap fokus terpisah', () => {
    const onChange = vi.fn()
    render(<MutuWaktuCell value="15 m" onChange={onChange} />)

    const group = screen.getByTestId('procedure-time-control')
    const amount = screen.getByRole('spinbutton', { name: 'Jumlah waktu' })
    const unit = screen.getByRole('combobox', { name: 'Satuan waktu' })

    expect(group).toContainElement(amount)
    expect(group).toContainElement(unit)
    expect(amount).toHaveValue(15)
    expect(unit).toHaveValue('m')

    fireEvent.change(amount, { target: { value: '20' } })
    expect(onChange).toHaveBeenCalledWith('20', 'm')

    fireEvent.change(unit, { target: { value: 'h' } })
    expect(onChange).toHaveBeenCalledWith('15', 'h')
  })
})
