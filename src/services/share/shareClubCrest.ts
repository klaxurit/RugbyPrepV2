/**
 * Écusson de secours de la carte de partage : pastille ronde aux couleurs
 * RugbyForge avec les initiales du club. Forme volontairement neutre (cercle,
 * pas de blason / bouclier) pour ne jamais imiter un emblème officiel.
 */
const CREST_BG = '#7A1F2C'
const CREST_INK = '#F5EFE6'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildFallbackCrestSvg(initials: string): string {
  const letters = initials.slice(0, 4).toUpperCase()
  const fontSize = letters.length >= 4 ? 26 : letters.length === 3 ? 31 : 38
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="46" fill="${CREST_BG}"/><circle cx="48" cy="48" r="40" fill="none" stroke="${CREST_INK}" stroke-width="3"/><text x="48" y="48" dominant-baseline="central" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-style="italic" font-weight="800" font-size="${fontSize}" fill="${CREST_INK}">${escapeXml(letters)}</text></svg>`
}

export function buildFallbackCrestDataUrl(initials: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildFallbackCrestSvg(initials))}`
}
