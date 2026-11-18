import { useState } from 'react'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { SkillList } from './AgentPage'
import { agentByID, agents, bangbooByID, banners, catalog, discByID, engineByID, engines, observations, statByID } from './data'
import type { CollectionState } from './collection'
import { conditionMatches } from './collection'
import { builds, guides, recommendedTeams } from './editorial'
import { engineStats, promotionCaps, showStat } from './mechanics'
import type { Engine, RecordBase } from './model'
import { dbPath } from './navigation'
import { AgentLink, DBHeading, DBPanel, Empty, Materials, OpenSquad, Ownership, RankBadge, RecordLink, RelativeDate, Sources, SquadLinks, Tags, Thumbnail } from './ui'

function ItemHero({ record, section, sectionKey, tags, children }: { record: RecordBase & { rank?: 'S' | 'A' | 'B' }; section: string; sectionKey: string; tags: (string | undefined)[]; children?: React.ReactNode }) {
  return <section className="db-profile-hero db-item-hero">
    <div className="db-profile-copy">
      <div className="db-kicker"><Link to={dbPath(sectionKey)}>{section}</Link><ChevronRight size={14} />{record.version ? 'Version ' + record.version : 'Released'}</div>
      <div className="db-identity">{record.rank && <RankBadge rank={record.rank} />}<h1>{record.name}</h1></div>
      <Tags items={tags} />{children}
    </div>
    <Thumbnail asset={record} eager className="db-profile-art" />
  </section>
}

