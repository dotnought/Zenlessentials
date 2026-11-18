import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, ChevronDown, CircleHelp, Eye, EyeOff, LockKeyhole, MapPin } from 'lucide-react'
import type { NarrativeEntry } from '../data/model'
import { availabilityLabels, categories, confidenceLabels, entryAnchor, getAvailability, seasons } from '../data/model'
import { chapters } from '../data/chapters'
import { entryByID } from '../data/timeline'
import { isComplete, totals } from '../progress'
import type { Tracker } from '../progress'
import { ProgressBar, TypeIcon } from './visuals'

export function storyLink(entry: NarrativeEntry) {
  return '/timeline?season=' + entry.season + '#' + entryAnchor(entry.id)
}

type Props = {
  entry: NarrativeEntry
  tracker: Tracker
  nextID?: string
  childFilter?: Set<string>
  showChildMatch?: boolean
  target?: string
}

export function StoryCard({ entry, tracker, nextID, childFilter, showChildMatch, target }: Props) {
  const [expanded, setExpanded] = useState<{ target?: string; value: boolean }>()
  const [revealed, setRevealed] = useState(false)
  const complete = isComplete(entry, tracker.progress)
  const children = entry.childQuestIDs.map((id) => entryByID[id])
  const group = children.length > 0
  const linkedChild = children.some((child) => entryAnchor(child.id) === target)
  const deepLinked = target === entryAnchor(entry.id) || linkedChild
  const open = expanded && expanded.target === target ? expanded.value : deepLinked || Boolean(showChildMatch)
  const toggle = () => setExpanded({ target, value: !open })
  const availability = getAvailability(entry)
  const canWatch = availability === 'expired' || availability === 'archived' || availability === 'unknown'
  const watched = tracker.progress[entry.id]?.method === 'watched'
  const groupProgress = totals(children, tracker.progress)
  const shownChildren = children.filter((child) => !childFilter || childFilter.has(child.id))
  const connections = [...new Set([...entry.placementAfter, ...entry.placementBefore, ...entry.relatedEntryIDs])]
  const detailID = 'details-' + entry.id
  const chapter = chapters.find((item) => item.id === entry.chapter)

  return <article id={entryAnchor(entry.id)} className={'story-card type-' + entry.contentType + (complete ? ' is-complete' : '') + (nextID === entry.id ? ' is-next' : '') + (entry.parentID ? ' story-child' : '')}>
    <div className="story-row">
      <div className="type-icon"><TypeIcon type={entry.contentType} /></div>
      <button type="button" className="story-title" aria-expanded={open} aria-controls={detailID} onClick={toggle}>
        <span className="story-meta">
          <span className="type-label">{categories[entry.contentType]}</span>
          {!entry.parentID && entry.releaseVersion && <span className="version-tag">v{entry.releaseVersion}</span>}
          {!entry.parentID && (availability === 'expired' || availability === 'limited') && <span className={'version-tag status-' + availability}>{availabilityLabels[availability]}</span>}
          {nextID === entry.id && <span className="next-tag">UP NEXT</span>}
          {watched && <span className="watched-tag">Watched</span>}
        </span>
        <strong>{entry.title}</strong>
        {entry.characters.length > 0 && !entry.parentID && <span className="story-characters">{entry.characters.join(' · ')}</span>}
      </button>
      {group
        ? <div className="group-count" aria-label={groupProgress.done + ' of ' + groupProgress.total + ' quests complete'}>{groupProgress.done}/{groupProgress.total}</div>
        : <label className="checkbox">
            <input type="checkbox" checked={complete} aria-label={'Complete ' + entry.title} onChange={() => tracker.mark(entry.id, !complete && availability === 'expired' ? 'watched' : 'toggle')} />
            <span><Check size={16} strokeWidth={3} /></span>
          </label>}
      <button type="button" className="icon-button details-toggle" aria-label={(open ? 'Collapse ' : 'Expand ') + entry.title} aria-expanded={open} aria-controls={detailID} onClick={toggle}><ChevronDown size={17} className={open ? 'rotated' : ''} /></button>
    </div>
    {open && <div className="story-details" id={detailID}>
      <div className="detail-head">
        <span className={'availability status-' + availability}><i />{availabilityLabels[availability]}</span>
        <span className="confidence"><MapPin size={13} />{confidenceLabels[entry.placementConfidence]}</span>
        <span className="confidence">{entry.optional ? 'Optional' : 'Core story'}</span>
      </div>
      <p className="entry-summary">{entry.description}</p>
      <dl className="story-facts">
        {!entry.parentID && <div><dt><MapPin size={14} /> Timeline section</dt><dd>{seasons[entry.season - 1].title} · {chapter?.label}</dd></div>}
        <div><dt><LockKeyhole size={14} /> In-game requirements</dt><dd>{entry.prerequisites || 'Unverified'}</dd></div>
        <div><dt><MapPin size={14} /> Why here?</dt><dd>{entry.placementReason}</dd></div>
        {entry.officialRecommendation && <div><dt>HoYoverse recommends</dt><dd>{entry.officialRecommendation}</dd></div>}
      </dl>
      {entry.notes && <p className="entry-note"><CircleHelp size={15} />{entry.notes}</p>}
      {entry.spoilerDescription && <div className="spoiler-panel">
        {tracker.preferences.spoilerSafe && !complete && !revealed
          ? <button type="button" onClick={() => setRevealed(true)}><EyeOff size={15} /> Reveal story spoilers</button>
          : <><p>{entry.spoilerDescription}</p>{tracker.preferences.spoilerSafe && !complete && <button type="button" onClick={() => setRevealed(false)}><Eye size={15} /> Hide spoilers</button>}</>}
      </div>}
      {(connections.length > 0 || entry.sourceURLs.length > 0) && <div className="story-links">
        {connections.map((id) => <Link key={id} to={storyLink(entryByID[id])}>{entryByID[id].title}<ArrowUpRight size={12} /></Link>)}
        {entry.sourceURLs.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={12} /></a>)}
      </div>}
      {canWatch && !group && <div className="watch-actions">
        <button type="button" className="secondary-button" disabled={watched} onClick={() => tracker.mark(entry.id, 'watched')}><Eye size={14} /> {watched ? 'Watched' : 'Mark watched'}</button>
        {availability !== 'expired' && <button type="button" className="secondary-button" disabled={complete && !watched} onClick={() => tracker.mark(entry.id, 'played')}>Mark played</button>}
      </div>}
      {group && <div className="quest-chain">
        <div className="quest-chain-heading"><strong>Quest chain</strong><span>{groupProgress.done} of {groupProgress.total} complete</span></div>
        <ProgressBar percent={groupProgress.percent} />
        {shownChildren.map((child) => <StoryCard key={child.id} entry={child} tracker={tracker} nextID={nextID} target={target} />)}
        {shownChildren.length === 0 && <p>No quests match the current filters.</p>}
      </div>}
    </div>}
  </article>
}
