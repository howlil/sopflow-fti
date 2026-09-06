import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const clientDir = fileURLToPath(new URL('..', import.meta.url))
const journeyDir = path.join(clientDir, 'e2e', 'journeys')
const mutationTokens = [
  'apiPost(',
  'apiPatch(',
  'apiDelete(',
  'createAuthenticatedApiContext(',
  'createReadySopFixture(',
  'createApprovedSopFixture(',
  'signBeritaAcara(',
  'signAllSop(',
]
const forbiddenImports = [
  '../support/business-preconditions',
  '../support/business-actions',
  '../support/business-audit',
]

const files = fs
  .readdirSync(journeyDir)
  .filter((name) => name.endsWith('.spec.ts'))
  .sort()

const violations = []
if (files.length === 0) {
  violations.push('Tidak ada FTI business journey spec di client/e2e/journeys')
}

for (const file of files) {
  if (!file.startsWith('fti-')) {
    violations.push(`${file}: journey executable harus FTI-native; retire milestone/legacy journey`) 
  }

  const absolute = path.join(journeyDir, file)
  const content = fs.readFileSync(absolute, 'utf8')

  if (!content.includes('test.step(')) {
    violations.push(`${file}: business journey wajib memakai test.step() untuk audit trail`)
  }

  for (const token of mutationTokens) {
    if (content.includes(token)) {
      violations.push(
        `${file}: mutation helper langsung '${token}' dilarang; gunakan FTI precondition helper atau lakukan aksi lewat UI`,
      )
    }
  }

  for (const forbiddenImport of forbiddenImports) {
    if (content.includes(forbiddenImport)) {
      violations.push(`${file}: legacy support import '${forbiddenImport}' harus retired`)
    }
  }
}

if (violations.length > 0) {
  console.error('FTI E2E journey audit FAILED:')
  for (const violation of violations) console.error(` - ${violation}`)
  process.exit(1)
}

console.log(`FTI E2E journey audit passed (${files.length} journeys).`)
for (const file of files) console.log(` - ${file}`)
