import type { ReactNode } from 'react'
import { Footprints, Bike, Waves, Leaf } from 'lucide-react'

export interface ActiveRecoveryActivity {
  id: string
  label: string
  shortLabel: string
  duration: string
  durationMin: number
  icon: ReactNode
}

export const ACTIVE_RECOVERY_ACTIVITIES: ActiveRecoveryActivity[] = [
  { id: 'walk', shortLabel: 'Marche', label: 'Marche', duration: '20-30\'', durationMin: 25, icon: <Footprints className="w-3 h-3" /> },
  { id: 'bike', shortLabel: 'Vélo', label: 'Vélo léger', duration: '15-20\'', durationMin: 17, icon: <Bike className="w-3 h-3" /> },
  { id: 'mobility', shortLabel: 'Mobilité', label: 'Mobilité / Yoga', duration: '15-20\'', durationMin: 17, icon: <Leaf className="w-3 h-3" /> },
  { id: 'swim', shortLabel: 'Natation', label: 'Natation légère', duration: '20-30\'', durationMin: 25, icon: <Waves className="w-3 h-3" /> },
]
