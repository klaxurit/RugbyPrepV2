import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        // The current production bundle is slightly above Workbox's default 2 MiB
        // precache limit. Raise the threshold so deployment doesn't fail while we
        // keep chunking work as a separate optimization task.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'RugbyForge',
        short_name: 'RugbyForge',
        description: 'Application de preparation physique rugby avec programmes personnalises, suivi ACWR et prevention blessures.',
        lang: 'fr',
        theme_color: '#e11d48',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        categories: ['sports', 'health', 'productivity'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
