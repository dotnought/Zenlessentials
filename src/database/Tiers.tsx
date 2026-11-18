import { DndContext, DragOverlay, MeasuringStrategy, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor } from '@dnd-kit/core'
import type { Announcements, CollisionDetection, DragEndEvent } from '@dnd-kit/core'
import { GripHorizontal, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import { agentByID, agents } from './data'
import type { CollectionState } from './collection'
import { matchesQuery } from './mechanics'
import type { Agent } from './model'
import { dbPath } from './navigation'
import { DBHeading, Empty, Thumbnail } from './ui'
import { tierByAgent, tierOrder } from './tiers'
import type { Tier } from './tiers'

const specialties = [...new Set(agents.map((agent) => agent.specialty))].sort()
const handleId = (agentId: string) => 'tier-move-' + agentId
const measuring = { droppable: { strategy: MeasuringStrategy.Always } }
const findTier: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  const dock = hits.find((hit) => String(hit.id).startsWith('dock-'))
  return dock ? [dock] : hits
}
const dragAccessibility = {
  announcements: {
    onDragStart: ({ active }) => (agentByID.get(String(active.id))?.name ?? 'Agent') + ' picked up.',
    onDragOver: ({ over }) => over ? 'Over ' + over.data.current?.tier + '.' : undefined,
    onDragEnd: ({ over }) => over ? undefined : 'Move canceled.',
    onDragCancel: () => 'Move canceled.',
  } satisfies Announcements,
}

export function TierList({ state }: { state: CollectionState }) {
  const [params, setParams] = useSearchParams()
  const mode = params.get('view') === 'personal' ? 'personal' : 'rankings'
  const [role, setRole] = useState('')
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [dragging, setDragging] = useState<string>()
  const [choosing, setChoosing] = useState<string>()
  const [announcement, setAnnouncement] = useState('')
  const pointer = useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  const personal = mode === 'personal'
  const active = agentByID.get(dragging ?? choosing ?? '')
  const rank = (id: string) => (personal ? state.collection.tiers[id] : undefined) ?? tierByAgent.get(id)
  const selected = agents.filter((agent) => {
    const tier = rank(agent.id)
    return tier && (!role || agent.specialty === role) && (!tierFilter || tier === tierFilter)
      && matchesQuery(query, agent.name, ...agent.aliases)
  })

  function focusHandle(agentId: string) {
    requestAnimationFrame(() => {
      const target = document.getElementById(handleId(agentId)) ?? document.getElementById('tier-filter')
      target?.focus({ preventScroll: true })
    })
  }

  function moveAgent(agent: Agent, tier?: Tier) {
    const destination = tier ?? tierByAgent.get(agent.id)
    if (!destination) return
    const initialTier = tierByAgent.get(agent.id)
    state.setCollection((current) => {
      const updated = { ...current.tiers }
      if (destination === initialTier) delete updated[agent.id]
      else updated[agent.id] = destination
      return { ...current, tiers: updated }
    })
    setAnnouncement(agent.name + ' moved to ' + destination + '.')
  }

  function endDrag({ active, over }: DragEndEvent) {
    setDragging(undefined)
    const agent = agentByID.get(String(active.id))
    const destination: unknown = over?.data.current?.tier
    const tier = tierOrder.find((value) => value === destination)
    if (agent && tier && rank(agent.id) !== tier) moveAgent(agent, tier)
  }

  return <>
    <DBHeading title="Tier List" description="Browse the T0–T2 rankings or save your own placements." />
    <div className="panel db-toolbar">
      <div className="db-tab-row db-plain-tabs" aria-label="Tier list view">
        {([['rankings','Rankings'],['personal','My tier list']] as const).map(([value,label]) =>
          <button key={value} type="button" aria-pressed={mode === value} onClick={() => {
            if (value === mode) return
            setChoosing(undefined)
            setParams(value === 'personal' ? { view: 'personal' } : {}, { replace: true })
          }}>{label}</button>)}
      </div>
      <label className="search-field"><Search size={16} /><input type="search" aria-label="Search tier list" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an Agent…" /></label>
      <div className="db-facets">
        <label className="db-control">Specialty<select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="">All specialties</option>{specialties.map((item) => <option key={item}>{item}</option>)}
        </select></label>
        <label className="db-control">Tier<select id="tier-filter" value={tierFilter} onChange={(event) => setTierFilter(event.target.value)}>
          <option value="">All tiers</option>{tierOrder.map((item) => <option key={item}>{item}</option>)}
        </select></label>
      </div>
      {personal && <p className="db-muted db-tier-hint">Drag the nameplate under a portrait, or select it to choose a tier.</p>}
    </div>
    <p className="sr-only" role="status">{announcement}</p>
    {!selected.length && <Empty>No Agents match these filters.</Empty>}
    <DndContext sensors={[pointer]} collisionDetection={findTier} measuring={measuring} accessibility={dragAccessibility}
      onDragStart={({ active }) => { setChoosing(undefined); setDragging(String(active.id)) }}
      onDragEnd={endDrag}
      onDragCancel={() => setDragging(undefined)}>
      {tierOrder.map((tier) => {
        const members = selected.filter((agent) => rank(agent.id) === tier).sort((a, b) => a.name.localeCompare(b.name))
        if (!members.length && !(personal && selected.length && !tierFilter)) return null
        return <TierRow key={tier} tier={tier} members={members} personal={personal} choosing={choosing}
          onChoose={(agentId) => {
            setAnnouncement('')
            setChoosing((id) => id === agentId ? undefined : agentId)
          }} />
      })}
      {personal && active && <TierDock key={active.id} agent={active} current={rank(active.id)} isDragging={Boolean(dragging)}
        canReset={Object.hasOwn(state.collection.tiers, active.id)}
        onSelect={(tier) => {
          if (tier === undefined || tier !== rank(active.id)) moveAgent(active, tier)
          setChoosing(undefined)
          focusHandle(active.id)
        }}
        onClose={() => { setChoosing(undefined); focusHandle(active.id) }} />}
      {createPortal(<DragOverlay dropAnimation={null}>
        {dragging && active && <div className="db-tier-drag-preview" aria-hidden="true">
          <Thumbnail asset={active} portrait /><strong>{active.name}</strong>
        </div>}
      </DragOverlay>, document.body)}
    </DndContext>
  </>
}

