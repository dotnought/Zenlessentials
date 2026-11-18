import { Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AgentPage } from './AgentPage'
import { BannerBook } from './Banners'
import { Catalog, DatabaseHub, DatabaseSearch } from './Catalog'
import type { CollectionState } from './collection'
import { BangbooPage, DiscPage, EngineCompare, EnginePage, Guides } from './Equipment'
import { TeamBuilder } from './Teams'
import { TierList } from './Tiers'
import { DatabaseNav, Empty } from './ui'
import './database.css'

function Detail({ section,state }: { section: 'agents'|'engines'|'discs'|'bangboo'|'banners'|'guides'|'teams'; state: CollectionState }) {
  const { id } = useParams()
  switch (section) {
    case 'agents': return <AgentPage key={id} id={id ?? ''} state={state} />
    case 'engines': return <EnginePage key={id} id={id ?? ''} state={state} />
    case 'discs': return <DiscPage id={id ?? ''} />
    case 'bangboo': return <BangbooPage id={id ?? ''} state={state} />
    case 'banners': return <BannerBook id={id} />
    case 'guides': return <Guides id={id} />
    case 'teams': return <TeamBuilder key={id} id={id} state={state} />
  }
}

export default function DatabaseApp({ state }: { state: CollectionState }) {
  const {search} = useLocation()
  return <div className="db">
    <DatabaseNav />
    <Routes>
      <Route index element={<DatabaseHub />} />
      <Route path="search" element={<DatabaseSearch />} />
      <Route path="agents" element={<Catalog key="agents" kind="agents" state={state} />} />
      <Route path="agents/:id" element={<Detail section="agents" state={state} />} />
      <Route path="engines" element={<Catalog key="engines" kind="engines" state={state} />} />
      <Route path="engines/compare" element={<EngineCompare />} />
      <Route path="engines/:id" element={<Detail section="engines" state={state} />} />
      <Route path="discs" element={<Catalog key="discs" kind="discs" state={state} />} />
      <Route path="discs/:id" element={<Detail section="discs" state={state} />} />
      <Route path="bangboo" element={<Catalog key="bangboo" kind="bangboo" state={state} />} />
      <Route path="bangboo/:id" element={<Detail section="bangboo" state={state} />} />
      <Route path="tiers" element={<TierList state={state} />} />
      <Route path="teams" element={<TeamBuilder key={search} state={state} />} />
      <Route path="teams/:id" element={<Detail section="teams" state={state} />} />
      <Route path="banners" element={<BannerBook />} />
      <Route path="banners/:id" element={<Detail section="banners" state={state} />} />
      <Route path="guides" element={<Guides />} />
      <Route path="guides/:id" element={<Detail section="guides" state={state} />} />
      <Route path="*" element={<Empty>This database page is unavailable.</Empty>} />
    </Routes>
  </div>
}
