import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { Cloud, LogOut, RefreshCw, Upload } from 'lucide-react'
import App, { Zenlessentials } from '../App'
import { collectionActions } from '../database/collection'
import { trackerActions } from '../progress'
import { emptySaves, equalSaves, readGuestSaves } from './saves'
import { useCloudSaves } from './useCloudSaves'
import './account.css'

const callback = new URLSearchParams(window.location.search)
const oauthReturned = callback.has('code') || callback.has('error') || callback.has('error_code')
const sessionKey = 'zenlessentials.auth'
type Identity = Pick<User, 'id' | 'email'>

function cachedIdentity(): Identity | null {
  try {
    const user = JSON.parse(localStorage.getItem(sessionKey) ?? 'null')?.user
    if (typeof user?.id === 'string' && /^[0-9a-f-]{36}$/i.test(user.id)) {
      return { id: user.id, email: typeof user.email === 'string' ? user.email : undefined }
    }
  } catch {
    // The SDK will establish the active account when storage or the network becomes available.
  }
  return null
}

function makeClient() {
  try {
    return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
      auth: { flowType: 'pkce', storageKey: sessionKey },
    })
  } catch {
    return undefined
  }
}

const client = makeClient()

export default function AccountApp() {
  const [user, setUser] = useState<Identity | null | undefined>(() => navigator.onLine ? undefined : cachedIdentity())
  const [oauthProblem, setOauthProblem] = useState(oauthReturned)
  useEffect(() => {
    if (!client) return
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (session) setOauthProblem(false)
      setUser(session?.user ?? (event === 'INITIAL_SESSION' ? cachedIdentity() : null))
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!client) return <App accountLabel="Sync unavailable" account={
    <section className="panel settings-panel"><h2>Account sync unavailable</h2><p>This site needs a valid account configuration.</p></section>
  } />
  if (user === undefined) return <p className="account-loading" role="status">Checking account…</p>
  if (user) return <SignedIn key={user.id} client={client} user={user} />
  return <App accountLabel="Sign in to sync" account={<SignIn client={client} oauthProblem={oauthProblem} />} />
}

function SignIn({ client, oauthProblem }: { client: SupabaseClient; oauthProblem: boolean }) {
  const [creating, setCreating] = useState(false)
  const [email, setEmail] = useState('')
  const [target, setTarget] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(oauthProblem ? 'Google sign-in didn’t finish. Try again or use an email code.' : '')

  async function perform(action: () => Promise<void>) {
    setBusy(true)
    setMessage('')
    try {
      await action()
    } catch {
      setMessage('Couldn’t connect. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function googleSignIn() {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: window.location.origin + '/profile/account' },
    })
    if (error) setMessage('Couldn’t start Google sign-in. Try again or use an email code.')
  }

  async function sendCode() {
    const address = email.trim()
    const { error } = await client.auth.signInWithOtp({ email: address, options: { shouldCreateUser: creating } })
    if (error) {
      setMessage(error.status === 429 ? 'Wait a minute before requesting another code.' : 'Couldn’t send a code. Check the address and try again.')
      return
    }
    setTarget(address)
    setMessage('Check your email for the sign-in code.')
  }

  async function verifyCode() {
    const { error } = await client.auth.verifyOtp({ email: target, token: code.trim(), type: 'email' })
    if (error) setMessage('That code couldn’t be verified. Check it or request a new one.')
  }

  return <section className="panel settings-panel account-panel">
    <h2><Cloud size={18} /> Account sync</h2>
    <p>Sync your story progress, collection, personal tiers, and preferences across devices.</p>
    <button type="button" className="primary-button" disabled={busy} onClick={() => void perform(googleSignIn)}>Continue with Google</button>
    <form className="account-form" onSubmit={(event) => {
      event.preventDefault()
      if (!busy) void perform(target ? verifyCode : sendCode)
    }}>
      <h3>{creating ? 'Create an account' : 'Sign in with email'}</h3>
      {target ? <>
        <p>Enter the code sent to <strong>{target}</strong>.</p>
        <label>Verification code<input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6,10}" maxLength={10}
          required value={code} onChange={(event) => setCode(event.target.value)} /></label>
        <div className="settings-actions">
          <button className="primary-button" disabled={busy} type="submit">Verify and sign in</button>
          <button className="secondary-button" disabled={busy} type="button" onClick={() => void perform(sendCode)}>Resend code</button>
          <button className="secondary-button" disabled={busy} type="button" onClick={() => { setTarget(''); setCode(''); setMessage('') }}>Change email</button>
        </div>
      </> : <>
        <label>Email address<input type="email" autoComplete="email" maxLength={254} required value={email}
          onChange={(event) => setEmail(event.target.value)} /></label>
        <div className="settings-actions">
          <button className="primary-button" disabled={busy} type="submit">Send email code</button>
          <button className="secondary-button" disabled={busy} type="button" onClick={() => { setCreating(!creating); setMessage('') }}>
            {creating ? 'Already have an account?' : 'Create an account'}
          </button>
        </div>
      </>}
    </form>
    {message && <p className="account-message" role="status">{message}</p>}
  </section>
}

