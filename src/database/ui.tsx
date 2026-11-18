import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Bookmark, Check, ChevronRight, Database, ImageOff, Search, Star } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { agentByID, bangbooByID, catalog, materialByID } from './data'
import type { CollectionState } from './collection'
import type { Agent, Asset, MaterialCost, Rank } from './model'
import { databaseSections, dbPath } from './navigation'

export function DatabaseNav() {
  return <nav className="db-nav" aria-label="Database sections">
    <NavLink to={dbPath()} end><Database size={16} /> Overview</NavLink>
    {databaseSections.map(({ key, title, icon: Icon }) => <NavLink key={key} to={dbPath(key)}><Icon size={15} />{title}</NavLink>)}
  </nav>
}

export function DBHeading({ section, title, description, children }: { section?: string; title: string; description?: string; children?: ReactNode }) {
  return <header className="db-page-heading">
    <div>
      <div className="db-kicker"><Link to={dbPath()}>Database</Link>{section && <><ChevronRight size={12} />{section}</>}</div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {children}
  </header>
}

export function DBPanel({ title, children, id, note }: { title: string; children?: ReactNode; id?: string; note?: string }) {
  return <section className="panel db-panel" id={id}><h2>{title}</h2>{note && <p className="db-muted">{note}</p>}{children}</section>
}

export function Thumbnail({ asset, portrait = false, eager = false, className = '' }: { asset: Asset; portrait?: boolean; eager?: boolean; className?: string }) {
  const source = portrait ? asset.portrait ?? asset.image : asset.image ?? asset.portrait
  const [failed,setFailed] = useState<string>()
  return <span className={'db-thumbnail ' + className}>
    {source && source !== failed ? <img src={source} alt="" width={portrait ? 240 : 620} height={portrait ? 240 : 620} decoding="async" loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(source)} /> : <ImageOff aria-hidden="true" size={22} />}
  </span>
}

export function Tags({ items }: { items: (string | undefined)[] }) {
  return <div className="db-tags">{items.filter(Boolean).map((tag, index) => <span key={index}>{tag && catalog.icons[tag] && <img src={catalog.icons[tag]} alt="" width={15} height={15} loading="lazy" />}{tag}</span>)}</div>
}

export function RankBadge({ rank }: { rank: Rank }) {
  return <span className={'db-rank db-rank-' + rank.toLowerCase()} aria-label={rank + ' Rank'}>{rank}</span>
}

export function RecordLink({ route, record, meta }: { route: string; record: Asset & { name: string; id: string }; meta?: string }) {
  return <Link className="db-record-link" to={dbPath(route, record.id)}>
    <Thumbnail asset={record} portrait />
    <span><strong>{record.name}</strong>{meta && <small>{meta}</small>}</span>
    <ChevronRight size={14} className="db-link-caret" />
  </Link>
}

export function AgentLink({ agent, meta }: { agent: Agent; meta?: string }) {
  return <RecordLink route="agents" record={agent} meta={meta ?? agent.specialty + ' · ' + agent.attribute} />
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="panel db-empty"><Search size={22} /><p>{children}</p></div>
}

export function Sources({ urls }: { urls: string[] }) {
  return <div className="db-sources">{[...new Set(urls)].map((url) => <a href={url} rel="noreferrer" target="_blank" key={url}>
    {new URL(url).hostname.replace(/^www\./, '')} <ArrowUpRight size={13} />
  </a>)}</div>
}

export function Materials({ costs }: { costs: MaterialCost[] }) {
  return costs.length ? <dl className="db-materials">
    {costs.map((cost) => {
      const material = materialByID.get(cost.id)
      return <div key={cost.id}><dt>{material?.name}{material?.acquisition && <small>{material.acquisition}</small>}</dt><dd>{cost.count.toLocaleString()}</dd></div>
    })}
  </dl> : <p className="db-muted">No material costs are verified for this section.</p>
}

export function Ownership({ state, kind, id }: { state: CollectionState; kind: 'agents' | 'engines' | 'bangboo'; id: string }) {
  const level = state.collection[kind][id]
  const planned = state.collection.planned.includes(id)
  const favorite = state.collection.favorites.includes(id)
  const start = kind === 'agents' ? 0 : 1
  const count = kind === 'agents' ? 7 : 5
  const label = kind === 'agents' ? 'Mindscape' : kind === 'engines' ? 'Overclock' : 'Stars'
  return <div className="db-actions">
    <button type="button" className="secondary-button" aria-pressed={level !== undefined}
      onClick={() => state.setOwned(kind, id, level === undefined ? start : undefined)}><Check size={16} />{level === undefined ? 'Mark owned' : 'Owned'}</button>
    {level !== undefined && <label className="db-control db-inline-control">{label}
      <select value={level} onChange={(event) => state.setOwned(kind, id, Number(event.target.value))}>
        {Array.from({ length: count }, (_, index) => <option key={index} value={start + index}>{start + index}</option>)}
      </select>
    </label>}
    {kind === 'agents' && <button type="button" className="secondary-button" aria-pressed={favorite} onClick={() => state.toggleList('favorites', id)}>
      <Star size={15} /> {favorite ? 'Favorited' : 'Favorite'}</button>}
    <button type="button" className="secondary-button" aria-pressed={planned} onClick={() => state.toggleList('planned', id)}>
      <Bookmark size={15} /> {planned ? 'Planned' : 'Plan to acquire'}</button>
  </div>
}

export function SquadLinks({ agentIds, bangbooId }: { agentIds: readonly string[]; bangbooId?: string }) {
  const boo = bangbooId ? bangbooByID.get(bangbooId) : undefined
  return <div className="db-squad-links">
    {agentIds.map((id) => {
      const agent = agentByID.get(id)
      return agent && <AgentLink key={id} agent={agent} />
    })}
    {boo && <RecordLink route="bangboo" record={boo} meta="Bangboo" />}
  </div>
}

export function OpenSquad({ agentIds, bangbooId }: { agentIds: readonly string[]; bangbooId?: string }) {
  const query = new URLSearchParams({ squad: agentIds.join(',') })
  if (bangbooId) query.set('bangboo', bangbooId)
  return <Link className="secondary-button" to={dbPath('teams') + '?' + query.toString()}>Open in Team Builder <ArrowRight size={15} /></Link>
}

export function RelativeDate({ value }: { value: string }) {
  const [day, time] = value.split('T')
  const display = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(day + 'T00:00:00Z'))
  return <time dateTime={value}>{display}{time && ' · ' + time.slice(0, 5)}</time>
}