function EngineSpec({ engine, compact = false }: { engine: Engine; compact?: boolean }) {
  const [level, setLevel] = useState(60)
  const [promotion, setPromotion] = useState(5)
  const [overclock, setOverclock] = useState(1)
  const values = engineStats(engine, catalog.engineCurves, level, promotion)
  const secondary = statByID.get(engine.secondary.stat)
  const minimum = promotion === 0 ? 1 : promotionCaps[promotion - 1]
  return <>
    <div className="db-facets">
      <label className="db-control">Promotion<select value={promotion} onChange={(event) => {
        const index = Number(event.target.value)
        setPromotion(index); setLevel(promotionCaps[index])
      }}>{promotionCaps.map((cap,index) => <option key={cap} value={index}>{index} · Lv. {cap} cap</option>)}</select></label>
      <label className="db-control">Level<select value={level} onChange={(event) => setLevel(Number(event.target.value))}>
        {Array.from({ length: promotionCaps[promotion] - minimum + 1 }, (_, index) => index + minimum).map((value) => <option key={value}>{value}</option>)}
      </select></label>
      <label className="db-control">Overclock<select value={overclock} onChange={(event) => setOverclock(Number(event.target.value))}>
        {[1,2,3,4,5].map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>
    <dl className="db-stat-grid"><div><dt>Base ATK</dt><dd>{values.atk}</dd></div>
      {secondary && <div><dt>{secondary.name}</dt><dd>{showStat(secondary,values.secondary)}</dd></div>}</dl>
    <h3>{engine.effect ?? 'W-Engine effect'}</h3>
    <p>{engine.passiveLevels?.[overclock-1] ?? 'The passive at this Overclock level is unverified.'}</p>
    {!compact && <p className="db-muted">Passive requires a matching {engine.specialty} Agent.</p>}
  </>
}

export function EnginePage({ id, state }: { id: string; state: CollectionState }) {
  const engine = engineByID.get(id)
  if (!engine) return <Empty>This W-Engine isn’t in the released catalog.</Empty>
  const compatible = agents.filter((agent) => agent.specialty === engine.specialty)
  const observed = compatible.filter((agent) => observations.agents[agent.id]?.engines.some((entry) => entry.id === id))
  const curated = builds.filter((build) => build.engines.some((item) => item.id === id))
  const appearances = banners.filter((banner) => banner.engineIds.includes(id))
  return <>
    <ItemHero record={engine} section="W-Engines" sectionKey="engines" tags={[engine.specialty, statByID.get(engine.secondary.stat)?.name]}>
      {engine.description && <p>{engine.description}</p>}
      <Ownership state={state} kind="engines" id={id} />
    </ItemHero>
    <DBPanel title="Stats and passive"><EngineSpec engine={engine} />
      <Link className="secondary-button" to={dbPath('engines','compare') + '?left=' + id}>Compare this W-Engine <ArrowRight size={15} /></Link>
    </DBPanel>
    <div className="db-two-columns">
      <DBPanel title="Signature Agents">
        {engine.signatureIds.length ? engine.signatureIds.map((agent) => <AgentLink key={agent} agent={agentByID.get(agent)!} />) : <p className="db-muted">No verified signature association.</p>}
        {curated.length > 0 && <><h3>Recommended builds</h3>{curated.map((build) => <AgentLink key={build.id} agent={agentByID.get(build.agentId)!} meta={build.engines.find((item) => item.id === id)?.note} />)}</>}
      </DBPanel>
      <DBPanel title="Acquisition and banners">
        <p>{engine.acquisition ?? 'Acquisition method is unverified in this database.'}</p>
        {appearances.map((entry) => <Link key={entry.id} className="db-story-link" to={dbPath('banners',entry.id)}>
          <span>{entry.name}<small><RelativeDate value={entry.starts} /></small></span><ChevronRight size={14} />
        </Link>)}
      </DBPanel>
    </div>
    <DBPanel title="Compatible Agents" note="Matching specialty activates the passive. Observed usage is shown where available.">
      <div className="db-related">{[...observed,...compatible.filter((agent) => !observed.includes(agent))].map((agent) => {
        const sample = observations.agents[agent.id]?.engines.find((item) => item.id === id)
        return <AgentLink agent={agent} key={agent.id} meta={sample ? sample.share + '% observed build share' : 'Matching specialty'} />
      })}</div>
    </DBPanel>
    <DBPanel title="Promotion materials"><Materials costs={engine.materials} /></DBPanel>
    <Sources urls={[catalog.sources[1].url,catalog.sources[2].url]} />
  </>
}

export function EngineCompare() {
  const [params, setParams] = useSearchParams()
  const agent = agentByID.get(params.get('agent') ?? '')
  const sorted = [...engines].sort((a,b) => a.name.localeCompare(b.name))
  const [onlyCompatible, setOnlyCompatible] = useState(true)
  const options = agent && onlyCompatible ? sorted.filter((engine) => engine.specialty === agent.specialty) : sorted
  const observed = agent ? observations.agents[agent.id]?.engines : undefined
  const left = engineByID.get(params.get('left') ?? '') ?? engineByID.get(agent?.signatureId ?? '') ?? options[0]
  const right = engineByID.get(params.get('right') ?? '') ?? options.find((w) => w.id !== left.id)
  function update(key: string,value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key,value)
    else next.delete(key)
    if (key === 'agent') { next.delete('left'); next.delete('right') }
    setParams(next, {replace:true})
  }
  return <>
    <DBHeading section="W-Engines" title="Compare W-Engines" description="Compare verified stats and individual Overclock effects." />
    <div className="panel db-toolbar"><div className="db-facets">
      <label className="db-control">Agent<select value={agent?.id ?? ''} onChange={(event) => update('agent',event.target.value)}>
        <option value="">Any Agent</option>{[...agents].sort((a,b) => a.name.localeCompare(b.name)).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select></label>
      {agent && <label className="db-check"><input type="checkbox" checked={onlyCompatible} onChange={(event) => setOnlyCompatible(event.target.checked)} /> Matching specialties only</label>}
    </div></div>
    <div className="db-two-columns">
      {([['left','First W-Engine',left],['right','Second W-Engine',right]] as const).map(([key,title,engine]) => engine && <DBPanel title={title} key={key}>
        <label className="db-control db-block">Choose {title.toLowerCase()}<select value={engine.id} onChange={(event) => update(key,event.target.value)}>
          {!options.includes(engine) && <option value={engine.id}>{engine.name}</option>}
          {options.map((w) => <option value={w.id} key={w.id}>{w.name}</option>)}
        </select></label>
        <RecordLink route="engines" record={engine} meta={engine.rank + ' Rank · ' + engine.specialty} />
        <Tags items={[agent && (engine.specialty === agent.specialty ? 'Passive compatible' : 'Passive inactive on this Agent'), engine.signatureIds.includes(agent?.id ?? '') ? 'Signature' : undefined,
          engine.acquisition?.includes('Gadget Store') ? 'Craftable' : undefined,
          observed?.some((w) => w.id === engine.id) ? observed.find((w) => w.id === engine.id)!.share + '% observed usage' : undefined]} />
        <EngineSpec key={engine.id} engine={engine} compact />
      </DBPanel>)}
    </div>
  </>
}

export function DiscPage({ id }: { id: string }) {
  const disc = discByID.get(id)
  if (!disc) return <Empty>This Drive Disc set isn’t in the released catalog.</Empty>
  const editorial = builds.filter((build) => build.discs.some((item) => item.id === id))
  const samples = agents.flatMap((agent) => {
    const share = observations.agents[agent.id]?.discs.filter((item) => item.ids.includes(id)).reduce((sum,group) => sum+group.share,0)
    return share ? [{agent,share}] : []
  }).sort((a,b) => b.share-a.share).slice(0,12)
  return <>
    <ItemHero record={disc} section="Drive Discs" sectionKey="discs" tags={['Drive Disc set',disc.acquisition]} />
    <div className="db-two-columns"><DBPanel title="Two-piece bonus"><p>{disc.two}</p></DBPanel>
      <DBPanel title="Four-piece bonus"><p>{disc.four}</p></DBPanel></div>
    {editorial.length > 0 && <DBPanel title="Recommended builds"><div className="db-related">
      {editorial.map((build) => <AgentLink agent={agentByID.get(build.agentId)!} key={build.id} meta={build.discs.find((item) => item.id === id)?.note} />)}
    </div></DBPanel>}
    <DBPanel title="Seen in endgame builds" note="Shares reflect the displayed sample combinations that include this set.">
      {samples.length ? <div className="db-related">{samples.map(({agent,share}) => <AgentLink key={agent.id} agent={agent} meta={share.toFixed(2) + '% observed build share'} />)}</div>
        : <p className="db-muted">No matching combinations in the displayed sample.</p>}
      <Sources urls={[observations.source]} />
    </DBPanel>
    <Link className="secondary-button" to={dbPath('guides','drive-discs')}>Browse the slot stat reference <ArrowRight size={15} /></Link>
  </>
}

export function BangbooPage({ id, state }: { id: string; state: CollectionState }) {
  const record = bangbooByID.get(id)
  if (!record) return <Empty>This Bangboo isn’t in the released catalog.</Empty>
  const compatible = agents.filter((agent) => record.condition?.some((rule) => conditionMatches({ ...rule,count:1 },[agent])))
  const teams = recommendedTeams.filter((team) => team.bangbooId === id)
  const observed = observations.teams.flatMap((team) => {
    const evidence = team.observations.find((item) => item.bangbooId === id)
    return evidence ? [{team,evidence}] : []
  }).sort((a,b) => b.evidence.share-a.evidence.share).slice(0,5)
  return <>
    <ItemHero record={record} section="Bangboo" sectionKey="bangboo" tags={[record.acquisition]}>
      <Ownership state={state} kind="bangboo" id={id} />
    </ItemHero>
    <DBPanel title="Abilities"><SkillList skills={record.skills} /></DBPanel>
    <div className="db-two-columns">
      <DBPanel title="Activation partners" note="These Agents can count toward a recorded requirement. Check the full squad in Team Builder.">
        {compatible.length ? <div className="db-related">{compatible.map((agent) => <AgentLink key={agent.id} agent={agent} />)}</div> :
          <p>See the Additional Ability text for the activation requirement.</p>}
      </DBPanel>
      <DBPanel title="Promotion materials"><Materials costs={record.materials} /></DBPanel>
    </div>
    {(teams.length > 0 || observed.length > 0) && <DBPanel title="Related squads">
      <div className="db-two-columns">
        {teams.map((team) => <article className="db-team-card" key={team.id}>
          <h3>{team.name}</h3><p>{team.reason}</p><SquadLinks agentIds={team.agentIds} /><OpenSquad agentIds={team.agentIds} bangbooId={id} />
        </article>)}
        {observed.map(({team,evidence}) => <article className="db-team-card" key={team.id}>
          <h3>{evidence.mode} · {evidence.share}% appearance</h3><SquadLinks agentIds={team.agentIds} /><OpenSquad agentIds={team.agentIds} bangbooId={id} />
        </article>)}
      </div>
      <Sources urls={[observations.source]} />
    </DBPanel>}
  </>
}

export function Guides({ id }: { id?: string }) {
  const guide = guides.find((item) => item.id === id)
  if (id && !guide) return <Empty>That guide is unavailable.</Empty>
  if (!guide) return <>
    <DBHeading title="Guides" description="Practical reference for preparing Agents and using equipment." />
    <div className="db-home-grid">{guides.map((item) => <Link className="panel db-guide-card" to={dbPath('guides',item.id)} key={item.id}>
      <h2>{item.title}</h2><p>{item.summary}</p><ChevronRight size={18} />
    </Link>)}</div>
    <DBPanel title="Agent build guides"><div className="db-related">{builds.map((build) => <AgentLink key={build.id} agent={agentByID.get(build.agentId)!} meta={build.summary} />)}</div></DBPanel>
  </>
  return <>
    <DBHeading section="Guides" title={guide.title} description={guide.summary} />
    {guide.sections.map((section) => <DBPanel key={section.title} title={section.title}><p>{section.text}</p></DBPanel>)}
    {guide.id === 'drive-discs' && <>
      <DBPanel title="Main stat by slot" note="Maximum main stats at S-Rank +15.">
        <div className="db-stat-ref">{catalog.discSlots.map((slot) => <div key={slot.slot}><h3>Slot {slot.slot}</h3>
          <dl className="db-materials">{slot.stats.map(({id,value}) => {
            const stat = statByID.get(id)!
            return <div key={id}><dt>{stat.name}</dt><dd>{showStat(stat,value)}</dd></div>
          })}</dl>
        </div>)}</div>
      </DBPanel>
      <DBPanel title="Substats" note="S-Rank value per roll. Repeated rolls add the same value.">
        <dl className="db-materials">{catalog.discSubstats.map(({id,value}) => {
          const stat = statByID.get(id)!
          return <div key={id}><dt>{stat.name}</dt><dd>{showStat(stat,value)}</dd></div>
        })}</dl>
      </DBPanel>
    </>}
    <Sources urls={guide.sources} />
  </>
}
