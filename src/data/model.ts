export const categories = {
  main: 'Main Story',
  special: 'Special Episode',
  agent: 'Agent Story',
  major: 'Major Event',
  minor: 'Minor Narrative Event',
  side: 'Permanent Side Content',
  archive: 'Video Archive Story',
} as const

export const availabilityLabels = {
  permanent: 'Permanent',
  limited: 'Limited time',
  archived: 'Archived / replayable',
  expired: 'Expired',
  unknown: 'Availability unknown',
} as const

export const confidenceLabels = {
  official: 'Official recommendation',
  continuity: 'Continuity-based',
  flexible: 'Flexible',
} as const

export type ContentType = keyof typeof categories
export type Availability = keyof typeof availabilityLabels
export type Confidence = keyof typeof confidenceLabels
export type SeasonID = (typeof seasons)[number]['id']
export type Source = { label: string; url: string; kind: 'official' | 'database' | 'community' }
export type Chapter = { id: string; season: SeasonID; label: string; title: string; description: string }
export type NarrativeEntry = {
  id: string
  title: string
  contentType: ContentType
  season: SeasonID
  chapter: string
  releaseVersion: string | null
  chronologicalOrder: number
  placementAfter: string[]
  placementBefore: string[]
  prerequisites: string | null
  officialRecommendation: string | null
  availability: Availability
  limitedUntil?: string
  optional: boolean
  description: string
  spoilerDescription: string | null
  placementReason: string
  placementConfidence: Confidence
  sourceURLs: Source[]
  relatedEntryIDs: string[]
  childQuestIDs: string[]
  parentID?: string
  characters: string[]
  notes?: string
}

export const seasons = [
  { id: 1, title: 'New Eridu', subtitle: 'The city behind the Hollow', versions: '1.0–1.7' },
  { id: 2, title: 'Waifei Peninsula', subtitle: 'Across the waters', versions: '2.0–2.8' },
  { id: 3, title: 'Roscaelifer', subtitle: 'Above the clouds', versions: '3.0–3.3' },
] as const
export const gameVersion = '3.3'
export const chapterID = (chapter: Pick<Chapter, 'id'>) => 'chapter-' + chapter.id
export const entryAnchor = (id: string) => 'story-' + id

export function getAvailability(entry: NarrativeEntry, now = new Date()): Availability {
  if (entry.availability === 'limited' && entry.limitedUntil && now >= new Date(entry.limitedUntil)) return 'expired'
  return entry.availability
}
