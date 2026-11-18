import { useCallback, useEffect, useRef, useState } from 'react'
import type { SetStateAction } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { emptySaves, equalSaves, importGuestSaves, mergeSaves, parseSaves, readGuestSaves } from './saves'
import type { Saves } from './saves'

type CloudCopy = { revision: number; snapshot: Saves }
type CachedSaves = { base: CloudCopy; snapshot: Saves; guestImported: boolean }
type SyncStatus = 'connecting' | 'syncing' | 'saved' | 'offline' | 'error'
const emptyCopy = { revision: 0, snapshot: emptySaves }
const emptyCache = { base: emptyCopy, snapshot: emptySaves, guestImported: false }
const table = 'account_saves'

function readCache(key: string): CachedSaves | undefined {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const { base, snapshot, guestImported } = JSON.parse(raw)
    if (!Number.isSafeInteger(base?.revision) || base.revision < 0) return
    return {
      base: { revision: base.revision, snapshot: parseSaves(base.snapshot) },
      snapshot: parseSaves(snapshot),
      guestImported: guestImported === true,
    }
  } catch {
    return undefined
  }
}

async function readCloud(client: SupabaseClient, userId: string): Promise<CloudCopy> {
  const { data, error } = await client.from(table).select('revision,snapshot').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data ? { revision: data.revision, snapshot: parseSaves(data.snapshot) } : emptyCopy
}

async function writeCloud(client: SupabaseClient, userId: string, revision: number, snapshot: Saves): Promise<boolean> {
  if (revision === 0) {
    const { error } = await client.from(table).insert({ user_id: userId, revision: 1, snapshot })
    if (error && error.code !== '23505') throw error
    return !error
  }
  const { data, error } = await client.from(table).update({ revision: revision + 1, snapshot })
    .eq('user_id', userId).eq('revision', revision).select('revision').maybeSingle()
  if (error) throw error
  return data !== null
}

export function useCloudSaves(client: SupabaseClient, userId: string) {
  const key = 'zenlessentials.account-saves.' + userId
  const [cache, setCache] = useState(() => readCache(key) ?? emptyCache)
  const [status, setStatus] = useState<SyncStatus>('connecting')
  const [connected, setConnected] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const local = useRef(cache)
  const storageFailed = useRef(false)
  const mounted = useRef(false)
  const inFlight = useRef<Promise<void> | null>(null)

  const current = useCallback(() => {
    const cached = storageFailed.current ? undefined : readCache(key)
    return cached && cached.base.revision >= local.current.base.revision ? cached : local.current
  }, [key])

  const commit = useCallback((next: CachedSaves) => {
    local.current = next
    try {
      const raw = JSON.stringify(next)
      if (localStorage.getItem(key) !== raw) localStorage.setItem(key, raw)
      storageFailed.current = false
    } catch {
      storageFailed.current = true
    }
    setStorageError(storageFailed.current)
    setCache(next)
  }, [key])

  const syncChanges = useCallback(async () => {
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const remote = await readCloud(client, userId)
        if (!mounted.current) return
        const before = current()
        if (before.base.revision > remote.revision) continue
        const snapshot = mergeSaves(before.base.snapshot, before.snapshot, remote.snapshot)
        const changed = !equalSaves(snapshot, remote.snapshot)
        if (changed && !await writeCloud(client, userId, remote.revision, snapshot)) continue
        if (!mounted.current) return
        const revision = remote.revision + Number(changed)
        const after = current()
        if (after.base.revision > revision) continue
        const next = { ...after, base: { revision, snapshot }, snapshot: mergeSaves(before.snapshot, after.snapshot, snapshot) }
        if (!equalSaves(next, local.current)) commit(next)
        setConnected(true)
        setStatus('saved')
        return
      }
      setStatus('error')
    } catch {
      if (mounted.current) setStatus(navigator.onLine ? 'error' : 'offline')
    }
  }, [client, userId, current, commit])

  const synchronize = useCallback(() => {
    if (!mounted.current) return
    if (inFlight.current) return inFlight.current
    if (!navigator.onLine) { setStatus('offline'); return }
    setStatus('syncing')
    const request = syncChanges().finally(() => { inFlight.current = null })
    inFlight.current = request
    return request
  }, [syncChanges])

  useEffect(() => {
    mounted.current = true
    void synchronize()
    const refresh = () => { if (document.visibilityState === 'visible') void synchronize() }
    const offline = () => setStatus('offline')
    const updateFromTab = (event: StorageEvent) => {
      if (event.key !== key) return
      const next = current()
      if (equalSaves(local.current, next)) return
      local.current = next
      setCache(next)
    }
    const timer = window.setInterval(refresh, 30_000)
    window.addEventListener('online', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('offline', offline)
    window.addEventListener('storage', updateFromTab)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      mounted.current = false
      window.clearInterval(timer)
      window.removeEventListener('online', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('offline', offline)
      window.removeEventListener('storage', updateFromTab)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [current, key, synchronize])

  const pending = !equalSaves(cache.base.snapshot, cache.snapshot)
  useEffect(() => {
    if (!pending) return
    const timer = window.setTimeout(() => void synchronize(), 500)
    return () => window.clearTimeout(timer)
  }, [cache, pending, synchronize])

  function change<K extends keyof Saves>(kind: K, action: SetStateAction<Saves[K]>) {
    const before = current()
    const value = typeof action === 'function' ? action(before.snapshot[kind]) : action
    commit({ ...before, snapshot: { ...before.snapshot, [kind]: value } })
  }

  function importFromDevice() {
    const before = current()
    if (before.guestImported) return
    commit({ ...before, guestImported: true, snapshot: importGuestSaves(before.snapshot, readGuestSaves()) })
  }

  return {
    saves: cache.snapshot, status, storageError, change, synchronize, pending, importFromDevice,
    canImport: (connected || cache.base.revision > 0) && !cache.guestImported,
    guestImported: cache.guestImported,
  }
}
