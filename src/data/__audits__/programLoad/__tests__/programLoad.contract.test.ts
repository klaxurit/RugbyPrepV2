/**
 * Contrat de charge programme — garde-fou permanent.
 *
 * Trois familles de vérifications :
 *   1. Cohérence reps × %1RM : aucune prescription ne doit demander plus de
 *      répétitions que ce que l'intensité annoncée permet.
 *   2. Volume par groupe musculaire : plancher sur le bloc d'hypertrophie,
 *      plafond partout. C'est l'indicateur de dosage de référence.
 *   3. Charge neurale et ischios : plafonds de `LOAD_BUDGETS` sur les blocs de
 *      contraste et les séries d'ischios.
 *
 * Chaque test porte une allowlist de dette connue. L'allowlist doit se vider,
 * jamais s'allonger.
 */

import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS } from '../../../motherSessions.generated'
import { contributionFor } from '../muscleGroups'
import {
  auditWeeklyMuscleVolume,
  findMuscleVolumeFindings,
  formatMuscleFinding,
} from '../muscleVolume'
import {
  auditIntensityAnchors,
  formatMissingAnchor,
} from '../intensityAnchors'
import { auditRepsIntensity, formatFinding } from '../repsIntensity'
import { auditWeeklyLoad, findBudgetBreaches, formatBreach } from '../weeklyLoad'

/**
 * Prescriptions incohérentes connues, à corriger avec le rééquilibrage du bloc
 * Force-Pont. Clé : `sessionId::exerciseName`.
 */
const KNOWN_REPS_INTENSITY_DEBT = new Set<string>([
  'LOWER_OFFSEASON_FORCE_BRIDGE_V1::pin back squat',
  'UPPER_OFFSEASON_FORCE_BRIDGE_V1::bench press',
  'FULL_OFFSEASON_FORCE_BRIDGE_V1::Barbell Hip Thrust',
])

/**
 * Semaines en dépassement de charge neurale ou ischios. Clé : `weekKey::metric`.
 * Deux foyers : le bloc Force-Pont inter-saison et la pré-saison phase 3, qui
 * empilent six blocs de contraste sur la semaine.
 */
const KNOWN_LOAD_DEBT = new Set<string>([
  'gym|off_season|off3|f3|front_row::hamstringSets', // 17 vs 16
  'gym|off_season|off4|f3|front_row::contrastBlocks', // 6 vs 4
  'gym|off_season|off4|f3|back_three::contrastBlocks', // 6 vs 4
  'gym|pre_season|p3|f3|front_row::contrastBlocks', // 6 vs 4
  'gym|pre_season|p3|f3|back_three::contrastBlocks', // 6 vs 4
  'bodyweight|off_season|off4|f3|front_row::contrastBlocks', // 6 vs 4
  'bodyweight|pre_season|p2|f4|front_row::contrastBlocks', // 5 vs 4
])

/**
 * Écarts par groupe musculaire. Vidé après correction des sous-dosages
 * hypertrophie (back_three salle + BW) et des dépassements dos pré-saison p3.
 */
const KNOWN_MUSCLE_VOLUME_DEBT = new Set<string>([])

describe('cohérence répétitions × %1RM', () => {
  const findings = auditRepsIntensity(MOTHER_SESSIONS)

  it('ne laisse apparaître aucune nouvelle prescription impossible', () => {
    const unexpected = findings.filter(
      (f) => !KNOWN_REPS_INTENSITY_DEBT.has(`${f.sessionId}::${f.exerciseName}`),
    )
    expect(
      unexpected,
      unexpected.length
        ? `Prescriptions incohérentes non listées :\n${unexpected.map((f) => `  • ${formatFinding(f)}`).join('\n')}`
        : '',
    ).toHaveLength(0)
  })

  it('voit sa dette connue diminuer, jamais grossir', () => {
    expect(findings.length).toBeLessThanOrEqual(KNOWN_REPS_INTENSITY_DEBT.size)
  })
})

describe('ancres d\'intensité (RER / %1RM)', () => {
  const missing = auditIntensityAnchors(MOTHER_SESSIONS)

  it('couvre les prescriptions dures avec une ancre d\'effort', () => {
    expect(
      missing,
      missing.length
        ? `Prescriptions dures sans ancre :\n${missing.map((m) => `  • ${formatMissingAnchor(m)}`).join('\n')}`
        : '',
    ).toHaveLength(0)
  })
})

describe('volume hebdomadaire par groupe musculaire', () => {
  const rows = [...auditWeeklyMuscleVolume(), ...auditWeeklyMuscleVolume([])]

  it('couvre tous les exercices du catalogue', () => {
    const unmapped = new Set<string>()
    for (const session of MOTHER_SESSIONS) {
      for (const block of session.blocks) {
        for (const exercise of block.exercises) {
          if (!contributionFor(exercise.name)) unmapped.add(exercise.name)
        }
      }
    }
    expect(
      [...unmapped],
      unmapped.size
        ? `Exercices absents du registre muscle :\n${[...unmapped].map((n) => `  • ${n}`).join('\n')}`
        : '',
    ).toHaveLength(0)
  })

  it('ne laisse apparaître aucun nouveau sous-dosage ni dépassement', () => {
    const findings = findMuscleVolumeFindings(rows)
    const unexpected = findings.filter((f) => !KNOWN_MUSCLE_VOLUME_DEBT.has(`${f.key}::${f.group}`))
    expect(
      unexpected,
      unexpected.length
        ? `Volumes hors bornes non listés :\n${unexpected.map((f) => `  • ${formatMuscleFinding(f)}`).join('\n')}`
        : '',
    ).toHaveLength(0)
  })

  it('voit sa dette connue diminuer, jamais grossir', () => {
    expect(findMuscleVolumeFindings(rows).length).toBeLessThanOrEqual(
      KNOWN_MUSCLE_VOLUME_DEBT.size,
    )
  })
})

describe('charge neurale et sollicitation ischios', () => {
  const gymRows = auditWeeklyLoad()
  // Profil poids de corps = aucun équipement déclaré (cf. resolveEquipmentProgramTier).
  const bwRows = auditWeeklyLoad([])
  const allRows = [...gymRows, ...bwRows]

  it('assemble un corpus de semaines non vide (sanity)', () => {
    expect(gymRows.length).toBeGreaterThan(10)
    expect(bwRows.length).toBeGreaterThan(10)
  })

  it('ne référence aucune séance absente du dataset', () => {
    const missing = allRows.filter((r) => r.missingSessionIds.length > 0)
    expect(
      missing,
      missing.length
        ? `Séances introuvables :\n${missing.map((r) => `  • ${r.key} → ${r.missingSessionIds.join(', ')}`).join('\n')}`
        : '',
    ).toHaveLength(0)
  })

  it('ne laisse apparaître aucun nouveau dépassement de budget', () => {
    const breaches = findBudgetBreaches(allRows)
    const unexpected = breaches.filter((b) => !KNOWN_LOAD_DEBT.has(`${b.key}::${b.metric}`))
    expect(
      unexpected,
      unexpected.length
        ? `Dépassements non listés :\n${unexpected.map((b) => `  • ${formatBreach(b)}`).join('\n')}`
        : '',
    ).toHaveLength(0)
  })

  it('voit sa dette connue diminuer, jamais grossir', () => {
    expect(findBudgetBreaches(allRows).length).toBeLessThanOrEqual(KNOWN_LOAD_DEBT.size)
  })
})
