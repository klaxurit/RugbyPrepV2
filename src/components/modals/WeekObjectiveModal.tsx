import { Modal } from '../Modal'
import type { WeekGuidance } from '../../data/weekGuidance.v1'
import type { CycleWeek } from '../../types/training'

interface WeekObjectiveModalProps {
  isOpen: boolean
  onClose: () => void
  week: CycleWeek
  guidance: WeekGuidance
}

export function WeekObjectiveModal({
  isOpen,
  onClose,
  week,
  guidance
}: WeekObjectiveModalProps) {
  return (
    <Modal title={`Objectif — Semaine ${week}`} isOpen={isOpen} onClose={onClose}>
      <p>
        <strong>{guidance.title}</strong> — {guidance.focus}
      </p>
      <p>{guidance.intensityCue}</p>
      <ul>
        {guidance.keyRules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </Modal>
  )
}
