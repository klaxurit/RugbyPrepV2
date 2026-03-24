import { Navigate } from 'react-router-dom'

/**
 * /program est un alias technique temporaire.
 * Redirige proprement vers /week (la vue hebdomadaire canonique).
 */
export function ProgramPage() {
  return <Navigate to="/week" replace />
}
