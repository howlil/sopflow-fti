import {
  expect,
  request as playwrightRequest,
  test as base,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from '@playwright/test'

import { apiBaseURL } from '../support/api'
import type { E2eUser } from './users'

const browserApiBaseURL =
  process.env.E2E_BROWSER_API_BASE_URL ?? apiBaseURL.replace('127.0.0.1', 'localhost')

type BrowserStorageState = Awaited<ReturnType<APIRequestContext['storageState']>>

interface RoleAuthBundle {
  api: APIRequestContext
  browserStorageState: BrowserStorageState
}

export interface RoleSession {
  user: E2eUser
  context: BrowserContext
  page: Page
  /** Shared worker API context khusus setup/post-condition audit. */
  api: APIRequestContext
  runtimeErrors: string[]
}

export type RoleSessionFactory = (user: E2eUser) => Promise<RoleSession>
export type RoleApiFactory = (user: E2eUser) => Promise<APIRequestContext>
type RoleStorageStateFactory = (user: E2eUser) => Promise<BrowserStorageState>
type RoleAuthFactory = (user: E2eUser) => Promise<RoleAuthBundle>

interface BusinessTestFixtures {
  roleSession: RoleSessionFactory
  /** Browser tanpa cookie/localStorage untuk mengaudit permukaan publik. */
  publicPage: Page
}

interface BusinessWorkerFixtures {
  roleAuth: RoleAuthFactory
  roleApi: RoleApiFactory
  roleStorageState: RoleStorageStateFactory
}

function identityKey(user: E2eUser): string {
  return user.email.trim().toLowerCase()
}

/**
 * Fixture khusus business-journey.
 *
 * Satu login dibuat per identity per worker. Browser memakai storage state asli dari
 * host login, sedangkan API precondition/audit memakai Cookie header dari respons
 * login yang sama. Identity key sengaja memakai email, bukan legacy role, karena
 * beberapa identity FTI dapat memiliki role akun yang sama tetapi Process/authority
 * capability yang berbeda.
 */
export const test = base.extend<BusinessTestFixtures, BusinessWorkerFixtures>({
  roleAuth: [
    async ({}, use) => {
      const bundles = new Map<string, RoleAuthBundle>()

      await use(async (user) => {
        const key = identityKey(user)
        const existing = bundles.get(key)
        if (existing) return existing

        const authContext = await playwrightRequest.newContext({ baseURL: browserApiBaseURL })
        try {
          const login = await authContext.post(`${browserApiBaseURL}/auth/login`, {
            data: {
              email: user.email,
              password: user.password,
            },
          })
          if (!login.ok()) {
            const body = await login.text().catch(() => '')
            throw new Error(
              `Precondition auth ${user.roleLabel} <${user.email}> gagal (${login.status()}): ${body}`,
            )
          }

          const browserStorageState = await authContext.storageState()
          const cookieHeader = login
            .headersArray()
            .filter((header) => header.name.toLowerCase() === 'set-cookie')
            .map((header) => header.value.split(';')[0])
            .filter(Boolean)
            .join('; ')
          if (!cookieHeader) {
            throw new Error(
              `Precondition auth ${user.roleLabel} <${user.email}> tidak mengembalikan Set-Cookie`,
            )
          }

          const api = await playwrightRequest.newContext({
            baseURL: apiBaseURL,
            extraHTTPHeaders: { cookie: cookieHeader },
          })
          const me = await api.get(`${apiBaseURL}/auth/me`)
          if (!me.ok()) {
            const body = await me.text().catch(() => '')
            await api.dispose()
            throw new Error(
              `Cookie API ${user.roleLabel} <${user.email}> gagal (${me.status()}): ${body}`,
            )
          }

          const bundle = { api, browserStorageState }
          bundles.set(key, bundle)
          return bundle
        } finally {
          await authContext.dispose()
        }
      })

      await Promise.allSettled([...bundles.values()].map(({ api }) => api.dispose()))
    },
    { scope: 'worker' },
  ],

  roleApi: [
    async ({ roleAuth }, use) => {
      await use(async (user) => (await roleAuth(user)).api)
    },
    { scope: 'worker' },
  ],

  roleStorageState: [
    async ({ roleAuth }, use) => {
      await use(async (user) => (await roleAuth(user)).browserStorageState)
    },
    { scope: 'worker' },
  ],

  publicPage: async ({ browser }, use, testInfo) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()
    const runtimeErrors: string[] = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))

    await use(page)
    await context.close()

    if (testInfo.status === testInfo.expectedStatus) {
      expect(runtimeErrors, 'public journey tidak boleh menghasilkan pageerror').toEqual([])
    }
  },

  roleSession: async ({ browser, roleApi, roleStorageState }, use, testInfo) => {
    const sessions: RoleSession[] = []

    await use(async (user) => {
      const context = await browser.newContext({ storageState: await roleStorageState(user) })
      const page = await context.newPage()
      const runtimeErrors: string[] = []
      page.on('pageerror', (error) => runtimeErrors.push(error.message))

      const session: RoleSession = {
        user,
        context,
        page,
        api: await roleApi(user),
        runtimeErrors,
      }
      sessions.push(session)
      return session
    })

    const runtimeErrors = sessions.flatMap((session) =>
      session.runtimeErrors.map((message) => `${session.user.email}: ${message}`),
    )

    await Promise.allSettled(sessions.map((session) => session.context.close()))

    // Jangan menutupi error utama test dengan assertion teardown kedua.
    if (testInfo.status === testInfo.expectedStatus) {
      expect(runtimeErrors, 'business journey tidak boleh menghasilkan pageerror').toEqual([])
    }
  },
})

export { expect }
