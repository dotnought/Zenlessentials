import { existsSync, readFileSync, readdirSync } from 'node:fs'
import raw from '../../src/database/data/catalog.json'
import archive from '../../src/database/data/banners.json'
import observed from '../../src/database/data/observations.json'
import links from '../../src/database/data/story-links.json'
import { entryByID } from '../../src/data/timeline'
import { builds, guides, recommendedTeams } from '../../src/database/editorial'
import type { AgentKit, Asset, CatalogData, Condition, MaterialCost, RecordBase } from '../../src/database/model'
import { compareVersion } from '../../src/database/mechanics'

const data = raw as CatalogData
const errors: string[] = []
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const versionPattern = /^\d+\.\d+$/
const dates = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const specialties = new Set(['Attack','Stun','Anomaly','Defense','Rupture','Support','Armorer'])
const fail = (message: string) => { errors.push(message) }
const check = (test: unknown,message: string) => { if (!test) fail(message) }
const ids = <T extends { id: string | number }>(records: readonly T[], label: string) => {
  const map = new Map<T['id'],T>()
  for (const record of records) {
    check(typeof record.id === 'number' || idPattern.test(record.id),label + ' has invalid ID ' + record.id)
    check(!map.has(record.id),label + ' has duplicate ID ' + record.id)
    map.set(record.id,record)
  }
  return map
}
const a = ids(data.agents,'Agents')
const w = ids(data.engines,'W-Engines')
const d = ids(data.discs,'Drive Discs')
const b = ids(data.bangboo,'Bangboo')
const m = ids(data.materials,'Materials')
const stats = ids(data.stats,'Stats')
const featured = ids(archive.banners,'Banners')
const seenBuilds = ids(builds,'Builds')
const teams = ids(recommendedTeams,'Teams')
ids(guides,'Guides')
ids(observed.teams,'Observed teams')
check(/^\d{4}-\d\d-\d\d$/.test(data.checked) && Number.isFinite(Date.parse(data.checked)), 'Catalog verification date is invalid.')
check(versionPattern.test(data.version) && data.sources.length >= 3,'Missing version or source metadata.')
const sources = (urls: string[], label: string) => {
  for (const url of urls) check(/^https:\/\/[a-z0-9.-]+\//i.test(url),label + ' has invalid source URL ' + url)
}
sources(data.sources.map((source) => source.url),'Catalog')
const art = new Set<string>()
function image(record: Asset,label: string,required = false) {
  if (required) check(record.image,label + ' has no released artwork')
  for (const path of [record.image,record.portrait]) {
    if (path) {
      art.add(path)
      check(/^\/database-art\/[a-z0-9-]+\.webp$/.test(path) && existsSync(new URL('../../public' + path,import.meta.url)),label + ' has broken artwork ' + path)
    }
  }
}
function version(record: Pick<RecordBase,'version'>, label: string) {
  if (record.version) check(versionPattern.test(record.version) && compareVersion(record.version,data.version) <= 0,label + ' has invalid version ' + record.version)
}
function materialCosts(costs: MaterialCost[], label: string) {
  const ids = new Set()
  for (const cost of costs) {
    check(m.has(cost.id) && Number.isInteger(cost.count) && cost.count > 0 && !ids.has(cost.id),label + ' has invalid material ' + cost.id)
    ids.add(cost.id)
  }
}
for (const icon of Object.values(data.icons)) image({image:icon},'Database icon')
const attacks = new Set(data.agents.flatMap((agent) => agent.attackTypes))
const attributes = new Set(data.agents.flatMap((agent) => [agent.attribute,agent.baseAttribute]))
const factions = new Set(data.agents.flatMap((agent) => [agent.faction,...agent.affiliations]))
const condition = (list: Condition[] | undefined,label: string) => {
  for (const rule of list ?? []) {
    const values = rule.kind === 'agent' ? a : rule.kind === 'attribute' ? attributes : rule.kind === 'faction' ? factions : rule.kind === 'attackType' ? attacks : specialties
    check(rule.values.length && rule.values.every((value) => values.has(value)) && Number.isInteger(rule.count) && rule.count > 0 && rule.count <= 3,label + ' has invalid passive requirement.')
  }
}
const kits = new Set(readdirSync(new URL('../../src/database/data/kits/',import.meta.url)).filter((file) => file.endsWith('.json')))
for (const agent of a.values()) {
  const label = agent.id + ' ' + agent.name
  check(agent.name && agent.faction && agent.attribute && agent.version && ['S','A'].includes(agent.rank) && specialties.has(agent.specialty),label + ' is missing identity fields.')
  image(agent,label,true)
  check(agent.portrait,label + ' has no portrait.')
  version(agent,label)
  condition(agent.condition,label)
  if (agent.signatureId) {
    const record = w.get(agent.signatureId)
    check(record?.signatureIds.includes(agent.id) && record.specialty === agent.specialty,label + ' has invalid signature W-Engine.')
  }
  if (!kits.delete(agent.id + '.json')) { fail(label + ' has no skill kit.'); continue }
  const kit: AgentKit = JSON.parse(readFileSync(new URL('../../src/database/data/kits/' + agent.id + '.json',import.meta.url),'utf8'))
  check(kit.id === agent.id && kit.promotions.length === 6 && kit.cores.length === 7 && kit.coreUnlocks.length === 7,label + ' has invalid stat tables.')
  check(kit.skills.length >= 11 && kit.mindscapes.length === 6,label + ' has an incomplete skill kit.')
  for (const skill of [...kit.skills,...kit.mindscapes,...kit.potential]) {
    check(skill.name && skill.group && skill.description,label + ' has an empty skill.')
    for (const row of skill.numbers ?? []) check(row.name && row.levels.length === 16,label + ' has an invalid multiplier row.')
  }
  for (const [group,cost] of Object.entries(kit.materials)) materialCosts(cost,label + ' ' + group)
}
check(!kits.size,'Unreferenced skill kits: ' + [...kits].join(', '))
for (const engine of w.values()) {
  const label = engine.id + ' ' + engine.name
  check(engine.name && specialties.has(engine.specialty) && ['S','A','B'].includes(engine.rank) && engine.base > 0 && stats.has(engine.secondary.stat) && engine.secondary.value > 0,label + ' has invalid stats.')
  check(engine.passiveLevels?.length === 5 && engine.passiveLevels.every(Boolean),label + ' has missing Overclock scaling.')
  check(engine.signatureIds.every((id) => a.get(id)?.signatureId === engine.id),label + ' has invalid signature references.')
  image(engine,label,true)
  version(engine,label)
  materialCosts(engine.materials,label)
}
for (const record of d.values()) {
  check(record.name && record.two && record.four,record.id + ' has missing set bonuses.')
  check(record.bonuses.every((bonus) => stats.has(bonus.stat) && Number.isFinite(bonus.value)),record.id + ' has invalid set stats.')
  image(record,record.id,true)
  version(record,record.id)
}
for (const record of b.values()) {
  check(record.name && record.skills.length >= 2 && record.skills.every((skill) => skill.name && skill.description),record.id + ' has missing Bangboo abilities.')
  image(record,record.id,true)
  condition(record.condition,record.id)
  materialCosts(record.materials,record.id)
}
for (const [rank,curve] of Object.entries(data.engineCurves)) {
  check(curve.levels.length === 61 && curve.promotions.length === 6 && curve.levels.every((level) => Number.isFinite(level)),rank + ' has a broken engine curve.')
}
check(data.discSlots.length === 6 && data.discSlots.every((slot,index) => slot.slot === index + 1 && slot.stats.length), 'Invalid disc slot table.')
for (const prop of [...data.discSlots.flatMap((slot) => slot.stats),...data.discSubstats]) {
  check(stats.has(prop.id) && prop.value > 0,'Unknown disc stat ' + prop.id)
}
function validDate(date: string) {
  return dates.test(date) && Number.isFinite(Date.parse(date + 'Z')) && new Date(date + 'Z').toISOString().slice(0,16) === date
}
for (const banner of featured.values()) {
  check(banner.name && validDate(banner.starts) && validDate(banner.ends) && banner.starts < banner.ends,banner.id + ' has invalid dates.')
  check(banner.agentIds.length > 0 && banner.agentIds.every((id) => a.has(id)) && banner.engineIds.every((id) => w.has(id)),banner.id + ' has invalid featured equipment or Agents.')
  version(banner,banner.id)
  image(banner,banner.id)
  sources([banner.source],banner.id)
}
for (const notice of archive.upcoming) {
  check(notice.name && notice.note && Number.isFinite(Date.parse(notice.date)),'Invalid upcoming announcement.')
  sources([notice.source],notice.name)
}
for (const build of seenBuilds.values()) {
  const agent = a.get(build.agentId)
  check(agent && build.summary && build.rotation.length && build.main.length === 3,build.id + ' has missing guide data.')
  check(build.engines.every((item) => w.has(item.id) && w.get(item.id)?.specialty === agent?.specialty) && build.discs.every((item) => d.has(item.id)),build.id + ' has invalid equipment.')
  if (build.comparison) {
    check(w.has(build.comparison.baseline) && build.comparison.values.every((item) => w.get(item.engineId)?.specialty === agent?.specialty && item.percent > 0),build.id + ' has invalid published comparison.')
    sources([build.comparison.source],build.id)
  }
  version(build,build.id)
  sources(build.sources,build.id)
}
for (const team of teams.values()) {
  check(new Set(team.agentIds).size === 3 && team.agentIds.every((id) => a.has(id)) && (!team.bangbooId || b.has(team.bangbooId)) && team.alternatives?.every((id) => a.has(id)) !== false,team.id + ' has invalid squad records.')
  sources(team.sources,team.id)
}
for (const [id,entry] of Object.entries(observed.agents)) {
  check(a.has(id) && entry.engines.every((engine) => w.has(engine.id)) && entry.discs.every((group) => group.ids.every((did) => d.has(did))),id + ' has broken endgame build records.')
  check([entry.shiyu,entry.deadly,...entry.engines.map((v) => v.share),...entry.discs.map((v) => v.share)].every((v) => v >= 0 && v <= 100),id + ' has invalid sample shares.')
}
for (const team of observed.teams) {
  check(new Set(team.agentIds).size === 3 && team.agentIds.every((id) => a.has(id)) &&
    team.observations.every((row) => (!row.bangbooId || b.has(row.bangbooId)) && row.share > 0 && row.share <= 100),team.id + ' has broken sample references.')
}
for (const [story,agents] of Object.entries(links.stories)) {
  check(Object.hasOwn(entryByID,story) && agents.every((member) => a.has(member)),story + ' has broken story-to-Agent links.')
}

if (errors.length) {
  for (const error of errors) console.error(error)
  process.exitCode = 1
} else {
  console.log(`Validated ${a.size} Agents, ${w.size} W-Engines, ${d.size} Drive Disc sets, ${b.size} Bangboo, ${featured.size} banner records, ${art.size} artwork references and ${Object.keys(links.stories).length} story links.`)
}
