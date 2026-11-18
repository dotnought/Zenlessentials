import { useMemo } from 'react'
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Layers3, Plus, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { agents, bangboo, catalog, discs, engines, observations, statByID } from './data'
import type { CollectionState } from './collection'
import type { Agent, Bangboo, Disc, Engine } from './model'
import { compareVersion, matchesQuery } from './mechanics'
import { databaseSections, dbPath } from './navigation'
import { DBHeading, Empty, RankBadge, RecordLink, Tags, Thumbnail } from './ui'

type RecordItem = Agent | Engine | Disc | Bangboo
type Kind = 'agents' | 'engines' | 'discs' | 'bangboo'
const entries = { agents, engines, discs, bangboo }
const facets = { rank: 'Rank', attribute: 'Attribute', specialty: 'Specialty', faction: 'Faction', version: 'Release version' } as const
const facetKeys = Object.keys(facets) as (keyof typeof facets)[]
const featured = [...agents].filter((agent) => agent.image)
  .sort((a,b) => compareVersion(b.version ?? '0',a.version ?? '0') || b.id.localeCompare(a.id)).slice(0,3)
const pageSize = 24

export function DatabaseHub() {
  return <>
    <section className="db-hero">
      <div className="db-hero-art" aria-hidden="true">{featured.map((agent) => <Thumbnail key={agent.id} asset={agent} eager />)}</div>
      <div className="db-hero-copy">
        <div className="db-kicker"><span /> PATCH {catalog.version} · NEW ERIDU</div>
        <h1>GAME<br /><em>DATABASE</em></h1>
        <p>Look up an Agent, check gear, and build a squad for your next Hollow run.</p>
        <Link className="primary-button" to={dbPath('agents')}>Browse Agents <ArrowRight size={16} /></Link>
      </div>
    </section>
    <div className="db-count-strip">
      {(['agents','engines','discs','bangboo'] as const).map((key) => <Link key={key} to={dbPath(key)}>
        <strong>{entries[key].length}</strong><span>{databaseSections.find((item) => item.key === key)?.title}</span>
      </Link>)}
    </div>
    <div className="db-home-grid">
      {databaseSections.map(({ key, title, description, icon: Icon }) => <Link className="panel db-category" key={key} to={dbPath(key)}>
        <span className="db-category-icon"><Icon size={21} /></span><div><strong>{title}</strong><p>{description}</p></div><ArrowUpRight size={15} />
      </Link>)}
      <Link className="panel db-category" to="/profile/collection">
        <span className="db-category-icon"><Layers3 size={21} /></span><div><strong>My Collection</strong><p>View your roster, wishlist and saved squads in Profile</p></div><ArrowUpRight size={15} />
      </Link>
    </div>
    <p className="db-muted db-coverage">Game data checked {catalog.checked}. <a href="https://github.com/dotnought/Zenlessentials/blob/main/DATABASE_SOURCES.md" target="_blank" rel="noreferrer">Sources and coverage <ArrowUpRight size={13} /></a></p>
  </>
}

