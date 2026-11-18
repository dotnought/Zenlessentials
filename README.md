# Zenlessentials

Zenlessentials is an unofficial Zenless Zone Zero companion with a story tracker and game database. It puts main chapters, Special Episodes, Agent Stories, limited events, and side commissions on one interactive timeline. The recommended path follows narrative context, and every timeline placement comes with a reason and references.

The latest researched game version is **3.3, Journey to the Sky**. See [Chronology and research coverage](CHRONOLOGY.md) for the source conventions, placement decisions, and open gaps.

## Use the tracker

- **Timeline** is the default view. Switch seasons, jump to a chapter or the next incomplete item, and expand cards for prerequisites, related stories, and sources.
- **Dashboard** shows the next core story, your current chapter, recent completions, and shortcuts to the Game Database and your collection.
- **Content Library** searches titles, characters, categories, and summaries. It includes filters for season, game version, progress, and availability, with dedicated Agent Story and Event views.
- **Profile → Story Progress** shows progress across the archive, by season, and by content type. Grouped stories count their individual parts. Switch to **Collection** for your roster, wishlist, and saved squads.
- **Settings** controls spoilers, optional content, expired content, and completed items. Expired events remain trackable and are recorded as watched. Replayable archived events support both played and watched.
- **Settings → Appearance** offers Signal Yellow, Hollow Blue, Ether Violet, and Calydon Orange. Theme choices are saved automatically in this browser, independently of progress backups.

Progress and preferences are saved in this browser’s local storage for this site’s origin. Deployments on the same origin keep the data. Use **Settings → Export JSON** to back it up or move it to another browser, device, domain, or deploy preview. Import merges completions and keeps the newest record for each ID. Reset clears completions only after confirmation.

When account sync is configured, **Profile → Account** lets you sign in with Google or an email link and sync your saves across devices. See [Account sync setup and behavior](ACCOUNT_SYNC.md).

## Use the game database

- **Database** opens the Agents, W-Engines, Drive Discs and Bangboo catalogs. Browse or use the search bar to find records. Agent profiles connect their skills, builds and banner history to related story entries.
- **Team Builder** checks squad ability conditions and supports locally saved squads. **Tier List** shows T0–T2 placements and saved personal rankings. Agent profiles show sampled endgame appearance rates on **Overview**.
- **Banners** shows the verified Signal Search archive and currently running channels. **Guides** covers disc stats, squad building, progression and the banner schedule.
- **Profile → Collection** tracks ownership, Mindscapes, Overclock, favorites, planned acquisitions, and saved squads. Collection backups also include personal tiers. Use Settings for story progress backups.

The factual catalog and artwork are served by Zenlessentials. See [Database sources, audit and update procedure](DATABASE_SOURCES.md) for coverage.

## Install on iPhone or iPad

1. Open Zenlessentials in Safari, then choose **Share → Add to Home Screen**.
2. Turn on **Open as Web App** if Safari offers it, then tap **Add**.
3. Open Zenlessentials from its Home Screen icon while online so it can save the app for offline use.

The timeline, filters, Profile story statistics, theme picker, and checklists work offline after that first online launch finishes loading. The database downloads its catalog and caches artwork as you visit pages. Open the collection and any database pages you need while online first. Links to external sources still need an internet connection.

