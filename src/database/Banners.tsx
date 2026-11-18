import { useEffect, useState } from 'react'
import { ArrowUpRight, CalendarDays, ChevronRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { agentByID, agents, banners, engineByID, upcoming } from './data'
import { bannerState, compareVersion } from './mechanics'
import type { Banner } from './model'
import { dbPath } from './navigation'
import { AgentLink, DBHeading, DBPanel, Empty, RecordLink, RelativeDate, Tags, Thumbnail } from './ui'

type Server = Parameters<typeof bannerState>[2]
const serverOptions = [{ id:'asia',label:'Asia (UTC+8)' },{ id:'europe',label:'Europe (UTC+1)' },{ id:'america',label:'America (UTC−5)' }] as const
const states = ['Current','Upcoming','History','All'] as const
const newest = banners[0]?.version
const startsByAgent = new Map(agents.map((agent) => [agent.id, banners.filter((b) => b.kind === 'Exclusive' && b.agentIds.includes(agent.id)).map((b) => b.starts).sort()]))
const schedule = 'https://bannerhistory.app/en/zzz-pickup-history'

function BannerPeople({ banner, dense = false }: { banner: Banner; dense?: boolean }) {
  return <div className={dense ? 'db-related' : 'db-banner-people'}>
    {banner.kind !== 'Dissonant' && banner.agentIds.map((id) => {
      const agent = agentByID.get(id)!
      const known = startsByAgent.get(id) ?? []
      const note = banner.kind === 'Exclusive' ? known[0] === banner.starts ? 'First recorded channel' : 'Rerun' : undefined
      return <AgentLink key={id} agent={agent} meta={note} />
    })}
    {banner.engineIds.map((id) => <RecordLink key={id} route="engines" record={engineByID.get(id)!} meta="Featured W-Engine" />)}
  </div>
}

export function BannerBook({ id }: { id?: string }) {
  const [params,setParams] = useSearchParams()
  const [now,setNow] = useState(() => new Date())
  const server: Server = serverOptions.find((option) => option.id === params.get('server'))?.id ?? 'asia'
  const initially = banners.some((banner) => bannerState(banner,now,server) === 'Current') ? 'Current' : 'History'
  const view = states.find((value) => value === params.get('when')) ?? initially
  const agentId = params.get('agent') ?? ''
  const kind = params.get('kind') ?? ''
  const version = params.get('version') ?? ''
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()),60000)
    return () => window.clearInterval(interval)
  },[])
  const details = banners.find((banner) => banner.id === id)
  if (id && !details) return <Empty>This banner isn’t in the verified archive.</Empty>
  if (details) return <>
    <DBHeading section="Banners" title={details.name} description={'Version ' + details.version + ' · ' + details.kind + ' Channel'} />
    <DBPanel title="Signal Search window">
      {details.image && <Thumbnail className="db-banner-wide" asset={details} eager />}
      <Tags items={[bannerState(details,now,server),details.kind]} />
      <p><RelativeDate value={details.starts} /> – <RelativeDate value={details.ends} /> · server time</p>
      <a className="secondary-button" href={details.source} target="_blank" rel="noreferrer">Read the source <ArrowUpRight size={15} /></a>
    </DBPanel>
    <DBPanel title="Featured records"><BannerPeople banner={details} dense /></DBPanel>
    {details.kind !== 'Dissonant' && banners.some((entry) => entry.id === details.id + '-engines') &&
      <Link className="secondary-button" to={dbPath('banners',details.id+'-engines')}>Open matching W-Engine channel <ChevronRight size={15} /></Link>}
  </>
  const displayed = banners.filter((item) => (!agentId || item.agentIds.includes(agentId)) && (!kind || item.kind === kind)
    && (!version || item.version === version) && (view === 'All' || bannerState(item,now,server) === view))
  const versions = [...new Set(banners.map((banner) => banner.version))].sort((a,b) => compareVersion(b,a))
  const groups = versions.filter((v) => displayed.some((b) => b.version === v))
  function change(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key,value)
    else next.delete(key)
    setParams(next,{replace:true})
  }
  return <>
    <DBHeading title="Signal Search" description={'Current and historical channels through Version ' + newest + '. Status uses the selected server clock.'} />
    <div className="panel db-toolbar">
      <div className="db-tab-row db-plain-tabs" aria-label="Banner period">
        {states.map((state) => <button type="button" aria-pressed={state === view} key={state} onClick={() => change('when',state)}>{state}</button>)}
      </div>
      <div className="db-facets">
        <label className="db-control">Server<select value={server} onChange={(event) => change('server',event.target.value)}>{serverOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        <label className="db-control">Agent<select value={agentId} onChange={(event) => change('agent',event.target.value)}>
          <option value="">All Agents</option>{[...agents].sort((a,b) => a.name.localeCompare(b.name)).map((agent) => <option value={agent.id} key={agent.id}>{agent.name}</option>)}</select></label>
        <label className="db-control">Channel type<select value={kind} onChange={(event) => change('kind',event.target.value)}>
          <option value="">All channels</option>{['Exclusive','Dissonant','Special'].map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="db-control">Version<select value={version} onChange={(event) => change('version',event.target.value)}>
          <option value="">All versions</option>{versions.map((v) => <option key={v}>{v}</option>)}</select></label>
      </div>
    </div>
    {view === 'Upcoming' && !agentId && !kind && !version && <DBPanel title="Official announcements">
      {upcoming.map((notice) => <a className="db-story-link" key={notice.source} href={notice.source} target="_blank" rel="noreferrer">
        <CalendarDays size={19} /><span>{notice.name}<small><RelativeDate value={notice.date} /> UTC+8. {notice.note}</small></span><ArrowUpRight size={15} />
      </a>)}
    </DBPanel>}
    {!displayed.length && <Empty>{view === 'Upcoming' ? 'No officially dated upcoming channels match this view.' : 'No banners match these filters.'}</Empty>}
    {groups.map((v) => <section className="db-banner-group" key={v}><h2>Version {v}</h2>
      <div className="db-two-columns">{displayed.filter((b) => b.version === v).map((banner) => <article key={banner.id} className="panel db-banner-card">
        {banner.image && <Link className="db-banner-artlink" tabIndex={-1} aria-hidden="true" to={dbPath('banners',banner.id)}><Thumbnail asset={banner} className="db-banner-wide" /></Link>}
        <div><Tags items={[bannerState(banner,now,server),banner.kind]} />
          <h3><Link to={dbPath('banners',banner.id)}>{banner.name} <ChevronRight size={16} /></Link></h3>
          <p className="db-muted"><RelativeDate value={banner.starts} /> – <RelativeDate value={banner.ends} /></p>
          <BannerPeople banner={banner} />
        </div>
      </article>)}</div>
    </section>)}
    <p className="db-muted db-coverage">Historical limited channels adapted from <a href={schedule} target="_blank" rel="noreferrer">BannerHistory <ArrowUpRight size={13} /></a> · CC BY 4.0. Available records emphasize featured S-Ranks and special selectors.</p>
  </>
}
