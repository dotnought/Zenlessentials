import { useEffect, useState } from 'react'
import { ArrowUpRight, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { entryByID } from '../data/timeline'
import { categories } from '../data/model'
import { storyLink } from '../components/StoryCard'
import { agentByID, banners, catalog, discByID, engineByID, engines, loadKit, observations, statByID, storyIdsByAgent } from './data'
import { buildByAgent, recommendedTeams } from './editorial'
import { agentStat, maxCoreSteps, promotionCaps, showStat } from './mechanics'
import { dbPath } from './navigation'
import type { Agent, AgentKit, Skill } from './model'
import type { CollectionState } from './collection'
import { AgentLink, DBPanel, Empty, Materials, OpenSquad, Ownership, RankBadge, RecordLink, RelativeDate, Sources, SquadLinks, Tags, Thumbnail } from './ui'

const tabs = [['Overview','overview'],['Skills','skills'],['Builds','builds'],['Teams','teams'],['Progression','progression'],['Story & banners','story']] as const

export function AgentPage({ id, state }: { id: string; state: CollectionState }) {
  const agent = agentByID.get(id)
  const [tab, setTab] = useState<(typeof tabs)[number][1]>('overview')
  const [kit, setKit] = useState<AgentKit>()
  const [kitError, setKitError] = useState(false)
  useEffect(() => {
    if (!agent) return
    let valid = true
    loadKit(id)?.then((data) => { if (valid) setKit(data) }, () => { if (valid) setKitError(true) })
    return () => { valid = false }
  }, [agent, id])
  if (!agent) return <Empty>This Agent isn’t in the released roster.</Empty>
  const build = buildByAgent.get(id)
  const signature = agent.signatureId ? engineByID.get(agent.signatureId) : undefined
  const kitReady = kit?.id === id ? kit : undefined
  return <>
    <section className="db-profile-hero" style={{ '--entry-accent': agent.color ?? 'var(--accent)' } as React.CSSProperties}>
      <div className="db-profile-copy">
        <div className="db-kicker"><Link to={dbPath('agents')}>Agents</Link><ChevronRight size={14} />{agent.version ? 'VERSION ' + agent.version : 'RELEASED'}</div>
        <div className="db-identity"><RankBadge rank={agent.rank} /><h1>{agent.name}</h1></div>
        {agent.aliases.length > 0 && <p className="db-alias">{agent.aliases[0]}</p>}
        <Tags items={[agent.attribute, agent.specialty, agent.faction, agent.attackTypes.join(" / ")]} />
        <p>{build?.summary ?? agent.conditionText ?? 'Browse this Agent’s kit, equipment and related stories.'}</p>
        <Ownership state={state} kind="agents" id={id} />
      </div>
      <Thumbnail asset={agent} eager className="db-profile-art" />
    </section>
    <nav className="db-tab-row" aria-label="Agent profile sections">
      {tabs.map(([label,value]) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}>{label}</button>)}
    </nav>
    {tab === 'overview' && <>
      <div className="db-two-columns">
        <DBPanel title="Combat profile">
          {build ? <><p>{build.summary}</p><h3>Strengths</h3><ul>{build.strengths.map((note) => <li key={note}>{note}</li>)}</ul>
            <h3>Tradeoffs</h3><ul>{build.tradeoffs.map((note) => <li key={note}>{note}</li>)}</ul></> :
            <><p>{agent.specialty} · {agent.faction}</p>{agent.conditionText && <p><strong>Additional Ability</strong><br />{agent.conditionText}.</p>}</>}
        </DBPanel>
        <DBPanel title="Signature W-Engine">{signature ? <RecordLink route="engines" record={signature} meta={signature.specialty} /> : <p className="db-muted">A signature W-Engine is unverified.</p>}
          {signature && <p>{signature.passiveLevels?.[0]}</p>}
        </DBPanel>
      </div>
      {kitReady ? <AgentStats kit={kitReady} /> : <KitStatus error={kitError} />}
    </>}
    {tab === 'skills' && (kitReady ? <AgentSkills kit={kitReady} /> : <KitStatus error={kitError} />)}
    {tab === 'builds' && <AgentBuild agent={agent} kit={kitReady} />}
    {tab === 'teams' && <AgentTeams agent={agent} />}
    {tab === 'progression' && (kitReady ? <DBPanel title="Promotion and skill materials" note="Totals are per section. Promotion excludes level EXP and includes caps from 20 through 60.">
      {Object.entries(kitReady.materials).map(([group,costs]) => <details className="db-accordion" key={group}>
        <summary>{group} <ChevronDown size={16} /></summary><Materials costs={costs} />
      </details>)}
      <Link className="secondary-button" to={dbPath('guides','agent-progression')}>Where to farm <ArrowUpRight size={15} /></Link>
    </DBPanel> : <KitStatus error={kitError} />)}
    {tab === 'story' && <AgentStory agent={agent} />}
  </>
}

