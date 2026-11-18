# Zenlessentials database sources and coverage

Last verified **November 18, 2026**. The latest released game update was **3.3, Journey to the Sky**. The production snapshot excludes beta and test records. The official Version 3.4 special program appears as an announcement. A broadcast time does not establish a banner time. [Official Version 3.3 notes](https://zenless.hoyoverse.com/en-us/news/166963) · [Official Version 3.4 program announcement](https://zenless.hoyoverse.com/en-us/news/167352)

## Reference inventory

Prydwen served as the scope reference. The game data, illustrations and written Zenlessentials guides come from the sources below.

| Prydwen area | Fields and interactions reviewed | Zenlessentials coverage |
| --- | --- | --- |
| Agent catalog and profiles | Rank, element, specialty, faction, identity, base stats, grouped moves, Core, Mindscape, Potential, review, equipment, disc slots, upgrade priorities, teams, sample analytics, published calculations | 62 released Agents with portraits and full art. Level, promotion and Core controls use client stat values. Skill kits include six Mindscapes and available Potential and multiplier data. Five independently written build guides complement observed builds for 61 Agents. |
| W-Engines | Rank, specialty, attack, advanced stat, effect by Overclock, signature, build comparisons | 103 engines have art, exact level/promotion stat tables, five passive texts and backlinks. Comparisons distinguish gear statistics, passive compatibility and observed usage. |
| Drive Disc sets and mechanics | Set art, 2- and 4-piece effects, slots, main stats, substats, rarities and levelling | 30 sets with local icons, launch versions, set effects, acquisition methods, related builds and an S-Rank slot reference. |
| Bangboo | Rank, active, additional ability, Chain Attack, activation, upgrade information and teams | 41 released combat Bangboo with art, ability text, associated squad conditions and promotion materials. Eous is a story companion rather than a regular combat-roster record. |
| Tier list and endgame | Shiyu Defense and Deadly Assault, role/element filters, investment assumptions, usage, encounter data and methodology | One list shows user-provided T0–T2 placements, alongside saved personal rankings. Agent overviews show attributed appearance rates for both endgame modes. |
| Signal Search | Current, next and previous phases, dates, featured Agents and W-Engines, and official links | 90 Agent/W-Engine channel or special-channel records from 1.0 through 3.3, grouped by phase and type. The current 3.3 windows were cross-checked with both official notices. |
| Guides and game modes | Combat, progression, gear systems, farming, gacha and endgame primers | Four native guides cover disc stats, squad checks, progression and Signal Search. Mode-specific boss and stage guides are outside this snapshot. |

[Database index](https://www.prydwen.gg/zenless/) · [Agents](https://www.prydwen.gg/zenless/characters) · [W-Engines](https://www.prydwen.gg/zenless/w-engines) · [Drive Discs](https://www.prydwen.gg/zenless/disk-drives) · [Bangboo](https://www.prydwen.gg/zenless/bangboo) · [Tier List](https://www.prydwen.gg/zenless/tier-list) · [Banners](https://www.prydwen.gg/zenless/banners) · [Guides](https://www.prydwen.gg/zenless/guides)

## Source and normalization notes

- **Released game tables and English localization.** Dimbreath’s release snapshot `ab85fff9659168f981904259ebb9ec2c51fb5fe4` provides configurations for skills, promotions, abilities, stats, weapon and disc effects, item sources, and progression costs. English overwrite rows take precedence over older strings. The importer removes presentation markup and resolves named button prompts. Basic damage and daze multiplier rows are derived from decoded game fields. Unresolved expressions remain absent. [Pinned ZenlessData release](https://git.mero.moe/dimbreath/ZenlessData/src/commit/ab85fff9659168f981904259ebb9ec2c51fb5fe4) · [Independent release-revision check](https://zzz.gachabase.net/changelog/release)
- **Identifiers, base stats and artwork.** Enka.Network’s tagged 3.3 data commit `a9b583eb4a708dd3db56f6bdef35c3e84e4d213c` is the playable Agent and equipment allowlist. It supplies stable game IDs and decoded Agent growth curves. W-Engine curves use the release tables. The Agent debut-version map starts from factual metadata in ZZZ Tools. Display names use the game localization, with aliases to connect to the story archive and sample. [Enka metadata and formulas](https://github.com/EnkaNetwork/API-docs/blob/a9b583eb4a708dd3db56f6bdef35c3e84e4d213c/docs/zzz/api.md) · [ZZZ Tools release data](https://github.com/njxaxson/zzz-utils/blob/7f92f0296c95f34d31b841cd078511d17f532744/app/public/data/units.json)
- **Observed gear, teams and usage.** LvlUrArti’s MIT-licensed ShiyuDataProcessed cycle 3.3.2, revision `b4589c02c11e32d8b0de33de9b933037cf5c33c9`, supplies observed teams, equipment appearances and sampled stats. The app stores aggregate records only. It links usable records by game ID, identifies off-specialty gear as having an inactive passive, and displays the published shares without inferring damage or exact disc-piece counts. The sample contains 61 Agents, 355 unique lineups after filtering, and no Severian record. Severian has a separately authored guide and squad. [ShiyuDataProcessed dataset and MIT notice](https://huggingface.co/datasets/LvlUrArti/ShiyuDataProcessed)
- **Build and squad explanations.** The written recommendations in `src/database/editorial.ts` interpret the released kits and cite the supporting guide or official information. Sampled loadouts retain a separate evidence label. Team Builder checks documented faction, attribute, attack type, specialty and specific-Agent rules the importer can represent. Other rule types fall back to the displayed skill text. [Official 3.3 gameplay overview](https://www.hoyoverse.com/en-us/news/166759)
- **Banner phases.** The factual dates, featured records and official notice references are adapted from **BannerHistory** under **CC BY 4.0**. The adapter groups duplicate localized fields, uses stable phase IDs, and emits separate Agent and W-Engine records where a verified pairing exists. Phase times from the Asia schedule are stored without an offset and displayed against the chosen regional server clock. Client locale never changes the date text. Selection pools and versions are audited for unknown records during updates. [BannerHistory schedule](https://bannerhistory.app/en/zzz-pickup-history) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [Official 3.3 Phase I](https://zenless.hoyoverse.com/en-us/news/166926) · [Official 3.3 Phase II](https://zenless.hoyoverse.com/en-us/news/167269)
- **Images.** All 62 Agents have both a portrait and a larger image. Equipment and combat Bangboo have local WebP icons. Historical banner artwork uses the English HoYoverse notice image when available. Agent and equipment art is distributed through Enka.Network’s public image paths, with Nanoka’s public mirrors used for Bangboo and missing Enka image paths. The art is HoYoverse game artwork. This fan project claims no ownership over it. Image downloads are limited to images referenced by the release manifest, and the browser reads local files. Catalog images load lazily and keep a reserved aspect ratio. [HoYoverse’s Fan Creations Guide](https://www.hoyolab.com/article/30075725) · [Nanoka](https://zzz.nanoka.cc/)
- **Story relationships.** The story archive’s editorial cast lists are joined against a reviewed alias map at build preparation time. Output uses stable Agent and story IDs. Runtime does not match on names. Links reflect tracked appearances and can be incomplete when the original cast list is incomplete. [Chronology research](CHRONOLOGY.md)

## Audit boundaries

- The release roster, equipment and combat Bangboo totals reflect the verified game data, not unreleased entries displayed in public guides.
- Detailed playstyle editorial is available for Miyabi, Phoenix, Severian, Nicole and Anby. Other Agents have real kits, signature gear, mechanics and the available mode-specific gear, average stat and team observations. Individual rotations, investment breakpoints and matchup analysis remain editorial work.
- Skills include all decoded descriptions, with multipliers for mapped damage and daze fields and localized Core variants. Unparsed formulas, bespoke skill properties, certain alternate move sets and combat simulation need additional verification. The W-Engine comparison uses actual game stats and passives. The Severian guide presents one attributed Version 3.3 team simulation under its published assumptions. Comparisons for other Agents use game stats and observed gear only.
- The banner archive covers limited S-Rank phases and verified special selectors. It does not yet enumerate every historical A-Rank rate-up, permanent pool or Bangboo channel. Some old phases have no reusable official image. The Version 3.4 banner windows were unannounced at verification.
- S-Rank Drive Disc stat ranges, item access labels and material quantities are represented. A/B-Rank numeric ranges and all skill-specific farming stages have not been audited. Attribute and specialty icons are bundled from the client. Faction logos are included where a source path resolved.
- Tier placements follow the provided rankings. The separate appearance rates reflect participation, the sampled boss pool, investment, release timing and ownership. Manual team recommendations explain mechanic interactions independently of sample popularity.

## Updating the database

Use Python 3.10+, curl and, when adding or updating artwork, ImageMagick 7. The site remains a static build. These tools are needed only for the explicit data import.

1. Confirm the new **released** version and date. Update the version, revisions and verified release metadata in `scripts/database/import.py`. Use a fresh external cache directory so pinned snapshots and newly fetched archives cannot be confused.
2. Verify the new Agent, equipment and Bangboo IDs against official notes and the released Enka/client tables. Check every name alias and conditional rule reported by the importer. Vet future Signal Search notices and update the announcement metadata in the importer.
3. Normalize and validate locally.

   ```sh
   python3 scripts/database/import.py --cache /tmp/zenlessentials-new-release --art
   npm run update:database
   npm run validate:database
   npm test
   npm run build
   npm run test:e2e
   ```

4. Review each generated change. The validator checks cross-record references, known roles, stat tables, local images, banner dates and version consistency. Compare counts against the official release and spot-check recently changed skills, equipment levels, language overrides, BannerHistory dates and local art. Remove retired artwork only when no released entry references it.
5. Update the guide and team records independently in `editorial.ts`, and refresh the endgame cycle only after its data is published. Keep existing game IDs, banner phase IDs and story IDs stable. Record unresolved fields and update this document.
6. Check a production or preview build at direct nested URLs and in phone layouts. Merge to `main` to trigger the existing Netlify pipeline. No data source or account connection is needed by the live app.

Collection data uses `zenlessentials.collection` and its own versioned backup. The story tracker continues to use `zenlessentials.progress` and `zenlessentials.preferences`. Netlify deploy previews and installations on other origins have separate browser storage.
