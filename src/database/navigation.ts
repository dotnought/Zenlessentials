import { AudioLines, BookOpen, CalendarDays, CircleDot, Disc3, Flag, ScanSearch, Swords, UsersRound } from 'lucide-react'

export const databaseSections = [
  { key: 'agents', title: 'Agents', icon: UsersRound, description: 'Stats, skills, builds and story appearances' },
  { key: 'engines', title: 'W-Engines', icon: CircleDot, description: 'Passives, Overclock levels and comparisons' },
  { key: 'discs', title: 'Drive Discs', icon: Disc3, description: 'Set bonuses, slot stats and farming' },
  { key: 'bangboo', title: 'Bangboo', icon: AudioLines, description: 'Abilities, squad requirements and upgrades' },
  { key: 'tiers', title: 'Tier List', icon: Flag, description: 'Endgame ratings and your own rankings' },
  { key: 'teams', title: 'Team Builder', icon: Swords, description: 'Assemble squads and check their passives' },
  { key: 'banners', title: 'Banners', icon: CalendarDays, description: 'Signal Search schedules and reruns' },
  { key: 'guides', title: 'Guides', icon: BookOpen, description: 'Combat, gearing and progression' },
] as const
export const databaseSearch = { key: 'search', title: 'Database Search', icon: ScanSearch }
export const dbPath = (section = '', id = '') => '/database' + (section ? '/' + section : '') + (id ? '/' + id : '')

export function databaseTitle(pathname: string) {
  const section = pathname.split('/')[2]
  return [...databaseSections, databaseSearch].find((item) => item.key === section)?.title ?? 'Overview'
}
