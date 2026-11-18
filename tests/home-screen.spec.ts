import { expect, test } from '@playwright/test'

test('publishes the Home Screen manifest and Apple touch icon', async ({ page, request }) => {
  await page.goto('/settings')
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/)
  const manifestPath = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(manifestPath).toBeTruthy()
  const manifest = await request.get(manifestPath!)
  expect(manifest.ok()).toBe(true)
  expect(await manifest.json()).toMatchObject({
    name: 'Zenlessentials',
    id: '/',
    scope: '/',
    start_url: '/',
    display: 'standalone',
    icons: expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
      expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
    ]),
  })
  const iconPath = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')
  expect(iconPath).toBeTruthy()
  const icon = await request.get(iconPath!)
  expect(icon.ok()).toBe(true)
  expect(icon.headers()['content-type']).toBe('image/png')
  const png = await icon.body()
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([180, 180])
})

test('opens offline, keeps the theme and saves quest progress across reloads', async ({ page, context }) => {
  await page.goto('/settings')
  await page.getByRole('radio', { name: 'Ether Violet' }).check()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await context.setOffline(true)
  await page.goto('/timeline')
  const prologue = page.getByRole('checkbox', { name: 'Complete Business x Strangeness x Justness' })
  await expect(prologue).toBeVisible()
  await prologue.check()
  await page.reload()
  await expect(prologue).toBeChecked()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ether')
  await expect(page.locator('.hero-art')).toHaveJSProperty('naturalWidth', 1600)
  await page.goto('/library?q=The+Great+Aquarium+Rescue')
  await expect(page.getByRole('checkbox', { name: 'Complete The Great Aquarium Rescue' })).toBeVisible()
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Progress by season' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Profile sections' }).getByRole('link', { name: /Story Progress.*1\// })).toBeVisible()
})

test('keeps phone controls inside the safe area', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'This checks the phone layout.')
  await page.goto('/timeline')
  await page.addStyleTag({ content: ':root { --safe-top: 47px; --safe-left: 12px; --safe-right: 12px; --safe-bottom: 34px; }' })
  await expect(page.locator('.shell')).toHaveCSS('padding-top', '47px')
  await expect(page.locator('.sidebar')).toHaveCSS('padding-bottom', '34px')
  await expect(page.locator('.sidebar')).toHaveCSS('padding-left', '12px')
  await expect(page.locator('.season-nav')).toHaveCSS('top', '47px')
  await expect(page.getByRole('searchbox', { name: 'Search stories' })).toHaveCSS('font-size', '16px')

  await page.setViewportSize({ width: 844, height: 390 })
  await expect(page.locator('.sidebar')).toHaveCSS('position', 'fixed')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(844)
})

test('limits touch callout suppression to app controls', async ({ page, hasTouch }) => {
  test.skip(!hasTouch, 'This checks touch interactions.')
  await page.goto('/timeline?season=1#story-prologue')
  const settings = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Settings' })
  const prologue = page.locator('#story-prologue')
  const toggle = prologue.getByRole('button', { name: 'Collapse Business x Strangeness x Justness' })
  const checkbox = prologue.getByRole('checkbox')
  const source = prologue.locator('a[target="_blank"]').first()
  const search = page.getByRole('searchbox', { name: 'Search stories' })

  for (const control of [settings, toggle, checkbox]) {
    await expect(control).toHaveCSS('user-select', 'none')
  }
  for (const content of [source, search]) {
    await expect(content).not.toHaveCSS('user-select', 'none')
  }
  if (await page.evaluate(() => CSS.supports('-webkit-touch-callout', 'none'))) {
    await expect(settings).toHaveCSS('-webkit-touch-callout', 'none')
    await expect(source).toHaveCSS('-webkit-touch-callout', 'default')
  }

  await checkbox.tap()
  await expect(checkbox).toBeChecked()
  await toggle.tap()
  await expect(toggle).toBeHidden()
  await settings.tap()
  await expect(page).toHaveURL('/settings')
})

test('passes the progress backup to the native share sheet when file sharing is available', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: ({ files }: ShareData) => files?.[0]?.type === 'application/json' })
    Object.defineProperty(navigator, 'share', { value: async ({ files }: ShareData) => {
      const file = files![0]
      sessionStorage.setItem('shared-backup', JSON.stringify({ name: file.name, body: JSON.parse(await file.text()) }))
    } })
  })
  await page.goto('/timeline')
  await page.getByRole('checkbox', { name: 'Complete Business x Strangeness x Justness' }).check()
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Share backup' }).click()
  await expect(page.getByRole('status')).toHaveText('Backup shared.')
  const backup = await page.evaluate(() => JSON.parse(sessionStorage.getItem('shared-backup')!))
  expect(backup).toMatchObject({
    name: 'zenlessentials-progress.json',
    body: { format: 'zenlessentials-progress', completions: { prologue: { method: 'played' } } },
  })
})
