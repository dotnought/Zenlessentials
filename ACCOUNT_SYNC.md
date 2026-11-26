# Account sync

Zenlessentials uses Supabase Auth and Postgres for optional accounts. The site continues to support guest use with the original browser storage and JSON backups. After signing in, open **Profile → Account → Import guest saves** on a device that already has data. The import adds guest saves to the account and keeps a separate guest copy on that device.

Story completions and played/watched status, ownership, favorites, wishlist, squads, personal tiers, theme, and story preferences sync. After visiting the app online, a signed-in device can keep editing its local copy offline. Sync resumes when the connection returns. Open **Profile → Account → Sync now** to refresh immediately. Keep the app open until it says **Up to date** before switching devices, especially on iOS.

Changes to different stories, collection items, and preferences combine. If two devices edit the same item before receiving each other’s changes, the last device to sync that edit wins. Unchecking a story or removing an item syncs the removal. Guest import combines saved items, keeps the account's existing collection entries where they overlap, and uses the newer completion when both copies have it.

## Configure authentication on both hosts

Keep Cloudflare Pages and Netlify on the same Supabase project. The existing accounts and `account_saves` table are shared. For a fresh Supabase project, apply [the account saves migration](supabase/migrations/20261118000000_account_saves.sql) once to give authenticated users access to their own save row.

1. In Supabase **Authentication → URL Configuration**, include both exact entries under **Redirect URLs**. Set **Site URL** to `https://zenlessentials.pages.dev` as the default destination once sign-in there is verified.

   - `https://zenlessentials.pages.dev/profile/account`
   - `https://zenlessentials.netlify.app/profile/account`

2. In the existing Google OAuth **Web application** client, include `https://zenlessentials.pages.dev` and `https://zenlessentials.netlify.app` under **Authorized JavaScript origins**. The **Authorized redirect URI** remains the callback shown under the Google provider in Supabase, typically `https://<project-ref>.supabase.co/auth/v1/callback`. The app asks Supabase to return the user to `/profile/account` on the host that initiated sign-in. If Google's app is in **Testing**, its test-user restrictions still apply.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the same project's HTTPS URL and **publishable** (`sb_publishable_…`) key in both providers' production build environments. In Cloudflare Pages, use **Settings → Variables and Secrets**. In Netlify, use **Project configuration → Environment variables** with **Builds** scope. Vite exposes both values in the browser. Keep service-role keys, Google OAuth secrets, and SMTP credentials in their respective service dashboards.
4. In Supabase **Authentication**, enable email sign-in and new sign-ups as needed. The default **Confirm sign up** and **Magic Link** emails work for project team addresses with the built-in sender. For delivery to other addresses, configure custom SMTP. If your templates include `{{ .Token }}`, the **Enter a code** option works with it.
5. Verify email and Google sign-in from each production site. Open email links in the browser that requested them. Check that an account save reaches **Up to date** on one host and appears on the other after signing in there. If an iOS Home Screen install opens the callback in a separate browser storage context, an email code can be entered directly into the install when custom templates provide one.

For local development, copy `.env.example` to `.env.local` and add `http://localhost:5173/profile/account` to the redirect list if you're using real auth. A build with both variables empty runs as a guest. Previews can use independent settings and a test Supabase project. If auth is enabled for a specific preview, explicitly allow its callback URL.

## Move from Netlify to Cloudflare Pages

Your browser saves, sign-in session, and Home Screen installation belong to the address you used. Open the old site or install that has your saves before switching.

**With account sync**

1. At `https://zenlessentials.netlify.app`, sign in under **Profile → Account**. If you have guest saves there, select **Import guest saves**. Wait for **Up to date** so the server has the changes.
2. Open `https://zenlessentials.pages.dev` and sign in to the same account. Check the story progress and collection after the first sync. Follow the same steps within a new Home Screen install if you plan to use one.

**With JSON backups**

1. On the Netlify site, use **Settings → Export JSON** for story progress and **Profile → Collection → Export collection** for ownership, favorites, wishlist, saved squads, and personal tiers.
2. On Cloudflare Pages, use **Settings → Import JSON** to merge story progress. Use **Profile → Collection → Import collection** to restore the collection. The collection import replaces the current collection after confirmation, so back up any collection you already created on Pages first.
3. Set theme and visibility preferences again if you moved only via JSON. Account sync also transfers preferences.

## Test without a provider account

Build and run the account browser tests with the two values below. Playwright intercepts the test backend requests. These tests exercise the SDK and browser flow and use no live email or Google account credentials.

```sh
export VITE_SUPABASE_URL=https://zenlessentials-sync-test.supabase.co
export VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test_stub
npm run build
npm run test:e2e -- tests/account.spec.ts
```

Provider references [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) · [Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google) · [Email codes](https://supabase.com/docs/guides/auth/auth-email-passwordless) · [SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp)
