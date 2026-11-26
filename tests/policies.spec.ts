import { expect, test } from '@playwright/test'

const official = 'https://zenlessentials.org'
const pages = [
  { path: '/privacy', title: 'Privacy Policy', section: 'Privacy requests' },
  { path: '/terms', title: 'Terms of Service', section: 'Accounts and acceptable use' },
  { path: '/code-of-conduct', title: 'Code of Conduct', section: 'Reporting and enforcement' },
]

test('serves the homepage and complete public policy HTML with canonical metadata before scripts run', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  try {
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Zenlessentials', level: 1 })).toBeVisible()
    await expect(page.getByText(/Track the story, look up Agents and equipment, and build squads/)).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', official + '/')

    for (const { path, title, section } of pages) {
      await page.getByRole('link', { name: title }).click()
      await expect(page).toHaveURL(path)
      await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible()
      await expect(page.getByRole('heading', { name: section, level: 2 })).toBeVisible()
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', official + path)
      await expect(page.locator('[property="og:url"]')).toHaveAttribute('content', official + path)
      await page.reload()
      await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible()
    }
  } finally {
    await context.close()
  }
})

test('opens policy links within the app and preserves theme and offline access', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  const policies = page.locator('.site-footer').getByRole('navigation', { name: 'Project policies' })
  await expect(policies.getByRole('link', { name: 'Terms of Service' })).toBeVisible()
  await policies.getByRole('link', { name: 'Privacy Policy' }).click()
  await expect(page.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeVisible()
  await expect(page).toHaveTitle('Privacy Policy — Zenlessentials')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', official + '/privacy')

  await page.goto('/settings')
  await page.getByRole('radio', { name: 'Ether Violet' }).check()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await context.setOffline(true)
  await page.goto('/code-of-conduct')
  await expect(page.getByRole('heading', { name: 'Code of Conduct', level: 1 })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'Treat other contributors with respect' })).toHaveCount(1)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ether')
})