Safari and the installed app use separate local storage. To bring your quest progress over, export it from Safari before opening the installed app, then choose **Settings → Import JSON** in the app. Use **Share backup → Save to Files** where supported, or download the file with **Export JSON**. Back up progress before removing an existing Home Screen installation. [Apple’s installation guide](https://support.apple.com/en-us/guide/iphone/iphea86e5236/ios) · [WebKit’s storage details](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/)

## Develop locally

Use Node.js 22.12 or newer in the 22.x line, or Node.js 24 or newer.

```sh
git clone https://github.com/dotnought/Zenlessentials.git
cd Zenlessentials
npm ci
npm run dev
```

```sh
npm run check
npm run validate:data
npm run validate:database
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser tests use the production build through Vite preview and exercise desktop and iPhone-sized Chromium viewports. To use a system Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path. For the iPhone-sized WebKit project, install WebKit with `npx playwright install webkit` and run `PLAYWRIGHT_WEBKIT=1 npm run test:e2e -- --project "iphone webkit"`. Run `npm run preview` to inspect the built site locally.

| Path | Purpose |
| --- | --- |
| `src/components/` | Story cards, settings, and progress graphics |
| `src/data/` | Catalog, typed model, chapter structure, and source references |
| `src/progress.ts` | Local story progress and versioned JSON backups |
| `src/database/` | Database routes, collection, editorial content and normalized datasets |
| `scripts/database/` | Data import, story relationships and validation |
| `public/database-art/` | Optimized local game artwork |
| `scripts/validate-data.ts` | Validates entries, references, chronology, and quest groups |
| `tests/` | Progress unit tests and production browser tests |
| `netlify.toml` | Netlify build, asset caching, and SPA routing |

## GitHub and Netlify

The production repository is [dotnought/Zenlessentials](https://github.com/dotnought/Zenlessentials), with `main` as the deployment branch. The production site is [zenlessentials.netlify.app](https://zenlessentials.netlify.app/). To deploy a separate copy, create or select an empty GitHub repository and push your checkout’s `main` branch to it.

```sh
git remote -v
git push -u origin main
```

Use branches and pull requests for routine changes. Keep the lockfile and `netlify.toml` in Git. Dependencies, build output, local environment files, and test artifacts are ignored.

1. Sign in to [Netlify](https://app.netlify.com/).
2. In your Netlify team, select **Add new project → Import an existing project → GitHub**.
3. Complete the one-time GitHub authorization. If GitHub asks which repositories Netlify may access, select `dotnought/Zenlessentials`.
4. Select the repository and verify the production branch is `main`.
5. Leave the base directory at the repository root. Verify that the build command is `npm run build` and the publish directory is `dist`. The repository’s configuration supplies both settings and uses Node.js 22.
6. Select **Deploy** and wait for the published deploy. Set **Project configuration → General → Visitor access → Project visibility** to **Public** to make production accessible without a Netlify account.
7. Open the production address from the project overview. Refresh `/timeline`, `/database/agents`, and an Agent profile directly, and confirm a checked story persists after a reload.

Pushing or merging to `main` triggers a production deploy once the GitHub connection is active. Netlify can build Deploy Previews from pull requests with the same configuration. Each deploy preview has its own origin and local progress.

### Restrict access

On plans with project visibility controls, open the Netlify project and choose **Project configuration → General → Visitor access → Project visibility → Private**. Save the setting, review team memberships and project invitations, then open the production URL in a signed-out browser to confirm it prompts for Netlify login. Private visibility admits the Netlify team and invited viewers. Restrict team access and invitations if only you should be able to open the site. A public URL is accessible to anyone who obtains it. Netlify visibility does not change your GitHub repository’s visibility. [Netlify project visibility](https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility/)

## Update the story catalog

1. Read the latest official update and event notices and compare them with the Video Archive or an English quest transcript.
2. Identify the present-day framing, first meetings, earlier references, and any official best-experience prerequisite.
3. Edit `src/data/story-data.ts`, `src/data/event-data.ts`, and any new sections in `src/data/chapters.ts`. Add sources in `src/data/sources.ts` as needed.
4. Keep published IDs stable. Assign new IDs to new stories and commissions. Preserve existing completion semantics if you split a published entry into a quest chain. Leave unverified prerequisites, dates, or replay status unknown. Leave room between explicit orders for later additions.
5. Update [CHRONOLOGY.md](CHRONOLOGY.md) with the new coverage and important placement decisions.
6. Run `npm run update:database` to refresh the explicit Agent–story links. Run the checks, build, and browser tests. Commit to a branch, review the preview when available, and merge to `main`.

Keep story summaries in your own words. Game titles and names identify the underlying stories.

## Artwork

The banner uses HoYoverse’s Cunning Hares illustration from the 40 million pre-registration announcement. Zenlessentials is an unofficial, non-commercial fan project. © All rights reserved by miHoYo. Other properties and associated intellectual property rights belong to their respective owners. [Official artwork](https://www.hoyolab.com/article/29770110) · [Zenless Zone Zero Fan Creations Guide](https://www.hoyolab.com/article/30075725)
