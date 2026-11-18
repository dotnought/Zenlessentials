import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: '/',
        name: 'Zenlessentials',
        short_name: 'Zenlessentials',
        description: 'Track Zenless Zone Zero stories, Agents, and events.',
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
        navigateFallbackDenylist: [/\.[^/]+$/],
      },
    }),
  ],
})
