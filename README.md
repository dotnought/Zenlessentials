# Zenlessentials

Zenlessentials is an unofficial Zenless Zone Zero companion with a story tracker and game database. It puts main chapters, Special Episodes, Agent Stories, limited events, and side commissions on one interactive timeline. The recommended path follows narrative context, and every timeline placement comes with a reason and references.

[Open Zenlessentials at zenlessentials.org](https://zenlessentials.org/)

The latest researched game version is **3.3, Journey to the Sky**. See [Chronology and research coverage](CHRONOLOGY.md) for the source conventions, placement decisions, and open gaps.

## Use the tracker

- **Dashboard** is the home page. It shows the next core story, your current chapter, recent completions, and shortcuts to the Game Database and your collection.
- **Timeline** lets you switch seasons, jump to a chapter or the next incomplete item, and expand cards for prerequisites, related stories, and sources.
- **Content Library** searches titles, characters, categories, and summaries. It includes filters for season, game version, progress, and availability, with dedicated Agent Story and Event views.
- **Profile → Story Progress** shows progress across the archive, by season, and by content type. Grouped stories count their individual parts. Switch to **Collection** for your roster, wishlist, and saved squads.
- **Settings** controls spoilers, optional content, expired content, and completed items. Expired events remain trackable and are recorded as watched. Replayable archived events support both played and watched.
- **Settings → Appearance** offers Signal Yellow, Hollow Blue, Ether Violet, and Calydon Orange. Theme choices are saved automatically in this browser, independently of progress backups.

Progress and preferences are saved in your browser for the site address you use. Deployments at the same address keep that data. Use **Settings → Export JSON** to back up story completions. Import merges completions and keeps the newest record for each ID. Reset clears completions only after confirmation.

When account sync is configured, **Profile → Account** lets you sign in with Google or an email link and sync your saves across devices. To transfer saves from the Pages or Netlify address to zenlessentials.org, follow [Move from a legacy address](ACCOUNT_SYNC.md#move-from-a-legacy-address).

## Use the game database

- **Database** opens the Agents, W-Engines, Drive Discs and Bangboo catalogs. Browse or use the search bar to find records. Agent profiles connect their skills, builds and banner history to related story entries.
- **Team Builder** checks squad ability conditions and supports locally saved squads. **Tier List** shows T0–T2 placements and saved personal rankings. Agent profiles show sampled endgame appearance rates on **Overview**.
- **Banners** shows the verified Signal Search archive and currently running channels. **Guides** covers disc stats, squad building, progression and the banner schedule.
- **Profile → Collection** tracks ownership, Mindscapes, Overclock, favorites, planned acquisitions, and saved squads. Collection backups also include personal tiers. Use Settings for story progress backups.

The factual catalog and artwork are served by Zenlessentials. See [Database sources, audit and update procedure](DATABASE_SOURCES.md) for coverage.

## Install on iPhone or iPad

1. Open [zenlessentials.org](https://zenlessentials.org/) in Safari, then choose **Share → Add to Home Screen**.
2. Turn on **Open as Web App** if Safari offers it, then tap **Add**.
3. Open Zenlessentials from its Home Screen icon while online so it can save the app for offline use.

The timeline, filters, Profile story statistics, theme picker, and checklists work offline after that first online launch finishes loading. The database downloads its catalog and caches artwork as you visit pages. Open the collection and any database pages you need while online first. Links to external sources still need an internet connection.

Home Screen installations from the Pages or Netlify address still open that address. Install from zenlessentials.org to use the official domain. Back up or sync guest saves from the existing installation before removing it. Safari and its Home Screen app can have separate storage. Export from the browser or installation that holds your data. **Share backup → Save to Files** can save story progress on supported devices. [Apple’s installation guide](https://support.apple.com/en-us/guide/iphone/iphea86e5236/ios) · [WebKit’s storage details](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/)

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
| `public/_headers` | Shared cache headers for Cloudflare Pages and Netlify |
| `netlify.toml` | Netlify build and SPA routing |
| `PRIVACY.md`, `TERMS.md`, `CODE_OF_CONDUCT.md` | Source text for the public policy pages |

## GitHub and hosting

The source repository is [dotnought/Zenlessentials](https://github.com/dotnought/Zenlessentials). [zenlessentials.org](https://zenlessentials.org/) is the official site, hosted by Cloudflare Pages. The [Pages address](https://zenlessentials.pages.dev/) and [Netlify address](https://zenlessentials.netlify.app/) remain available for existing installations and saves. Both providers use `main` as their production branch. Cloudflare Pages publishes updates from `main` while Netlify's Git-triggered builds are paused. Use branches and pull requests for preview testing.

### Cloudflare Pages

In **Workers & Pages**, create a Pages project with **Connect to Git** and select the repository. Use the React/Vite preset and the following configuration. [Cloudflare Git integration guide](https://developers.cloudflare.com/pages/get-started/git-integration/)

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Build variable `NODE_VERSION` | `22` |

For sign-in and sync on a new deployment, set both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in its build environment. See [Account sync](ACCOUNT_SYNC.md#authentication-by-address) for the existing callback URLs. Preview deployments have separate origins and build variables.

Pages serves the React Router app shell for nested routes through its default SPA fallback. Keep the build free of a top-level `404.html` to retain this behavior. The app uses static hosting and talks directly to Supabase. Vite copies `public/_headers` to `dist/_headers` for immutable caching of hashed assets and revalidation of the service worker and manifest. Leave HTML and navigation on their default cache policy so a new deployment can load its new bundle. [Pages serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/) · [Pages custom headers](https://developers.cloudflare.com/pages/configuration/headers/)

Pages Free allows 500 builds per month, including Git preview builds, with one concurrent build and a 20-minute timeout. The output can contain up to 20,000 files, with a limit of 25 MiB per asset. Inspect `dist` before adding a large batch of artwork. [Pages limits](https://developers.cloudflare.com/pages/platform/limits/)

### Netlify

Import the same GitHub repository in [Netlify](https://app.netlify.com/) and select `main`. `netlify.toml` configures Node.js 22, the build, and the SPA rewrite. Netlify also reads `dist/_headers`. Set the two Supabase variables for production builds to enable the same account features. Netlify Deploy Previews can use the same build settings. [Netlify custom headers](https://docs.netlify.com/manage/routing/headers/)

Git-triggered Netlify builds are paused while the Open Source application is pending. The existing Netlify deployment stays online. To resume automatic builds, remove `ignore = "exit 0"` from `netlify.toml` and merge the change to `main`. Manual deploys and build hooks can still trigger deployments during this pause. [Netlify ignore builds](https://docs.netlify.com/build/configure-builds/ignore-builds/)

When checking either deployment, directly open and refresh `/timeline`, `/database/agents`, an Agent profile, and `/profile/account` if sign-in is enabled. Check that the manifest and service worker load, and that local progress survives a refresh. Authenticate with a test account before relying on sync at a new domain.

### Public policies and Google OAuth branding

The build renders the homepage introduction and the three policy routes into HTML. React uses the same policy text. Preview edits by opening `/privacy`, `/terms`, and `/code-of-conduct` directly in a signed-out browser.

Review and approve the Privacy Policy and Terms of Service before publishing. Privacy requests go to [support@zenlessentials.org](mailto:support@zenlessentials.org). General inquiries go to [contact@zenlessentials.org](mailto:contact@zenlessentials.org). The repository can verify the app’s data flows and the account deletion cascade. Provider-side logging, analytics or security cookies, mail delivery, backup retention, and the deletion process need maintainer review.

After the approved pages are live, open **Google Auth Platform → Branding** and list the homepage as `https://zenlessentials.org/`, the Privacy Policy as `https://zenlessentials.org/privacy`, and the Terms of Service as `https://zenlessentials.org/terms`. Open each signed out before submitting branding changes for verification. [Google OAuth policies](https://developers.google.com/identity/protocols/oauth2/policies)

### Restrict access on Netlify

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

The Timeline banner uses HoYoverse’s Cunning Hares illustration from the 40 million pre-registration announcement. Other page banners reuse artwork from the game database. Zenlessentials is an unofficial, non-commercial fan project. © All rights reserved by miHoYo. Other properties and associated intellectual property rights belong to their respective owners. [Official artwork](https://www.hoyolab.com/article/29770110) · [Zenless Zone Zero Fan Creations Guide](https://www.hoyolab.com/article/30075725)

## License and community

The original Zenlessentials code and its accompanying software documentation are available under the [MIT License](LICENSE). HoYoverse artwork, game text, trademarks, and other third-party materials retain their existing rights and licenses. See [Database Sources](DATABASE_SOURCES.md) for asset and game-data credits.

Contributors and project discussions follow the [Code of Conduct](CODE_OF_CONDUCT.md).
