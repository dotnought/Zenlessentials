import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Activity, ArrowDown, ArrowRight, ArrowUpRight, BookOpen, ChartNoAxesColumn, CheckCircle2, ChevronDown,
  ChevronRight, CircleHelp, Compass, Crosshair, Flag, LayoutDashboard, LibraryBig, ListFilter, MapPin, Route as RouteIcon,
  Search, Settings2, SlidersHorizontal, X,
} from 'lucide-react'
import { chapters } from './data/chapters'
import {
  availabilityLabels, categories, chapterID, entryAnchor, gameVersion, getAvailability, seasons,
} from './data/model'
import type { Availability, ContentType, NarrativeEntry, SeasonID } from './data/model'
import { entries, entryByID } from './data/timeline'
import { isComplete, totals, useTracker } from './progress'
import type { Tracker } from './progress'
import { StoryCard, storyLink } from './components/StoryCard'
import { ProgressBar, Ring, TypeIcon } from './components/visuals'
import { Settings } from './components/Settings'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/timeline', label: 'Timeline', icon: RouteIcon },
  { path: '/library', label: 'Content Library', icon: LibraryBig },
  { path: '/stats', label: 'Statistics', icon: ChartNoAxesColumn },
]
const views: Record<string, string> = { '/': 'Timeline', '/timeline': 'Timeline', '/dashboard': 'Dashboard', '/library': 'Content Library', '/agents': 'Agent Stories', '/events': 'Events', '/stats': 'Statistics', '/settings': 'Settings' }
const versions = [...new Set(entries.flatMap((entry) => entry.releaseVersion ? [entry.releaseVersion] : []))]
  .sort((first, second) => first.localeCompare(second, undefined, { numeric: true })).reverse()
const roots = entries.filter((entry) => !entry.parentID)
const core = roots.filter((entry) => !entry.optional)
const searchable = new Map(entries.map((entry) => [entry.id, [
  entry.title, entry.description, categories[entry.contentType], ...entry.characters, entry.releaseVersion,
  entry.parentID ? entryByID[entry.parentID].title : '',
].join(' ').toLocaleLowerCase()]))

function eligible(entry: NarrativeEntry, tracker: Tracker) {
  return entry.placementAfter.every((id) => {
    const preceding = entryByID[id]
    return preceding.optional || isComplete(preceding, tracker.progress)
  })
}

function recommend(tracker: Tracker) {
  const nextCore = core.find((entry) => !isComplete(entry, tracker.progress) && eligible(entry, tracker))
  return nextCore ?? roots.find((entry) => !isComplete(entry, tracker.progress) && eligible(entry, tracker))
}

function Brand() {
  return <Link to="/" className="brand" aria-label="Zenlessentials home">
    <img src="/mark.svg" alt="" width="37" height="37" />
    <span>Zenlessentials<small>STORY TRACKER</small></span>
  </Link>
}

function Shell({ children }: { children: React.ReactNode }) {
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const [globalSearch, setGlobalSearch] = useState('')
  const title = views[pathname] ?? 'Page unavailable'
  useEffect(() => {
    document.title = title + ' — Zenlessentials'
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash, title])

  return <div className="shell">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="sidebar">
      <Brand />
      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} className={({ isActive }) => isActive || (path === '/timeline' && pathname === '/') || (path === '/library' && ['/agents', '/events'].includes(pathname)) ? 'nav-link active' : 'nav-link'} aria-current={(path === '/timeline' && pathname === '/') ? 'page' : undefined}>
          <Icon size={18} /><span>{label}</span>
        </NavLink>)}
        <NavLink to="/settings" className={({ isActive }) => 'nav-link settings-nav' + (isActive ? ' active' : '')}><Settings2 size={18} /><span>Settings</span></NavLink>
      </nav>
      <div className="sidebar-bottom">
        <div className="version-box"><span className="version-dot" /><div><strong>Version {gameVersion}</strong><small>Game coverage</small></div></div>
        <span className="fan-label">Unofficial ZZZ companion</span>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div className="breadcrumb"><Compass size={15} /><span>Story Archive</span><ChevronRight size={13} /><strong>{title}</strong></div>
        <form className="top-search" role="search" onSubmit={(event) => {
          event.preventDefault()
          if (!globalSearch.trim()) return
          navigate('/library?q=' + encodeURIComponent(globalSearch.trim()))
          setGlobalSearch('')
        }}>
          <Search size={16} />
          <input aria-label="Search the content library" placeholder="Search archive…" value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} />
          <button type="submit" title="Search"><ArrowRight size={15} aria-label="Search" /></button>
        </form>
      </header>
      <main id="main-content" className="content">{children}</main>
    </div>
  </div>
}