function TierRow({ tier, members, personal, choosing, onChoose }: {
  tier: Tier; members: Agent[]; personal: boolean; choosing?: string; onChoose: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'row-' + tier, data: { tier }, disabled: !personal })
  return <section ref={setNodeRef} className="panel db-tier-row" data-tier={tier} data-drop-over={isOver || undefined}>
    <h2>{tier}</h2>
    <div>{members.length ? members.map((agent) => <TierAgent key={agent.id} agent={agent} personal={personal}
      choosing={choosing === agent.id} onChoose={onChoose} />) : <p className="db-tier-empty">Drop Agents here</p>}</div>
  </section>
}

function TierAgent({ agent, personal, choosing, onChoose }: {
  agent: Agent; personal: boolean; choosing: boolean; onChoose: (id: string) => void
}) {
  const { listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: agent.id, disabled: !personal })
  const caption = <><strong>{agent.name}</strong><small>{agent.specialty}</small></>
  return <article className="db-tier-agent" ref={setNodeRef} data-personal={personal || undefined} data-dragging={isDragging || undefined}>
    <Link to={dbPath('agents', agent.id)} aria-label={personal ? agent.name : undefined}
      onDragStart={personal ? (event) => event.preventDefault() : undefined}>
      <Thumbnail asset={agent} portrait />{!personal && caption}
    </Link>
    {personal && <button type="button" id={handleId(agent.id)} className="db-tier-grip"
      ref={setActivatorNodeRef} {...listeners} aria-label={'Move ' + agent.name}
      aria-expanded={choosing} aria-controls={choosing ? 'tier-destinations' : undefined}
      onClick={() => onChoose(agent.id)}>
      {caption}<GripHorizontal aria-hidden="true" size={14} />
    </button>}
  </article>
}

function TierDock({ agent, current, isDragging, canReset, onSelect, onClose }: {
  agent: Agent; current?: Tier; isDragging: boolean; canReset: boolean; onSelect: (tier?: Tier) => void; onClose: () => void
}) {
  const dock = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!isDragging) dock.current?.querySelector<HTMLButtonElement>('button[aria-current]')?.focus({ preventScroll: true })
  }, [isDragging])
  return <section ref={dock} className="panel db-tier-dock" id="tier-destinations" aria-labelledby="tier-destinations-title"
    onKeyDown={(event) => {
      if (event.key === 'Escape' && !isDragging) { event.preventDefault(); onClose() }
    }}>
    <div className="db-tier-dock-head">
      <h2 id="tier-destinations-title">{isDragging ? 'Drop ' : 'Move '}{agent.name} into a tier</h2>
      {!isDragging && <button type="button" className="icon-button" aria-label="Cancel move" onClick={onClose}><X size={17} /></button>}
    </div>
    <div className="db-tier-targets">
      {tierOrder.map((tier) => <TierTarget key={tier} tier={tier} current={current === tier} isDragging={isDragging} onSelect={onSelect} />)}
    </div>
    {!isDragging && canReset && <button type="button" className="secondary-button" onClick={() => onSelect()}>Reset to main tier</button>}
  </section>
}

function TierTarget({ tier, current, isDragging, onSelect }: {
  tier: Tier; current: boolean; isDragging: boolean; onSelect: (tier: Tier) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'dock-' + tier, data: { tier }, disabled: !isDragging })
  return <button ref={setNodeRef} className="db-tier-target" type="button" data-tier={tier}
    data-drop-over={isOver || undefined} aria-current={current || undefined}
    onClick={() => onSelect(tier)}>{tier}</button>
}
