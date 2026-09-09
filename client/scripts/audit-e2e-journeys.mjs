import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const clientDir = fileURLToPath(new URL('..', import.meta.url))
const journeyDir = path.join(clientDir, 'e2e', 'journeys')
const useCasePath = path.join(clientDir, 'e2e', 'use-cases.json')
const useCases = JSON.parse(fs.readFileSync(useCasePath, 'utf8'))

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
const forbiddenLegacyTokens = [
  /\bPJ_PENYUSUN\b/,
  /\bPJ_EVALUATOR\b/,
  /\bKEPALA_OPD\b/,
  /\bopdId\b/,
  /\bperan\s*:\s*['"](?:PENYUSUN|EVALUATOR|PJ_PENYUSUN|PJ_EVALUATOR|KEPALA_OPD)['"]/,
]

const files = fs
  .readdirSync(journeyDir)
  .filter((name) => name.endsWith('.spec.ts'))
  .sort()

const violations = []
const owners = new Map()

if (files.length === 0) {
  violations.push('Tidak ada FTI business journey spec di client/e2e/journeys')
}

for (const [useCaseId, useCase] of Object.entries(useCases)) {
  if (!/^UC\d{2}$/.test(useCaseId)) {
    violations.push(`${useCaseId}: use case id harus memakai format UC01, UC02, ...`)
  }

  for (const field of ['name', 'actor', 'goal', 'outcome']) {
    if (typeof useCase[field] !== 'string' || useCase[field].trim() === '') {
      violations.push(`${useCaseId}: field '${field}' wajib diisi`)
    }
  }

  if (!Array.isArray(useCase.specs) || useCase.specs.length === 0) {
    violations.push(`${useCaseId}: minimal memiliki satu executable spec`)
    continue
  }

  for (const spec of useCase.specs) {
    if (!files.includes(spec)) {
      violations.push(`${useCaseId}: spec '${spec}' tidak ditemukan di e2e/journeys`)
      continue
    }

    if (owners.has(spec)) {
      violations.push(`${spec}: dimiliki lebih dari satu use case (${owners.get(spec)}, ${useCaseId})`)
    } else {
      owners.set(spec, useCaseId)
    }
  }
}

for (const file of files) {
  if (!file.startsWith('fti-')) {
    violations.push(`${file}: executable journey harus FTI-native`)
  }

  if (!owners.has(file)) {
    violations.push(`${file}: orphan E2E spec; setiap spec wajib dimiliki tepat satu business use case`)
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
      violations.push(`${file}: retired support import '${forbiddenImport}' harus dihapus`)
    }
  }

  for (const legacyPattern of forbiddenLegacyTokens) {
    if (legacyPattern.test(content)) {
      violations.push(`${file}: mengandung executable legacy workflow vocabulary ${legacyPattern}`)
    }
  }
}

if (violations.length > 0) {
  console.error('FTI use-case E2E audit FAILED:')
  for (const violation of violations) console.error(` - ${violation}`)
  process.exit(1)
}

console.log(`FTI use-case E2E audit passed (${Object.keys(useCases).length} use cases, ${files.length} specs).`)
for (const [useCaseId, useCase] of Object.entries(useCases)) {
  console.log(` - ${useCaseId}: ${useCase.name}`)
  for (const spec of useCase.specs) console.log(`   - ${spec}`)
}
