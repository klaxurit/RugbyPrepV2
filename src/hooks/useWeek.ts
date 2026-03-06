import { useContext } from 'react'
import { WeekContext } from '../contexts/WeekContext'

export const useWeek = () => {
  const ctx = useContext(WeekContext)
  if (!ctx) {
    throw new Error('useWeek must be used within WeekProvider')
  }
  return ctx
}
