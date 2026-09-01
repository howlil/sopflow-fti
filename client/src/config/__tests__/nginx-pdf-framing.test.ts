import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const nginx = readFileSync(resolve(process.cwd(), 'nginx.conf'), 'utf8')

describe('nginx PDF framing policy', () => {
  it('keeps global frame denial and allows same-origin framing only for public PDF', () => {
    expect(nginx).toContain('add_header X-Frame-Options "DENY" always;')
    expect(nginx).toContain("frame-ancestors 'none'")
    expect(nginx).toContain('location /api/v1/sop/public/pdf/')
    expect(nginx).toContain('proxy_pass http://backend:3001/api/v1/sop/public/pdf/;')
    expect(nginx).toContain('add_header X-Frame-Options "SAMEORIGIN" always;')
    expect(nginx).toContain("frame-ancestors 'self'")
  })
})
