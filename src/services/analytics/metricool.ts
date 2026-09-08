/** Pixel Metricool (détection du site). Chargé seulement après consentement cookies. */

export const METRICOOL_HASH = 'a1e32f90b630fc86d17b513e2e7c742d'
const SCRIPT_SRC = 'https://tracker.metricool.com/resources/be.js'
const SCRIPT_ID = 'metricool-be-tracker'

type BeTracker = { t: (opts: { hash: string }) => void }

function getBeTracker(): BeTracker | undefined {
  return (window as Window & { beTracker?: BeTracker }).beTracker
}

function pingMetricool(): void {
  getBeTracker()?.t({ hash: METRICOOL_HASH })
}

export function initMetricool(): void {
  if (typeof document === 'undefined') return

  const existing = document.getElementById(SCRIPT_ID)
  if (existing) {
    pingMetricool()
    return
  }

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.src = SCRIPT_SRC
  script.async = true
  script.onload = () => pingMetricool()
  document.head.appendChild(script)
}
