import { useRef, useState } from 'react'
import { ArrowUpRight, Download, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { agentByID, bangbooByID, engineByID } from './data'
import { parseCollection, serializeCollection } from './collection'
import type { CollectionState } from './collection'
import { dbPath } from './navigation'
import { SavedSquads } from './Teams'
import { DBPanel, Ownership, RecordLink } from './ui'
import './database.css'

export default function CollectionPage({ state }: { state: CollectionState }) {
  const input = useRef<HTMLInputElement>(null)
  const [message,setMessage] = useState('')
  const [pendingImport,setPendingImport] = useState<ReturnType<typeof parseCollection>>()
  const {collection} = state
  const groups = [
    { title:'Agents',kind:'agents',ids:agentByID },
    { title:'W-Engines',kind:'engines',ids:engineByID },
    { title:'Bangboo',kind:'bangboo',ids:bangbooByID },
  ] as const
  function exportBackup() {
    const blob = new Blob([serializeCollection(collection)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'zenlessentials-collection.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url),1000)
    setMessage('Collection backup exported.')
  }
  async function readBackup(file: File) {
    setPendingImport(undefined)
    setMessage('')
    try {
      if (file.size > 1_000_000) throw new Error('This backup exceeds the 1 MB size limit.')
      const raw = await file.text()
      setPendingImport(parseCollection(raw))
    } catch (error) {
      setMessage(error instanceof SyntaxError ? 'That file is invalid JSON.' : error instanceof Error ? error.message : 'Could not read the backup.')
    }
  }
  return <div className="db profile-collection">
    <div className="profile-collection-heading">
      <h2>Your Collection</h2>
      <div className="db-actions">
        <Link className="secondary-button" to={dbPath('teams')}>Team Builder <ArrowUpRight size={14} /></Link>
        <Link className="secondary-button" to={dbPath('tiers') + '?view=personal'}>My Tier List <ArrowUpRight size={14} /></Link>
      </div>
    </div>
    <div className="db-count-strip db-collection-counts">{groups.map((group) => <div key={group.kind}>
      <strong>{Object.keys(collection[group.kind]).filter((id) => group.ids.has(id)).length}</strong><span>Owned {group.title}</span>
    </div>)}</div>
    {groups.map(({title,kind,ids}) => <DBPanel title={title} key={kind}>
      <div className="db-related">{Object.keys(collection[kind]).flatMap((id) => {
        const record = ids.get(id)
        return record ? [<div className="db-collection-card" key={id}><RecordLink route={kind} record={record} />
          <Ownership state={state} kind={kind} id={id} /></div>] : []
      })}</div>
      {!Object.keys(collection[kind]).some((id) => ids.has(id)) && <Link className="secondary-button" to={dbPath(kind)}>Browse {title} <ArrowUpRight size={14} /></Link>}
    </DBPanel>)}
    <div className="db-two-columns">
      <DBPanel title="Favorite Agents">
        {collection.favorites.length ? collection.favorites.map((id) => {
          const agent = agentByID.get(id)
          return agent && <RecordLink key={id} route="agents" record={agent} />
        }) : <p className="db-muted">Favorites appear here when you star an Agent.</p>}
      </DBPanel>
      <DBPanel title="Wishlist">
        {collection.planned.length ? collection.planned.map((id) => {
          const group = groups.find((group) => group.ids.has(id))
          const record = group?.ids.get(id)
          return group && record && <div className="db-wishlist-row" key={id}>
            <RecordLink route={group.kind} record={record} /><button type="button" className="secondary-button" aria-label={'Remove ' + record.name + ' from wishlist'} onClick={() => state.toggleList('planned',id)}>Remove</button>
          </div>
        }) : <p className="db-muted">Use Plan to acquire on a record to add it here.</p>}
      </DBPanel>
    </div>
    <SavedSquads state={state} />
    <DBPanel title="Collection backup" note="Save your collection, squads, and personal tiers as a file you can import on another device.">
      <div className="db-actions">
        <button className="secondary-button" type="button" onClick={exportBackup}><Download size={16} /> Export collection</button>
        <button className="secondary-button" type="button" onClick={() => input.current?.click()}><Upload size={16} /> Import collection</button>
      </div>
      <input hidden type="file" ref={input} aria-label="Collection backup file" accept=".json,application/json" onChange={(event) => {
        const file = event.currentTarget.files?.[0]
        event.currentTarget.value = ''
        if (file) void readBackup(file)
      }} />
      {pendingImport && <div className="db-import-confirm">
        <p>Replace the current collection with this backup?</p>
        <div className="db-actions">
          <button className="secondary-button" type="button" onClick={() => {
            state.setCollection(pendingImport)
            setPendingImport(undefined)
            setMessage('Collection imported.')
          }}>Replace collection</button>
          <button className="secondary-button" type="button" onClick={() => setPendingImport(undefined)}>Cancel</button>
        </div>
      </div>}
      {message && <p role="status">{message}</p>}
      <Link className="profile-backup-link" to="/settings">Story progress backup in Settings <ArrowUpRight size={14} /></Link>
    </DBPanel>
  </div>
}
