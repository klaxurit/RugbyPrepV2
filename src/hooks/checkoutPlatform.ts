/**
 * Routage checkout : Play Billing (TWA Android) vs Stripe (web / iOS PWA).
 *
 * Une PWA iOS en mode « Ajouter à l’écran d’accueil » est `standalone` mais
 * n’a pas Digital Goods API. Bloquer tout standalone forçait à tort le message
 * Play Store et empêchait Stripe.
 */

export function isAndroidUserAgent(userAgent: string): boolean {
  return /Android/i.test(userAgent)
}

/**
 * True → afficher le message « ouvre via le Play Store » et ne pas appeler Stripe.
 * False → enchaîner sur Stripe (Safari, desktop, iOS PWA standalone).
 */
export function shouldBlockStandaloneWithoutPlayBilling(input: {
  standalone: boolean
  playBillingAvailable: boolean
  userAgent: string
}): boolean {
  if (input.playBillingAvailable) return false
  if (!input.standalone) return false
  // Sideload / TWA Android sans Digital Goods : politique Play.
  // iOS / desktop standalone : Stripe OK.
  return isAndroidUserAgent(input.userAgent)
}