export function Catalog({ kind, state }: { kind: Kind; state: CollectionState }) {
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page'))
  const q = params.get('q') ?? ''
  const owned = params.get('owned') ?? ''
  const sorting = params.get('sort') ?? 'name'
  const seen = useMemo(() => Object.fromEntries(facetKeys.map((key) => {
    const values = [...new Set(entries[kind].flatMap((entry) => key in entry && entry[key as keyof RecordItem] ? [String(entry[key as keyof RecordItem])] : []))]
      .sort((a,b) => key === 'version' ? compareVersion(b,a) : a.localeCompare(b))
    return [key, values]
  })), [kind])
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params)
    next.delete('page')
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const results = useMemo(() => entries[kind].filter((item) => {
    const entry = item as RecordItem & Partial<Agent>
    if (!matchesQuery(q, entry.name, ...(entry.aliases ?? []), entry.faction, entry.attribute, entry.specialty, entry.version,
        'two' in entry ? entry.two : undefined, 'four' in entry ? entry.four : undefined)) return false
    if (facetKeys.some((key) => params.has(key) && params.get(key) !== entry[key])) return false
    if (kind === 'discs' || !owned) return true
    const has = Object.hasOwn(state.collection[kind], entry.id)
    return owned === 'yes' ? has : !has
  }).sort((a, b) => {
    if (sorting === 'recent') return compareVersion(b.version ?? '0', a.version ?? '0') || a.name.localeCompare(b.name)
    if (sorting === 'rank' && 'rank' in a && 'rank' in b) return b.rank.localeCompare(a.rank) || a.name.localeCompare(b.name)
    if (sorting === 'usage') return (observations.agents[b.id]?.deadly ?? -1) - (observations.agents[a.id]?.deadly ?? -1) || a.name.localeCompare(b.name)
    return a.name.localeCompare(b.name)
  }), [kind, owned, q, params, sorting, state.collection])
  const label = databaseSections.find((item) => item.key === kind)!
  const pages = Math.max(1, Math.ceil(results.length / pageSize))
  const current = Number.isSafeInteger(page) && page > 0 ? Math.min(page, pages) : 1
  const catalogSearch = params.toString()

  function goToPage(destination: number) {
    const next = new URLSearchParams(params)
    if (destination === 1) next.delete('page')
    else next.set('page', String(destination))
    setParams(next)
  }

  return <>
    <DBHeading title={label.title} description={label.description}>
      {kind === 'engines' && <Link className="secondary-button" to={dbPath('engines','compare')}>Compare W-Engines <ArrowRight size={15} /></Link>}
      {kind === 'discs' && <Link className="secondary-button" to={dbPath('guides','drive-discs')}>Slot stat reference <ArrowRight size={15} /></Link>}
    </DBHeading>
    <div className="panel db-toolbar">
      <label className="search-field"><Search size={17} /><input type="search" aria-label={'Search ' + label.title} value={q} placeholder={'Search ' + label.title + '…'} onChange={(event) => filter('q', event.target.value)} /></label>
      <div className="db-facets">
        {facetKeys.filter((key) => seen[key].length > 1).map((key) => <label key={key} className="db-control">{facets[key]}
          <select value={params.get(key) ?? ''} onChange={(event) => filter(key, event.target.value)}>
            <option value="">Any</option>{seen[key].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>)}
        {kind !== 'discs' && <label className="db-control">Ownership<select value={owned} onChange={(event) => filter('owned', event.target.value)}>
          <option value="">All</option><option value="yes">Owned</option><option value="no">Unowned</option>
        </select></label>}
        <label className="db-control">Sort<select value={sorting} onChange={(event) => filter('sort', event.target.value)}>
          <option value="name">Name A–Z</option>{seen.version.length > 1 && <option value="recent">Latest release</option>}
          {kind !== 'discs' && <option value="rank">Rank</option>}{kind === 'agents' && <option value="usage">Deadly Assault usage</option>}
        </select></label>
      </div>
      <div className="db-results">
        <span role="status">{results.length} of {entries[kind].length} {label.title}</span>
        {params.size > Number(params.has('page')) && <button className="secondary-button" type="button" onClick={() => setParams({}, { replace: true })}>Clear filters</button>}
      </div>
    </div>
    {results.length ? <div className={'db-cards db-cards-' + kind}>
      {results.slice((current - 1) * pageSize, current * pageSize).map((entry) => {
        const owned = kind !== 'discs' && Object.hasOwn(state.collection[kind], entry.id)
        return <CatalogCard entry={entry} key={entry.id} kind={kind} owned={owned} catalogSearch={catalogSearch}
          onToggleOwned={kind === 'agents' ? () => state.setOwned('agents', entry.id, owned ? undefined : 0) : undefined} />
      })}
    </div> : <Empty>No matches. Try clearing a filter or searching by name.</Empty>}
    {pages > 1 && <nav className="db-pager" aria-label="Catalog pages">
      <button className="secondary-button" type="button" disabled={current === 1} onClick={() => goToPage(current - 1)}><ChevronLeft size={16} /> Previous</button>
      <span>Page {current} of {pages}</span>
      <button className="secondary-button" type="button" disabled={current === pages} onClick={() => goToPage(current + 1)}>Next <ChevronRight size={16} /></button>
    </nav>}
  </>
}

function CatalogCard({ entry, kind, owned, catalogSearch, onToggleOwned }: {
  entry: RecordItem; kind: Kind; owned: boolean; catalogSearch: string; onToggleOwned?: () => void
}) {
  const accent = 'color' in entry ? entry.color : undefined
  return <article className="db-card panel" style={accent ? { '--entry-accent': accent } as React.CSSProperties : undefined}>
    <Link className="db-card-link" to={dbPath(kind, entry.id)} state={kind === 'agents' ? { catalogSearch } : undefined}>
      <div className="db-card-art">
        <Thumbnail asset={entry} portrait={kind === 'agents'} />
        {'rank' in entry && <RankBadge rank={entry.rank} />}
        {owned && !onToggleOwned && <span className="db-owned-badge" aria-label="Owned"><Check size={14} /></span>}
      </div>
      <div className="db-card-body">
        <strong>{entry.name}</strong>
        {'attribute' in entry && <><Tags items={[entry.attribute, entry.specialty]} /><small>{entry.faction}</small>{entry.signatureId && <small>Signature W-Engine</small>}</>}
        {'secondary' in entry && <><Tags items={[entry.specialty, statByID.get(entry.secondary.stat)?.name]} /><small>{entry.base} Base ATK{entry.signatureIds.length ? ' · Signature' : ''}</small></>}
        {'two' in entry && <small>{entry.two}</small>}
        {'skills' in entry && <small>{entry.skills[0]?.name}</small>}
      </div>
    </Link>
    {onToggleOwned && <button className="db-owned-toggle" type="button" aria-label={entry.name + ' ownership'} aria-pressed={owned}
      title={owned ? 'Remove from owned Agents' : 'Mark as owned'} onClick={onToggleOwned}>
      <span>{owned ? <Check size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}</span>
    </button>}
  </article>
}

export function DatabaseSearch() {
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''
  const sections = (Object.keys(entries) as Kind[]).map((key) => ({
    key, records: query ? entries[key].filter((item) => matchesQuery(query, item.name,
      'aliases' in item ? item.aliases.join(' ') : '', 'specialty' in item ? item.specialty : '',
      'faction' in item ? item.faction : '', 'two' in item ? item.two : '')) : [],
  }))
  return <><DBHeading title="Database Search" description={query ? 'Results for “' + query + '”' : 'Use the search bar to look up Agents and equipment.'} />
    {sections.every((group) => !group.records.length) && <Empty>No matching database records.</Empty>}
    {sections.filter((group) => group.records.length).map(({ key, records }) => <section className="panel db-panel" key={key}>
      <h2>{databaseSections.find((item) => item.key === key)?.title}</h2>
      <div className="db-related">{records.map((record) => <RecordLink route={key} record={record} key={record.id} />)}</div>
    </section>)}
    {query && <Link className="secondary-button" to={'/library?q=' + encodeURIComponent(query)}>Search the story archive <ArrowRight size={15} /></Link>}
  </>
}
