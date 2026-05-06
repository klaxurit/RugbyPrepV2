/**
 * Identifiant idempotent d'un créneau de séance mère pour un utilisateur donné.
 *
 * Format : `motherSessionId:weekLabel:sessionIndex`
 *
 * Sert de clé d'unicité côté Supabase (`session_logs.slot_signature` et
 * `exercise_set_logs.slot_signature`) pour permettre :
 *   - l'auto-save par bloc (upsert sans connaître le session_log_id)
 *   - la re-validation d'une séance déjà fermée sans créer de doublon
 *     (ex : un user passe free→premium et ré-ouvre une séance pour ajouter
 *      ses charges dessus, on UPDATE au lieu d'INSERT).
 *
 * `weekLabel` encode déjà la semaine du cycle, donc une séance reste la
 * même séance physique quel que soit le jour où l'utilisateur revient
 * dessus pour la compléter — pas de doublon créé en cas d'ajout tardif
 * de charges. Une nouvelle occurrence apparaîtra naturellement au cycle
 * suivant via le changement de `weekLabel`.
 */
export interface SlotSignatureInput {
  motherSessionId: string
  weekLabel: string
  sessionIndex: number
}

export function buildSlotSignature(input: SlotSignatureInput): string {
  return `${input.motherSessionId}:${input.weekLabel}:${input.sessionIndex}`
}

export function parseSlotSignature(signature: string): SlotSignatureInput | null {
  const parts = signature.split(':')
  // Compat : tolère l'ancien format à 4 parties (avec dateYMD) en l'ignorant.
  if (parts.length !== 3 && parts.length !== 4) return null
  const [motherSessionId, weekLabel, sessionIndexStr] = parts
  const sessionIndex = Number(sessionIndexStr)
  if (Number.isNaN(sessionIndex)) return null
  return { motherSessionId, weekLabel, sessionIndex }
}

/** Tronque un timestamp ISO en YYYY-MM-DD (UTC). Conservé pour usages externes. */
export function dateYmdFromIso(iso: string): string {
  return iso.slice(0, 10)
}