function KitStatus({ error }: { error: boolean }) {
  return <p className="db-loading" role={error ? 'alert' : 'status'}>{error ? 'This kit could not load. Reopen the profile while online.' : 'Loading Agent kit…'}</p>
}

function AgentStats({ kit }: { kit: AgentKit }) {
  const [promotion, setPromotion] = useState(5)
  const [level, setLevel] = useState(60)
  const [core, setCore] = useState(6)
  const minimum = promotion === 0 ? 1 : promotionCaps[promotion - 1]
  const validCore = kit.coreUnlocks.reduce((latest,required,step) => required <= level ? step : latest,0)
  const selectedCore = Math.min(core,validCore)
  return <DBPanel title="Base statistics" note="The in-game level curve, promotion and Core Skill bonuses. Equipment and in-combat buffs are excluded.">
    <div className="db-facets">
      <label className="db-control">Promotion<select value={promotion} onChange={(event) => {
        const value = Number(event.target.value)
        setPromotion(value); setLevel(promotionCaps[value])
      }}>{promotionCaps.map((cap, index) => <option value={index} key={cap}>{index} · Lv. {cap} cap</option>)}</select></label>
      <label className="db-control">Level<select value={level} onChange={(event) => setLevel(Number(event.target.value))}>
        {Array.from({ length: promotionCaps[promotion] - minimum + 1 }, (_, index) => index + minimum).map((value) => <option key={value}>{value}</option>)}
      </select></label>
      <label className="db-control">Core Skill<select value={selectedCore} onChange={(event) => setCore(Number(event.target.value))}>
        {maxCoreSteps.map((label,index) => <option value={index} key={label} disabled={index > validCore}>{label}</option>)}
      </select></label>
    </div>
    <dl className="db-stat-grid">{Object.keys(kit.base).map(Number).map((id) => {
      const stat = statByID.get(id)
      const value = agentStat(kit,id,level,promotion,selectedCore)
      return stat && value !== 0 && <div key={id}><dt>{stat.name}</dt><dd>{showStat(stat, stat.scale === 1 ? Math.floor(value) : value)}</dd></div>
    })}</dl>
  </DBPanel>
}

export function SkillList({ skills }: { skills: Skill[] }) {
  const [level, setLevel] = useState(12)
  const numberData = skills.some((skill) => skill.numbers?.length)
  return <>
    {numberData && <label className="db-control db-skill-level">Skill multiplier level<select value={level} onChange={(event) => setLevel(Number(event.target.value))}>
      {Array.from({length:16},(_,i) => <option key={i}>{i+1}</option>)}
    </select></label>}
    {skills.map((skill,index) => <details className="db-accordion" key={index}>
      <summary><span><small>{skill.group}</small>{skill.name}</span><ChevronDown size={16} /></summary>
      <SkillText skill={skill} />
      {skill.numbers && <dl className="db-multis">{skill.numbers.map((entry,i) => <div key={i}><dt>{entry.name}</dt><dd>{entry.levels[level-1] ?? '—'}</dd></div>)}</dl>}
    </details>)}
  </>
}

function SkillText({ skill }: { skill: Skill }) {
  const [variant,setVariant] = useState(skill.variants?.length ? skill.variants.length - 1 : 0)
  return <>
    {skill.variants && <label className="db-control db-skill-variant">Effect level<select value={variant} onChange={(event) => setVariant(Number(event.target.value))}>
      {skill.variants.map((option,index) => <option value={index} key={option.label}>{option.label}</option>)}
    </select></label>}
    <p className="db-skill-copy">{skill.variants?.[variant]?.text ?? skill.description}</p>
  </>
}

function AgentSkills({ kit }: { kit: AgentKit }) {
  return <>
    <DBPanel title="Skill kit" note="Core passive descriptions show the highest available Core step. Multiplier rows are shown where their scaling is decoded.">
      <SkillList skills={kit.skills} />
    </DBPanel>
    <DBPanel title="Mindscape Cinema"><SkillList skills={kit.mindscapes} /></DBPanel>
    {kit.potential.length > 0 && <DBPanel title="Potential Vision"><SkillList skills={kit.potential} /></DBPanel>}
  </>
}

