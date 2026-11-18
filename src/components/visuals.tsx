import { BookOpen, Film, Fingerprint, Flag, Radio, Sparkles, Waypoints } from 'lucide-react'
import type { ContentType } from '../data/model'

const typeIcons = {
  main: BookOpen,
  special: Film,
  agent: Fingerprint,
  major: Flag,
  minor: Sparkles,
  side: Waypoints,
  archive: Radio,
}

export function TypeIcon({ type, size = 17 }: { type: ContentType; size?: number }) {
  const Icon = typeIcons[type]
  return <Icon size={size} aria-hidden="true" />
}

export function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  return <div className={'progress-track ' + className} role="progressbar" aria-label="Completion" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
    <span style={{ width: percent + '%' }} />
  </div>
}

export function Ring({ percent, size = 94 }: { percent: number; size?: number }) {
  return <div className="progress-ring" style={{ width: size, height: size }} role="img" aria-label={percent + '% complete'}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="43" className="ring-track" />
      <circle cx="50" cy="50" r="43" className="ring-fill" pathLength="100" strokeDasharray={percent + ' 100'} />
    </svg>
    <strong>{percent}<small>%</small></strong>
  </div>
}
