import { useRef, useState } from 'react'
import { Check, Download, EyeOff, HardDrive, Palette, RotateCcw, Share, Upload } from 'lucide-react'
import { mergeProgress, parseProgress, serializeProgress } from '../progress'
import type { Preferences, Tracker } from '../progress'
import { themes } from '../themes'

const backupName = 'zenlessentials-progress.json'
const backupType = 'application/json'

const switches: { key: Exclude<keyof Preferences, 'theme'>; title: string; note: string }[] = [
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
  const canShareBackup = !compact && typeof navigator.share === 'function' &&
    navigator.canShare?.({ files: [new File(['{}'], backupName, { type: backupType })] })

  async function importFile(file: File) {
    try {
      if (file.size > 2_000_000) throw new Error('This backup exceeds the 2 MB size limit.')
      const parsed = parseProgress(await file.text())
      tracker.setProgress((current) => mergeProgress(current, parsed))
      setMessage('Backup merged with your progress.')
    } catch (error) {
      setMessage(error instanceof SyntaxError ? 'This file is not valid JSON.' : error instanceof Error ? error.message : 'Import failed.')
    }
  }

  function exportFile() {
    const url = URL.createObjectURL(new Blob([serializeProgress(tracker.progress)], { type: backupType }))
    const link = document.createElement('a')
    link.href = url
    link.download = backupName
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Backup exported.')
  }

  async function shareBackup() {
    try {
      const file = new File([serializeProgress(tracker.progress)], backupName, { type: backupType })
      await navigator.share({ files: [file] })
      setMessage('Backup shared.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setMessage('Sharing is unavailable. Use Export JSON to save your backup.')
    }
  }

  return <div className={compact ? 'compact-settings' : 'settings-layout'}>
    {!compact && <section className="panel settings-panel appearance-panel">
      <h2 id="appearance-heading"><Palette size={17} /> Appearance</h2>
      <div className="theme-options" role="radiogroup" aria-labelledby="appearance-heading">
        {themes.map((theme) => {
          const selected = tracker.preferences.theme === theme.id
          return <label key={theme.id} className="theme-option">
            <input type="radio" name="site-theme" value={theme.id} checked={selected}
              onChange={() => tracker.setPreferences((current) => ({ ...current, theme: theme.id }))} />
            <span className="theme-card">
              <span className="theme-preview" data-palette={theme.id} aria-hidden="true"><i /><i /><i /></span>
              <span className="theme-name">{theme.name}{selected && <Check size={15} aria-hidden="true" />}</span>
            </span>
          </label>
        })}
      </div>
    </section>}
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
      <p>Export a backup to move progress between Safari and the Home Screen app, or to another browser or device.</p>
      <div className="settings-actions">
        <button type="button" className="secondary-button" onClick={exportFile}><Download size={15} /> Export JSON</button>
        {canShareBackup && <button type="button" className="secondary-button" onClick={() => void shareBackup()}><Share size={15} /> Share backup</button>}
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
