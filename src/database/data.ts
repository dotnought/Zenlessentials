import catalogData from './data/catalog.json'
import channelData from './data/banners.json'
import observedData from './data/observations.json'
import storyData from './data/story-links.json'
import type { AgentKit, Banner, CatalogData } from './model'

export type ObservedAgent = {
  engines: { id: string; share: number }[]
  discs: { ids: string[]; share: number }[]
  slots: { name: string; share: number }[][]
  stats: { name: string; value: number; suffix: string }[]
  substats: { name: string; value: number; suffix: string }[]
  shiyu: number; deadly: number; shiyuSample: number; deadlySample: number
}
export type ObservedTeam = {
  id: string; agentIds: string[]
  observations: { mode: string; share: number; rank: number; bangbooId?: string }[]
}
export const catalog: CatalogData = catalogData as CatalogData
export const { agents, engines, discs, bangboo } = catalog
export const { banners, upcoming } = channelData as {
  banners: Banner[]
  upcoming: { name: string; date: string; note: string; source: string }[]
}
export const observations = observedData as {
  cycle: string; source: string; agents: Record<string, ObservedAgent>; teams: ObservedTeam[]
}
export const storyAgents = storyData as { stories: Record<string, string[]>; names: Record<string, string> }
export const storyIdsByAgent = new Map(agents.map((agent) => [
  agent.id, Object.entries(storyAgents.stories).filter(([, members]) => members.includes(agent.id)).map(([storyId]) => storyId),
]))

function indexByID<T extends { id: string | number }>(records: T[]) {
  return new Map(records.map((entry) => [entry.id as T['id'], entry]))
}
export const agentByID = indexByID(agents)
export const engineByID = indexByID(engines)
export const discByID = indexByID(discs)
export const bangbooByID = indexByID(bangboo)
export const statByID = indexByID(catalog.stats)
export const materialByID = indexByID(catalog.materials)
const kits = import.meta.glob<AgentKit>('./data/kits/*.json', { import: 'default' })
export const loadKit = (id: string) => kits['./data/kits/' + id + '.json']?.()
