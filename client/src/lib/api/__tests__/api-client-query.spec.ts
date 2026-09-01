import { describe, expect, it } from 'vitest'
import { buildQueryString } from '../api-client'

describe('buildQueryString', () => {
  it('serializes scalar query values', () => {
    expect(buildQueryString({ page: 1, search: 'abc' })).toBe('?page=1&search=abc')
  })

  it('serializes array values as repeated query parameters', () => {
    expect(buildQueryString({ statusIn: ['A', 'B'] })).toBe('?statusIn=A&statusIn=B')
  })

  it('skips undefined, null, and empty arrays', () => {
    expect(buildQueryString({ search: undefined, optional: null, statusIn: [] })).toBe('')
  })
})
