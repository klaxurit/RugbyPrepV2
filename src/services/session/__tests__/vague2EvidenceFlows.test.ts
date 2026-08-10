/**
 * Vérification automatisée Vague 2 — Israetel / Severo / Weakley.
 * Simule le pipeline app sans UI : notice copy → resolve deload →
 * prepareSessionForRender → truncate → insights / toasts.
 */
import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import {
  programNoticeDeloadBullets,
  programNoticeDeloadSummary,
} from '../../../i18n/programSurfaces'
import { buildExplanation } from '../../scheduling/buildExplanation'
import { resolveMotherSessionsForWeek } from '../../motherSession/resolveMotherSessionsForWeek'
import { prepareSessionForRender } from '../prepareSessionForRender'
import { truncateSessionBlocks } from '../truncateSessionBlocks'
import { selectSessionInsight } from '../selectSessionInsight'
import { buildVsPreviousToastData, buildLivePRToastData } from '../../pr/formatLivePRToast'
import { NORDIC_PROGRESSION_BY_MESO_WEEK } from '../applyProgressiveNordic'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'
import type { CalendarEvent } from '../../../types/training'
import type { DetectedPR } from '../../pr/detectPRs'

function match(date: string): CalendarEvent {
  return {
    id: `m-${date}`,
    type: 'match',
    date,
    title: 'Match',
  }
}

function basePlanning(overrides: Partial<AnnualPlanningContext> = {}): AnnualPlanningContext {
  return {
    cycle: 'in_season',
    isMatchWeek: false,
    isDeloadWeek: false,
    fatigueLevel: 'moderate',
    daysUntilNextMatch: 10,
    weekLabel: 'S4',
    weekNumber: 4,
    mesocycleWeek: 4,
    planningTrace: {
      resolutionMode: 'calendar_inferred',
      rulesApplied: ['rule:in_season_deload_3_1'],
      warnings: [],
    },
    ...overrides,
  }
}

