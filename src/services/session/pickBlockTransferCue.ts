/**
 * 1 ligne « pourquoi ce bloc » pour l’UI — première note courte / transfert rugby.
 */

const TRANSFER_HINT =
  /transfert|rugby|mêlée|melee|plaquage|tackle|scrum|lineout|touche|sprint|cod|contact|maul|ruck|carry|lockout|lancer/i

export function pickBlockTransferCue(
  coachingNotes: readonly string[] | undefined | null,
  maxLen = 110,
): string | null {
  if (!coachingNotes || coachingNotes.length === 0) return null
  const cleaned = coachingNotes
    .map((n) => n.replace(/`/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  if (cleaned.length === 0) return null

  const preferred = cleaned.find((n) => TRANSFER_HINT.test(n) && n.length <= maxLen * 1.4)
  const raw = preferred ?? cleaned.find((n) => n.length <= maxLen) ?? cleaned[0]!
  if (raw.length <= maxLen) return raw
  return `${raw.slice(0, maxLen - 1).trim()}…`
}