function SignedIn({ client, user }: { client: SupabaseClient; user: Identity }) {
  const cloud = useCloudSaves(client, user.id)
  const tracker = trackerActions({
    progress: cloud.saves.progress, preferences: cloud.saves.preferences, storageError: cloud.storageError,
    setProgress: (action) => cloud.change('progress', action),
    setPreferences: (action) => cloud.change('preferences', action),
  })
  const collection = collectionActions({
    collection: cloud.saves.collection, storageError: cloud.storageError,
    setCollection: (action) => cloud.change('collection', action),
  })
  const [hasGuestSaves] = useState(() => !equalSaves(readGuestSaves(), emptySaves))
  const [signingOut, setSigningOut] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const syncMessage = {
    connecting: 'Connecting to your account…', syncing: 'Syncing…',
    saved: cloud.pending ? 'Changes ready to sync.' : 'Up to date.',
    offline: 'Offline. Changes will sync when you reconnect.',
    error: 'Couldn’t sync. Changes are still available on this device.',
  }[cloud.status]

  async function signOut() {
    setSigningOut(true)
    setAuthMessage('')
    try {
      await cloud.synchronize()
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw error
    } catch {
      setAuthMessage('Couldn’t sign out. Check your connection and try again.')
    } finally {
      setSigningOut(false)
    }
  }

  return <Zenlessentials tracker={tracker} collection={collection} accountLabel="Cloud sync" account={
    <div className="account-panels">
      <section className="panel settings-panel account-panel">
        <h2><Cloud size={18} /> Account sync</h2>
        <p>Signed in as <strong>{user.email ?? 'your account'}</strong></p>
        <p className="account-message" role="status">{syncMessage}</p>
        <div className="settings-actions">
          <button type="button" className="secondary-button" disabled={cloud.status === 'syncing' || signingOut}
            onClick={() => void cloud.synchronize()}><RefreshCw size={16} /> Sync now</button>
          <button type="button" className="secondary-button" disabled={signingOut} onClick={() => void signOut()}><LogOut size={16} /> Sign out</button>
        </div>
        {authMessage && <p role="alert">{authMessage}</p>}
      </section>
      {hasGuestSaves && (cloud.canImport || cloud.guestImported) && <section className="panel settings-panel account-panel">
        <h2><Upload size={18} /> Guest saves on this device</h2>
        {cloud.guestImported ? <p role="status">Guest saves were added to this account.</p> : <>
          <p>Bring your existing story progress, collection, personal tiers, and preferences into this account.</p>
          <button className="secondary-button" type="button" onClick={cloud.importFromDevice}>Import guest saves</button>
        </>}
      </section>}
    </div>
  } />
}
