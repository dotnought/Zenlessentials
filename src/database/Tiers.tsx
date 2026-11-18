import { useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { agents, observations } from './data'
import type { CollectionState } from './collection'
import { matchesQuery } from './mechanics'
import { dbPath } from './navigation'
import { DBHeading, DBPanel, Empty, Thumbnail } from './ui'
import { tierByAgent, tierOrder } from './tiers'
import type { Tier } from './tiers'

const tiers = [...tierOrder, 'Unranked'] as const
const specialties = [...new Set(agents.map((agent) => agent.specialty))].sort()

export function TierList({ state }: { state: CollectionState }) {
  const [mode,setMode] = useState<'deadly'|'shiyu'|'personal'>('deadly')
  const [role,setRole] = useState('')
  const [query,setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const rank = (id: string) => (mode === 'personal' ? state.collection.tiers[id] : tierByAgent.get(id)) ?? 'Unranked'
  const selected = agents.filter((agent) => (!role || agent.specialty === role)
    && (!tierFilter || rank(agent.id) === tierFilter) && matchesQuery(query, agent.name, ...agent.aliases))
  return <>
    <DBHeading title="Tier List" description="Browse the T0–T2 rankings or save your own placements." />
    <div className="panel db-toolbar">
      <div className="db-tab-row db-plain-tabs" aria-label="Rankings mode">
        {([['deadly','Deadly Assault'],['shiyu','Shiyu Defense'],['personal','My tier list']] as const).map(([value,label]) =>
          <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>)}
      </div>
      <label className="search-field"><Search size={16} /><input type="search" aria-label="Search tier list" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an Agent…" /></label>
      <div className="db-facets">
        <label className="db-control">Specialty<select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="">All specialties</option>{specialties.map((item) => <option key={item}>{item}</option>)}
        </select></label>
        <label className="db-control">Tier<select value={tierFilter} onChange={(event) => setTierFilter(event.target.value)}>
          <option value="">All tiers</option>{tiers.map((item) => <option key={item}>{item}</option>)}
        </select></label>
      </div>
    </div>
    {mode !== 'personal' && <DBPanel title="Rankings and usage">
      <p>These placements apply in both modes. The percentages show sampled appearances for the selected mode in cycle {observations.cycle}.</p>
      <a href={observations.source} className="secondary-button" target="_blank" rel="noreferrer">LvlUrArti sample <ArrowUpRight size={14} /></a>
    </DBPanel>}
    {!selected.length && <Empty>No Agents match these filters.</Empty>}
    {tiers.map((tier) => {
      const members = selected.filter((agent) => rank(agent.id) === tier).sort((a, b) => a.name.localeCompare(b.name))
      if (!members.length) return null
      return <section className="panel db-tier-row" data-tier={tier} key={tier}>
        <h2>{tier}</h2>
        <div>{members.map((agent) => <article className="db-tier-agent" key={agent.id}>
          <Link to={dbPath('agents',agent.id)}>
            <Thumbnail asset={agent} portrait /><strong>{agent.name}</strong>
            <small>{mode !== 'personal' && observations.agents[agent.id] ? observations.agents[agent.id][mode] + '%' : agent.specialty}</small>
          </Link>
          {mode === 'personal' && <select aria-label={'Tier for ' + agent.name} value={state.collection.tiers[agent.id] ?? ''} onChange={(event) => {
            const tier = event.target.value as Tier | ''
            state.setCollection((current) => {
              const updated = { ...current.tiers }
              if (tier) updated[agent.id] = tier
              else delete updated[agent.id]
              return { ...current, tiers: updated }
            })
          }}>
            <option value="">Unranked</option>{tierOrder.map((item) => <option key={item}>{item}</option>)}
          </select>}
        </article>)}</div>
      </section>
    })}
  </>
}