function Hero() {
  return <section className="hero" aria-labelledby="timeline-title">
    <div className="hero-content">
      <div className="hero-label"><span /><span>PHAETHON’S STORY ARCHIVE</span></div>
      <h1 id="timeline-title">STORY<br /><em>TIMELINE</em></h1>
      <p>Follow the story across New Eridu, Waifei Peninsula, and Roscaelifer.</p>
    </div>
    <div className="hero-corner"><i /><i /><i /><i /><i /><i /></div>
  </section>
}

function UpNext({ next, tracker }: { next: NarrativeEntry | undefined; tracker: Tracker }) {
  const previousCore = next && core.slice().reverse().find((entry) => entry.chronologicalOrder < next.chronologicalOrder)
  const optional = next && !next.optional && tracker.preferences.showOptional ? roots.filter((entry) =>
    entry.optional && entry.chronologicalOrder < next.chronologicalOrder &&
    entry.chronologicalOrder > (previousCore?.chronologicalOrder ?? 0) &&
    !isComplete(entry, tracker.progress) && eligible(entry, tracker) &&
    ['permanent', 'archived', 'limited'].includes(getAvailability(entry)) &&
    (!tracker.preferences.majorOnly || entry.contentType !== 'minor'),
  ).slice(0, 2) : []
  return <section className="panel up-next">
    <div className="next-heading"><span><Crosshair size={17} /></span><h2>UP NEXT</h2></div>
    {next ? <>
      <span className="story-kicker">{categories[next.contentType]}</span>
      <h3>{next.title}</h3>
      <p>{next.optional || next.contentType === 'special' ? next.placementReason : next.placementAfter.length ? 'You’ve cleared the preceding story. Continue here.' : 'Start here to meet Phaethon and see how the story begins.'}</p>
      <Link className="primary-button" to={storyLink(next)}>Jump to story <ArrowRight size={16} /></Link>
      {optional.map((entry) => <Link className="optional-link" key={entry.id} to={storyLink(entry)}>Optional first · {entry.title} <ChevronRight size={13} /></Link>)}
    </> : <p>You’ve completed every story in the archive.</p>}
  </section>
}

function Overview({ tracker }: { tracker: Tracker }) {
  const total = totals(entries, tracker.progress)
  return <section className="panel overview">
    <div className="panel-heading"><h2>Story Progress</h2><Link to="/stats" className="icon-button" aria-label="View statistics"><ArrowUpRight size={17} /></Link></div>
    <div className="overview-total"><Ring percent={total.percent} /><div><strong>{total.done}<span> / {total.total}</span></strong><small>stories completed</small></div></div>
    <div className="mini-stats">
      {([
        ['main', 'Main Story', ['main']],
        ['agent', 'Agent Stories', ['agent']],
        ['major', 'Events', ['major', 'minor']],
      ] as const).map(([type, title, included]) => {
        const stat = totals(entries.filter((entry) => (included as readonly string[]).includes(entry.contentType)), tracker.progress)
        return <div className={'mini-stat type-' + type} key={type}><TypeIcon type={type} size={15} /><span>{title}</span><strong>{stat.done}<small>/{stat.total}</small></strong></div>
      })}
    </div>
  </section>
}

function SideRail({ tracker, next }: { tracker: Tracker; next: NarrativeEntry | undefined }) {
  const stat = totals(entries, tracker.progress)
  return <aside className="right-rail" aria-label="Timeline progress">
    <Link className="mobile-progress" to="/stats" aria-label={'Story progress, ' + stat.percent + '% complete. View statistics.'}>
      <span>Story progress</span><ProgressBar percent={stat.percent} /><strong>{stat.percent}%</strong>
    </Link>
    <Overview tracker={tracker} />
    <UpNext next={next} tracker={tracker} />
    <Settings tracker={tracker} compact />
  </aside>
}

