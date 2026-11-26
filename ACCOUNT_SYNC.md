# Account sync

Zenlessentials uses Supabase Auth and Postgres for optional accounts. The site continues to support guest use with the original browser storage and JSON backups. After signing in, open **Profile → Account → Import guest saves** on a device that already has data. The import adds guest saves to the account and keeps a separate guest copy on that device.

Story completions and played/watched status, ownership, favorites, wishlist, squads, personal tiers, theme, and story preferences sync. After visiting the app online, a signed-in device can keep editing its local copy offline. Sync resumes when the connection returns. Open **Profile → Account → Sync now** to refresh immediately. Keep the app open until it says **Up to date** before switching devices, especially on iOS.

Changes to different stories, collection items, and preferences combine. If two devices edit the same item before receiving each other’s changes, the last device to sync that edit wins. Unchecking a story or removing an item syncs the removal. Guest import combines saved items, keeps the account's existing collection entries where they overlap, and uses the newer completion when both copies have it.

## Authentication by address

The official site and both legacy addresses use the same Supabase project. Accounts and cloud saves are shared. Authenticated users can access their own save row. [Account saves migration](supabase/migrations/20261118000000_account_saves.sql)

The Supabase **Site URL** is `https://zenlessentials.org`. The app returns to `/profile/account` on the address that started sign-in. These production callbacks are authorized:

- `https://zenlessentials.org/profile/account`
- `https://zenlessentials.pages.dev/profile/account`
- `https://zenlessentials.netlify.app/profile/account`

Google sends its response to the existing Supabase OAuth callback, typically `https://<project-ref>.supabase.co/auth/v1/callback`. If Google’s app is in **Testing**, its test-user restrictions still apply. For a hosted smoke test, confirm that Google and email return to the starting address, then check that an account save reaches **Up to date** and appears after signing in at another authorized address.

For a new deployment, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the shared Supabase project URL and browser-safe publishable key. Keep service-role keys, Google OAuth secrets, and SMTP credentials in their respective service dashboards.

Open a sign-in email in the browser that requested it. With the Supabase built-in sender, delivery is limited to project team addresses. If a custom template includes `{{ .Token }}`, **Enter a code** works inside an iOS Home Screen install even when a link opens in a different browser storage context.

For local development, copy `.env.example` to `.env.local` and add `http://localhost:5173/profile/account` to the redirect list if you're using real auth. A build with both variables empty runs as a guest. Previews can use independent settings and a test Supabase project. If auth is enabled for a specific preview, explicitly allow its callback URL.

## Move from a legacy address

Your browser saves, sign-in session, and Home Screen installation belong to the address you used. Open the old site or install that has your saves before switching.

**With account sync**

1. At `https://zenlessentials.pages.dev` or `https://zenlessentials.netlify.app`, sign in under **Profile → Account**. If you have guest saves there, select **Import guest saves**. Wait for **Up to date** so the server has the changes.
2. Open `https://zenlessentials.org` and sign in to the same account. Check the story progress and collection after the first sync. Follow the same steps within a new Home Screen install if you plan to use one.

**With JSON backups**

1. At the old address, use **Settings → Export JSON** for story progress and **Profile → Collection → Export collection** for ownership, favorites, wishlist, saved squads, and personal tiers.
2. At zenlessentials.org, use **Settings → Import JSON** to merge story progress. Use **Profile → Collection → Import collection** to restore the collection. The collection import replaces the current collection after confirmation. Back up any collection you have already created at the official address first.
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
