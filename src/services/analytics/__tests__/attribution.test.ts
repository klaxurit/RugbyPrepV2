/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ATTRIBUTION_STORAGE_KEY,
  attributionAsEventProps,
  captureLandingAttributionOnce,
  getAttribution,
  hasAttributionSignal,
  parseAttributionFromSearch,
} from '../attribution'

describe('attribution', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('parseAttributionFromSearch extracts utm + referrer', () => {
    const attr = parseAttributionFromSearch(
      '?utm_source=tiktok&utm_medium=social&utm_campaign=launch&foo=1',
      'https://t.co/x',
      '/',
    )
    expect(attr.utm_source).toBe('tiktok')
    expect(attr.utm_medium).toBe('social')
    expect(attr.utm_campaign).toBe('launch')
    expect(attr.referrer).toBe('https://t.co/x')
    expect(attr.landing_path).toBe('/')
    expect(hasAttributionSignal(attr)).toBe(true)
  })

  it('captureLandingAttributionOnce keeps first touch', () => {
    const first = captureLandingAttributionOnce({
      search: '?utm_source=instagram',
      referrer: '',
      pathname: '/',
    })
    expect(first.utm_source).toBe('instagram')

    const second = captureLandingAttributionOnce({
      search: '?utm_source=facebook',
      referrer: '',
      pathname: '/',
    })
    expect(second.utm_source).toBe('instagram')
    expect(getAttribution()?.utm_source).toBe('instagram')
    expect(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toContain('instagram')
  })

  it('attributionAsEventProps omits empty keys', () => {
    expect(
      attributionAsEventProps({
        utm_source: 'x',
        referrer: 'https://example.com',
        landing_path: '/',
      }),
    ).toEqual({
      utm_source: 'x',
      referrer: 'https://example.com',
      landing_path: '/',
    })
  })
})
