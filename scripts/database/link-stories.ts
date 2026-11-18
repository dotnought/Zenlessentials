import { writeFileSync } from 'node:fs'
import { entries } from '../../src/data/timeline'
import raw from '../../src/database/data/catalog.json'
import type { CatalogData } from '../../src/database/model'

const catalog = raw as CatalogData
const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
const agents = new Map(catalog.agents.flatMap((agent) =>
  [agent.name, ...agent.aliases].map((name) => [normalize(name), agent] as const)))

const stories = Object.fromEntries(entries.flatMap((entry) => {
  const links = [...new Set(entry.characters.flatMap((name) => {
    const agent = agents.get(normalize(name))
    return agent ? [agent.id] : []
  }))]
  return links.length ? [[entry.id, links]] : []
}))
const names = Object.fromEntries(catalog.agents.map((agent) => [agent.id, agent.name]))
writeFileSync(new URL('../../src/database/data/story-links.json', import.meta.url), JSON.stringify({ stories, names }) + '\n')
console.log('Linked ' + Object.keys(stories).length + ' story entries to Agent profiles.')
