import { useContext } from 'react'
import { WeekContext } from '../contexts/weekContext'

export const useWeek = () => {
  const ctx = useContext(WeekContext)
  if (!ctx) {
    throw new Error('useWeek must be used within WeekProvider')
  }
  return ctx
}
