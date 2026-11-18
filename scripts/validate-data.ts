import assert from 'node:assert/strict'
import { chapters } from '../src/data/chapters'
import { availabilityLabels, categories, confidenceLabels, seasons } from '../src/data/model'
import { entries } from '../src/data/timeline'

const ids = new Set<string>()
const order = new Set<number>()
const byID = new Map(entries.map((entry) => [entry.id, entry]))
const chapterByID = new Map(chapters.map((chapter) => [chapter.id, chapter]))
const requiredText = ['title', 'description', 'placementReason'] as const

assert.equal(chapterByID.size, chapters.length, 'Duplicate chapter ID')
for (const chapter of chapters) {
  assert(seasons.some((season) => season.id === chapter.season), 'Invalid season for ' + chapter.id)
  assert(entries.some((entry) => entry.chapter === chapter.id && entry.contentType === 'main'), 'Missing main story for ' + chapter.id)
}

for (const entry of entries) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id), 'Invalid ID ' + entry.id)
  assert(!ids.has(entry.id), 'Duplicate ID ' + entry.id)
  ids.add(entry.id)
  assert(Number.isSafeInteger(entry.chronologicalOrder) && entry.chronologicalOrder > 0, 'Invalid order for ' + entry.id)
  assert(!order.has(entry.chronologicalOrder), 'Duplicate order for ' + entry.id)
  order.add(entry.chronologicalOrder)
  assert(chapterByID.get(entry.chapter)?.season === entry.season, 'Chapter and season mismatch for ' + entry.id)
  assert(Object.hasOwn(categories, entry.contentType), 'Invalid category for ' + entry.id)
  assert(Object.hasOwn(availabilityLabels, entry.availability), 'Invalid availability for ' + entry.id)
  assert(Object.hasOwn(confidenceLabels, entry.placementConfidence), 'Invalid placement confidence for ' + entry.id)
  assert.equal(typeof entry.optional, 'boolean', 'Missing optional flag for ' + entry.id)
  assert(entry.releaseVersion === null || /^\d+\.\d+$/.test(entry.releaseVersion), 'Invalid version for ' + entry.id)
  assert(entry.availability !== 'limited' || (entry.limitedUntil && Number.isFinite(Date.parse(entry.limitedUntil))), 'Missing end date for ' + entry.id)
  for (const field of requiredText) assert(entry[field].trim(), 'Missing ' + field + ' for ' + entry.id)
  assert(entry.sourceURLs.length > 0, 'Missing sources for ' + entry.id)
  for (const source of entry.sourceURLs) {
    assert(source.label && new URL(source.url).protocol === 'https:', 'Invalid source for ' + entry.id)
  }
  if (entry.placementConfidence === 'official') {
    assert(entry.officialRecommendation && entry.sourceURLs.some((source) => source.kind === 'official'), 'Missing official evidence for ' + entry.id)
  }
  for (const refs of [entry.placementAfter, entry.placementBefore, entry.relatedEntryIDs, entry.childQuestIDs]) {
    assert.equal(new Set(refs).size, refs.length, 'Duplicate references in ' + entry.id)
    for (const ref of refs) assert(ref !== entry.id && byID.has(ref), 'Broken reference ' + entry.id + ' → ' + ref)
  }
  for (const id of entry.placementAfter) assert(byID.get(id)!.chronologicalOrder < entry.chronologicalOrder, 'Invalid preceding story for ' + entry.id)
  for (const id of entry.placementBefore) assert(byID.get(id)!.chronologicalOrder > entry.chronologicalOrder, 'Invalid following story for ' + entry.id)
  if (entry.parentID) {
    const parent = byID.get(entry.parentID)
    assert(parent && parent.childQuestIDs.includes(entry.id), 'Missing parent link for ' + entry.id)
    assert(!parent.parentID && !entry.childQuestIDs.length, 'Invalid nested chain for ' + entry.id)
    assert(parent.chapter === entry.chapter && parent.contentType === entry.contentType && parent.optional === entry.optional, 'Inconsistent quest group for ' + entry.id)
  }
  let previousOrder = entry.chronologicalOrder
  for (const id of entry.childQuestIDs) {
    const child = byID.get(id)!
    assert(child.parentID === entry.id && child.chronologicalOrder > previousOrder, 'Invalid child order or parent in ' + entry.id)
    previousOrder = child.chronologicalOrder
  }
}

// All dependency edges point to strictly earlier ordinals. The ordering checks
// above reject cycles as well as out-of-sequence references.
const leafCount = entries.filter((entry) => !entry.childQuestIDs.length).length
console.log('Validated ' + entries.length + ' entries (' + leafCount + ' checkable), ' + chapters.length + ' chapters and ' + seasons.length + ' seasons.')
