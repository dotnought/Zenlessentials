export type Rank = 'S' | 'A' | 'B'
export type Stat = { id: number; name: string; scale: number; unit: '' | '%' }
export type MaterialCost = { id: string; count: number }
export type Source = { name: string; url: string; revision?: string }
export type Asset = { image?: string; portrait?: string }
export type RecordBase = Asset & { id: string; name: string; version?: string }
export type Skill = { name: string; description: string; group: string; variants?: { label: string; text: string }[]; numbers?: { name: string; levels: (string | null)[] }[] }
export type Condition = { kind: 'attribute' | 'specialty' | 'faction' | 'agent' | 'attackType'; values: string[]; count: number }
export type Agent = RecordBase & {
  rank: Exclude<Rank, 'B'>; attribute: string; baseAttribute: string; attackTypes: string[]; specialty: string; faction: string; affiliations: string[]; aliases: string[]
  signatureId?: string; condition?: Condition[]; conditionText?: string; color?: string
}
export type AgentKit = {
  id: string; base: Record<string, number>; growth: Record<string, number>
  promotions: Record<string, number>[]; cores: Record<string, number>[]; coreUnlocks: number[]
  skills: Skill[]; mindscapes: Skill[]; potential: Skill[]
  materials: Record<string, MaterialCost[]>; priority: string[]
}
export type Engine = RecordBase & {
  rank: Rank; specialty: string; signatureIds: string[]
  base: number; secondary: { stat: number; value: number }; effect?: string; passiveLevels?: string[]
  description?: string; acquisition?: string; materials: MaterialCost[]
}
export type Disc = RecordBase & {
  two: string; four: string; bonuses: { stat: number; value: number }[]; acquisition?: string
}
export type Bangboo = RecordBase & {
  rank: Exclude<Rank, 'B'>; skills: Skill[]; condition?: Condition[]
  materials: MaterialCost[]; acquisition?: string
}
export type Banner = {
  id: string; version: string; name: string; starts: string; ends: string; kind: 'Exclusive' | 'Dissonant' | 'Special'
  agentIds: string[]; engineIds: string[]; source: string; image?: string
}
export type EditorialBuild = {
  id: string; agentId: string; version: string; summary: string; strengths: string[]; tradeoffs: string[]
  rotation: string[]; engines: { id: string; note: string }[]; discs: { id: string; note: string }[]
  comparison?: { context: string; baseline: string; values: { engineId: string; percent: number }[]; source: string }
  main: [string, string, string]; substats: string[]; targets?: string[]; sources: string[]
}
export type RecommendedTeam = { id: string; name: string; agentIds: [string, string, string]; bangbooId?: string; alternatives?: string[]; reason: string; sources: string[] }
export type Guide = { id: string; title: string; summary: string; sections: { title: string; text: string }[]; sources: string[] }
export type CatalogData = {
  version: string; checked: string; sources: Source[]
  agents: Agent[]; engines: Engine[]; discs: Disc[]; bangboo: Bangboo[]
  stats: Stat[]; icons: Record<string, string>; materials: (RecordBase & { acquisition?: string })[]
  engineCurves: Record<Rank, { levels: number[]; promotions: { atk: number; secondary: number }[] }>
  discSlots: { slot: number; stats: { id: number; value: number }[] }[]
  discSubstats: { id: number; value: number }[]
}
