import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExpandableGroupedTable } from '@/components/data/expandable-grouped-table'

describe('ExpandableGroupedTable', () => {
  it('dapat menyatu ke outer data surface tanpa card per group', () => {
    render(
      <ExpandableGroupedTable
        groups={[{ id: 'opd-1', name: 'Dinas A' }]}
        getGroupId={(group) => group.id}
        renderGroupTitle={(group) => group.name}
        renderRows={() => <div>Rows</div>}
        surfaceMode="embedded"
      />,
    )

    const group = screen.getByRole('button', { name: /Dinas A/ }).parentElement
    expect(group).not.toHaveClass('rounded-surface', 'border', 'shadow-surface')
    expect(screen.getByText('Rows')).toBeInTheDocument()
  })
})
