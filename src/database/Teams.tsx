import { useMemo, useState } from 'react'
import { Check, ChevronRight, Pencil, Plus, Save, Trash2, UsersRound, X } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { agentByID, agents, bangboo, bangbooByID, discByID, engineByID, observations } from './data'
import { buildByAgent, recommendedTeams } from './editorial'
import { agentPassive, bangbooPassive } from './collection'
import type { CollectionState, SavedTeam } from './collection'
import { dbPath } from './navigation'
import { AgentLink, DBHeading, DBPanel, Empty, OpenSquad, RecordLink, Sources, SquadLinks, Tags } from './ui'

const sortedAgents = [...agents].sort((a,b) => a.name.localeCompare(b.name))
const sortedBoo = [...bangboo].sort((a,b) => a.name.localeCompare(b.name))
const blank: string[] = ['','','']
const validAgents = (value: string[]) => [...new Set(value.filter((id) => agentByID.has(id)))].slice(0,3)
const pad = (value: string[]) => [...value,...blank].slice(0,3)

export function TeamBuilder({ state, id }: { state: CollectionState; id?: string }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const saved = state.collection.teams.find((team) => team.id === id)
  const draft = saved?.agentIds ?? validAgents(params.get('squad')?.split(',') ?? [])
  const [selected,setSelected] = useState(() => pad(draft))
  const [boo,setBoo] = useState(() => saved?.bangbooId ?? (bangbooByID.has(params.get('bangboo') ?? '') ? params.get('bangboo')! : ''))
  const [name,setName] = useState(saved?.name ?? '')
  const [ownedOnly,setOwnedOnly] = useState(false)
  const [message,setMessage] = useState('')
  const chosen = selected.flatMap((id) => {
    const agent = agentByID.get(id)
    return agent ? [agent] : []
  })
  const companion = bangbooByID.get(boo)
  const bench = useMemo(() => sortedAgents.filter((member) => !selected.includes(member.id) &&
    (!ownedOnly || Object.hasOwn(state.collection.agents, member.id))), [selected,ownedOnly,state.collection.agents])
  const options = useMemo(() => {
    const active = selected.filter(Boolean)
    if (active.length === 0 || active.length === 3) return []
    return bench.flatMap((candidate) => {
      const squad = [...chosen,candidate]
      const checks = squad.filter((agent) => agentPassive(agent,squad) && (agent.id === candidate.id || !agentPassive(agent,chosen)))
      return checks.length ? [{candidate, checks}] : []
    }).sort((a,b) => Number(Object.hasOwn(state.collection.agents,b.candidate.id))-Number(Object.hasOwn(state.collection.agents,a.candidate.id)) || b.checks.length-a.checks.length).slice(0,8)
  }, [selected, bench, chosen, state.collection.agents])
  if (id && !saved) return <Empty>This saved squad is unavailable in your collection.</Empty>
  function commit() {
    if (validAgents(selected).length !== 3) return
    const item: SavedTeam = {id:saved?.id ?? 'squad-' + crypto.randomUUID(),name:name.trim() || 'Untitled squad',agentIds:[...selected],bangbooId:boo}
    state.setCollection((current) => ({
      ...current, teams: [...current.teams.filter((team) => team.id !== item.id), item],
    }))
    if (!saved) navigate(dbPath('teams',item.id))
    else setMessage('Squad updated.')
  }
  const activeBoo = companion ? bangbooPassive(companion,chosen) : undefined
  const matchingBangboo = chosen.length ? sortedBoo.filter((record) => record.id !== boo && bangbooPassive(record,chosen) &&
    (!ownedOnly || Object.hasOwn(state.collection.bangboo,record.id)))
    .sort((a,b) => Number(Object.hasOwn(state.collection.bangboo,b.id))-Number(Object.hasOwn(state.collection.bangboo,a.id))).slice(0,5) : []
  return <>
    <DBHeading title={saved ? saved.name : 'Team Builder'} description="Build a three-Agent squad and check its Additional Abilities.">
      {saved && <Link to={dbPath('teams')} className="secondary-button"><Plus size={16} /> New squad</Link>}
    </DBHeading>
    <div className="db-two-columns db-team-layout">
      <DBPanel title="Squad lineup">
        <label className="db-check"><input type="checkbox" checked={ownedOnly} onChange={(event) => setOwnedOnly(event.target.checked)} /> Show only owned Agents and Bangboo</label>
        <div className="db-team-picks">{selected.map((value,index) => {
          const member = agentByID.get(value)
          const active = member && agentPassive(member,chosen)
          return <div key={index}>
            <label className="db-control db-block">Agent slot {index + 1}<select aria-label={'Agent slot ' + (index+1)} value={value} onChange={(event) => {
              setSelected((current) => current.map((id,i) => i === index ? event.target.value : id))
              setMessage('')
            }}>
              <option value="">Choose an Agent</option>{sortedAgents.filter((agent) => agent.id === value || bench.includes(agent)).map((agent) =>
                <option key={agent.id} value={agent.id}>{agent.name}{Object.hasOwn(state.collection.agents,agent.id) ? ' · Owned' : ''}</option>)}
            </select></label>
            {member && <><AgentLink agent={member} /><Tags items={[active === undefined ? 'See requirement text' : active ? 'Ability active' : 'Ability inactive']} />
              {member.conditionText && <p>{member.conditionText}.</p>}</>}
          </div>
        })}</div>
        <label className="db-control db-block">Bangboo<select value={boo} onChange={(event) => setBoo(event.target.value)}>
          <option value="">No Bangboo</option>{sortedBoo.filter((record) => record.id === boo || !ownedOnly || Object.hasOwn(state.collection.bangboo,record.id))
            .map((record) => <option value={record.id} key={record.id}>{record.name}</option>)}
        </select></label>
        {companion && <><RecordLink route="bangboo" record={companion} meta={activeBoo === undefined ? 'Check ability text' : activeBoo ? 'Ability active' : 'Ability inactive'} />
          <p className="db-muted">{companion.skills.find((skill) => skill.group === 'Additional Ability')?.description.replace(/^Additional Ability\n/,'')}</p></>}
        <div className="db-facets db-save-squad">
          <label className="db-control">Squad name<input maxLength={64} value={name} onChange={(event) => setName(event.target.value)} placeholder="Name your squad" /></label>
          <button className="primary-button" type="button" disabled={chosen.length !== 3} onClick={commit}><Save size={16} />{saved ? 'Save changes' : 'Save squad'}</button>
        </div>
        {message && <p role="status">{message}</p>}
      </DBPanel>
      <div>
        <DBPanel title="Passive synergies" note="Recommendations come from recorded Additional Ability conditions. Owned Agents appear first.">
          {options.length ? options.map(({candidate,checks}) => <div className="db-synergy" key={candidate.id}>
            <AgentLink agent={candidate} meta={'Activates ' + checks.map((member) => member.name).join(', ')} />
            <button className="icon-button" type="button" aria-label={'Add ' + candidate.name} onClick={() => setSelected((current) => {
              const slot = current.indexOf('')
              return current.map((id,index) => index === slot ? candidate.id : id)
            })}><Plus size={19} /></button>
          </div>) : <p className="db-muted">{chosen.length === 3 ? 'Check the lineup to see each selected Agent’s activation state.' : 'Choose an Agent to see who helps activate an ability.'}</p>}
        </DBPanel>
        {matchingBangboo.length > 0 && <DBPanel title="Bangboo matches" note="The current lineup meets these Additional Ability requirements.">
          {matchingBangboo.map((record) => <div className="db-synergy" key={record.id}>
            <RecordLink route="bangboo" record={record} meta={Object.hasOwn(state.collection.bangboo,record.id) ? 'Owned' : undefined} />
            <button className="icon-button" type="button" aria-label={'Select ' + record.name} onClick={() => setBoo(record.id)}><Plus size={18} /></button>
          </div>)}
        </DBPanel>}
        {chosen.length > 0 && <DBPanel title="Equipment for this squad">
          {chosen.map((agent) => {
            const guide = buildByAgent.get(agent.id)
            const sample = observations.agents[agent.id]
            const engine = engineByID.get(guide?.engines[0]?.id ?? sample?.engines[0]?.id ?? agent.signatureId ?? '')
            const discs = guide?.discs.slice(0,2).map((item) => item.id) ?? sample?.discs[0]?.ids ?? []
            return <div className="db-gear-group" key={agent.id}>
              <h3><Link to={dbPath('agents',agent.id)}>{agent.name} <ChevronRight size={14} /></Link></h3>
              {engine && <RecordLink route="engines" record={engine} meta={guide ? 'Guide recommendation' : sample ? 'Observed usage' : 'Signature'} />}
              {discs.map((id) => <RecordLink key={id} route="discs" record={discByID.get(id)!} />)}
            </div>
          })}
        </DBPanel>}
      </div>
    </div>
    <SavedSquads state={state} />
    <DBPanel title="Featured squads"><div className="db-two-columns">
      {recommendedTeams.map((team) => <article className="db-team-card" key={team.id}>
        <h3>{team.name}</h3><p>{team.reason}</p><SquadLinks agentIds={team.agentIds} bangbooId={team.bangbooId} />
        <OpenSquad agentIds={team.agentIds} bangbooId={team.bangbooId} />
      </article>)}
    </div></DBPanel>
    <DBPanel title="Most-used observed squads" note={observations.cycle + ' · Deadly Assault. Rates reflect the sample and cycle.'}>
      <div className="db-two-columns">{observations.teams.filter((team) => team.observations.some((obs) => obs.mode === 'Deadly Assault' && obs.rank <= 4)).slice(0,8).map((team) => {
        const obs = team.observations.find((item) => item.mode === 'Deadly Assault')!
        return <article className="db-team-card" key={team.id}>
          <h3>{obs.share}% appearance</h3><SquadLinks agentIds={team.agentIds} bangbooId={obs.bangbooId} />
          <OpenSquad agentIds={team.agentIds} bangbooId={obs.bangbooId} />
        </article>
      })}</div><Sources urls={[observations.source]} />
    </DBPanel>
  </>
}

