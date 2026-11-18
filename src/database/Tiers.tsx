import { useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { agents, observations } from './data'
import { personalTiers } from './collection'
import type { CollectionState } from './collection'
import { matchesQuery } from './mechanics'
import { dbPath } from './navigation'
import { DBHeading, DBPanel, Empty, Thumbnail } from './ui'

const tiers = ['S','A','B','C','D','Unrated'] as const
const specialties = [...new Set(agents.map((agent) => agent.specialty))].sort()
const thresholds = [15,7,3,1]

export function TierList({ state }: { state: CollectionState }) {
  const [mode,setMode] = useState<'deadly'|'shiyu'|'personal'>('deadly')
  const [role,setRole] = useState('')
  const [query,setQuery] = useState('')
  const rank = (id: string) => {
    if (mode === 'personal') return state.collection.tiers[id] ?? 'Unrated'
    const sample = observations.agents[id]
    if (!sample) return 'Unrated'
    const i = thresholds.findIndex((threshold) => sample[mode] >= threshold)
    return i === -1 ? 'D' : tiers[i]
  }
  const selected = agents.filter((agent) => (!role || agent.specialty === role) && matchesQuery(query,agent.name,...agent.aliases))
  return <>
    <DBHeading title="Tier List" description="Explore sampled endgame usage or save your own rankings." />
    <div className="panel db-toolbar">
      <div className="db-tab-row db-plain-tabs" aria-label="Rankings mode">
        {([['deadly','Deadly Assault'],['shiyu','Shiyu Defense'],['personal','My tier list']] as const).map(([value,label]) =>
          <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>)}
      </div>
      <label className="search-field"><Search size={16} /><input type="search" aria-label="Search tier list" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an Agent…" /></label>
      <div className="db-facets"><label className="db-control">Specialty<select value={role} onChange={(event) => setRole(event.target.value)}>
        <option value="">All specialties</option>{specialties.map((item) => <option key={item}>{item}</option>)}
      </select></label></div>
    </div>
    {mode !== 'personal' && <DBPanel title={'Usage methodology · Cycle ' + observations.cycle}>
      <p>Zenlessentials groups the published appearance rates into S (15%+), A (7%+), B (3%+), C (1%+) and D (under 1%). Each sample reflects participating players, their rosters and the bosses in that cycle. A low appearance rate can still hide a strong matchup or an Agent released after the sample.</p>
      <a href={observations.source} className="secondary-button" target="_blank" rel="noreferrer">LvlUrArti sample <ArrowUpRight size={14} /></a>
    </DBPanel>}
    {!selected.length && <Empty>No Agents match these filters.</Empty>}
    {tiers.map((tier) => {
      const members = selected.filter((agent) => rank(agent.id) === tier).sort((a,b) => {
        if (mode !== 'personal') {
          const delta = (observations.agents[b.id]?.[mode] ?? 0) - (observations.agents[a.id]?.[mode] ?? 0)
          if (delta) return delta
        }
        return a.name.localeCompare(b.name)
      })
      if (!members.length) return null
      return <section className={'panel db-tier-row db-tier-' + tier.toLowerCase()} key={tier}>
        <h2>{tier}</h2>
        <div>{members.map((agent) => <article className="db-tier-agent" key={agent.id}>
          <Link to={dbPath('agents',agent.id)}>
            <Thumbnail asset={agent} portrait /><strong>{agent.name}</strong>
            <small>{mode !== 'personal' && observations.agents[agent.id] ? observations.agents[agent.id][mode] + '%' : agent.specialty}</small>
          </Link>
          {mode === 'personal' && <select aria-label={'Tier for ' + agent.name} value={state.collection.tiers[agent.id] ?? ''} onChange={(event) => {
            const tier = event.target.value
            state.setCollection((current) => {
              const updated = { ...current.tiers }
              if (tier) updated[agent.id] = tier
              else delete updated[agent.id]
              return { ...current, tiers: updated }
            })
          }}>
            <option value="">Unrated</option>{personalTiers.map((item) => <option key={item}>{item}</option>)}
          </select>}
        </article>)}</div>
      </section>
    })}
  </>
}
