import { expect, test } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'
import { createHash } from 'node:crypto'
import type { Saves } from '../src/account/saves'

const authOrigin = 'https://zenlessentials-sync-test.supabase.co'
const userId = '114ec165-e371-4068-b531-0ccbfe1f7081'
const email = 'proxy@example.test'
const prologue = 'Complete Business x Strangeness x Justness'
test.use({ serviceWorkers: 'block' })
test.skip(process.env.VITE_SUPABASE_URL !== authOrigin, 'Requires the build configured for the account test backend.')

function backend() {
  let row: { revision: number; snapshot: Saves } | undefined
  const emailRequests: { createUser: boolean; redirectTo: string | null; challenge: string; method: string }[] = []
  const googleRequests: URL[] = []
  const base64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const expires = Math.floor(Date.now() / 1000) + 3600
  const token = base64({ alg: 'HS256', typ: 'JWT' }) + '.' + base64({ sub: userId, exp: expires, role: 'authenticated' }) + '.test'
  const session = {
    access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: expires, refresh_token: 'test-refresh-token',
    user: { id: userId, email, app_metadata: {}, user_metadata: {}, aud: 'authenticated' },
  }

  async function connect(context: BrowserContext) {
    await context.route(authOrigin + '/**', async (route) => {
      const request = route.request()
      const method = request.method()
      const url = new URL(request.url())
      const headers = {
        'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
        'access-control-allow-headers': '*',
      }
      const json = (value: unknown, status = 200) => route.fulfill({ json: value, headers, status })
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
      if (url.pathname === '/auth/v1/otp') {
        const body = request.postDataJSON()
        emailRequests.push({ createUser: body.create_user, redirectTo: url.searchParams.get('redirect_to'), challenge: body.code_challenge, method: body.code_challenge_method })
        return json({})
      }
      if (url.pathname === '/auth/v1/verify') {
        expect(request.postDataJSON()).toMatchObject({ email, token: '123456', type: 'email' })
        return json(session)
      }
      if (url.pathname === '/auth/v1/authorize') {
        googleRequests.push(url)
        const location = new URL(url.searchParams.get('redirect_to')!)
        location.searchParams.set('code', 'test-oauth-code')
        return route.fulfill({ contentType: 'text/html', body: '<script>location.replace(' + JSON.stringify(location.href) + ')</script>' })
      }
      if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'pkce') {
        const { auth_code, code_verifier } = request.postDataJSON()
        const expectedChallenge = auth_code === 'test-email-link-code' ? emailRequests.at(-1)?.challenge : googleRequests[0]?.searchParams.get('code_challenge')
        expect(['test-email-link-code', 'test-oauth-code']).toContain(auth_code)
        expect(createHash('sha256').update(code_verifier).digest('base64url')).toBe(expectedChallenge)
        return json(session)
      }
      if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers })
      if (url.pathname !== '/rest/v1/account_saves' || request.headers().authorization !== 'Bearer ' + token) {
        return json({ message: 'Unauthorized' }, 401)
      }
      if (method === 'GET') return json(row ? [row] : [])
      const body = request.postDataJSON()
      if (method === 'POST') {
        expect(body.user_id).toBe(userId)
        if (row) return json({ code: '23505', message: 'Duplicate key' }, 409)
        row = { snapshot: body.snapshot, revision: body.revision }
        return route.fulfill({ status: 201, headers })
      }
      if (method === 'PATCH') {
        if (!row || url.searchParams.get('revision') !== 'eq.' + row.revision) return json([])
        expect(url.searchParams.get('user_id')).toBe('eq.' + userId)
        row = { snapshot: body.snapshot, revision: body.revision }
        return json([{ revision: row.revision }])
      }
      return json({}, 404)
    })
  }

  return { connect, emailRequests, googleRequests, saved: () => row?.snapshot }
}

