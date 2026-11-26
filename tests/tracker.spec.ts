import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('story completion survives reload and advances the recommendation', async ({ page }) => {
  await page.goto('/timeline')
  const title = 'Business x Strangeness x Justness'
  const prologue = page.getByRole('checkbox', { name: 'Complete ' + title, exact: true })
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await prologue.check()
  await expect(page.getByRole('heading', { name: "Cat's Lost & Found (A)" })).toBeVisible()
  await page.reload()
  await expect(prologue).toBeChecked()
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Recently completed' })).toBeVisible()
  await expect(page.getByRole('link', { name: title })).toBeVisible()
})

test('opens Dashboard as home and shows artwork on the main sections', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  const footer = page.locator('.site-footer')
  await expect(footer.getByRole('link', { name: 'This site is powered by Netlify' })).toHaveAttribute('href', 'https://www.netlify.com/')
  await expect(footer.getByRole('link', { name: 'Code of Conduct' })).toHaveAttribute('href', '/code-of-conduct')
  const dashboardNav = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dashboard' })
  await expect(dashboardNav).toHaveAttribute('aria-current', 'page')
  for (const [route, name] of [['dashboard', 'Dashboard'], ['library', 'Content Library'], ['profile', 'Profile'], ['settings', 'Settings']]) {
    await page.goto('/' + route)
    const banner = page.locator('[data-banner="' + route + '"]')
    await expect(banner.getByRole('heading', { name, level: 1 })).toBeVisible()
    await expect(banner.locator('img').first()).not.toHaveJSProperty('naturalWidth', 0)
  }
  const logo = page.locator('.brand')
  await expect(logo).toHaveAttribute('href', '/dashboard')
  if (await logo.isVisible()) await logo.click()
  else await dashboardNav.click()
  await expect(page).toHaveURL('/dashboard')
})

test('uses the available space on a 3440 × 1440 display', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'This checks the desktop ultrawide layout.')
  await page.setViewportSize({ width: 3440, height: 1440 })
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  const banner = await page.locator('[data-banner="dashboard"]').boundingBox()
  expect(banner?.width).toBeGreaterThan(2800)
  const columns = await page.locator('.dashboard-panels').evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' '))
  expect(columns).toHaveLength(3)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(3440)
})

test('spoiler controls hide unfinished story details and reveal them on request', async ({ page }) => {
  await page.goto('/timeline?season=1#story-prologue')
  const spoilers = page.getByText('After a hacker forces the siblings', { exact: false })
  await expect(spoilers).toHaveCount(0)
  await page.getByRole('button', { name: 'Reveal story spoilers' }).click()
  await expect(spoilers).toBeVisible()
  await page.getByRole('button', { name: 'Hide spoilers' }).click()
  await expect(spoilers).toHaveCount(0)
})

test('finds a Labyrinth commission and persists its independent completion', async ({ page }) => {
  await page.goto('/library?q=the+great+aquarium+rescue')
  await expect(page.getByText('1 result', { exact: true })).toBeVisible()
  const quest = page.getByRole('checkbox', { name: 'Complete The Great Aquarium Rescue' })
  await quest.check()
  await expect(page.getByText('1 of 8 complete', { exact: true })).toBeVisible()
  await page.goto('/timeline?season=3#story-bagel-aquarium')
  await expect(quest).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Complete The Hematite Mystery' })).not.toBeChecked()
  await expect(page.getByRole('link', { name: /Season 3 Roscaelifer/ })).toHaveAttribute('aria-current', 'page')
})

test('filters expired events, allows watched completion, and restores defaults', async ({ page }) => {
  await page.goto('/events')
  await page.getByRole('searchbox', { name: 'Search stories' }).fill('Camellia')
  await page.getByLabel('Availability', { exact: true }).selectOption('expired')
  await expect(page.getByText('1 result', { exact: true })).toBeVisible()
  const golden = page.locator('#story-camellia')
  await golden.getByRole('button', { name: 'Expand Camellia Golden Week' }).click()
  const checkboxes = golden.getByRole('checkbox')
  await checkboxes.first().check()
  await expect(golden.getByText('Watched', { exact: true }).first()).toBeVisible()
  await page.getByLabel('Availability', { exact: true }).selectOption('available')
  await expect(page.getByRole('heading', { name: 'No stories found' })).toBeVisible()
})

test('validates, imports and exports JSON and requires confirmation to reset', async ({ page }) => {
  await page.goto('/settings')
  const input = page.locator('input[type=file]')
  await input.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') })
  await expect(page.getByRole('status')).toHaveText(/Choose a Zenlessentials progress backup/)
  const completions = { prologue: { method: 'played', completedAt: '2026-11-18T12:00:00.000Z' } }
  const data = { format: 'zenlessentials-progress', version: 1, completions }
  await input.setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) })
  await expect(page.getByRole('status')).toHaveText('Backup merged with your progress.')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('zenlessentials-progress.json')
  expect(JSON.parse(await readFile((await download.path())!, 'utf8'))).toEqual(data)
  page.once('dialog', (dialog) => void dialog.dismiss())
  await page.getByRole('button', { name: 'Reset progress' }).click()
  await page.goto('/timeline')
  await expect(page.getByRole('checkbox', { name: 'Complete Business x Strangeness x Justness' })).toBeChecked()
  await page.goto('/settings')
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: 'Reset progress' }).click()
  await expect(page.getByRole('status')).toHaveText('All completions cleared.')
  await page.goto('/timeline')
  await expect(page.getByRole('checkbox', { name: 'Complete Business x Strangeness x Justness' })).not.toBeChecked()
})

test('production build serves nested routes and fits the viewport', async ({ page }) => {
  for (const [path, heading] of [['/agents', 'Agent Stories'], ['/events', 'Events'], ['/stats', 'Profile'], ['/timeline', 'STORY TIMELINE']]) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: heading, exact: true, level: 1 })).toBeVisible()
    if (path === '/stats') await expect(page).toHaveURL('/profile')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth))
  }
})

test('appearance restores old preferences and saves the selected theme with progress intact', async ({ page }) => {
  await page.goto('/timeline')
  const prologue = page.getByRole('checkbox', { name: 'Complete Business x Strangeness x Justness' })
  await prologue.check()
  await page.evaluate(() => localStorage.setItem('zenlessentials.preferences', JSON.stringify({ spoilerSafe: false })))
  await page.goto('/settings')
  await expect(page.getByRole('radio', { name: 'Signal Yellow' })).toBeChecked()
  await expect(page.getByRole('switch', { name: /Spoiler-safe mode/ })).not.toBeChecked()

  const root = page.locator('html')
  const hollow = page.getByRole('radio', { name: 'Hollow Blue' })
  await hollow.check()
  await expect(root).toHaveCSS('background-color', 'rgb(13, 21, 27)')
  await page.getByRole('radio', { name: 'Ether Violet' }).check()
  await expect(root).toHaveCSS('background-color', 'rgb(21, 18, 29)')
  await page.getByRole('radio', { name: 'Calydon Orange' }).check()
  await expect(root).toHaveCSS('background-color', 'rgb(25, 19, 16)')
  await hollow.check()
  await page.reload()
  await expect(hollow).toBeChecked()
  await expect(root).toHaveAttribute('data-theme', 'hollow')

  await page.getByRole('link', { name: 'Timeline', exact: true }).click()
  await expect(prologue).toBeChecked()
  await expect(root).toHaveAttribute('data-theme', 'hollow')
  await expect(page.locator('.hero-art')).toHaveJSProperty('complete', true)
  await expect(page.locator('.hero-art')).toHaveJSProperty('naturalWidth', 1600)
})
