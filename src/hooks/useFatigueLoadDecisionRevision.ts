import { useEffect, useState } from 'react'
import { FATIGUE_LOAD_DECISION_UPDATED_EVENT } from '../services/program/fatigueLoadChoice'

/** Bump quand le joueur applique / annule un choix ACWR — invalide les surfaces memoïsées. */
export function useFatigueLoadDecisionRevision(): number {
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const bump = () => setRevision((n) => n + 1)
    window.addEventListener(FATIGUE_LOAD_DECISION_UPDATED_EVENT, bump)
    return () => window.removeEventListener(FATIGUE_LOAD_DECISION_UPDATED_EVENT, bump)
  }, [])

  return revision
}
