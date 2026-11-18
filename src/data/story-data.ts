import type { EntryInput } from './timeline'
import type { Source } from './model'
import { archive, community, official, updates, versionWiki, wiki } from './sources'

type MainRow = [id: string, title: string, chapter: string, version: string, order: number, archiveID: number | null, summary: string, characters: string[], unlock?: string, extra?: Source[]]

const mainRows: MainRow[] = [
  ['prologue', 'Business x Strangeness x Justness', 's1-prologue', '1.0', 10, 1, 'A rescue job brings the Cunning Hares to Phaethon, a pair of sibling Proxies operating from the Random Play video store.', ['Belle', 'Wise', 'Nicole', 'Anby', 'Billy'], 'Begin a new game.'],
  ['cat-a', "Cat's Lost & Found (A)", 's1-cat', '1.0', 10, 2, 'Nekomata approaches the Cunning Hares with a commission tied to the old city district.', ['Nekomata', 'Nicole', 'Anby', 'Billy']],
  ['cat-b', "Cat's Lost & Found (B)", 's1-cat', '1.0', 20, 3, 'Phaethon and the Cunning Hares follow Nekomata back into the Hollow.', ['Nekomata', 'Nicole', 'Anby', 'Billy']],
  ['the-zero-zone', 'The Zero Zone', 's1-zero', '1.0', 10, 4, 'Phaethon begins working with the investigators at Scott Outpost.', ['Belle', 'Wise', 'Ray', 'Roland'],
    'As of 2.5, reach Inter-Knot Lv. 25 and Certified Proxy, then complete this key Side Mission to unlock Hollow Zero.', [updates['2.5']]],
  ['hollow-heart-a', "A Call From the Hollow's Heart (A)", 's1-hollow-heart', '1.0', 10, 6, 'Belobog Heavy Industries needs a Proxy to help track down missing construction machinery.', ['Koleda', 'Grace', 'Ben', 'Anton']],
  ['hollow-heart-b', "A Call From the Hollow's Heart (B)", 's1-hollow-heart', '1.0', 20, 7, 'The Belobog investigation draws the team deeper into the construction site.', ['Koleda', 'Grace', 'Ben', 'Anton']],
  ['unthinkable-a', 'Mission Unthinkable (A)', 's1-unthinkable', '1.0', 10, 8, 'A new lead puts Phaethon in the orbit of New Eridu Public Security.', ['Zhu Yuan', 'Qingyi', 'Belle', 'Wise']],
  ['unthinkable-b', 'Mission Unthinkable (B)', 's1-unthinkable', '1.0', 20, 9, 'Zhu Yuan and Qingyi take center stage as an investigation moves into the Hollow.', ['Zhu Yuan', 'Qingyi']],
  ['midnight-a', 'The Midnight Pursuit (A)', 's1-midnight', '1.0', 10, 10, 'Victoria Housekeeping takes on an assignment at the Ballet Twins.', ['Von Lycaon', 'Rina', 'Ellen Joe', 'Corin']],
  ['midnight-b', 'The Midnight Pursuit (B)', 's1-midnight', '1.0', 20, 11, 'Phaethon and Victoria Housekeeping press on through the Ballet Twins.', ['Von Lycaon', 'Rina', 'Ellen Joe', 'Corin']],
  ['inferno-a', 'Tour de Inferno (A)', 's1-inferno', '1.2', 10, 12, 'Phaethon heads to the Outer Ring, where the Sons of Calydon are preparing for the Tour de Inferno.', ['Caesar', 'Lucy', 'Piper', 'Burnice', 'Lighter']],
  ['inferno-b', 'Tour de Inferno (B)', 's1-inferno', '1.2', 20, 13, 'The race for the Outer Ring’s future puts the biker crews to the test.', ['Caesar', 'Lucy', 'Burnice', 'Lighter']],
  ['falling-stars-a', 'A Storm of Falling Stars (A)', 's1-stars', '1.4', 10, 14, 'Section 6 and Phaethon take up an investigation that leads through Port Elpis.', ['Hoshimi Miyabi', 'Tsukishiro Yanagi', 'Asaba Harumasa', 'Soukaku'], 'Complete Tour de Inferno and the Special Episode Virtual Revenge.'],
  ['falling-stars-b', 'A Storm of Falling Stars (B)', 's1-stars', '1.4', 20, 15, 'Phaethon and Section 6 confront a crisis threatening New Eridu.', ['Hoshimi Miyabi', 'Asaba Harumasa', 'Belle', 'Wise']],
  ['bury-tears-a', 'Bury Your Tears With the Past (A)', 's1-epilogue', '1.6', 10, 16, 'Phaethon’s search brings the siblings into contact with Mockingbird and old acquaintances.', ['Vivian', 'Hugo', 'Von Lycaon'], "Complete Leisurely Lull: Goldfinch's Escape and Astra-nomical Moment."],
  ['bury-tears-b', 'Bury Your Tears With the Past (B)', 's1-epilogue', '1.7', 20, 17, 'Mockingbird returns as the New Eridu arc draws to a close.', ['Vivian', 'Hugo', 'Von Lycaon'], 'Complete Bury Your Tears With the Past (A).'],
  ['where-clouds', 'Where Clouds Embrace the Dawn', 's2-clouds', '2.0', 10, 18, 'The siblings head to Waifei Peninsula and meet the members of Yunkui Summit.', ['Yixuan', 'Ju Fufu', 'Pan Yinhu', 'Belle', 'Wise']],
  ['crash-waves', 'The Impending Crash of Waves', 's2-waves', '2.1', 10, 19, 'An investigation in Failume Heights brings Phaethon into Alice and Yuzuha’s orbit.', ['Alice', 'Ukinami Yuzuha', 'Komano Manato']],
  ['good-night', 'Do Not Go Gentle Into That Good Night', 's2-good-night', '2.2', 10, 20, 'Phaethon works with Obol Squad as events on the peninsula escalate.', ['Seed', 'Orphie & Magus', 'Soldier 11']],
  ['dreams-bygone', 'Memories of Dreams Bygone', 's2-dreams', '2.3', 10, 21, 'Phaethon follows new leads with members of Spook Shack.', ['Lucia Elowen', 'Yidhari Murphy', 'Komano Manato']],
  ['precipice-abyss', 'On the Precipice of the Abyss', 's2-abyss', '2.4', 10, 22, 'The investigation deepens as Phaethon meets Dialyn and Banyue.', ['Dialyn', 'Banyue', 'Ye Shunguang']],
  ['fuel-night', 'To Be Fuel for the Night', 's2-fuel', '2.5', 10, 23, 'Phaethon’s search converges with Ye Shunguang and Zhao’s stories.', ['Ye Shunguang', 'Zhao', 'Yixuan'], 'Complete On the Precipice of the Abyss.'],
  ['old-dream', 'Encore for an Old Dream', 's2-encore', '2.6', 10, 24, 'The Angels of Delusion draw Phaethon into a new commission during the Season 2 interlude.', ['Sunna', 'Aria', 'Nangong Yu'], 'Complete To Be Fuel for the Night.', [official('HoYoverse story notice', '162500')]],
  ['eridan-sunset-a', 'New: Eridan Sunset (A)', 's2-sunset', '2.7', 10, 25, 'The Season 2 epilogue picks up after the Angels’ interlude.', ['Cissia', 'Nangong Yu'], 'Complete Encore for an Old Dream.', [community('2.7 patch notes mirror', 'https://zenless.gg/version-2-7-champions-never-fall-to-the-past-update-announcement/')]],
  ['eridan-sunset-b', 'New: Eridan Sunset (B)', 's2-sunset', '2.8', 20, 26, 'The second half closes out the Waifei Peninsula arc.', ['Promeia', 'Starlight - Billy'], 'Complete New: Eridan Sunset (A).'],
  ['sleepwalkers-confession', "A Sleepwalker's Confession", 's3-sleep', '3.0', 10, 27, 'Phaethon arrives in Roscaelifer and gets a first look at Booastrum.', ['Velina', 'Norma', 'Pyrois'], 'Complete New: Eridan Sunset (B). Advance Screening offers early access.'],
  ['long-goodbye', 'The Long Goodbye', 's3-goodbye', '3.1', 10, 28, 'The search continues in Booastrum, with Gear Street opening up to Phaethon.', ['Remielle', 'Sigrid']],
  ['secret-histories', 'Their Secret Histories', 's3-histories', '3.2', 10, 29, 'The Roscaelifer investigation leads into the Vyrium District.', ['Claret', 'Roxy'], 'Complete The Long Goodbye.', [official('HoYoverse story notice', '165981')]],
  ['journey-sky', 'Journey to the Sky', 's3-sky', '3.3', 10, null, 'To reach Booastrum again, Phaethon heads for the occupied skyport on Quietude Isle.', ['Phoenix', 'Severian'], 'Complete Their Secret Histories.', [official('HoYoverse story notice', '166928')]],
]

