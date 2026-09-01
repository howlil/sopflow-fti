import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ValidasiPdfPage } from '../ValidasiPdfPage'

const mocks = vi.hoisted(() => ({
  verifyPdf: vi.fn(),
}))

vi.mock('@/api/tte', () => ({
  tteApi: {
    verifyPdf: mocks.verifyPdf,
  },
  usePdfSigningStatus: () => ({
    isLoading: false,
    isSuccess: true,
    data: {
      enabled: true,
      trustedCaSubject: 'CN=SOPFlow Root CA,O=Biro Organisasi',
      trustedSignerSubject: null,
      verificationPath: 'certificate-chain',
    },
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
}))

function makePdf(name: string) {
  const file = new File(['pdf'], name, { type: 'application/pdf' })
  Object.defineProperty(file, 'arrayBuffer', {
    value: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
  })
  return file
}

const matchedResult = {
  pdfSigningEnabled: true,
  trustedCaSubject: 'CN=SOPFlow Root CA,O=Biro Organisasi',
  hasSignatures: true,
  allValid: true,
  disclaimer: 'Verifikasi signature PDF.',
  signatures: [
    {
      index: 0,
      valid: true,
      reason: 'valid',
      signatureValue: 'signature',
      signerSubject: 'CN=Hendra Wijaya,O=Dinas Kesehatan Provinsi',
      signerIssuer: 'CN=SOPFlow Root CA,O=Biro Organisasi',
      signedAt: '2026-08-14T00:00:00.000Z',
      binding: {
        dokumenTteId: 'dokumen-1',
        userId: 'user-1',
        jenisDokumen: 'SOP_BERLAKU',
      },
      certificate: {
        validFrom: '2026-01-01T00:00:00.000Z',
        validTo: '2027-01-01T00:00:00.000Z',
        fingerprint: 'fingerprint',
        serialNumber: 'serial',
      },
      checks: {
        digestMatch: true,
        chainTrusted: true,
        certificatePeriodValid: true,
      },
      tteMatch: {
        matched: true,
        reason: 'matched',
        ditandatanganiPada: '2026-08-14T00:00:00.000Z',
      },
    },
  ],
}

describe('ValidasiPdfPage', () => {
  beforeEach(() => {
    mocks.verifyPdf.mockReset()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('shows a local PDF preview after a file is selected', () => {
    const { container } = render(<ValidasiPdfPage />)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()

    const file = makePdf('SOP-1231-v1.pdf')
    fireEvent.change(input!, { target: { files: [file] } })

    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(screen.getByTitle('Pratinjau PDF SOP-1231-v1.pdf')).toHaveAttribute(
      'src',
      'blob:preview',
    )
  })

  it('revokes the previous object URL when the selected file changes', async () => {
    const createObjectURL = vi
      .fn()
      .mockReturnValueOnce('blob:preview-1')
      .mockReturnValueOnce('blob:preview-2')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    })

    const { container } = render(<ValidasiPdfPage />)
    const initialInput = container.querySelector<HTMLInputElement>('input[type="file"]')!

    fireEvent.change(initialInput, { target: { files: [makePdf('first.pdf')] } })

    const replacementInput = screen.getByLabelText<HTMLInputElement>('Ganti PDF')
    fireEvent.change(replacementInput, { target: { files: [makePdf('second.pdf')] } })

    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1'),
    )
  })

  it('keeps verification working without duplicating the matched success heading', async () => {
    mocks.verifyPdf.mockResolvedValue(matchedResult)
    const { container } = render(<ValidasiPdfPage />)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!

    fireEvent.change(input, { target: { files: [makePdf('signed.pdf')] } })
    fireEvent.click(screen.getByRole('button', { name: 'Verifikasi tanda tangan' }))

    await waitFor(() => expect(mocks.verifyPdf).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(screen.getAllByText('TTE ini sudah cocok dengan signature PDF')).toHaveLength(1),
    )
  })
})