export function AgentBuild({ agent, kit }: { agent: Agent; kit?: AgentKit }) {
  const build = buildByAgent.get(agent.id)
  const sample = observations.agents[agent.id]
  const compatible = engines.filter((engine) => engine.specialty === agent.specialty && engine.acquisition?.includes('Gadget Store') && engine.id !== agent.signatureId)
  const signature = agent.signatureId ? engineByID.get(agent.signatureId) : undefined
  return <>
    {build && <>
      <DBPanel title="Recommended setup" note={'Zenlessentials guide · Version ' + build.version}>
        <div className="db-two-columns">
          <div><h3>W-Engines</h3>{build.engines.map(({ id, note }) => <div key={id} className="db-build-option">
            <RecordLink route="engines" record={engineByID.get(id)!} /><p>{note}</p>
          </div>)}</div>
          <div><h3>Drive Discs</h3>{build.discs.map(({ id, note }) => <div key={id} className="db-build-option">
            <RecordLink route="discs" record={discByID.get(id)!} /><p>{note}</p>
          </div>)}</div>
        </div>
        <div className="db-facets db-slot-recos">{build.main.map((item,index) => <div key={index}><small>Slot {index + 4}</small><strong>{item}</strong></div>)}</div>
        <p><strong>Substats</strong> · {build.substats.join(' → ')}</p>
        {build.targets?.map((target) => <p key={target}><strong>Target</strong> · {target}</p>)}
        <h3>Rotation</h3><ol>{build.rotation.map((step) => <li key={step}>{step}</li>)}</ol>
        {build.comparison && <details className="db-accordion"><summary>Published W-Engine comparison <ChevronDown size={15} /></summary>
          <div className="db-comparison-detail">
            <p>{build.comparison.context}</p>
            <dl className="db-materials">{build.comparison.values.map((option) => <div key={option.engineId}>
              <dt><Link to={dbPath('engines',option.engineId)}>{engineByID.get(option.engineId)?.name}</Link></dt><dd>{option.percent.toFixed(2)}%</dd>
            </div>)}</dl>
            <Sources urls={[build.comparison.source]} />
          </div>
        </details>}
        <Sources urls={build.sources} />
      </DBPanel>
    </>}
    <DBPanel title="Equipment options">
      {!build && signature && <RecordLink route="engines" record={signature} meta="Signature W-Engine" />}
      {!build && compatible.length > 0 && <><h3>Craftable, specialty-compatible alternatives</h3>
        <div className="db-related">{compatible.map((engine) => <RecordLink key={engine.id} route="engines" record={engine} meta={engine.rank + ' Rank'} />)}</div></>}
      <Link className="secondary-button" to={dbPath('engines','compare') + '?agent=' + agent.id}>Open W-Engine comparison <ArrowUpRight size={15} /></Link>
      {kit?.priority.some(Boolean) && <><h3>In-game upgrade priorities</h3><ol>{kit.priority.filter(Boolean).map((section) => <li key={section}>{section}</li>)}</ol></>}
    </DBPanel>
    {sample ? <DBPanel title="Observed endgame builds" note={observations.cycle + ' · ' + (sample.shiyuSample + sample.deadlySample).toLocaleString() + ' appearances across modes. Shares describe equipment people used, and can reflect ownership or small samples.'}>
      <div className="db-two-columns">
        <div><h3>W-Engine usage</h3>{sample.engines.map((engine) => <RecordLink key={engine.id} route="engines" record={engineByID.get(engine.id)!} meta={engine.share + '% of observed builds' + (engineByID.get(engine.id)?.specialty !== agent.specialty ? ' · Passive inactive' : '')} />)}</div>
        <div><h3>Drive Disc combinations</h3>{sample.discs.map((combo,index) => <div className="db-observed-combo" key={index}>
          <strong>{combo.share}%</strong><div>{combo.ids.map((id) => <Link key={id} to={dbPath('discs',id)}>{discByID.get(id)?.name} <ArrowUpRight size={12} /></Link>)}</div>
        </div>)}</div>
      </div>
      <div className="db-facets db-slot-recos">{sample.slots.map((options,index) => <div key={index}>
        <small>Slot {index + 4} usage</small><strong>{options[0]?.name ?? 'No sample'}</strong>
        {options.map((opt) => <small key={opt.name}>{opt.name} · {opt.share}%</small>)}
      </div>)}</div>
      <h3>Average stats of observed builds</h3>
      <dl className="db-stat-grid">{sample.stats.map(({name,value,suffix}) => <div key={name}><dt>{name}</dt><dd>{value.toLocaleString()}{suffix}</dd></div>)}</dl>
      <h3>Observed substat investment</h3>
      <dl className="db-materials">{sample.substats.map(({name,value,suffix}) => <div key={name}><dt>{name}</dt><dd>{value.toLocaleString()}{suffix}</dd></div>)}</dl>
      <Sources urls={[observations.source]} />
    </DBPanel> : <DBPanel title="Observed endgame builds" note="This Agent is absent from the published sample for this cycle." />}
  </>
}