export const mainStories: EntryInput[] = mainRows.map(([id, title, chapter, version, order, archiveID, summary, characters, unlock, extra], index) => ({
  id, title, chapter, releaseVersion: version, chronologicalOrder: order, characters, description: summary,
  contentType: 'main',
  optional: id === 'the-zero-zone',
  notes: id === 'the-zero-zone' ? 'The Video Archive preserves its original Chapter 1 intermission position. Version 2.5 moved the playable mission to Key Side Missions.' : undefined,
  availability: 'permanent',
  placementAfter: id === 'falling-stars-a' ? ['inferno-b', 'virtual-revenge']
    : id === 'bury-tears-a' ? ['falling-stars-b', 'astra-nomical-moment']
      : index ? [mainRows[index - 1][0]] : [],
  prerequisites: unlock ?? null,
  placementReason: index === 0 ? 'The Video Archive opens with this prologue. The siblings’ work as Phaethon frames the rest of the story.'
    : id === 'falling-stars-a' ? 'The chapter follows Tour de Inferno and assumes you have already seen Section 6 in Virtual Revenge.'
      : id === 'bury-tears-a' ? 'The epilogue follows the Chapter 5 wrap-up and the meeting with Astra and Evelyn in their Special Episode.'
        : 'Follow this part in the order shown in Phaethon’s Story.',
  spoilerDescription: id === 'prologue' ? 'After a hacker forces the siblings to give up Phaethon’s original Inter-Knot account, Fairy takes up residence in their HDD system.' : null,
  sourceURLs: [...(archiveID ? [archive(archiveID)] : []), updates[version] ?? versionWiki(version), ...(extra ?? [])],
}))

