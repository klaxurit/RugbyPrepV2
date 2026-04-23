import { useCallback, useEffect, useState } from 'react'
import type { FatigueStatus } from '../types/training'
import { useAuth } from './useAuth'
import { userScopedKey } from '../services/storage/userScopedStorage'

export type FatigueState = FatigueStatus

const STORAGE_BASE = 'rugbyprep.fatigue'
const DEFAULT_FATIGUE: FatigueState = 'OK'

const isFatigueState = (value: unknown): value is FatigueState =>
  value === 'OK' || value === 'FATIGUE'

const readFatigue = (userId: string | null): FatigueState => {
  if (typeof window === 'undefined') return DEFAULT_FATIGUE
  try {
    const raw = window.localStorage.getItem(userScopedKey(STORAGE_BASE, userId))
    return isFatigueState(raw) ? raw : DEFAULT_FATIGUE
  } catch {
    return DEFAULT_FATIGUE
  }
}

export const useFatigue = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [fatigue, setFatigueState] = useState<FatigueState>(() => readFatigue(userId))

  // Re-seed when userId changes (new user shouldn't inherit previous fatigue state).
  useEffect(() => {
    setFatigueState(readFatigue(userId))
  }, [userId])

  useEffect(() => {
    try {
      window.localStorage.setItem(userScopedKey(STORAGE_BASE, userId), fatigue)
    } catch { /* ignore */ }
  }, [fatigue, userId])

  const setFatigue = useCallback((next: FatigueState) => {
    setFatigueState(next)
  }, [])

  return { fatigue, setFatigue }
}
