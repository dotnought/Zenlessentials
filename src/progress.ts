import { useEffect, useState } from 'react'
import type { NarrativeEntry } from './data/model'

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

function readProgress(): Progress {
  try {
    const saved = localStorage.getItem(progressKey)
    return saved ? parseProgress(saved) : {}
  } catch {
    return {}
  }
}

function readPreferences(): Preferences {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(preferenceKey) ?? '{}')
    if (record(saved)) {
      return { ...defaults, ...Object.fromEntries(
        Object.entries(defaults).filter(([key]) => typeof saved[key] === 'boolean').map(([key]) => [key, saved[key]]),
      ) }
    }
  } catch {
    // Storage might be unavailable in private or restricted contexts.
  }
  return defaults
}

export function useTracker() {
  const [progress, setProgress] = useState(readProgress)
  const [preferences, setPreferences] = useState(readPreferences)
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(progressKey, serializeProgress(progress))
      localStorage.setItem(preferenceKey, JSON.stringify(preferences))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }, [progress, preferences])

  useEffect(() => {
    function synchronize(event: StorageEvent) {
      if (event.key === progressKey) setProgress(readProgress())
      if (event.key === preferenceKey) setPreferences(readPreferences())
    }
    window.addEventListener('storage', synchronize)
    return () => window.removeEventListener('storage', synchronize)
  }, [])

  function mark(id: string, method: Completion['method'] | 'toggle') {
    setProgress((current) => {
      if (method === 'toggle' && Object.hasOwn(current, id)) {
        const next = { ...current }
        delete next[id]
        return next
      }
      return { ...current, [id]: { method: method === 'toggle' ? 'played' : method, completedAt: new Date().toISOString() } }
    })
  }

  return { progress, mark, setProgress, preferences, setPreferences, storageError }
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
