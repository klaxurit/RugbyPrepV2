// @vitest-environment jsdom

import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, render, within, fireEvent } from '@testing-library/react'
import { PlanningContextBanner } from '../PlanningContextBanner'
import {
  isPlanningContextBannerDuplicateOfSummary,
  planningContextBannerCopyForMode,
  resolvePlanningContextBannerModel,
} from '../planningContextBannerModel'
import type { WeeklyProgramSurfaceResult } from '../../../services/program/resolveWeeklyProgramSurface'
import type { WeekExplanation } from '../../../types/scheduling'

afterEach(() => {
  cleanup()
})

describe('PlanningContextBanner', () => {
  it('info tone renders titre, corps et région accessible', () => {
    const { container } = render(
      <PlanningContextBanner tone="info" title="Vue calendrier" data-testid="pcb">
        Les séances et matchs sont positionnés sur les jours de la semaine.
      </PlanningContextBanner>,
    )
    const region = within(container).getByRole('region', { name: 'Vue calendrier' })
    expect(region).toBeInTheDocument()
    expect(region).toHaveAttribute('data-testid', 'pcb')
    expect(region.textContent).toContain('Les séances et matchs')
    expect(region.className).toMatch(/bg-info-bg/)
    expect(region.className).toMatch(/border-info-bd/)
  })

  it('warning tone applique les tokens warn de l’app', () => {
    const { container } = render(
      <PlanningContextBanner tone="warning" title="Attention">
        Message court
      </PlanningContextBanner>,
    )
    const region = within(container).getByRole('region', { name: 'Attention' })
    expect(region.className).toMatch(/bg-warn-bg-muted/)
    expect(region.className).toMatch(/border-warn-bd/)
  })

  it('CTA lien optionnel', () => {
    const { container } = render(
      <PlanningContextBanner title="T" learnMoreLabel="Aide" learnMoreHref="/help">
        Corps
      </PlanningContextBanner>,
    )
    const link = within(container).getByRole('link', { name: 'Aide' })
    expect(link).toHaveAttribute('href', '/help')
  })

  it('CTA bouton optionnel appelle onLearnMore', () => {
    const onLearnMore = vi.fn()
    const { container } = render(
      <PlanningContextBanner learnMoreLabel="Pourquoi ?" onLearnMore={onLearnMore} aria-label="Bandeau">
        Corps
      </PlanningContextBanner>,
    )
    fireEvent.click(within(container).getByRole('button', { name: 'Pourquoi ?' }))
    expect(onLearnMore).toHaveBeenCalledTimes(1)
  })

  it('sans titre, aria-label du planificateur', () => {
    const { container } = render(
      <PlanningContextBanner aria-label="Contexte de planification">Texte</PlanningContextBanner>,
    )
    expect(within(container).getByRole('region', { name: 'Contexte de planification' })).toBeInTheDocument()
  })
})

describe('planningContextBannerCopyForMode', () => {
  it('calendar vs sequential', () => {
    const cal = planningContextBannerCopyForMode('calendar')
    expect(cal.title).toBe('Vue calendrier')
    expect(cal.body.length).toBeGreaterThan(10)
    const seq = planningContextBannerCopyForMode('sequential')
    expect(seq.title).toBe('Vue programme')
    expect(seq.body).not.toBe(cal.body)
  })
})

describe('isPlanningContextBannerDuplicateOfSummary', () => {
  it('détecte égalité après trim', () => {
    expect(isPlanningContextBannerDuplicateOfSummary('  a  ', 'a')).toBe(true)
    expect(isPlanningContextBannerDuplicateOfSummary('a', 'b')).toBe(false)
  })
})

describe('resolvePlanningContextBannerModel', () => {
  const surfaceCal = { schedulingMode: 'calendar' } as WeeklyProgramSurfaceResult
  const expl = (summary: string): WeekExplanation => ({
    summaryLine: summary,
    detailLines: [],
    corrections: [],
  })

  it('retourne null sans surface ou sans explanation', () => {
    expect(resolvePlanningContextBannerModel({ surface: null, explanation: expl('x') })).toBeNull()
    expect(resolvePlanningContextBannerModel({ surface: surfaceCal, explanation: null })).toBeNull()
  })

  it('retourne null si transition prioritaire', () => {
    expect(
      resolvePlanningContextBannerModel({
        surface: surfaceCal,
        explanation: expl('Résumé'),
        suppressForTransitionBanner: true,
      }),
    ).toBeNull()
  })

  it('retourne null si doublon summary / corps', () => {
    const { body } = planningContextBannerCopyForMode('calendar')
    expect(
      resolvePlanningContextBannerModel({
        surface: surfaceCal,
        explanation: expl(body),
      }),
    ).toBeNull()
  })

  it('retourne titre + corps sinon', () => {
    const m = resolvePlanningContextBannerModel({
      surface: surfaceCal,
      explanation: expl('Résumé distinct'),
    })
    expect(m?.title).toBe('Vue calendrier')
    expect(m?.body).toBe(planningContextBannerCopyForMode('calendar').body)
  })
})
