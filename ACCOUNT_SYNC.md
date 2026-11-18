# Account sync

Zenlessentials uses Supabase Auth and Postgres for optional accounts. The site continues to support guest use with the original browser storage and JSON backups. After signing in, open **Profile → Account → Import guest saves** on a device that already has data. The import adds guest saves to the account and keeps a separate guest copy on that device.

Story completions and played/watched status, ownership, favorites, wishlist, squads, personal tiers, theme, and story preferences sync. After visiting the app online, a signed-in device can keep editing its local copy offline. Sync resumes when the connection returns. Open **Profile → Account → Sync now** to refresh immediately. Keep the app open until it says **Up to date** before switching devices, especially on iOS.

Changes to different stories, collection items, and preferences combine. If two devices edit the same item before receiving each other’s changes, the last device to sync that edit wins. Unchecking a story or removing an item syncs the removal. Guest import combines saved items, keeps the account's existing collection entries where they overlap, and uses the newer completion when both copies have it.

## Enable on Netlify

1. Create or select a Supabase project. In its SQL Editor, run [the account saves migration](supabase/migrations/20261118000000_account_saves.sql) once. To use the CLI with a linked project, run `supabase db push`. The migration enables row-level security. Authenticated users can only read and write their own save row.
2. In **Authentication → URL Configuration**, set **Site URL** to `https://zenlessentials.netlify.app` and add `https://zenlessentials.netlify.app/profile/account` to **Redirect URLs**. For local development, also add `http://localhost:5173/profile/account`.
3. In Google Cloud, create an OAuth client of type **Web application**. Under **Authorized JavaScript origins**, add `https://zenlessentials.netlify.app`. Under **Authorized redirect URIs**, add the callback shown in the Supabase Google provider settings, typically `https://<project-ref>.supabase.co/auth/v1/callback`. Set up the Google consent screen and add your Google account as a test user if the app is in testing. Enable **Google** under Supabase **Authentication → Sign In / Providers**, and enter the Google OAuth client ID and secret there.
4. In Supabase **Authentication**, enable email sign-in and new sign-ups. Add the code `{{ .Token }}` to both the **Confirm signup** and **Magic Link** email templates. For example, use `<p>Your Zenlessentials sign-in code is <strong>{{ .Token }}</strong>.</p>`. Configure an SMTP sender for delivery to end users. Supabase’s built-in sender is limited to addresses on the project team. The app uses the code field on **Profile → Account** for both sign-in and account creation.
5. In Netlify **Project configuration → Environment variables**, add `VITE_SUPABASE_URL` with the HTTPS project URL and `VITE_SUPABASE_PUBLISHABLE_KEY` with the project's **publishable** (`sb_publishable_…`) key. Apply them to production builds. Vite exposes both values in the browser. Keep Supabase secret keys, Google OAuth secrets, and SMTP credentials in their respective dashboards.
6. Trigger a new production deploy. Open **Profile → Account**, register and verify with an email code, make a change, and sign in from a second browser to confirm it arrives. Test Google in a separate session. If the iOS Home Screen app opens the OAuth callback in a separate browser storage context, use the email code to sign in from inside the installed app.

For local development, copy `.env.example` to `.env.local` and set the same two public values. Without both values, the app runs in guest mode. Use a dedicated test project for deploy previews if you want preview accounts and data to stay separate from production.

## Test without a provider account

Build and run the account browser tests with the two values below. Playwright intercepts the test backend requests. These tests exercise the SDK and browser flow and use no live email or Google account credentials.

```sh
export VITE_SUPABASE_URL=https://zenlessentials-sync-test.supabase.co
export VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test_stub
npm run build
npm run test:e2e -- tests/account.spec.ts
```

Provider references [Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google) · [Email codes](https://supabase.com/docs/guides/auth/auth-email-passwordless) · [SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp) · [Netlify environment variables](https://docs.netlify.com/build/environment-variables/overview/)
