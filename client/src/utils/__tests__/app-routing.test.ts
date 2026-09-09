import { describe, expect, it } from 'vitest'
import { resolvePostLoginPath } from '@/utils/app-routing'

describe('resolvePostLoginPath', () => {
  it('uses the neutral capability home when no destination was requested', () => {
    expect(resolvePostLoginPath(undefined)).toBe('/work')
  })

  it('preserves a safe requested in-app destination', () => {
    expect(resolvePostLoginPath('/persetujuan?tab=tte')).toBe('/persetujuan?tab=tte')
  })

  it('rejects an external redirect and returns the neutral home', () => {
    expect(resolvePostLoginPath('https://example.test/steal')).toBe('/work')
  })
})