export const specialStories: EntryInput[] = [
  {
    id: 'undercover-rb', title: 'Undercover R&B', contentType: 'special', chapter: 's1-unthinkable', releaseVersion: '1.1', chronologicalOrder: 60,
    placementAfter: ['unthinkable-b'], prerequisites: 'Complete Mission Unthinkable.',
    availability: 'permanent', description: 'Jane Doe goes undercover to investigate the Mountain Lion gang.',
    placementReason: 'The Public Security interlude introduces the department before Jane’s assignment expands its side of the story.',
    sourceURLs: [archive(20001), updates['1.1']], characters: ['Jane Doe', 'Seth Lowell', 'Zhu Yuan', 'Qingyi'],
  },
  {
    id: 'virtual-revenge', title: 'Virtual Revenge', contentType: 'special', chapter: 's1-inferno', releaseVersion: '1.3', chronologicalOrder: 490,
    placementAfter: ['inferno-b'], placementBefore: ['falling-stars-a'], prerequisites: 'Complete Tour de Inferno.',
    officialRecommendation: 'HoYoverse lists this episode as a requirement for A Storm of Falling Stars.',
    optional: false, placementConfidence: 'official', availability: 'permanent',
    description: 'Section 6 tests a virtual training program, with Tsukishiro Yanagi at the center of the episode.',
    placementReason: 'Watch after the Outer Ring arc and before the team’s central role in Chapter 5.',
    sourceURLs: [archive(20002), updates['1.4']], characters: ['Tsukishiro Yanagi', 'Soukaku', 'Asaba Harumasa', 'Hoshimi Miyabi'],
  },
  {
    id: 'astra-nomical-moment', title: 'Astra-nomical Moment', contentType: 'special', chapter: 's1-stars', releaseVersion: '1.5', chronologicalOrder: 170,
    placementAfter: ['falling-stars-b'], placementBefore: ['bury-tears-a'], prerequisites: "Complete Leisurely Lull: Goldfinch's Escape after Chapter 5.",
    officialRecommendation: 'HoYoverse lists this episode as a requirement for the Season 1 epilogue.',
    optional: false, placementConfidence: 'official', availability: 'permanent',
    description: 'A commission with singer Astra Yao and her manager Evelyn takes Phaethon behind the scenes at Starloop.',
    placementReason: 'The Season 1 epilogue’s standard unlock expects this meeting to have happened.',
    sourceURLs: [archive(20003), updates['1.5'], updates['1.6']], characters: ['Astra Yao', 'Evelyn Chevalier'],
  },
]

