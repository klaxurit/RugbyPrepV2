/**
 * Audit du volume hebdomadaire par groupe musculaire.
 *
 * Remplace le comptage « séries dures totales » comme indicateur de dosage.
 * Un total ne dit rien du stimulus reçu par un muscle donné : 48 séries
 * réparties sur huit groupes, c'est 6 séries par groupe, soit un entretien.
 *
 * Repères retenus :
 *   - Pelland et al. 2025 (Sports Med) : relation dose-réponse positive et
 *     continue entre volume hebdomadaire par groupe et hypertrophie, avec
 *     rendements décroissants marqués au-delà de ~12-20 séries.
 *   - Israetel et al. 2019 : MEV ~10 séries/groupe/semaine en hypertrophie.
 *   - En saison, le volume de maintien est bien plus bas : la charge du club et
 *     les matchs occupent la marge de récupération.
 */

import { MOTHER_SESSIONS } from '../../motherSessions.generated'
import { getWeeklyTemplate, type GetWeeklyTemplateParams } from '../../weeklyTemplates'
import { mapMotherSessionIdForEquipment } from '../../../services/equipment/motherSessionEquipmentMap'
import { parseBlockTourCount, parseExerciseSets } from '../../../services/ui/blockPresentation'
import type { Block, MotherSession } from '../../../types/motherSession'
import type { Equipment } from '../../../types/training'
import {
  contributionFor,
  PRIMARY_MUSCLE_GROUPS,
  type MuscleGroup,
} from './muscleGroups'
import { buildWeekParams } from './weeklyLoad'

const BY_ID: Record<string, MotherSession> = Object.fromEntries(
  MOTHER_SESSIONS.map((s) => [s.metadata.id, s]),
)

export type MuscleVolume = Partial<Record<MuscleGroup, number>>

function setsForExercise(prescription: string, block: Block): number {
  return parseExerciseSets(prescription) ?? parseBlockTourCount(block)
}

/** Volume par groupe pour une séance, en séries fractionnelles. */
export function sessionMuscleVolume(sessionId: string): MuscleVolume {
  const session = BY_ID[sessionId]
  if (!session) return {}

  const volume: MuscleVolume = {}
  for (const block of session.blocks) {
    for (const exercise of block.exercises) {
      const contribution = contributionFor(exercise.name)
      if (!contribution) continue
      const sets = setsForExercise(exercise.prescription, block)
      for (const [group, weight] of Object.entries(contribution) as [MuscleGroup, number][]) {
        volume[group] = (volume[group] ?? 0) + sets * weight
      }
    }
  }
  return volume
}

export interface WeekMuscleVolumeRow {
  key: string
  cycle: GetWeeklyTemplateParams['cycle']
  offSeasonPhase?: GetWeeklyTemplateParams['offSeasonPhase']
  frequency: number
  equipment: 'gym' | 'bodyweight'
  sessionIds: string[]
  volume: MuscleVolume
}

function weekKey(params: GetWeeklyTemplateParams, equipment: 'gym' | 'bodyweight'): string {
  return [
    equipment,
    params.cycle,
    params.phase != null ? `p${params.phase}` : '',
    params.offSeasonPhase != null ? `off${params.offSeasonPhase}` : '',
    `f${params.frequency}`,
    params.positionGroup,
    params.matchContext ?? '',
  ]
    .filter(Boolean)
    .join('|')
}

export function auditWeeklyMuscleVolume(equipmentProfile?: Equipment[]): WeekMuscleVolumeRow[] {
  const label: 'gym' | 'bodyweight' = equipmentProfile ? 'bodyweight' : 'gym'
  const rows: WeekMuscleVolumeRow[] = []
  const seen = new Set<string>()

  for (const params of buildWeekParams()) {
    let template
    try {
      template = getWeeklyTemplate(params)
    } catch {
      continue
    }

    const sessionIds = template.sessions.map((s) =>
      mapMotherSessionIdForEquipment(s.sessionId, equipmentProfile),
    )
    const signature = `${label}|${params.cycle}|${sessionIds.join('+')}`
    if (seen.has(signature)) continue
    seen.add(signature)

    const volume: MuscleVolume = {}
    for (const id of sessionIds) {
      for (const [group, sets] of Object.entries(sessionMuscleVolume(id)) as [
        MuscleGroup,
        number,
      ][]) {
        volume[group] = (volume[group] ?? 0) + sets
      }
    }

    rows.push({
      key: weekKey(params, label),
      cycle: params.cycle,
      offSeasonPhase: params.offSeasonPhase,
      frequency: params.frequency,
      equipment: label,
      sessionIds,
      volume,
    })
  }

  return rows
}

/**
 * Plafond de séries fractionnelles par groupe et par semaine.
 *
 * Hors saison, on autorise la zone haute du dose-réponse. En saison, la charge
 * de club s'ajoute à tout ce qui est compté ici, d'où un plafond nettement
 * plus bas.
 */
export const MUSCLE_VOLUME_CEILING: Record<GetWeeklyTemplateParams['cycle'], number> = {
  off_season: 22,
  pre_season: 18,
  in_season: 14,
}

/**
 * Plancher appliqué aux seuls groupes primaires, et seulement sur le bloc
 * d'hypertrophie inter-saison à 3 séances ou plus : c'est le seul moment de
 * l'année où le développement de masse est l'objectif principal et où rien ne
 * vient concurrencer la récupération. Ailleurs, un volume bas est un choix, pas
 * un défaut.
 */
export const HYPERTROPHY_VOLUME_FLOOR = 10

export interface MuscleVolumeFinding {
  key: string
  group: MuscleGroup
  value: number
  threshold: number
  kind: 'below_floor' | 'above_ceiling'
  sessionIds: string[]
}

function isHypertrophyBlock(row: WeekMuscleVolumeRow): boolean {
  return row.cycle === 'off_season' && row.offSeasonPhase === 3 && row.frequency >= 3
}

export function findMuscleVolumeFindings(rows: WeekMuscleVolumeRow[]): MuscleVolumeFinding[] {
  const findings: MuscleVolumeFinding[] = []

  for (const row of rows) {
    const ceiling = MUSCLE_VOLUME_CEILING[row.cycle]
    for (const [group, value] of Object.entries(row.volume) as [MuscleGroup, number][]) {
      if (value > ceiling) {
        findings.push({
          key: row.key,
          group,
          value,
          threshold: ceiling,
          kind: 'above_ceiling',
          sessionIds: row.sessionIds,
        })
      }
    }

    if (!isHypertrophyBlock(row)) continue
    for (const group of PRIMARY_MUSCLE_GROUPS) {
      const value = row.volume[group] ?? 0
      if (value < HYPERTROPHY_VOLUME_FLOOR) {
        findings.push({
          key: row.key,
          group,
          value,
          threshold: HYPERTROPHY_VOLUME_FLOOR,
          kind: 'below_floor',
          sessionIds: row.sessionIds,
        })
      }
    }
  }

  return findings
}

export function formatMuscleFinding(f: MuscleVolumeFinding): string {
  const comparator = f.kind === 'below_floor' ? '<' : '>'
  return `${f.key} — ${f.group} ${f.value} ${comparator} ${f.threshold} (${f.sessionIds.join(' + ')})`
}
