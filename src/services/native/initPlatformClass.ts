/**
 * Ajoute une classe `platform-ios` / `platform-android` / `platform-web` sur
 * `<html>` au boot pour permettre aux styles Tailwind de cibler chaque plateforme.
 *
 * Usage dans un composant :
 *   className="py-4 ios:py-2"
 *   → 16px padding partout, 8px sur iPhone/iPad uniquement.
 *
 * Variant défini dans `src/styles/global.css` via `@custom-variant ios`.
 */

import { Capacitor } from '@capacitor/core'

export function initPlatformClass(): void {
  if (typeof document === 'undefined') return
  const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web'
  const root = document.documentElement
  root.classList.remove('platform-ios', 'platform-android', 'platform-web')
  if (platform === 'ios') root.classList.add('platform-ios')
  else if (platform === 'android') root.classList.add('platform-android')
  else root.classList.add('platform-web')
}
