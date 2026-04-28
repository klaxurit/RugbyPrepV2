/**
 * Identifiant idempotent d'un créneau de séance mère pour un utilisateur donné.
 *
 * Format : `motherSessionId:weekLabel:sessionIndex:YYYY-MM-DD`
 *
 * Sert de clé d'unicité côté Supabase (`session_logs.slot_signature` et
 * `exercise_set_logs.slot_signature`) pour permettre :
 *   - l'auto-save par bloc (upsert sans connaître le session_log_id)
 *   - la re-validation d'une séance déjà fermée sans créer de doublon
 *     (ex : un user passe free→premium et ré-ouvre une séance pour ajouter
 *      ses charges dessus, on UPDATE au lieu d'INSERT).
 *
 * La date d'attache est la date à laquelle la séance a été démarrée. Si
 * l'utilisateur ré-ouvre la même session le même jour, on retombe sur la
 * même signature donc on UPSERT correctement. S'il la ré-ouvre un autre
 * jour (ex : nouvelle occurrence de cette mother session dans le cycle
 * suivant), il aura une nouvelle signature et de nouvelles données.
 */
export interface SlotSignatureInput {
  motherSessionId: string
  weekLabel: string
  sessionIndex: number
  /** Format YYYY-MM-DD. Recommandé : la date de démarrage de la séance. */
  dateYMD: string
}

export function buildSlotSignature(input: SlotSignatureInput): string {
  return `${input.motherSessionId}:${input.weekLabel}:${input.sessionIndex}:${input.dateYMD}`
}

export function parseSlotSignature(signature: string): SlotSignatureInput | null {
  const parts = signature.split(':')
  if (parts.length !== 4) return null
  const [motherSessionId, weekLabel, sessionIndexStr, dateYMD] = parts
  const sessionIndex = Number(sessionIndexStr)
  if (Number.isNaN(sessionIndex)) return null
  return { motherSessionId, weekLabel, sessionIndex, dateYMD }
}

/** Tronque un timestamp ISO en YYYY-MM-DD (UTC). */
export function dateYmdFromIso(iso: string): string {
  return iso.slice(0, 10)
}