type AgentRow = [id: string, title: string, agent: string, chapter: string, version: string, order: number, archiveID: number, after: string, unlock: string, summary: string, reason: string, parts?: string[]]
const roman = ['I', 'II', 'III']
const agentRows: AgentRow[] = [
  ['mole-in-the-hole', 'Mole in the Hole', 'Soldier 11', 's1-zero', '1.0', 35, 10001, 'cat-b',
    'As of 2.5, complete the Chapter 1 main story intermission.', 'A military client hires a Proxy for an undercover assignment.', 'The frame is an early meeting with Soldier 11. It fits the first Scott Outpost stretch and introduces her ahead of later Obol Squad stories.'],
  ['cat-mouse', 'Cat and Mouse Game', 'Nekomata · Nekomiya Mana', 's1-hollow-heart', '1.0', 50, 10002, 'hollow-heart-b',
    "Complete A Call From the Hollow's Heart.", 'Nekomata takes on a job that reconnects her with her old neighborhood.', 'Nekomata already knows Phaethon and the Hares. The Chapter 2 break also respects the contemporary Video Archive unlock.'],
  ['iron-witch', 'The Iron Witch', 'Grace Howard', 's1-unthinkable', '1.0', 33, 10004, 'unthinkable-b',
    'Complete Mission Unthinkable.', 'Grace gets involved with an unusual piece of machinery.', 'Play after the Belobog arc establishes Grace and her relationship with machines. The Archive opens it after Mission Unthinkable.'],
  ['schoolyard', 'Schoolyard Powerhouse', 'Koleda Belobog', 's1-midnight', '1.0', 50, 10005, 'midnight-a',
    'Complete Phase 1 of The Midnight Pursuit.', 'Koleda takes an assignment connected to a school.', 'The story assumes you know Koleda and the Belobog crew. Grouped here at the next chapter break to avoid interrupting the Ballet Twins case.'],
  ['true-heroes', 'And the True Heroes Are Always Behind the Scenes', 'Von Lycaon', 's1-midnight', '1.0', 70, 10006, 'midnight-b',
    'Complete The Midnight Pursuit.', 'Lycaon takes on a case that highlights the work Victoria Housekeeping does out of sight.', 'The Ballet Twins arc introduces Lycaon’s role and working relationship with the Proxies.'],
  ['memory-fades', 'Until Your Memory Fades', 'Rina · Alexandrina Sebastiane', 's1-midnight', '1.0', 90, 10007, 'midnight-b',
    'Complete The Midnight Pursuit.', 'An unusual request sends Rina and Phaethon looking into a family’s past.', 'The present-day request works after Victoria Housekeeping’s introduction, even though it deals with earlier memories.'],
  ['missing-bangboo', 'The Case of a Missing Bangboo', 'Qingyi', 's1-unthinkable', '1.1', 90, 10008, 'unthinkable-b',
    'Complete Mission Unthinkable. The launch-era archive also lists Inter-Knot Lv. 30.', 'Qingyi investigates the disappearance of a Bangboo.', 'The Proxies already know Qingyi from the PubSec interlude. This case is independent of Jane’s assignment.'],
  ['stroke-of-luck', 'A Stroke of Luck', 'Burnice White', 's1-inferno', '1.2', 60, 10009, 'inferno-b',
    'Complete Leisurely Lull: Unexpected New Customer after Chapter 4.', 'Burnice gets drawn into a job in the Outer Ring.', 'The Tour establishes Burnice and the crew. The present-day request works naturally during the Blazewood downtime.'],
  ['leave-message', "It's Me... Leave a Message", 'Ellen Joe', 's1-midnight', '1.5', 120, 10010, 'midnight-b',
    'Complete The Midnight Pursuit.', 'Ellen’s life away from Victoria Housekeeping takes center stage.', 'It assumes the Proxies know Ellen through Victoria Housekeeping. Its school setting leaves the relative order with the other Victoria stories flexible.',
    ["It's Me... Leave a Message (I)", "It's Me... Leave a Message (II)", "It's Me... Leave a Message (III)"]],
  ['unsung-champion', 'The Unsung Champion', 'Lighter', 's1-inferno', '1.3', 85, 10011, 'inferno-b',
    'Complete Chapter 4: Intermission Reverberations.', 'An Outer Ring commission lets Phaethon see a different side of the Sons of Calydon’s champion.', 'Use the present-day framing after the Tour. Earlier events in Lighter’s life are related here as backstory.'],
  ['name-in-water', 'A Name Written in Water', 'Asaba Harumasa', 's1-stars', '1.4', 45, 10012, 'falling-stars-b',
    "Complete Leisurely Lull: Goldfinch's Escape after Chapter 5.", 'A personal commission brings Phaethon closer to Harumasa and his history.', 'Harumasa’s present-day relationship with the Proxies follows the Section 6 chapter.'],
  ['echoes-silver', 'Echoes of Silver', 'Soldier 0 - Anby', 's1-stars', '1.6', 260, 10013, 'falling-stars-b',
    "Complete Leisurely Lull: Goldfinch's Escape after Chapter 5.", 'Anby steps away from the Cunning Hares for a commission with ties to her past.', 'Follow the contemporary framing after the Chapter 5 wrap-up. Play Out of Sight nearby for another perspective on the military connections.'],
  ['out-of-sight', 'Out of Sight', 'Trigger', 's1-inferno', '1.6', 130, 10014, 'inferno-b',
    'Complete Leisurely Lull: Unexpected New Customer after Chapter 4.', 'Trigger and Phaethon follow a lead that connects to Trigger’s own history.', 'The episode portrays an earlier first meeting with Phaethon. Play it at the first practical archive break, before Echoes of Silver adds context to the relationship.', []],
  ['legend-tiger', 'Legend of the Tiger Warrior!', 'Ju Fufu', 's2-clouds', '2.0', 40, 10015, 'where-clouds',
    'Complete Where Clouds Embrace the Dawn.', 'Ju Fufu becomes involved with a film production.', 'The Waifei introduction establishes Ju Fufu and Yunkui Summit first.', []],
  ['flora-blooming', 'Flora of the Blooming Valley', 'Seed', 's2-good-night', '2.2', 40, 10016, 'good-night',
    'Complete Do Not Go Gentle Into That Good Night.', 'Seed takes Phaethon on a personal assignment involving flowers.', 'The framing follows Phaethon’s Waifei encounter with Obol Squad even where earlier memories appear.'],
  ['tales-dreamless', 'Tales of the Dreamless', 'Lucia Elowen', 's2-dreams', '2.3', 40, 10017, 'dreams-bygone',
    'Complete Memories of Dreams Bygone.', 'Lucia and Phaethon follow a story tied to dreams.', 'The chapter introduces Lucia and the group’s work before the Agent Story draws on that relationship.'],
]