describe('Vague 2 — vérification Israetel / Severo / Weakley', () => {
  describe('Israetel — copy + décharge réelle', () => {
    it('notice utilisateur : volume ↓, intensité maintenue (pas les deux réduits)', () => {
      const summary = programNoticeDeloadSummary('fr')
      expect(summary).toMatch(/volume/i)
      expect(summary).toMatch(/intensité maintenue/i)
      expect(summary).not.toMatch(/volume et intensité réduits/)
      const bullets = programNoticeDeloadBullets('fr').join(' ')
      expect(bullets).toMatch(/40/)
      expect(bullets).toMatch(/Intensité gardée|intensité/i)
    })

    it('explanation semaine deload mentionne ~40 % volume + intensité', () => {
      const exp = buildExplanation({
        planningContext: basePlanning({ isDeloadWeek: true }),
        schedulingMode: 'sequential',
        presentation: { sessions: [], companionRecommendations: [] },
        corrections: [],
      })
      const blob = [exp.summaryLine, ...exp.detailLines].join(' ')
      expect(blob).toMatch(/récupération|décharge/i)
      expect(blob).toMatch(/40/)
      expect(blob).toMatch(/intensité/i)
    })

    it('pré-saison S12 deload → variant light + maxBlocks 3 sur les slots', () => {
      const r = resolveMotherSessionsForWeek({
        events: [match('2025-03-15')],
        today: '2025-03-03',
        weeklyFrequency: 3,
        positionGroup: 'front_row',
      })
      expect(r.planningContext.isDeloadWeek).toBe(true)
      expect(r.sessions.every((s) => s.variant === 'light')).toBe(true)
      expect(r.sessions.every((s) => s.maxBlocks === 3)).toBe(true)
    })

    it('pipeline Upper Force-Pont deload : coupe vers 2 blocs + light (~−50 % séries)', () => {
      const raw = MOTHER_SESSIONS_BY_ID.UPPER_OFFSEASON_FORCE_BRIDGE_V1
      expect(raw).toBeDefined()
      expect(raw.blocks.length).toBeGreaterThanOrEqual(4)

      const prepared = prepareSessionForRender({
        session: raw,
        trainingLevel: 'performance',
        equipment: ['barbell', 'rack', 'bench', 'dumbbells'],
        lang: 'fr',
        mesocycleWeek: 4,
      })
      const deload = truncateSessionBlocks(prepared, { maxBlocks: 2, variant: 'light' })

      expect(deload.droppedBlockNumbers).toEqual(expect.arrayContaining([4, 3]))
      expect(deload.session.blocks.map((b) => b.number)).toEqual([1, 2])
      expect(deload.lightenedBlockNumbers.length).toBeGreaterThan(0)

      const countSets = (s: typeof raw) =>
        s.blocks.reduce((acc, b) => {
          for (const e of b.exercises) {
            const m = e.prescription.match(/(\d+)\s*[x×]/i)
            if (m) acc += Number(m[1])
          }
          return acc
        }, 0)

      const ratio = countSets(deload.session) / countSets(raw)
      expect(ratio).toBeGreaterThanOrEqual(0.35)
      expect(ratio).toBeLessThanOrEqual(0.65)
    })

    it('soft-floor : séance 2 blocs en deload ne perd pas de bloc', () => {
      const raw = MOTHER_SESSIONS_BY_ID.UPPER_OFFSEASON_FORCE_BRIDGE_V1
      const twoBlocks = {
        ...raw,
        blocks: raw.blocks.slice(0, 2),
      }
      const result = truncateSessionBlocks(twoBlocks, { maxBlocks: 1, variant: 'light' })
      expect(result.droppedBlockNumbers).toEqual([])
      expect(result.session.blocks).toHaveLength(2)
    })
  })

  describe('Severo — NHE progressif sur Lower BW réel', () => {
    const sessionId = 'LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1'

    it('semaine 1 → 2x5 ; semaine 4 → 3x8 sur Nordic (FR inclus Nordique)', () => {
      const raw = MOTHER_SESSIONS_BY_ID[sessionId]
      expect(raw).toBeDefined()

      const w1 = prepareSessionForRender({
        session: raw,
        trainingLevel: 'performance',
        equipment: ['pullup_bar', 'bands'],
        lang: 'fr',
        mesocycleWeek: 1,
      })
      const w4 = prepareSessionForRender({
        session: raw,
        trainingLevel: 'performance',
        equipment: ['pullup_bar', 'bands'],
        lang: 'fr',
        mesocycleWeek: 4,
      })

      const nordicRx = (s: typeof w1) =>
        s.blocks
          .flatMap((b) => b.exercises)
          .find((e) => /nordic|nordique/i.test(e.name))?.prescription

      expect(nordicRx(w1)).toBe(NORDIC_PROGRESSION_BY_MESO_WEEK[1])
      expect(nordicRx(w4)).toBe(NORDIC_PROGRESSION_BY_MESO_WEEK[4])

      const note = w1.blocks
        .flatMap((b) => b.coachingNotes ?? [])
        .find((n) => n.includes('NHE progressif'))
      expect(note).toMatch(/semaine 1\/4/)
    })

    it('Upper Force-Pont : pas de note NHE progressif (hors scope)', () => {
      const raw = MOTHER_SESSIONS_BY_ID.UPPER_OFFSEASON_FORCE_BRIDGE_V1
      const after = prepareSessionForRender({
        session: raw,
        trainingLevel: 'performance',
        equipment: ['barbell', 'rack', 'bench'],
        lang: 'fr',
        mesocycleWeek: 3,
      })
      const notes = after.blocks.flatMap((b) => b.coachingNotes ?? [])
      expect(notes.some((n) => n.includes('NHE progressif'))).toBe(false)
    })
  })

  describe('Weakley — feedback vs dernière + insight', () => {
    it('toast vs previous a le bon kind et titre FR', () => {
      const toast = buildVsPreviousToastData({
        exerciseId: 'bench_press',
        lang: 'fr',
        setLabel: '85 kg × 5',
        delta: '+2.5 kg',
      })
      expect(toast.kind).toBe('progress')
      expect(toast.title).toBe('Vs dernière séance')
      expect(toast.setLabel).toBe('85 kg × 5')
      expect(toast.delta).toBe('+2.5 kg')
    })

    it('PR toast reste prioritaire (kind personal/session, pas progress)', () => {
      const pr: DetectedPR = {
        exerciseId: 'bench_press',
        label: '100 kg × 3',
        improvement: '+5 kg',
        metricType: 'load_reps',
      }
      const toast = buildLivePRToastData(pr, 'fr', { beatsPriorSessions: true })
      expect(toast.kind).toBe('personal')
      expect(toast.title).toMatch(/Record/i)
    })

    it('insight fin de séance : beat previous sans PR', () => {
      const insight = selectSessionInsight({
        rpe: 7,
        completedRatio: 1,
        prs: [],
        beatPreviousSession: true,
      })
      expect(insight?.tone).toBe('success')
      expect(insight?.message).toMatch(/dernière séance/i)
    })

    it('insight : PR gagne sur beat previous', () => {
      const insight = selectSessionInsight({
        rpe: 7,
        completedRatio: 1,
        prs: [{ exerciseId: 'bench_press', previousBest: 80, newBest: 85 }],
        beatPreviousSession: true,
      })
      expect(insight?.message).toMatch(/record/i)
    })
  })
})
