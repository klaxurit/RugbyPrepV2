import { useCallback, useEffect, useState } from 'react'
import type { PhysicalTest, PhysicalTestType } from '../types/athleticTesting'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { readUserScoped, writeUserScoped } from '../services/storage/userScopedStorage'

const STORAGE_BASE = 'rugbyprep.athletictests'

// ─── localStorage helpers (user-scoped) ──────────────────────────────────────

const readFromStorage = (userId: string | null): PhysicalTest[] => {
  if (typeof window === 'undefined') return []
  const parsed = readUserScoped<PhysicalTest[]>(STORAGE_BASE, userId)
  return Array.isArray(parsed) ? parsed : []
}

const saveToStorage = (tests: PhysicalTest[], userId: string | null) => {
  writeUserScoped(STORAGE_BASE, userId, tests)
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

  const [tests, setTests] = useState<PhysicalTest[]>(() => readFromStorage(userId))

  // Sync from Supabase on auth. Re-seed from active user's cache on userId change
  // so previous user's data never flashes on login / signup.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- required: userId change must reset cache
    setTests(readFromStorage(userId))
    if (!userId) return
    supabase
      .from('athletic_tests')
      .select('id, date_iso, type, value, estimated_from, notes')
      .eq('user_id', userId)
      .order('date_iso', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return
        const loaded = sortNewestFirst((data as AthleteTestRow[]).map(rowToTest))
        setTests(loaded)
        saveToStorage(loaded, userId)
      })
  }, [userId])

  const addTest = useCallback(
    async (test: Omit<PhysicalTest, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const next: PhysicalTest = { ...test, id }
      if (userId) {
        const { data, error } = await supabase
          .from('athletic_tests')
          .insert(testToRow(next, userId))
          .select('id, date_iso, type, value, estimated_from, notes')
          .single()
        if (!error && data) {
          const saved = rowToTest(data as AthleteTestRow)
          setTests((current) => {
            const updated = sortNewestFirst([saved, ...current])
            saveToStorage(updated, userId)
            return updated
          })
          return
        }
      }

      // Offline fallback
      setTests((current) => {
        const updated = sortNewestFirst([next, ...current])
        saveToStorage(updated, userId)
        return updated
      })
    },
    [userId]
  )

  const deleteTest = useCallback(
    async (id: string) => {
      if (userId) {
        await supabase.from('athletic_tests').delete().eq('id', id)
      }
      setTests((current) => {
        const updated = current.filter((t) => t.id !== id)
        saveToStorage(updated, userId)
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
