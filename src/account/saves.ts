import { emptyCollection, loadCollection, parseCollection } from '../database/collection'
import type { Collection } from '../database/collection'
import { defaults, mergeProgress, parsePreferences, parseProgress, readPreferences, readProgress } from '../progress'
import type { Preferences, Progress } from '../progress'

export type Saves = { progress: Progress; collection: Collection; preferences: Preferences }
export const emptySaves: Saves = { progress: {}, collection: emptyCollection, preferences: defaults }

export function readGuestSaves(): Saves {
  return { progress: readProgress(), collection: loadCollection(), preferences: readPreferences() }
}

export function parseSaves(value: unknown): Saves {
  if (!value || typeof value !== 'object' || !('progress' in value) || !('collection' in value) || !('preferences' in value)) {
    throw new Error('Invalid account save.')
  }
  return {
    progress: parseProgress(JSON.stringify({ format: 'zenlessentials-progress', version: 1, completions: value.progress })),
    collection: parseCollection(JSON.stringify({ format: 'zenlessentials-collection', version: 1, collection: value.collection })),
    preferences: parsePreferences(value.preferences),
  }
}

// JSONB can return keys in a different order from the browser.
export function equalSaves(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false
  const left = Object.entries(a)
  const right = Object.keys(b)
  return left.length === right.length && left.every(([key, value]) =>
    Object.hasOwn(b, key) && equalSaves(value, (b as Record<string, unknown>)[key]))
}

function mergeRecords<T>(base: Record<string, T>, local: Record<string, T>, remote: Record<string, T>): Record<string, T> {
  const merged = { ...remote }
  for (const id of new Set([...Object.keys(base), ...Object.keys(local)])) {
    if (equalSaves(local[id], base[id])) continue
    if (Object.hasOwn(local, id)) merged[id] = local[id]
    else delete merged[id]
  }
  return merged
}

const keyedList = (list: string[]) => Object.fromEntries(list.map((id) => [id, true]))
const keyedTeams = (teams: Collection['teams']) => Object.fromEntries(teams.map((team) => [team.id, team]))

// Each locally changed record wins over its remote counterpart. Unchanged records
// follow the server, including deletions. Edits to other records remain intact.
export function mergeSaves(base: Saves, local: Saves, remote: Saves): Saves {
  const b = base.collection, l = local.collection, r = remote.collection
  return {
    progress: mergeRecords(base.progress, local.progress, remote.progress),
    collection: {
      agents: mergeRecords(b.agents, l.agents, r.agents),
      engines: mergeRecords(b.engines, l.engines, r.engines),
      bangboo: mergeRecords(b.bangboo, l.bangboo, r.bangboo),
      tiers: mergeRecords(b.tiers, l.tiers, r.tiers),
      favorites: Object.keys(mergeRecords(keyedList(b.favorites), keyedList(l.favorites), keyedList(r.favorites))),
      planned: Object.keys(mergeRecords(keyedList(b.planned), keyedList(l.planned), keyedList(r.planned))),
      teams: Object.values(mergeRecords(keyedTeams(b.teams), keyedTeams(l.teams), keyedTeams(r.teams))),
    },
    preferences: { ...remote.preferences, ...Object.fromEntries(Object.entries(local.preferences).filter(([key, value]) =>
      value !== base.preferences[key as keyof Preferences])) },
  }
}

export function importGuestSaves(account: Saves, guest: Saves): Saves {
  return { ...mergeSaves(emptySaves, account, guest), progress: mergeProgress(account.progress, guest.progress) }
}
