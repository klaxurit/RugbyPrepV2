/**
 * iOS status bar integration.
 *
 * Sur Capacitor iOS, la status bar native (heure / WiFi / batterie) est gérée
 * séparément du webview. Par défaut elle apparaît visuellement détachée du
 * header de l'app. En passant en `Overlay=true` + style adapté à la couleur
 * de fond, on obtient l'apparence d'un bloc continu (status bar fusionnée
 * avec le header), comme sur les apps natives iOS (Instagram, Revolut, etc.).
 *
 * La couleur du texte de la status bar doit contraster avec le fond du header.
 * Notre header (`bg-shell`) est crème clair → on utilise le style `Dark`
 * (texte noir). Si tu changes la couleur du header en fond sombre, passe à
 * `Light` (texte blanc).
 */

import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export async function initStatusBar(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  if (Capacitor.getPlatform() !== 'ios') return

  try {
    // Le webview s'étend sous la status bar — le fond du header remplit visuellement
    // la zone de la status bar. Les safe-area-inset-* CSS positionnent le contenu
    // correctement en dessous des éléments système.
    await StatusBar.setOverlaysWebView({ overlay: true })
    // Texte noir (heure/WiFi/batterie) lisible sur notre fond crème.
    await StatusBar.setStyle({ style: Style.Dark })
  } catch (err) {
    console.warn('[StatusBar] init failed:', err)
  }
}
