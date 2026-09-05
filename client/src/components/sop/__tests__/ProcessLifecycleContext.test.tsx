import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProcessLifecycleContext } from '../ProcessLifecycleContext'

describe('ProcessLifecycleContext', () => {
  it('answers the current stage, responsibility, and blocking reason compactly', () => {
    render(
      <ProcessLifecycleContext
        processName="Pengelolaan Akademik"
        lifecycle={{
          stage: 'FINAL_APPROVAL',
          stateLabel: 'Menunggu persetujuan akhir',
          responsibility: { type: 'DEAN', name: 'Dekan FTI' },
          action: null,
          blockingReason: 'Menunggu persetujuan akhir Dekan FTI.',
        }}
      />,
    )

    expect(screen.getByTestId('process-lifecycle-context')).toBeInTheDocument()
    expect(screen.getByText('Pengelolaan Akademik')).toBeInTheDocument()
    expect(screen.getByText('Menunggu persetujuan akhir')).toBeInTheDocument()
    expect(screen.getByText('Dekan FTI')).toBeInTheDocument()
    expect(screen.getAllByText('Menunggu persetujuan akhir Dekan FTI.')).toHaveLength(1)
  })
})
