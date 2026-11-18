import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { NarrativeEntry } from './data/model'
import { defaultTheme, isTheme } from './themes'
import type { Theme } from './themes'

export type Completion = { method: 'played' | 'watched'; completedAt: string | null }
export type Progress = Record<string, Completion>
const progressKey = 'zenlessentials.progress'
const preferenceKey = 'zenlessentials.preferences'
const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/
const idFormat = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const reservedIDs = new Set(['constructor', 'prototype'])

export const defaults = {
  spoilerSafe: true,
  hideCompleted: false,
  showOptional: true,
  showExpired: true,
  majorOnly: false,
  theme: defaultTheme as Theme,
}
export type Preferences = typeof defaults

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseProgress(raw: string): Progress {
  if (raw.length > 2_000_000) throw new Error('This backup exceeds the 2 MB size limit.')
  const data: unknown = JSON.parse(raw)
  if (!record(data) || data.format !== 'zenlessentials-progress' || data.version !== 1 || !record(data.completions)) {
    throw new Error('Choose a Zenlessentials progress backup with format version 1.')
  }
  const result: Progress = {}
  for (const [id, value] of Object.entries(data.completions)) {
    if (id.length > 128 || !idFormat.test(id) || reservedIDs.has(id) || !record(value) ||
      (value.method !== 'played' && value.method !== 'watched') ||
      (value.completedAt !== null && (typeof value.completedAt !== 'string' ||
        !dateFormat.test(value.completedAt) || !Number.isFinite(Date.parse(value.completedAt))))) {
      throw new Error('The backup contains an invalid completion record.')
    }
    result[id] = { method: value.method, completedAt: value.completedAt }
  }
  return result
}

export function serializeProgress(completions: Progress) {
  return JSON.stringify({ format: 'zenlessentials-progress', version: 1, completions }, null, 2)
}

export function mergeProgress(current: Progress, backup: Progress): Progress {
  const result = { ...current }
  for (const [id, imported] of Object.entries(backup)) {
    const existing = result[id]
    const oldTime = existing?.completedAt ? Date.parse(existing.completedAt) : -Infinity
    const newTime = imported.completedAt ? Date.parse(imported.completedAt) : -Infinity
    if (!existing || newTime > oldTime) result[id] = imported
  }
  return result
}

export function readProgress(): Progress {
  try {
    const saved = localStorage.getItem(progressKey)
    return saved ? parseProgress(saved) : {}
  } catch {
    return {}
  }
}

export function parsePreferences(saved: unknown): Preferences {
  const preferences = { ...defaults }
  if (record(saved)) {
    if (isTheme(saved.theme)) preferences.theme = saved.theme
    for (const key of Object.keys(defaults) as (keyof Preferences)[]) {
      const value = saved[key]
      if (key !== 'theme' && typeof value === 'boolean') preferences[key] = value
    }
  }
  return preferences
}

export function readPreferences(): Preferences {
  try {
    return parsePreferences(JSON.parse(localStorage.getItem(preferenceKey) ?? '{}'))
  } catch {
    // Storage might be unavailable in private or restricted contexts.
  }
  return defaults
}

export function useTracker() {
  const [progress, setProgress] = useState(readProgress)
  const [preferences, setPreferences] = useState(readPreferences)
  const [progressStorageError, setProgressStorageError] = useState(false)
  const [preferenceStorageError, setPreferenceStorageError] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(progressKey, serializeProgress(progress))
      setProgressStorageError(false)
    } catch {
      setProgressStorageError(true)
    }
  }, [progress])

  useEffect(() => {
    try {
      localStorage.setItem(preferenceKey, JSON.stringify(preferences))
      setPreferenceStorageError(false)
    } catch {
      setPreferenceStorageError(true)
    }
  }, [preferences])

  useEffect(() => {
    function synchronize(event: StorageEvent) {
      if (event.key === progressKey) setProgress(readProgress())
      if (event.key === preferenceKey) setPreferences(readPreferences())
    }
    window.addEventListener('storage', synchronize)
    return () => window.removeEventListener('storage', synchronize)
  }, [])

  return trackerActions({ progress, setProgress, preferences, setPreferences, storageError: progressStorageError || preferenceStorageError })
}

export function trackerActions(state: {
  progress: Progress; setProgress: Dispatch<SetStateAction<Progress>>
  preferences: Preferences; setPreferences: Dispatch<SetStateAction<Preferences>>; storageError: boolean
}) {
  function mark(id: string, method: Completion['method'] | 'toggle') {
    state.setProgress((current) => {
      if (method === 'toggle' && Object.hasOwn(current, id)) {
        const next = { ...current }
        delete next[id]
        return next
      }
      return { ...current, [id]: { method: method === 'toggle' ? 'played' : method, completedAt: new Date().toISOString() } }
    })
  }

  return { ...state, mark }
}

export type Tracker = ReturnType<typeof useTracker>

export function isComplete(entry: NarrativeEntry, progress: Progress) {
  return entry.childQuestIDs.length
    ? entry.childQuestIDs.every((id) => Object.hasOwn(progress, id))
    : Object.hasOwn(progress, entry.id)
}

export function totals(entries: NarrativeEntry[], progress: Progress) {
  const items = entries.filter((entry) => !entry.childQuestIDs.length)
  const done = items.filter((entry) => isComplete(entry, progress)).length
  return { done, total: items.length, percent: items.length ? Math.round(100 * done / items.length) : 0 }
}