export function SavedSquads({ state }: { state: CollectionState }) {
  const [removal,setRemoval] = useState('')
  const {pathname} = useLocation()
  const navigate = useNavigate()
  return <DBPanel title="Saved squads">
    {!state.collection.teams.length && <p className="db-muted"><UsersRound size={15} /> Save a lineup to keep it here.</p>}
    <div className="db-two-columns">{state.collection.teams.map((team) => <article className="db-team-card" key={team.id}>
      <h3>{team.name}</h3><SquadLinks agentIds={team.agentIds} bangbooId={team.bangbooId} />
      <div className="db-actions">
        <Link className="secondary-button" to={dbPath('teams',team.id)}><Pencil size={14} /> Edit</Link>
        {removal === team.id ? <>
          <button className="secondary-button danger" type="button" onClick={() => {
            state.setCollection((current) => ({ ...current,teams:current.teams.filter((item) => item.id !== team.id) }))
            setRemoval('')
            if (pathname === dbPath('teams',team.id)) navigate(dbPath('teams'),{replace:true})
          }}><Check size={14} /> Confirm removal</button>
          <button className="secondary-button" type="button" onClick={() => setRemoval('')}><X size={14} /> Cancel</button>
        </> : <button className="secondary-button" type="button" onClick={() => setRemoval(team.id)}><Trash2 size={14} /> Remove</button>}
      </div>
    </article>)}</div>
  </DBPanel>
}
