// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { render, within } from '@testing-library/react'
import { WeekPlanningLegend } from '../WeekPlanningLegend'

describe('WeekPlanningLegend', () => {
  it('renders four entries with text labels (not color-only)', () => {
    const { container } = render(<WeekPlanningLegend />)
    const text = container.textContent ?? ''
    expect(text).toMatch(/Gym/)
    expect(text).toMatch(/Club/)
    expect(text).toMatch(/Match/)
    expect(text).toMatch(/Récup/)
  })

  it('uses a compact region with default aria-label', () => {
    const { container } = render(<WeekPlanningLegend />)
    expect(
      within(container).getByRole('region', { name: 'Légende des types de séance' }),
    ).toBeInTheDocument()
  })

  it('lists one marker per kind', () => {
    const { container } = render(<WeekPlanningLegend />)
    expect(container.querySelector('[data-session-kind="personal"]')).toBeInTheDocument()
    expect(container.querySelector('[data-session-kind="club"]')).toBeInTheDocument()
    expect(container.querySelector('[data-session-kind="match"]')).toBeInTheDocument()
    expect(container.querySelector('[data-session-kind="recovery"]')).toBeInTheDocument()
  })

  it('aligne marqueur et libellé sur une ligne (flex + leading-none)', () => {
    const { container } = render(<WeekPlanningLegend />)
    const items = container.querySelectorAll('li')
    expect(items.length).toBe(4)
    items.forEach((li) => {
      expect(li.className).toMatch(/items-center/)
      expect(li.className).toMatch(/gap-1\.5/)
    })
    const labels = container.querySelectorAll('li > span:last-child')
    labels.forEach((el) => {
      expect(el.className).toMatch(/leading-none/)
    })
  })

  it('allows custom aria-label', () => {
    const { container } = render(<WeekPlanningLegend aria-label="Types de la semaine" />)
    expect(within(container).getByRole('region', { name: 'Types de la semaine' })).toBeInTheDocument()
  })
})