test('signs in with email and syncs a guest import and offline edits across devices', async ({ page, context, browser, baseURL }) => {
  test.slow()
  const api = backend()
  await api.connect(context)
  await page.goto('/timeline')
  await page.getByRole('checkbox', { name: prologue }).check()
  await page.goto('/settings')
  await page.getByRole('radio', { name: 'Ether Violet' }).check()
  await page.goto('/profile/account')
  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Email address').fill(email)
  await page.getByRole('button', { name: 'Send sign-in email' }).click()
  await page.getByRole('button', { name: 'Enter a code' }).click()
  await page.getByLabel('Verification code').fill('123456')
  await page.getByRole('button', { name: 'Verify and sign in' }).click()
  await page.getByRole('button', { name: 'Import guest saves' }).click()
  await expect.poll(() => api.saved()?.progress.prologue?.method).toBe('played')
  await expect.poll(() => api.saved()?.preferences.theme).toBe('ether')

  const second = await browser.newContext({ baseURL, serviceWorkers: 'block' })
  try {
    await api.connect(second)
    const phone = await second.newPage()
    await phone.goto('/profile/account')
    await phone.getByLabel('Email address').fill(email)
    await phone.getByRole('button', { name: 'Send sign-in email' }).click()
    await phone.getByRole('button', { name: 'Enter a code' }).click()
    await phone.getByLabel('Verification code').fill('123456')
    await phone.getByRole('button', { name: 'Verify and sign in' }).click()
    await expect(phone.getByText('Up to date.', { exact: true })).toBeVisible()
    expect(api.emailRequests.map(({ createUser }) => createUser)).toEqual([true, false])
    await expect(phone.getByRole('link', { name: /Story Progress.*1\// })).toBeVisible()
    await expect(phone.locator('html')).toHaveAttribute('data-theme', 'ether')

    await context.setOffline(true)
    await page.getByRole('link', { name: 'Timeline', exact: true }).click()
    await page.getByRole('checkbox', { name: prologue }).uncheck()
    await phone.goto('/database/agents/agent-1641')
    await phone.getByRole('button', { name: 'Mark owned' }).click()
    await expect.poll(() => api.saved()?.collection.agents['agent-1641']).toBe(0)
    await context.setOffline(false)
    await expect.poll(() => api.saved()?.progress.prologue).toBeUndefined()
    await page.goto('/profile/collection')
    await expect(page.getByRole('link', { name: 'Phoenix', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /Story Progress.*0\// })).toBeVisible()

    await page.getByRole('link', { name: /Account.*Cloud sync/ }).click()
    await page.getByRole('button', { name: 'Sign out', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Story Progress.*1\// })).toBeVisible()
    await phone.goto('/profile/account')
    await expect(phone.getByRole('link', { name: /Story Progress.*0\// })).toBeVisible()
    await expect(phone.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()
  } finally {
    await second.close()
  }
})

test('signs in when the default signup email link opens in another tab', async ({ page, context }) => {
  const api = backend()
  await api.connect(context)
  await page.goto('/profile/account')
  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Email address').fill(email)
  await page.getByRole('button', { name: 'Send sign-in email' }).click()
  await expect(page.getByText('Sign-in email sent.')).toBeVisible()
  const redirectTo = new URL('/profile/account', page.url())
  expect(api.emailRequests).toEqual([{ createUser: true, redirectTo: redirectTo.href, challenge: expect.any(String), method: 's256' }])
  redirectTo.searchParams.set('code', 'test-email-link-code')
  const link = await context.newPage()
  await link.goto(redirectTo.href)
  await expect(link.getByText(email, { exact: true })).toBeVisible()
  await expect(link.getByText('Up to date.', { exact: true })).toBeVisible()
  expect(new URL(link.url()).searchParams.has('code')).toBe(false)
})

test('returns from Google OAuth through a PKCE exchange', async ({ page, context }) => {
  const api = backend()
  await api.connect(context)
  await page.goto('/profile/account')
  await page.getByRole('button', { name: 'Continue with Google' }).click()
  await expect(page.getByText(email, { exact: true })).toBeVisible()
  expect(api.googleRequests[0].searchParams.get('provider')).toBe('google')
  expect(api.googleRequests[0].searchParams.get('code_challenge_method')).toBe('s256')
  expect(new URL(page.url()).searchParams.has('code')).toBe(false)
})
