import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const clientDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const serverDir = resolve(clientDir, '..', 'server')
const allJourneyIds = Array.from({ length: 38 }, (_, index) => `J${String(index + 1).padStart(2, '0')}`)
const allJourneyIdSet = new Set(allJourneyIds)

function selectedJourneyIds() {
  const args = process.argv.slice(2)
  const envSelection = (process.env.E2E_CRITICAL_JOURNEYS ?? '')
    .split(/[\s,]+/)
    .filter(Boolean)

  if (args.includes('--all')) return allJourneyIds

  const requested = [...args, ...envSelection]
    .flatMap((value) => value.split(/[\s,]+/))
    .filter(Boolean)
    .map((value) => value.toUpperCase())

  if (requested.length === 0) {
    console.error('Critical E2E requires an explicit risk-selected journey list.')
    console.error('Example: pnpm test:e2e:critical -- J35 J36 J37 J38')
    console.error('Use --all only for an intentional full-suite qualification.')
    process.exit(1)
  }

  const invalid = requested.filter((journeyId) => !allJourneyIdSet.has(journeyId))
  if (invalid.length > 0) {
    console.error(`Unknown critical journey id(s): ${invalid.join(', ')}`)
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
      'Critical E2E menolak reset database karena DATABASE_NAME/DATABASE_URL tidak terlihat sebagai database test.',
    )
    console.error('Gunakan database disposable yang namanya mengandung "test" atau "ci_e2e".')
    process.exit(1)
  }
}

const journeyIds = selectedJourneyIds()

assertDisposableDatabase()
run(process.execPath, ['scripts/audit-e2e-journeys.mjs'], clientDir)

console.log(`Critical E2E selection: ${journeyIds.join(', ')}`)

for (const journeyId of journeyIds) {
  console.log(`\n=== ${journeyId}: reset disposable database from migrations ===`)
  run('pnpm', ['prisma', 'migrate', 'reset', '--force'], serverDir)
  run('pnpm', ['db:seed:e2e'], serverDir)

  console.log(`=== ${journeyId}: execute isolated journey ===`)
  run(
    process.execPath,
    ['scripts/run-e2e.mjs', 'journeys', '--grep', `${journeyId}\\b`, '--project=chromium'],
    clientDir,
    {
      E2E_SEED: 'false',
      E2E_SKIP_LOGIN_PREFLIGHT: 'true',
      E2E_TEST_RUN_ID: `${journeyId}-${Date.now()}`,
    },
  )
}
