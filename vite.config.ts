import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

function supabasePreconnectPlugin(origin: string | null) {
  return {
    name: 'inject-supabase-preconnect',
    transformIndexHtml(html: string) {
      if (!origin) return html
      const tag = `<link rel="preconnect" href="${origin}" crossorigin />`
      return html.replace('<!--INJECT_SUPABASE_PRECONNECT-->', tag)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  let supabaseOrigin: string | null = null
  try {
    const raw = env.VITE_SUPABASE_URL?.trim()
    if (raw) supabaseOrigin = new URL(raw).origin
  } catch {
    /* URL invalide — pas de preconnect */
  }

  return {
  build: {
    rollupOptions: {
      output: {
        // Split prudent : on n'isole QUE recharts (uniquement /progress) et
        // supabase (utilisé partout mais lourd). React, react-router,
        // framer-motion, lucide-react restent groupés dans le chunk vendor
        // par défaut — les séparer en chunks distincts a déclenché un TDZ
        // ("Cannot access 'Te' before initialization") en prod sur certains
        // ordres d'évaluation, donc on garde la chaîne d'init naturelle.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-recharts'
          if (id.includes('@supabase')) return 'vendor-supabase'
          return undefined
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    supabasePreconnectPlugin(supabaseOrigin),
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
      // 'prompt' (vs 'autoUpdate') : on ne skipWaiting pas silencieusement.
      // Le toast UpdatePrompt + useRegisterSW driven le flow → l'utilisateur
      // tap "Recharger" pour activer la nouvelle version. Évite qu'un SW
      // bascule en plein milieu d'une séance et écrase un upload de log.
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        name: 'RugbyForge',
        short_name: 'RugbyForge',
        description: 'Application de preparation physique rugby avec programmes personnalises, suivi ACWR et prevention blessures.',
        lang: 'fr',
        theme_color: '#7B0D1E',
        background_color: '#7B0D1E',
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
    // Activé via ANALYZE=1 npm run build pour ouvrir un treemap du bundle.
    process.env.ANALYZE === '1' && visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
      open: false,
    }),
  ].filter(Boolean),
  }
})
