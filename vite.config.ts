import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: { groups: [{ name: 'db-catalog', test: /[\/]database[\/]data[\/]catalog\.json$/ },
                                  { name: 'db-observations', test: /[\/]database[\/]data[\/]observations\.json$/ }] },
      },
    },
  },
  plugins: [
    {
      name: 'validate-account-settings',
      config(_config, { mode }) {
        const { VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key } = loadEnv(mode, process.cwd(), 'VITE_SUPABASE_')
        if (Boolean(url) !== Boolean(key)) throw new Error('Set both Supabase account sync environment variables or leave both empty.')
        if (key && !key.startsWith('sb_publishable_')) throw new Error('Use a Supabase publishable key for the web build.')
      },
    },
    react(),
    tailwind(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: '/',
        name: 'Zenlessentials',
        short_name: 'Zenlessentials',
        description: 'Track Zenless Zone Zero stories, look up Agents and equipment, and save squads.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#111214',
        background_color: '#111214',
        icons: [
          { src: '/icons/app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,woff,woff2,webp,svg,png,webmanifest}'],
        globIgnores: ['database-art/**', '**/agent-*.js', '**/DatabaseApp-*', '**/CollectionPage-*', '**/database-*', '**/db-*.js'],
        runtimeCaching: [{
          urlPattern: ({ url, sameOrigin }) => sameOrigin && /^\/assets\/(?:DatabaseApp-|CollectionPage-|database-|db-|agent-)/.test(url.pathname),
          handler: 'CacheFirst',
          options: { cacheName: 'database-chunks-v1', expiration: { maxEntries: 90, maxAgeSeconds: 60 * 60 * 24 * 14 } },
        }, {
          urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/database-art/'),
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'database-art-v1', expiration: { maxEntries: 240, maxAgeSeconds: 60 * 60 * 24 * 14, purgeOnQuotaError: true } },
        }],
        navigateFallbackDenylist: [/\.[^/]+$/],
      },
    }),
  ],
})