export const agentStories: EntryInput[] = [
  ...specialStories,
  ...agentRows.flatMap(([id, title, agent, chapter, releaseVersion, chronologicalOrder, archiveID, after, prerequisites, description, placementReason, parts]) => {
    const names = parts ?? roman.map((part) => title + ' (' + part + ')')
    const ids = names.map((_, index) => id + '-part-' + (index + 1))
    const base: EntryInput = {
      id, title, chapter, releaseVersion, chronologicalOrder, description, placementReason, prerequisites,
      contentType: 'agent', availability: 'permanent', placementAfter: [after], childQuestIDs: ids,
      characters: agent.split(' · '), sourceURLs: [archive(archiveID), wiki('Agent Story and episodes', title), updates[releaseVersion] ?? versionWiki(releaseVersion),
        ...(id === 'mole-in-the-hole' ? [updates['2.5']] : [])],
      relatedEntryIDs: id === 'out-of-sight' ? ['echoes-silver'] : id === 'echoes-silver' ? ['out-of-sight'] : [],
      notes: id === 'out-of-sight' ? 'This Agent Story has one episode with three HDD commissions: Blind Pursuit, Invitation to Kill, and Piercing Rain.' : undefined,
    }
    return [base, ...names.map((name, index): EntryInput => ({
      ...base, id: ids[index], title: name, parentID: id, chronologicalOrder: chronologicalOrder + index + 1,
      childQuestIDs: [], relatedEntryIDs: [], officialRecommendation: null,
      prerequisites: index ? 'Complete ' + names[index - 1] + '.' : prerequisites,
      placementAfter: index ? [ids[index - 1]] : [after],
      placementBefore: index < ids.length - 1 ? [ids[index + 1]] : [],
      placementReason: 'Part ' + (index + 1) + ' of ' + names.length + ' in the Video Archive sequence for ' + title + '.',
    }))]
  }),
  {
    id: 'day-video-store', title: 'Just Another Day at the Video Store', contentType: 'archive', chapter: 's1-hollow-heart', releaseVersion: '1.0', chronologicalOrder: 72,
    placementAfter: ['hollow-heart-b'], prerequisites: "Complete A Call From the Hollow's Heart.",
    availability: 'permanent', description: 'A short standalone story about Belle and Wise at Random Play.',
    placementReason: 'The archive unlocks this sibling story after Belobog’s arc. It fits a quiet stop back at the store.',
    sourceURLs: [archive(10018), versionWiki('1.0')], characters: ['Belle', 'Wise'],
  },
]
