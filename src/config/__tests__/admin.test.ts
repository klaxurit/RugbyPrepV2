import { describe, expect, it } from 'vitest'
import { isAdminEmail, ADMIN_EMAIL_ALLOWLIST } from '../../config/admin'

describe('admin config', () => {
  it('allowlists juncahugo@gmail.com', () => {
    expect(ADMIN_EMAIL_ALLOWLIST).toContain('juncahugo@gmail.com')
    expect(isAdminEmail('juncahugo@gmail.com')).toBe(true)
    expect(isAdminEmail('JuncaHugo@gmail.com')).toBe(true)
  })

  it('rejects other emails', () => {
    expect(isAdminEmail('other@example.com')).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
  })
})
