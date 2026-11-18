import type { AgentKit, CatalogData, Engine, Stat } from './model'

export const promotionCaps = [10, 20, 30, 40, 50, 60]
export const maxCoreSteps = ['Base', 'A', 'B', 'C', 'D', 'E', 'F']

export function agentStat(kit: AgentKit, id: number, level: number, promotion: number, core: number) {
  return (kit.base[id] ?? 0) + (kit.growth[id] ?? 0) * (level - 1) / 10000
    + (kit.promotions[promotion]?.[id] ?? 0) + (kit.cores[core]?.[id] ?? 0)
}

export function engineStats(engine: Engine, curves: CatalogData['engineCurves'], level: number, promotion: number) {
  const curve = curves[engine.rank]
  const modifiers = curve.promotions[promotion]
  const growth = curve.levels[level === 1 ? 0 : level]
  return {
    atk: Math.floor(engine.base * (10000 + growth + modifiers.atk) / 10000),
    secondary: engine.secondary.value * (10000 + modifiers.secondary) / 10000,
  }
}

export function showStat(stat: Stat, raw: number) {
  return (raw / stat.scale).toLocaleString('en-US', { maximumFractionDigits: stat.scale === 1 ? 0 : 2 }) + stat.unit
}

export function bannerState(banner: { starts: string; ends: string }, now = new Date(), server: 'asia' | 'europe' | 'america' = 'asia') {
  const offset = { asia: '+08:00', europe: '+01:00', america: '-05:00' }[server]
  const asDate = (value: string) => Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : value + offset)
  return +now < asDate(banner.starts) ? 'Upcoming' : +now < asDate(banner.ends) + 60_000 ? 'Current' : 'History'
}

export const compareVersion = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })

export function searchKey(value: string) {
  return value.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '')
}

export function matchesQuery(query: string, ...fields: (string | undefined)[]) {
  const content = searchKey(fields.filter(Boolean).join(' '))
  return searchKey(query.trim()).split(/\s+/).every((word) => content.includes(word))
}