type Filters = { q: string; types: ContentType[]; completion: string; availability: string; version: string }
const initialFilters: Filters = { q: '', types: [], completion: '', availability: '', version: '' }

function useFiltered(filters: Filters, tracker: Tracker, season?: number, applyPreferences = true, target = '') {
  return useMemo(() => {
    const query = filters.q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const matches = new Set(entries.filter((entry) => {
      if (season && entry.season !== season) return false
      if (entryAnchor(entry.id) === target) return true
      if (filters.types.length && !filters.types.includes(entry.contentType)) return false
      const availability = getAvailability(entry)
      const complete = isComplete(entry, tracker.progress)
      if (applyPreferences && (
        (tracker.preferences.hideCompleted && complete) ||
        (!tracker.preferences.showOptional && entry.optional) ||
        (!tracker.preferences.showExpired && availability === 'expired') ||
        (tracker.preferences.majorOnly && entry.contentType === 'minor')
      )) return false
      if (filters.completion && complete !== (filters.completion === 'completed')) return false
      if (filters.availability) {
        const available = availability === 'limited' || availability === 'permanent'
        if (filters.availability === 'available' ? !available : filters.availability !== availability) return false
      }
      if (filters.version && filters.version !== (entry.releaseVersion ?? 'unknown')) return false
      return query.every((word) => searchable.get(entry.id)!.includes(word))
    }).map((entry) => entry.id))
    const visible = roots.filter((entry) => matches.has(entry.id) || entry.childQuestIDs.some((id) => matches.has(id)))
    return { visible, matches }
  }, [filters, tracker.progress, tracker.preferences, season, applyPreferences, target])
}

function renderCard(entry: NarrativeEntry, tracker: Tracker, matches: Set<string>, nextID?: string, target?: string) {
  return <StoryCard key={entry.id} entry={entry} tracker={tracker} nextID={nextID}
    childFilter={entry.childQuestIDs.every((id) => matches.has(id)) ? undefined : matches}
    showChildMatch={!matches.has(entry.id)} target={target} />
}

function SeasonNav({ selected, tracker }: { selected: SeasonID; tracker: Tracker }) {
  return <nav className="season-nav" aria-label="Story seasons">
    {seasons.map((season) => {
      const stat = totals(entries.filter((entry) => entry.season === season.id), tracker.progress)
      return <Link key={season.id} to={'/timeline?season=' + season.id} aria-current={selected === season.id ? 'page' : undefined} className={'season-tab' + (selected === season.id ? ' selected' : '')}>
        <span className="season-number">0{season.id}</span><span><small>Season {season.id}</small><strong>{season.title}</strong></span><span className="season-percent">{stat.percent}%</span>
      </Link>
    })}
  </nav>
}

function SearchBox({ q, setQuery }: { q: string; setQuery: (s: string) => void }) {
  return <label className="search-field"><Search size={17} /><input type="search" aria-label="Search stories" placeholder="Search stories, Agents, and events…" value={q} onChange={(event) => setQuery(event.target.value)} />{q && <button className="icon-button" type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}</label>
}

