import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const clientDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const serverDir = resolve(clientDir, '..', 'server')
const useCases = JSON.parse(readFileSync(resolve(clientDir, 'e2e/use-cases.json'), 'utf8'))
const useCaseIds = Object.keys(useCases).sort()
const useCaseIdSet = new Set(useCaseIds)

function selectedUseCases() {
  const args = process.argv.slice(2)
  const envSelection = (process.env.E2E_USE_CASES ?? '')
    .split(/[\s,]+/)
    .filter(Boolean)

  if (args.includes('--all')) return useCaseIds

  const requested = [...args, ...envSelection]
    .flatMap((value) => value.split(/[\s,]+/))
    .filter(Boolean)
    .map((value) => value.toUpperCase())

  if (requested.length === 0) {
    console.error('Use-case E2E membutuhkan UC id yang eksplisit.')
    console.error(`Pilihan: ${useCaseIds.join(', ')}`)
    console.error('Contoh: pnpm test:e2e:usecase -- UC02 UC03')
    console.error('Gunakan --all hanya untuk qualification manual seluruh use case.')
    process.exit(1)
  }

  const invalid = requested.filter((id) => !useCaseIdSet.has(id))
  if (invalid.length > 0) {
    console.error(`Unknown E2E use case: ${invalid.join(', ')}`)
    process.exit(1)
  }

  return [...new Set(requested)]
}

function run(command, args, cwd, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...extraEnv },
    shell: process.platform === 'win32',
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function assertDisposableDatabase() {
  const identity = `${process.env.DATABASE_NAME ?? ''} ${process.env.DATABASE_URL ?? ''}`
  if (!/(^|[^a-z])(test|ci_e2e)([^a-z]|$)/i.test(identity)) {
    console.error(
      'Use-case E2E menolak reset database karena DATABASE_NAME/DATABASE_URL tidak terlihat sebagai database test.',
    )
    console.error('Gunakan database disposable yang namanya mengandung "test" atau "ci_e2e".')
    process.exit(1)
  }
}

const selected = selectedUseCases()

assertDisposableDatabase()
run(process.execPath, ['scripts/audit-e2e-journeys.mjs'], clientDir)

for (const useCaseId of selected) {
  const useCase = useCases[useCaseId]
  console.log(`\n=== ${useCaseId} — ${useCase.name} ===`)
  console.log(`Actor: ${useCase.actor}`)
  console.log(`Outcome: ${useCase.outcome}`)

  for (const spec of useCase.specs) {
    console.log(`\n--- ${useCaseId}: reset disposable database for ${spec} ---`)
    run('pnpm', ['prisma', 'migrate', 'reset', '--force'], serverDir)
    run('pnpm', ['db:seed:e2e'], serverDir)

    console.log(`--- ${useCaseId}: execute ${spec} ---`)
    run(
      process.execPath,
      ['scripts/run-e2e.mjs', `journeys/${spec}`, '--project=chromium'],
      clientDir,
      {
        E2E_SEED: 'false',
        E2E_SKIP_LOGIN_PREFLIGHT: 'true',
        E2E_TEST_RUN_ID: `${useCaseId}-${Date.now()}`,
      },
    )
  }
}
