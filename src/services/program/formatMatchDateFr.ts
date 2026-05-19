export type MatchDateLang = 'fr' | 'en'

/**
 * Date ISO locale (yyyy-mm-dd) → libellé long type « dimanche 17 mai » / « Sunday 17 May ».
 */
export function formatMatchDate(iso: string, lang: MatchDateLang = 'fr'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR'
  return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Date courte type « 17 mai » / « 17 May ». */
export function formatShortLocaleDate(iso: string, lang: MatchDateLang = 'fr'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR'
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long' })
}

/** @deprecated Préférer {@link formatMatchDate}(iso, 'fr'). */
export function formatMatchDateFr(iso: string): string {
  return formatMatchDate(iso, 'fr')
}
