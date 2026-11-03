/**
 * Theme weeks légères pour l’accent poste (Vague B).
 * Ne réécrit pas les mothers — réordonne / biais les slots runtime.
 *
 * W1 contact · W2 power · W3 skill (lockout / COD / throw) · W4 = deload (pas d’accent)
 */

export type PositionAccentTheme = 'contact' | 'power' | 'skill'

export type PositionAccentFocus = 'a' | 'b'

export function resolvePositionAccentTheme(
  mesoWeek: 1 | 2 | 3 | 4 | null | undefined,
): PositionAccentTheme | null {
  if (mesoWeek == null || mesoWeek === 4) return null
  if (mesoWeek === 1) return 'contact'
  if (mesoWeek === 2) return 'power'
  return 'skill'
}

/** Focus B = thème complémentaire (pas le même finisher chaque jour). */
export function alternatePositionAccentTheme(theme: PositionAccentTheme): PositionAccentTheme {
  if (theme === 'contact') return 'power'
  if (theme === 'power') return 'skill'
  return 'contact'
}

export function resolveEffectiveAccentTheme(
  mesoWeek: 1 | 2 | 3 | 4 | null | undefined,
  focus: PositionAccentFocus = 'a',
): PositionAccentTheme | null {
  const primary = resolvePositionAccentTheme(mesoWeek)
  if (!primary) return null
  return focus === 'b' ? alternatePositionAccentTheme(primary) : primary
}

export function positionAccentThemeLabel(
  theme: PositionAccentTheme,
  lang: 'fr' | 'en',
): string {
  if (lang === 'en') {
    if (theme === 'contact') return 'Contact'
    if (theme === 'power') return 'Power'
    return 'Skill'
  }
  if (theme === 'contact') return 'Contact'
  if (theme === 'power') return 'Puissance'
  return 'Technique'
}

export function positionAccentThemeHint(
  theme: PositionAccentTheme,
  lang: 'fr' | 'en',
): string {
  if (lang === 'en') {
    if (theme === 'contact') return 'Scrum / tackle / carry bias'
    if (theme === 'power') return 'Jump / COD / sprint bias'
    return 'Throw / lockout / rotation bias'
  }
  if (theme === 'contact') return 'Biais mêlée / plaquage / carry'
  if (theme === 'power') return 'Biais saut / COD / sprint'
  return 'Biais lancer / lockout / rotation'
}
