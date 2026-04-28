import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor configuration for iOS.
 *
 * - `appId` matches the Android Bubblewrap TWA package → single identity cross-platform.
 * - `webDir` points to the Vite production build output.
 * - `server.androidScheme` left default (https) — iOS uses `capacitor://` scheme
 *   automatically for local bundled assets, which is what we want (same-origin
 *   localStorage/indexedDB across app launches).
 */
const config: CapacitorConfig = {
  appId: 'fr.rugbyforge.app',
  appName: 'RugbyForge',
  webDir: 'dist',
  ios: {
    // Use content inset to respect the notch / home indicator. The CSS
    // `env(safe-area-inset-*)` tokens then apply correctly.
    contentInset: 'always',
  },
  // Disable Capacitor's default live-reload in release builds.
  server: {
    // In dev you can point this at a local Vite server for fast iteration ;
    // leave empty in production so the bundled dist/ is served.
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
}

export default config
