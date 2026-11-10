import { useEffect, useState } from 'react'
import { VOLUME_CONFIDENCE_UPDATED_EVENT } from '../services/program/volumeConfidenceBypass'

/** Bump quand le joueur active / annule le bypass volume — invalide surfaces + snapshot. */
export function useVolumeConfidenceRevision(): number {
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const bump = () => setRevision((n) => n + 1)
    window.addEventListener(VOLUME_CONFIDENCE_UPDATED_EVENT, bump)
    return () => window.removeEventListener(VOLUME_CONFIDENCE_UPDATED_EVENT, bump)
  }, [])

  return revision
}
