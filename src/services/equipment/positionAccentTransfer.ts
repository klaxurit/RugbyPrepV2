import type { PositionAccentBlock } from './positionAccentRegistry'

/**
 * Sous-titre Accent depuis les slots réellement retenus.
 * Évite « pull+T » quand ni pull ni T n’ont été choisis (dédup fatigue).
 */
export function positionAccentPackDomain(
  transfer: string,
): string {
  const parts = transfer.split(/\s*[—–]\s*/)
  return (parts[0] ?? transfer).trim()
}

export function buildPositionAccentTransferLine(
  pack: Pick<PositionAccentBlock, 'transferFr' | 'transferEn'>,
  chosenSlotLabels: readonly string[],
  lang: 'fr' | 'en',
): string {
  const fallback = lang === 'en' ? pack.transferEn : pack.transferFr
  if (chosenSlotLabels.length === 0) return fallback
  const domain = positionAccentPackDomain(fallback)
  return `${domain} — ${chosenSlotLabels.join(' + ')}`
}