function FilterControls({ filters, change, library = false }: { filters: Filters; change: (f: Filters) => void; library?: boolean }) {
  return <div className="filter-controls">
    <label>Status<select aria-label="Status" value={filters.completion} onChange={(event) => change({ ...filters, completion: event.target.value })}><option value="">All statuses</option><option value="completed">Completed</option><option value="incomplete">Incomplete</option></select></label>
    <label>Availability<select aria-label="Availability" value={filters.availability} onChange={(event) => change({ ...filters, availability: event.target.value })}><option value="">All availability</option><option value="available">Available now</option>{Object.entries(availabilityLabels).map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
    <label>Game version<select aria-label="Game version" value={filters.version} onChange={(event) => change({ ...filters, version: event.target.value })}><option value="">All versions</option>{versions.map((version) => <option key={version} value={version}>v{version}</option>)}<option value="unknown">Unknown</option></select></label>
    {library && <button type="button" className="secondary-button" onClick={() => change(initialFilters)}>Clear filters</button>}
  </div>
}

function Categories({ filters, change }: { filters: Filters; change: (f: Filters) => void }) {
  return <div className="category-filters" aria-label="Categories">
    <button type="button" className={!filters.types.length ? 'chosen' : ''} aria-pressed={!filters.types.length} onClick={() => change({ ...filters, types: [] })}>All content</button>
    {(Object.entries(categories) as [ContentType, string][]).map(([id, label]) => <button type="button" key={id} className={filters.types.includes(id) ? 'chosen' : ''} aria-pressed={filters.types.includes(id)} onClick={() => change({ ...filters, types: filters.types.includes(id) ? filters.types.filter((type) => type !== id) : [...filters.types, id] })}>{label}</button>)}
  </div>
}

function Empty({ reset }: { reset?: () => void }) {
  return <div className="empty panel"><Search size={27} /><h2>No stories found</h2><p>Try a different search or change your filters.</p>{reset && <button type="button" className="secondary-button" onClick={reset}>Clear filters</button>}</div>
}

function Timeline({ tracker, next }: { tracker: Tracker; next?: NarrativeEntry }) {
  const [params] = useSearchParams()
  const location = useLocation()
  const seasonValue = Number(params.get('season'))
  const season: SeasonID = seasonValue === 2 || seasonValue === 3 ? seasonValue : 1
  const [filters, change] = useState(initialFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const target = location.hash.slice(1)
  const { visible, matches } = useFiltered(filters, tracker, season, true, target)
  const nextIncomplete = entries.find((entry) => entry.season === season && !entry.childQuestIDs.length &&
    matches.has(entry.id) && !isComplete(entry, tracker.progress))
  const chapterGroups = chapters.filter((chapter) => chapter.season === season)
    .map((chapter) => ({ chapter, items: visible.filter((entry) => entry.chapter === chapter.id) }))
    .filter(({ items }) => items.length)

  useEffect(() => {
    if (!target) return
    const timer = window.setTimeout(() => document.getElementById(target)?.scrollIntoView({ block: 'start' }), 30)
    return () => window.clearTimeout(timer)
  }, [season, target, visible])

  function reset() {
    change(initialFilters)
    tracker.setPreferences((current) => ({ ...current, hideCompleted: false, showOptional: true, showExpired: true, majorOnly: false }))
  }

  return <>
    <Hero />
    <SeasonNav selected={season} tracker={tracker} />
    <div className="timeline-grid">
      <div className="timeline-main">
        <div className="timeline-toolbar">
          <SearchBox q={filters.q} setQuery={(q) => change({ ...filters, q })} />
          <button type="button" className={'secondary-button filter-button' + (showFilters ? ' pressed' : '')} aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={16} /> Filters</button>
        </div>
        {showFilters && <div className="panel filters-panel"><Categories filters={filters} change={change} /><FilterControls filters={filters} change={change} /><Link to="/settings" className="subtle-link">Story visibility settings <ChevronRight size={13} /></Link></div>}
        <div className="chapter-tools">
          <label><MapPin size={15} /><select aria-label="Jump to chapter" value="" onChange={(event) => {
            const value = event.target.value
            if (!value) return
            setCollapsed((current) => new Set([...current].filter((id) => id !== value)))
            document.getElementById('chapter-' + value)?.scrollIntoView({ block: 'start' })
          }}><option value="">Jump to chapter</option>{chapterGroups.map(({ chapter }) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}</select></label>
          {nextIncomplete && <Link className="subtle-link" to={storyLink(nextIncomplete)}><ArrowDown size={14} /> Next incomplete</Link>}
        </div>
        {chapterGroups.length === 0 && <Empty reset={reset} />}
        {chapterGroups.map(({ chapter, items }) => {
          const linked = items.some((entry) => target === entryAnchor(entry.id) || entry.childQuestIDs.some((id) => target === entryAnchor(id)))
          const open = !collapsed.has(chapter.id) || linked
          const summary = totals(entries.filter((entry) => entry.chapter === chapter.id), tracker.progress)
          return <section className="timeline-chapter" key={chapter.id} id={chapterID(chapter)}>
            <button type="button" className="chapter-heading" aria-expanded={open} aria-controls={'entries-' + chapter.id} onClick={() => {
              setCollapsed((current) => {
                const updated = new Set(current)
                if (current.has(chapter.id)) updated.delete(chapter.id)
                else updated.add(chapter.id)
                return updated
              })
            }}>
              <span className="chapter-marker"><Flag size={18} /></span>
              <span className="chapter-title"><small>{chapter.label}</small><strong>{chapter.title}</strong></span>
              <span className="chapter-count">{summary.done}/{summary.total}</span>
              <ChevronDown className={open ? 'rotated' : ''} size={17} />
            </button>
            {open && <div className="chapter-entries" id={'entries-' + chapter.id}>{items.map((entry) => renderCard(entry, tracker, matches, next?.id, target))}</div>}
          </section>
        })}
      </div>
      <SideRail tracker={tracker} next={next} />
    </div>
  </>
}

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="page-heading"><h1>{title}</h1><p>{subtitle}</p></div>
}

function Library({ tracker, mode }: { tracker: Tracker; mode?: 'agents' | 'events' }) {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const season = Number(params.get('season')) || undefined
  const modeTypes: ContentType[] = mode === 'agents' ? ['agent'] : mode === 'events' ? ['major', 'minor'] : []
  const [filters, change] = useState<Filters>({ ...initialFilters, types: modeTypes })
  const { visible, matches } = useFiltered({ ...filters, q }, tracker, season, false)

  function update(key: string, value: string) {
    const updated = new URLSearchParams(params)
    if (value) updated.set(key, value)
    else updated.delete(key)
    setParams(updated, { replace: true })
  }

  return <>
    <PageHeading title={mode === 'agents' ? 'Agent Stories' : mode === 'events' ? 'Events' : 'Content Library'} subtitle="Search the archive by story, Agent, or game version." />
    <section className="panel library-filters">
      <div className="library-search-row"><SearchBox q={q} setQuery={(value) => update('q', value)} /><label>Season<select aria-label="Season" value={season ?? ''} onChange={(event) => update('season', event.target.value)}><option value="">All seasons</option>{seasons.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div>
      <Categories filters={filters} change={change} />
      <FilterControls filters={filters} change={change} library />
    </section>
    <div className="result-heading"><ListFilter size={16} /><span role="status">{visible.length} {visible.length === 1 ? 'result' : 'results'}</span></div>
    {visible.length ? <div className="library-results">{visible.map((entry) => renderCard(entry, tracker, matches))}</div> : <Empty reset={() => { setParams({}); change(initialFilters) }} />}
  </>
}

function SeasonBreakdown({ tracker }: { tracker: Tracker }) {
  return <section className="panel chart-panel">
    <h2><MapPin size={18} /> Progress by season</h2>
    {seasons.map((season) => {
      const stat = totals(entries.filter((entry) => entry.season === season.id), tracker.progress)
      return <div className="chart-row" key={season.id}><div><Link to={'/timeline?season=' + season.id}>{season.title} <ChevronRight size={13} /></Link><span>{stat.done}/{stat.total} · {stat.percent}%</span></div><ProgressBar percent={stat.percent} /></div>
    })}
  </section>
}

function Statistics({ tracker }: { tracker: Tracker }) {
  const progressTotals = totals(entries, tracker.progress)
  const watched = entries.filter((entry) => !entry.childQuestIDs.length && tracker.progress[entry.id]?.method === 'watched').length
  return <>
    <PageHeading title="Statistics" subtitle="See how much of the story you’ve covered." />
    <div className="metric-grid">
      <section className="panel metric"><Ring percent={progressTotals.percent} size={78} /><div><strong>{progressTotals.done}/{progressTotals.total}</strong><span>Total complete</span></div></section>
      <section className="panel metric"><span className="metric-icon"><CheckCircle2 /></span><div><strong>{progressTotals.done - watched}</strong><span>Played</span></div></section>
      <section className="panel metric"><span className="metric-icon"><Activity /></span><div><strong>{watched}</strong><span>Watched</span></div></section>
    </div>
    <div className="dashboard-grid">
      <SeasonBreakdown tracker={tracker} />
      <section className="panel chart-panel">
        <h2><ChartNoAxesColumn size={18} /> Progress by category</h2>
        {(Object.entries(categories) as [ContentType, string][]).map(([type, title]) => {
          const stat = totals(entries.filter((entry) => entry.contentType === type), tracker.progress)
          return <div className={'chart-row type-' + type} key={type}><div><span><TypeIcon type={type} size={15} />{title}</span><span>{stat.done}/{stat.total}</span></div><ProgressBar percent={stat.percent} /></div>
        })}
      </section>
    </div>
  </>
}

function Dashboard({ tracker, next }: { tracker: Tracker; next?: NarrativeEntry }) {
  const recent = Object.entries(tracker.progress)
    .filter(([id]) => Object.hasOwn(entryByID, id) && !entryByID[id].childQuestIDs.length)
    .sort(([, first], [, second]) => (second.completedAt ?? '').localeCompare(first.completedAt ?? ''))
    .slice(0, 5)
  const currentChapter = next && chapters.find((chapter) => chapter.id === next.chapter)
  return <>
    <PageHeading title="Dashboard" subtitle="Your story progress and next stop." />
    <div className="dashboard-grid"><Overview tracker={tracker} /><UpNext next={next} tracker={tracker} /></div>
    <div className="dashboard-grid">
      <SeasonBreakdown tracker={tracker} />
      <section className="panel chart-panel">
        <h2><BookOpen size={18} /> Current position</h2>
        {currentChapter && next ? <><p>{seasons[next.season - 1].title} · {currentChapter.label}</p><h3>{currentChapter.title}</h3><Link className="secondary-button" to={'/timeline?season=' + next.season + '#' + chapterID(currentChapter)}>Open chapter <ArrowRight size={15} /></Link></> : <p>All tracked chapters are complete.</p>}
      </section>
      <section className="panel chart-panel">
        <h2><CheckCircle2 size={18} /> Recently completed</h2>
        {recent.length ? <ul className="recent-list">{recent.map(([id, completion]) => <li key={id}><Link to={storyLink(entryByID[id])}>{entryByID[id].title}</Link><span>{completion.method}</span></li>)}</ul> : <p>Stories will appear here as you complete them.</p>}
      </section>
    </div>
  </>
}

export default function App() {
  const tracker = useTracker()
  const next = recommend(tracker)
  return <Shell>
    {tracker.storageError && <p className="storage-message" role="alert">Browser storage is unavailable. Export a backup before leaving this page.</p>}
    <Routes>
      <Route path="/" element={<Timeline tracker={tracker} next={next} />} />
      <Route path="/timeline" element={<Timeline tracker={tracker} next={next} />} />
      <Route path="/dashboard" element={<Dashboard tracker={tracker} next={next} />} />
      <Route path="/library" element={<Library key="all" tracker={tracker} />} />
      <Route path="/agents" element={<Library key="agents" tracker={tracker} mode="agents" />} />
      <Route path="/events" element={<Library key="events" tracker={tracker} mode="events" />} />
      <Route path="/stats" element={<Statistics tracker={tracker} />} />
      <Route path="/settings" element={<><PageHeading title="Settings" subtitle="Manage what you see and back up your progress." /><Settings tracker={tracker} /></>} />
      <Route path="*" element={<div className="empty panel"><CircleHelp size={28} /><h1>Page unavailable</h1><Link className="primary-button" to="/timeline">Back to timeline <ArrowRight size={16} /></Link></div>} />
    </Routes>
    <footer className="site-footer"><span>Zenlessentials is an unofficial fan project.</span><a href="https://github.com/dotnought/Zenlessentials/blob/main/CHRONOLOGY.md">Research &amp; coverage <ArrowUpRight size={13} /></a></footer>
  </Shell>
}
