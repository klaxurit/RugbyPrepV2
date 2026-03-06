import { useCallback, useEffect, useState } from 'react'
import type { PhysicalTest, PhysicalTestType } from '../types/athleticTesting'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { DEMO_MODE_KEY } from '../data/fakeDataForProgress'

const STORAGE_KEY = 'rugbyprep.athletictests.v1'

// ─── localStorage helpers ────────────────────────────────────────────────────

const readFromStorage = (): PhysicalTest[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as PhysicalTest[]) : []
  } catch {
    return []
  }
}

const saveToStorage = (tests: PhysicalTest[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tests))
  } catch { /* ignore */ }
}

const sortNewestFirst = (tests: PhysicalTest[]) =>
  [...tests].sort((a, b) => b.dateISO.localeCompare(a.dateISO))

// ─── Row ↔ PhysicalTest mapping ─────────────────────────────────────────────

type AthleteTestRow = {
  id: string
  date_iso: string
  type: string
  value: number
  estimated_from: { loadKg: number; reps: number; formula: 'brzycki' | 'epley' } | null
  notes: string | null
}

const rowToTest = (row: AthleteTestRow): PhysicalTest => ({
  id: row.id,
  dateISO: row.date_iso,
  type: row.type as PhysicalTestType,
  value: row.value,
  estimatedFrom: row.estimated_from ?? undefined,
  notes: row.notes ?? undefined,
})

const testToRow = (test: PhysicalTest, userId: string) => ({
  id: test.id,
  user_id: userId,
  date_iso: test.dateISO,
  type: test.type,
  value: test.value,
  estimated_from: test.estimatedFrom ?? null,
  notes: test.notes ?? null,
})

// ─── Higher vs lower is better ──────────────────────────────────────────────

const LOWER_IS_BETTER: PhysicalTestType[] = ['sprint_10m', 'hooper']

function isBetter(type: PhysicalTestType, a: number, b: number): boolean {
  return LOWER_IS_BETTER.includes(type) ? a < b : a > b
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useAthleteTests = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [tests, setTests] = useState<PhysicalTest[]>(readFromStorage)

  // Sync from Supabase on auth (skip if demo mode — keep localStorage data)
  useEffect(() => {
    if (!userId) return
    if (typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_KEY) === '1') return
    supabase
      .from('athletic_tests')
      .select('id, date_iso, type, value, estimated_from, notes')
      .order('date_iso', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return
        const loaded = sortNewestFirst((data as AthleteTestRow[]).map(rowToTest))
        setTests(loaded)
        saveToStorage(loaded)
      })
  }, [userId])

  const addTest = useCallback(
    async (test: Omit<PhysicalTest, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const next: PhysicalTest = { ...test, id }
      const demoMode = typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_KEY) === '1'

      if (userId && !demoMode) {
        const { data, error } = await supabase
          .from('athletic_tests')
          .insert(testToRow(next, userId))
          .select('id, date_iso, type, value, estimated_from, notes')
          .single()
        if (!error && data) {
          const saved = rowToTest(data as AthleteTestRow)
          setTests((current) => {
            const updated = sortNewestFirst([saved, ...current])
            saveToStorage(updated)
            return updated
          })
          return
        }
      }

      // Offline fallback
      setTests((current) => {
        const updated = sortNewestFirst([next, ...current])
        saveToStorage(updated)
        return updated
      })
    },
    [userId]
  )

  const deleteTest = useCallback(
    async (id: string) => {
      const demoMode = typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_KEY) === '1'
      if (userId && !demoMode) {
        await supabase.from('athletic_tests').delete().eq('id', id)
      }
      setTests((current) => {
        const updated = current.filter((t) => t.id !== id)
        saveToStorage(updated)
        return updated
      })
    },
    [userId]
  )

  const getHistoryFor = useCallback(
    (type: PhysicalTestType, n = 8): PhysicalTest[] =>
      tests.filter((t) => t.type === type).slice(0, n),
    [tests]
  )

  const getBestFor = useCallback(
    (type: PhysicalTestType): number | null => {
      const typed = tests.filter((t) => t.type === type)
      if (typed.length === 0) return null
      return typed.reduce<number>((best, t) =>
        isBetter(type, t.value, best) ? t.value : best,
        typed[0].value
      )
    },
    [tests]
  )

  return {
    tests,
    addTest,
    deleteTest,
    getHistoryFor,
    getBestFor,
  }
}
