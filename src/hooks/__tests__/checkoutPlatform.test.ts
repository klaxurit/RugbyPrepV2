import { describe, expect, it } from 'vitest'
import {
  isAndroidUserAgent,
  shouldBlockStandaloneWithoutPlayBilling,
} from '../checkoutPlatform'

describe('isAndroidUserAgent', () => {
  it('détecte Android', () => {
    expect(isAndroidUserAgent('Mozilla/5.0 (Linux; Android 14)')).toBe(true)
  })

  it('ignore iPhone / desktop', () => {
    expect(isAndroidUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe(false)
    expect(isAndroidUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe(false)
  })
})

describe('shouldBlockStandaloneWithoutPlayBilling', () => {
  it('laisse passer Safari / web non-standalone', () => {
    expect(
      shouldBlockStandaloneWithoutPlayBilling({
        standalone: false,
        playBillingAvailable: false,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      }),
    ).toBe(false)
  })

  it('laisse passer iOS PWA standalone → Stripe', () => {
    expect(
      shouldBlockStandaloneWithoutPlayBilling({
        standalone: true,
        playBillingAvailable: false,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15',
      }),
    ).toBe(false)
  })

  it('bloque Android standalone sans Play Billing', () => {
    expect(
      shouldBlockStandaloneWithoutPlayBilling({
        standalone: true,
        playBillingAvailable: false,
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel)',
      }),
    ).toBe(true)
  })

  it('ne bloque pas si Play Billing est dispo', () => {
    expect(
      shouldBlockStandaloneWithoutPlayBilling({
        standalone: true,
        playBillingAvailable: true,
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel)',
      }),
    ).toBe(false)
  })
})
