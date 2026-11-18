# Zenlessentials

Zenlessentials is an unofficial Zenless Zone Zero story companion. It puts main chapters, Special Episodes, Agent Stories, limited events, and side commissions on one interactive timeline. The recommended path follows narrative context, and every timeline placement comes with a reason and references.

The latest researched game version is **3.3, Journey to the Sky**. See [Chronology and research coverage](CHRONOLOGY.md) for the source conventions, placement decisions, and open gaps.

## Use the tracker

- **Timeline** is the default view. Switch seasons, jump to a chapter or the next incomplete item, and expand cards for prerequisites, related stories, and sources.
- **Dashboard** shows the next core story, optional stories to consider first, your current chapter, and recent completions.
- **Content Library** searches titles, characters, categories, and summaries. It includes filters for season, game version, progress, and availability, with dedicated Agent Story and Event views.
- **Statistics** shows progress across the archive, by season, and by content type. Grouped stories count their individual parts.
- **Settings** controls spoilers, optional content, expired content, and completed items. Expired events remain trackable and are recorded as watched. Replayable archived events support both played and watched.

Progress and preferences are saved in this browser’s local storage for this site’s origin. Deployments on the same origin keep the data. Use **Settings → Export JSON** to back it up or move it to another browser, device, domain, or deploy preview. Import merges completions and keeps the newest record for each ID. Reset clears completions only after confirmation.

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
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser tests use the production build through Vite preview and exercise desktop and iPhone-sized Chromium viewports. To use a system browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path. Run `npm run preview` to inspect the built site locally.

| Path | Purpose |
| --- | --- |
| `src/components/` | Story cards, settings, and progress graphics |
| `src/data/` | Catalog, typed model, chapter structure, and source references |
| `src/progress.ts` | Local progress and versioned JSON backups |
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
7. Open the production address from the project overview. Refresh `/timeline`, `/agents`, `/events`, and `/stats` directly, and confirm a checked item persists after a reload.

Pushing or merging to `main` triggers a production deploy once the GitHub connection is active. Netlify can build Deploy Previews from pull requests with the same configuration. Each deploy preview has its own origin and local progress.

## Update the catalog

1. Read the latest official update and event notices and compare them with the Video Archive or an English quest transcript.
2. Identify the present-day framing, first meetings, earlier references, and any official best-experience prerequisite.
3. Edit `src/data/story-data.ts`, `src/data/event-data.ts`, and any new sections in `src/data/chapters.ts`. Add sources in `src/data/sources.ts` as needed.
4. Keep published IDs stable. Assign new IDs to new stories and commissions. Preserve existing completion semantics if you split a published entry into a quest chain. Leave unverified prerequisites, dates, or replay status unknown. Leave room between explicit orders for later additions.
5. Update [CHRONOLOGY.md](CHRONOLOGY.md) with the new coverage and important placement decisions.
6. Run the checks, build, and browser tests. Commit to a branch, review the preview when available, and merge to `main`.

Keep story summaries in your own words. Game titles and names identify the underlying stories. The app uses original banner art and does not bundle screenshots or game media.
