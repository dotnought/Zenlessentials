import { chapters } from './chapters'
import type { NarrativeEntry } from './model'
import { mainStories, agentStories } from './story-data'
import { eventStories } from './event-data'

export type EntryInput = Pick<NarrativeEntry, 'id' | 'title' | 'contentType' | 'chapter' | 'releaseVersion' | 'chronologicalOrder' | 'description' | 'placementReason' | 'sourceURLs'> &
  Partial<Omit<NarrativeEntry, 'id' | 'title' | 'contentType' | 'chapter' | 'releaseVersion' | 'chronologicalOrder' | 'description' | 'placementReason' | 'sourceURLs' | 'season'>>

const chapterIndex = new Map(chapters.map((chapter, index) => [chapter.id, { chapter, index }]))

export const entries = [...mainStories, ...agentStories, ...eventStories].map((entry): NarrativeEntry => {
  const info = chapterIndex.get(entry.chapter)
  if (!info) throw new Error('Unknown chapter for ' + entry.id)
  return {
    placementAfter: [],
    placementBefore: [],
    prerequisites: null,
    officialRecommendation: null,
    availability: 'unknown',
    optional: true,
    spoilerDescription: null,
    placementConfidence: 'continuity',
    relatedEntryIDs: [],
    childQuestIDs: [],
    characters: [],
    ...entry,
    season: info.chapter.season,
    chronologicalOrder: (info.index + 1) * 1000 + entry.chronologicalOrder,
  }
}).sort((a, b) => a.chronologicalOrder - b.chronologicalOrder)

export const entryByID: Record<string, NarrativeEntry> = Object.fromEntries(entries.map((entry) => [entry.id, entry]))
