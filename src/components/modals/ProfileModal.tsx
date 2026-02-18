import { Modal } from '../Modal'
import type { RugbyPosition, UserProfile } from '../../types/training'

const POSITION_LABELS: Record<RugbyPosition, string> = {
  FRONT_ROW: 'Premiere ligne',
  SECOND_ROW: 'Deuxieme ligne',
  BACK_ROW: 'Troisieme ligne',
  HALF_BACKS: 'Demi(s) (9/10)',
  CENTERS: 'Centres',
  BACK_THREE: 'Ailiers / Arriere'
}

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile
}

export function ProfileModal({ isOpen, onClose, profile }: ProfileModalProps) {
  return (
    <Modal title="Profil actif" isOpen={isOpen} onClose={onClose}>
      <p>
        <strong>Niveau:</strong> {profile.level}
      </p>
      {profile.rugbyPosition && (
        <p>
          <strong>Poste:</strong> {POSITION_LABELS[profile.rugbyPosition]}
        </p>
      )}
      {profile.leagueLevel && (
        <p>
          <strong>Championnat:</strong> {profile.leagueLevel}
        </p>
      )}
      <p>
        <strong>Séances / semaine:</strong> {profile.weeklySessions}
      </p>
      <p>
        <strong>Équipements:</strong> {profile.equipment.length}
      </p>
      <p className="helper-text">{profile.equipment.join(', ') || 'Aucun'}</p>
      <p>
        <strong>Blessures:</strong> {profile.injuries.length}
      </p>
      <p className="helper-text">{profile.injuries.join(', ') || 'Aucune'}</p>
    </Modal>
  )
}
