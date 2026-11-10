/**
 * Nettoie les notes / cues pour l’affichage joueur (markdown brut, franglais).
 * Ne modifie pas les IDs ni la prescription moteur.
 */
export function formatPlayerFacingNote(raw: string, lang: 'fr' | 'en' = 'fr'): string {
  let text = raw
    .replace(/`([^`]+)`/g, '$1')
    .replace(/`/g, '')
    .replace(/->/g, '→')
    .replace(/\s+/g, ' ')
    .trim()

  if (lang === 'fr') {
    text = text
      .replace(/\bTransfer\b/g, 'Transfert')
      .replace(/\btransfer\b/g, 'transfert')
  }

  return text
}

/** Sous-titres FR pour sigles / noms EN gardés à l’affichage. */
const EN_KEEP_FR_SUBTITLE: Record<string, string> = {
  rdl: 'Soulevé de terre jambes tendues',
  'hip thrust': 'Extension de hanche',
  'single-leg hip thrust': 'Extension de hanche unilatérale',
  'hip thrust unilatéral': 'Extension de hanche unilatérale',
  emom: 'Every Minute On the Minute',
}

/**
 * Titre affiché + sous-titre FR optionnel (sans changer l’ID exo).
 */
export function exerciseDisplayLabels(
  displayedName: string,
  lang: 'fr' | 'en' = 'fr',
): { title: string; subtitle?: string } {
  const title = displayedName.trim()
  if (!title || lang !== 'fr') return { title }
  const key = title.toLowerCase()
  for (const [pattern, subtitle] of Object.entries(EN_KEEP_FR_SUBTITLE)) {
    if (key === pattern || key.startsWith(`${pattern} `) || key.endsWith(` ${pattern}`)) {
      return { title, subtitle }
    }
  }
  if (/\brdl\b/i.test(title)) return { title, subtitle: EN_KEEP_FR_SUBTITLE.rdl }
  if (/hip\s*thrust/i.test(title)) return { title, subtitle: EN_KEEP_FR_SUBTITLE['hip thrust'] }
  return { title }
}
