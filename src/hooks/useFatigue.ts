import { useCallback, useEffect, useState } from 'react'
import type { FatigueStatus } from '../types/training'

export type FatigueState = FatigueStatus

const STORAGE_KEY = 'rugbyprep.fatigue.v1'
const DEFAULT_FATIGUE: FatigueState = 'OK'

const isFatigueState = (value: unknown): value is FatigueState =>
  value === 'OK' || value === 'FATIGUE'

const readFatigue = (): FatigueState => {
  if (typeof window === 'undefined') return DEFAULT_FATIGUE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return isFatigueState(raw) ? raw : DEFAULT_FATIGUE
  } catch {
    return DEFAULT_FATIGUE
  }
}

export const useFatigue = () => {
  const [fatigue, setFatigueState] = useState<FatigueState>(readFatigue)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, fatigue)
  }, [fatigue])

  const setFatigue = useCallback((next: FatigueState) => {
    setFatigueState(next)
  }, [])

  return { fatigue, setFatigue }
}
