import assert from 'node:assert/strict'
import test from 'node:test'
import { entries, entryByID } from '../src/data/timeline'
import { getAvailability } from '../src/data/model'
import { isComplete, parseProgress, serializeProgress, totals } from '../src/progress'

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
