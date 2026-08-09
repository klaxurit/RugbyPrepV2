/**
 * Contrat strict sur les repos de contraste.
 *
 * `overlapsKb` valide un bloc dès que sa fourchette *touche* la fenêtre KB :
 * un repos annoncé « 90-120s » passe donc l'exigence 120-180s du contraste,
 * alors que l'athlète se repose réellement 90 s sur la plupart des tours.
 *
 * Pour un contraste, c'est la borne BASSE qui compte : si elle descend sous
 * 2 min, la filière phosphagène n'est pas restaurée et les derniers tours
 * produisent de la fatigue sous charge lourde au lieu de la puissance. Ce test
 * exige donc `parsedMin >= 120s` sur tout bloc classé `power_contrast`.
 *
 * Source : Décision #40 v2, strength-methods.md (complex training / PAP).
 */

import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS } from '../../../motherSessions.generated'
import { auditAllSessions, type AuditRow } from '../auditBlock'
import { KB_RANGES } from '../kbRanges'

const CONTRAST_MIN_SECONDS = KB_RANGES.power_contrast.minSeconds

/**
 * Blocs de contraste dont le repos plancher est trop court au moment de
 * l'audit de périodisation. Clé : `sessionId#blockNum`.
 *
 * Deux natures d'écart, à traiter différemment lors de la correction :
 *   - Seconds contrastes lourds laissés à 90-120s pour tenir la durée cible
 *     (Force-Pont, clusters de tirage) → allonger à 2-3 min.
 *   - Clusters purement pliométriques des séances SPEED, sans charge lourde en
 *     amont → 90-120s y est physiologiquement correct, c'est l'inférence
 *     d'intent qui les classe à tort en `power_contrast`. À reclasser plutôt
 *     qu'à rallonger.
 */
const KNOWN_SHORT_CONTRAST_DEBT = new Set<string>([
  // Contrastes lourds — à rallonger
  'FULL_OFFSEASON_FORCE_BRIDGE_V1#2',
  'FULL_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1#2',
  'LOWER_OFFSEASON_FORCE_BRIDGE_V1#2',
  'LOWER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1#2',
  'UPPER_OFFSEASON_FORCE_BRIDGE_V1#2',
  'UPPER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1#2',
  'LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1#2',
  'UPPER_BW_OFFSEASON_FORCE_BRIDGE_V1#2',
  'FULL_PRESEASON_POWER_BACK_THREE_V1#3',
  'FULL_PRESEASON_POWER_FRONT_ROW_V1#3',
  'UPPER_PRESEASON_POWER_BACK_THREE_V1#2',
  'UPPER_PRESEASON_POWER_FRONT_ROW_V1#2',
  // Clusters pliométriques SPEED — à reclasser
  'SPEED_BW_POWER_PRESEASON_V1#2',
  'SPEED_POWER_PRESEASON_INTRO_V1#2',
  'SPEED_POWER_PRESEASON_V1#2',
])

const rows: AuditRow[] = auditAllSessions(MOTHER_SESSIONS)

function shortContrastRows(): AuditRow[] {
  return rows.filter(
    (r) =>
      r.intent === 'power_contrast' &&
      r.parsedMin != null &&
      r.parsedMin < CONTRAST_MIN_SECONDS,
  )
}

function describeRow(r: AuditRow): string {
  return (
    `${r.sessionId} #${r.blockNum} "${r.blockName}" — repos ${r.parsedMin}-${r.parsedMax}s, ` +
    `plancher exigé ${CONTRAST_MIN_SECONDS}s (format: "${r.rawFormat}")`
  )
}

describe('repos de contraste — borne basse stricte', () => {
  it('audite un nombre plausible de blocs de contraste (sanity)', () => {
    const contrastRows = rows.filter((r) => r.intent === 'power_contrast')
    expect(contrastRows.length).toBeGreaterThan(20)
  })

  it('ne laisse apparaître aucun nouveau contraste sous le plancher', () => {
    const unexpected = shortContrastRows().filter(
      (r) => !KNOWN_SHORT_CONTRAST_DEBT.has(`${r.sessionId}#${r.blockNum}`),
    )
    expect(
      unexpected,
      unexpected.length
        ? `Contrastes trop courts non listés :\n${unexpected.map((r) => `  • ${describeRow(r)}`).join('\n')}`
        : '',
    ).toHaveLength(0)
  })

  it('voit sa dette connue diminuer, jamais grossir', () => {
    expect(shortContrastRows().length).toBeLessThanOrEqual(KNOWN_SHORT_CONTRAST_DEBT.size)
  })

  it('ne conserve aucune entrée de dette périmée', () => {
    const stillShort = new Set(shortContrastRows().map((r) => `${r.sessionId}#${r.blockNum}`))
    const stale = [...KNOWN_SHORT_CONTRAST_DEBT].filter((key) => !stillShort.has(key))
    expect(
      stale,
      stale.length
        ? `Entrées à retirer de l'allowlist (le bloc est corrigé ou a changé de numéro) :\n${stale.map((k) => `  • ${k}`).join('\n')}`
        : '',
    ).toHaveLength(0)
  })
})
