// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { initMetricool, METRICOOL_HASH } from '../metricool'

describe('initMetricool', () => {
  afterEach(() => {
    document.getElementById('metricool-be-tracker')?.remove()
    delete (window as Window & { beTracker?: unknown }).beTracker
  })

  it('injecte le script tracker une seule fois', () => {
    initMetricool()
    initMetricool()
    const scripts = document.querySelectorAll('script[src="https://tracker.metricool.com/resources/be.js"]')
    expect(scripts).toHaveLength(1)
  })

  it('ping le hash Metricool au chargement du script', () => {
    const t = vi.fn()
    ;(window as Window & { beTracker?: { t: typeof t } }).beTracker = { t }

    initMetricool()
    document.getElementById('metricool-be-tracker')?.dispatchEvent(new Event('load'))

    expect(t).toHaveBeenCalledWith({ hash: METRICOOL_HASH })
  })
})
