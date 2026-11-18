import { useRef, useState } from 'react'
import { Download, EyeOff, HardDrive, RotateCcw, Upload } from 'lucide-react'
import { parseProgress, serializeProgress } from '../progress'
import type { Preferences, Tracker } from '../progress'

const switches: { key: keyof Preferences; title: string; note: string }[] = [
  { key: 'spoilerSafe', title: 'Spoiler-safe mode', note: 'Hide plot details for unfinished stories.' },
  { key: 'hideCompleted', title: 'Hide completed', note: 'Focus on stories you still have to finish.' },
  { key: 'showOptional', title: 'Include optional content', note: 'Show side stories and other optional entries.' },
  { key: 'showExpired', title: 'Include expired content', note: 'Show past events you can mark as watched.' },
  { key: 'majorOnly', title: 'Major events only', note: 'Hide smaller narrative events from the timeline.' },
]

export function Settings({ tracker, compact = false }: { tracker: Tracker; compact?: boolean }) {
  const [message, setMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const preferences = compact ? switches.slice(0, 2) : switches

  async function importFile(file: File) {
    try {
      if (file.size > 2_000_000) throw new Error('This backup exceeds the 2 MB size limit.')
      const parsed = parseProgress(await file.text())
      tracker.setProgress((current) => {
        const result = { ...current }
        for (const [id, imported] of Object.entries(parsed)) {
          if (!result[id] || (imported.completedAt ?? '') > (result[id].completedAt ?? '')) result[id] = imported
        }
        return result
      })
      setMessage('Backup merged with your progress.')
    } catch (error) {
      setMessage(error instanceof SyntaxError ? 'This file is not valid JSON.' : error instanceof Error ? error.message : 'Import failed.')
    }
  }

  function exportFile() {
    const url = URL.createObjectURL(new Blob([serializeProgress(tracker.progress)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'zenlessentials-progress.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Backup exported.')
  }

  return <div className={compact ? 'compact-settings' : 'settings-layout'}>
    <section className="panel settings-panel">
      <h2><EyeOff size={17} /> {compact ? 'Quick settings' : 'Story visibility'}</h2>
      {preferences.map(({ key, title, note }) => <label key={key} className="setting-row">
        <span><strong>{title}</strong>{!compact && <small>{note}</small>}</span>
        <input type="checkbox" role="switch" checked={tracker.preferences[key]} onChange={(event) => tracker.setPreferences((current) => ({ ...current, [key]: event.target.checked }))} />
        <span className="switch-track" aria-hidden="true" />
      </label>)}
    </section>
    {!compact && <section className="panel settings-panel">
      <h2><HardDrive size={17} /> Local progress</h2>
      <p>Progress lives in this browser for this website. Export a backup to move it to another browser or device.</p>
      <div className="settings-actions">
        <button type="button" className="secondary-button" onClick={exportFile}><Download size={15} /> Export JSON</button>
        <button type="button" className="secondary-button" onClick={() => fileInput.current?.click()}><Upload size={15} /> Import JSON</button>
        <button type="button" className="secondary-button danger" onClick={() => {
          if (window.confirm('Clear every completion saved on this browser?')) {
            tracker.setProgress({})
            setMessage('All completions cleared.')
          }
        }}><RotateCcw size={15} /> Reset progress</button>
      </div>
      <input ref={fileInput} type="file" aria-label="Import progress backup" accept=".json,application/json" onChange={(event) => {
        const file = event.currentTarget.files?.[0]
        event.currentTarget.value = ''
        if (file) void importFile(file)
      }} hidden />
      <p className="settings-message" role="status">{message}</p>
    </section>}
  </div>
}
