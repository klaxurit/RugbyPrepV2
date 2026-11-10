import { describe, expect, it } from 'vitest'
import {
  resolveSessionRunClearMoment,
  shouldClearSessionRunAfterSave,
} from '../sessionRunLifecycle'

describe('sessionRunLifecycle', () => {
  it('ne clear pas le store au save (compteurs derrière le share)', () => {
    expect(resolveSessionRunClearMoment()).toBe('on_leave_screen')
    expect(shouldClearSessionRunAfterSave()).toBe(false)
  })

  it('clear autorisé seulement au moment leave_screen', () => {
    expect(shouldClearSessionRunAfterSave('on_leave_screen')).toBe(false)
    expect(shouldClearSessionRunAfterSave('on_save')).toBe(true)
  })
})
