import { useEffect, useState } from 'react'
import type { Agent, Bangboo, Condition } from './model'

export type SavedTeam = { id: string; name: string; agentIds: string[]; bangbooId: string }
type Bookshelf = Record<string, number>
export type Collection = {
  agents: Bookshelf; engines: Bookshelf; bangboo: Bookshelf
  favorites: string[]; planned: string[]; teams: SavedTeam[]; tiers: Record<string, string>
}
export const collectionKey = 'zenlessentials.collection'
export const emptyCollection: Collection = { agents: {}, engines: {}, bangboo: {}, favorites: [], planned: [], teams: [], tiers: {} }
const id = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) && v.length < 90 && v !== 'constructor' && v !== 'prototype'
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const isList = (v: unknown): v is string[] => Array.isArray(v) && v.every(id)
export const personalTiers = ['S', 'A', 'B', 'C', 'D'] as const

function owned(value: unknown, min: number, max: number): Bookshelf {
  if (!isRecord(value)) throw new Error('Invalid ownership records.')
  return Object.fromEntries(Object.entries(value).map(([key, level]) => {
    if (!id(key) || typeof level !== 'number' || !Number.isInteger(level) || level < min || level > max) throw new Error('Invalid ownership level.')
    return [key, level]
  }))
}

export function parseCollection(raw: string): Collection {
  if (raw.length > 1_000_000) throw new Error('This backup exceeds the 1 MB size limit.')
  const data: unknown = JSON.parse(raw)
  if (!isRecord(data) || data.format !== 'zenlessentials-collection' || data.version !== 1 || !isRecord(data.collection)) {
    throw new Error('Choose a version 1 Zenlessentials collection backup.')
  }
  const { agents, engines, bangboo, favorites, planned, teams, tiers = {} } = data.collection
  if (!isList(favorites) || !isList(planned) || !Array.isArray(teams) || !isRecord(tiers)) throw new Error('Invalid collection lists.')
  const parsedTeams = teams.map((team): SavedTeam => {
    if (!isRecord(team) || !id(team.id) || typeof team.name !== 'string' || !team.name.trim() || team.name.length > 64 ||
      !isList(team.agentIds) || team.agentIds.length !== 3 || new Set(team.agentIds).size !== 3 ||
      (team.bangbooId !== '' && !id(team.bangbooId))) throw new Error('Invalid saved squad.')
    return { id: team.id, name: team.name, agentIds: team.agentIds, bangbooId: team.bangbooId }
  })
  if (new Set(parsedTeams.map((team) => team.id)).size !== parsedTeams.length) throw new Error('Duplicate squad IDs.')
  const parsedTiers = Object.fromEntries(Object.entries(tiers).map(([key, tier]) => {
    if (!id(key) || !personalTiers.some((valid) => tier === valid)) throw new Error('Invalid personal tier.')
    return [key, tier as string]
  }))
  return {
    agents: owned(agents, 0, 6), engines: owned(engines, 1, 5), bangboo: owned(bangboo, 1, 5),
    favorites: [...new Set(favorites)], planned: [...new Set(planned)], teams: parsedTeams, tiers: parsedTiers,
  }
}

export const serializeCollection = (collection: Collection) =>
  JSON.stringify({ format: 'zenlessentials-collection', version: 1, collection }, null, 2)

function loadCollection() {
  try {
    const raw = localStorage.getItem(collectionKey)
    return raw ? parseCollection(raw) : emptyCollection
  } catch {
    return emptyCollection
  }
}

export function useCollection() {
  const [collection, setCollection] = useState(loadCollection)
  const [storageError, setStorageError] = useState(false)
  useEffect(() => {
    try {
      const raw = serializeCollection(collection)
      if (localStorage.getItem(collectionKey) !== raw) localStorage.setItem(collectionKey, raw)
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }, [collection])
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === collectionKey) setCollection(loadCollection())
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function setOwned(kind: 'agents' | 'engines' | 'bangboo', id: string, level?: number) {
    setCollection((current) => {
      const updated = { ...current[kind] }
      if (level === undefined) delete updated[id]
      else updated[id] = level
      return { ...current, [kind]: updated }
    })
  }
  function toggleList(key: 'favorites' | 'planned', id: string) {
    setCollection((current) => ({
      ...current, [key]: current[key].includes(id) ? current[key].filter((item) => item !== id) : [...current[key], id],
    }))
  }
  return { collection, setCollection, storageError, setOwned, toggleList }
}
export type CollectionState = ReturnType<typeof useCollection>

export function conditionMatches(rule: Condition, team: Agent[]) {
  return team.filter((member) => {
    if (rule.kind === 'faction') return [member.faction, ...member.affiliations].some((value) => rule.values.includes(value))
    if (rule.kind === 'attackType') return member.attackTypes.some((value) => rule.values.includes(value))
    if (rule.kind === 'attribute') return rule.values.includes(member.attribute) || rule.values.includes(member.baseAttribute)
    return rule.values.includes(rule.kind === 'agent' ? member.id : member.specialty)
  }).length >= rule.count
}

export function agentPassive(agent: Agent, team: Agent[]) {
  return agent.condition?.some((rule) => conditionMatches(rule, team.filter((member) => member.id !== agent.id)))
}

export function bangbooPassive(bangboo: Bangboo, team: Agent[]) {
  return bangboo.condition?.some((rule) => conditionMatches(rule, team))
}
