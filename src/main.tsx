import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/barlow-condensed/latin-800.css'
import '@fontsource/barlow-condensed/latin-800-italic.css'
import '@fontsource-variable/dm-sans'
import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './style.css'

const AppWithAccounts = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ? lazy(() => import('./account/AccountApp'))
  : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {AppWithAccounts ? <Suspense fallback={<p className="account-loading" role="status">Opening Zenlessentials…</p>}><AppWithAccounts /></Suspense> : <App />}
    </BrowserRouter>
  </StrictMode>,
)

registerSW({
  onRegisteredSW(_url, registration) {
    if (!registration) return
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void registration.update().catch(() => {
          // The installed app can keep using its cached build if the network is unavailable.
        })
      }
    })
  },
})
