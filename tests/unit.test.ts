import rawDatabaseCatalog from '../src/database/data/catalog.json'
import type { CatalogData } from '../src/database/model'
import { bannerState, engineStats } from '../src/database/mechanics'
import { emptyCollection, parseCollection, serializeCollection } from '../src/database/collection'
import assert from 'node:assert/strict'
import test from 'node:test'
import { entries, entryByID } from '../src/data/timeline'
import { getAvailability } from '../src/data/model'
import { isComplete, mergeProgress, parseProgress, serializeProgress, totals } from '../src/progress'

const databaseCatalog = rawDatabaseCatalog as CatalogData

test('backup round trip keeps stable IDs, methods, and entries from future data versions', () => {
  const progress = {
    prologue: { method: 'played', completedAt: '2026-11-18T12:00:00.000Z' },
    'future-story': { method: 'watched', completedAt: null },
  } as const
  assert.deepEqual(parseProgress(serializeProgress(progress)), progress)
})

test('backup rejection is atomic for malformed documents and records', () => {
  for (const value of [
    '{', '{}', '{"format":"zenlessentials-progress","version":2,"completions":{}}',
    '{"format":"zenlessentials-progress","version":1,"completions":{"__proto__":{"method":"played","completedAt":null}}}',
    '{"format":"zenlessentials-progress","version":1,"completions":{"demo":{"method":"watched","completedAt":"yesterday"}}}',
  ]) assert.throws(() => parseProgress(value))
})

test('backup merge preserves the newest record across valid timestamp formats', () => {
  const newer = { method: 'played', completedAt: '2026-11-18T12:00:00.100Z' } as const
  const older = { method: 'watched', completedAt: '2026-11-18T12:00:00Z' } as const
  assert.deepEqual(mergeProgress({ prologue: newer }, { prologue: older, 'past-event': older }), {
    prologue: newer, 'past-event': older,
  })
})

test('quest chains count only individual stories and complete when each child is checked', () => {
  const parent = entryByID['enigma-labyrinth']
  const children = parent.childQuestIDs.map((id) => entryByID[id])
  assert.equal(children.length, 8)
  const one = { [children[0].id]: { method: 'played', completedAt: null } } as const
  assert.equal(isComplete(parent, one), false)
  assert.deepEqual(totals([parent, ...children], one), { done: 1, total: 8, percent: 13 })
  const all = Object.fromEntries(children.map(({ id }) => [id, { method: 'played', completedAt: null }] as const))
  assert.equal(isComplete(parent, all), true)
  assert.equal(totals(entries, all).done, 8)
})

test('limited availability rolls forward at the published deadline', () => {
  const event = entryByID['hobbling-trails']
  assert.equal(getAvailability(event, new Date('2026-11-18T12:00:00Z')), 'limited')
  assert.equal(getAvailability(event, new Date('2026-12-02T12:00:00Z')), 'expired')
})

test('W-Engine stats use the released curve and the exact Steel Cushion example', () => {
  const steel = databaseCatalog.engines.find((engine) => engine.name === 'Steel Cushion')!
  assert.deepEqual(engineStats(steel, databaseCatalog.engineCurves, 1, 0), {atk:46,secondary:960})
  assert.deepEqual(engineStats(steel, databaseCatalog.engineCurves, 10, 0), {atk:118,secondary:960})
  assert.deepEqual(engineStats(steel, databaseCatalog.engineCurves, 60, 5), {atk:684,secondary:2400})
})

test('regional banner state has a complete final minute', () => {
  const banner = {starts:'2026-11-11T12:00',ends:'2026-12-01T14:59'}
  assert.equal(bannerState(banner,new Date('2026-11-11T05:59Z'),'asia'),'Current')
  assert.equal(bannerState(banner,new Date('2026-11-11T05:59Z'),'europe'),'Upcoming')
  assert.equal(bannerState(banner,new Date('2026-12-01T06:59:58Z'),'asia'),'Current')
  assert.equal(bannerState(banner,new Date('2026-12-01T07:00Z'),'asia'),'History')
})

test('collection backups preserve valid unknown IDs and reject duplicate team members', () => {
  const store = { ...emptyCollection, agents:{'agent-9999':2}, planned:['engine-99999'] }
  assert.deepEqual(parseCollection(serializeCollection(store)),store)
  assert.throws(() => parseCollection(serializeCollection({
    ...store,teams:[{id:'squad-duplicate',name:'Duplicate',agentIds:['agent-1011','agent-1011','agent-1011'],bangbooId:''}],
  })),/Invalid saved squad/)
})

test('collection backups migrate personal tiers by rank without losing ownership', () => {
  const saved = JSON.stringify({
    format: 'zenlessentials-collection', version: 1,
    collection: { ...emptyCollection, agents: { 'agent-1011': 2 }, tiers: {
      'agent-1011': 'S', 'agent-1021': 'A', 'agent-1031': 'B', 'agent-1041': 'C', 'agent-1051': 'D', 'agent-1061': 'T0.5',
    } },
  })
  const collection = parseCollection(saved)
  assert.deepEqual(collection.agents, { 'agent-1011': 2 })
  assert.deepEqual(collection.tiers, {
    'agent-1011': 'T0', 'agent-1021': 'T0.5', 'agent-1031': 'T1', 'agent-1041': 'T1.5', 'agent-1051': 'T2', 'agent-1061': 'T0.5',
  })
  assert.deepEqual(parseCollection(serializeCollection(collection)), collection)
})