function AgentTeams({ agent }: { agent: Agent }) {
  const curated = recommendedTeams.filter((team) => team.agentIds.includes(agent.id))
  const observed = observations.teams.filter((team) => team.agentIds.includes(agent.id))
    .sort((a,b) => Math.max(...b.observations.map((x) => x.share)) - Math.max(...a.observations.map((x) => x.share))).slice(0,6)
  return <>
    {curated.length > 0 && <DBPanel title="Squad recommendations">{curated.map((team) => <article className="db-team-card" key={team.id}>
      <h3>{team.name}</h3><p>{team.reason}</p><SquadLinks agentIds={team.agentIds} bangbooId={team.bangbooId} />
      {!!team.alternatives?.length && <><h4>Alternative teammates</h4><div className="db-related">
        {team.alternatives.map((id) => <AgentLink key={id} agent={agentByID.get(id)!} />)}
      </div></>}
      <OpenSquad agentIds={team.agentIds} bangbooId={team.bangbooId} /><Sources urls={team.sources} />
    </article>)}</DBPanel>}
    <DBPanel title="Observed endgame squads" note={observations.cycle + ' · Most frequent recorded teams for this Agent.'}>
      {observed.length === 0 && <p className="db-muted">No team samples for this Agent in the published cycle.</p>}
      <div className="db-two-columns">{observed.map((team) => {
        const best = [...team.observations].sort((a,b) => b.share - a.share)[0]
        return <article className="db-team-card" key={team.id}>
          <h3>{best.mode} · {best.share}% appearance</h3>
          <SquadLinks agentIds={team.agentIds} bangbooId={best.bangbooId} />
          <OpenSquad agentIds={team.agentIds} bangbooId={best.bangbooId} />
        </article>
      })}</div>
      <Sources urls={[observations.source]} />
    </DBPanel>
    {agent.conditionText && <DBPanel title="Additional Ability requirement">
      <p>{agent.conditionText}.</p>
      {agent.condition?.some((rule) => rule.kind === 'agent') && agent.condition.filter((rule) => rule.kind === 'agent').flatMap((rule) => rule.values.map((id) => <AgentLink key={id} agent={agentByID.get(id)!} />))}
    </DBPanel>}
  </>
}

function AgentStory({ agent }: { agent: Agent }) {
  const appear = (storyIdsByAgent.get(agent.id) ?? []).map((id) => entryByID[id]).filter(Boolean)
  const history = banners.filter((banner) => banner.kind !== 'Dissonant' && banner.agentIds.includes(agent.id))
  return <>
    <DBPanel title="Appears in" note="Links come from the story archive’s researched cast lists.">
      {appear.length ? <div className="db-related">{appear.map((story) => <Link className="db-story-link" key={story.id} to={storyLink(story)}>
        <BookOpen size={17} /><span>{story.title}<small>{categories[story.contentType]}</small></span><ChevronRight size={14} />
      </Link>)}</div> : <p>No verified appearances in the tracked story entries yet.</p>}
    </DBPanel>
    <DBPanel title="Banner appearances">
      {history.length ? <div className="db-related">{history.map((banner) => <Link className="db-story-link" key={banner.id} to={dbPath('banners',banner.id)}>
        <span>{banner.name}<small><RelativeDate value={banner.starts} /></small></span><ChevronRight size={14} />
      </Link>)}</div> : <p>No limited Agent channel appearances in the imported archive.</p>}
    </DBPanel>
    <Sources urls={[catalog.sources[0].url]} />
  </>
}
