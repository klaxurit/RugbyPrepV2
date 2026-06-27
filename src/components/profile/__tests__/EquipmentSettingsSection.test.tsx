// @vitest-environment jsdom

import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, screen, fireEvent, render } from '@testing-library/react'
import { EquipmentSettingsSection } from '../EquipmentSettingsSection'
import { GYM_PRESET } from '../../../services/equipment/equipmentPresets'

const updateProfileMock = vi.fn()

function renderSection(equipment: string[] = []) {
  return render(
    <EquipmentSettingsSection
      profile={{
        level: 'intermediate',
        equipment: equipment as never,
        injuries: [],
        weeklySessions: 2,
      }}
      updateProfile={updateProfileMock}
      lang="fr"
    />,
  )
}

describe('EquipmentSettingsSection', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('affiche le hint de continuité programme', () => {
    renderSection()
    expect(screen.getByTestId('profile-equipment-hint')).toHaveTextContent(/même semaine/i)
  })

  it('coche la barre de traction et met à jour le profil', () => {
    renderSection([])
    fireEvent.click(screen.getByTestId('profile-equipment-check-pullup_bar'))
    expect(updateProfileMock).toHaveBeenCalledWith({ equipment: ['pullup_bar'] })
  })

  it('cage à squat ajoute barre + rack', () => {
    renderSection(['band'])
    fireEvent.click(screen.getByTestId('profile-equipment-check-squat_rack'))
    expect(updateProfileMock).toHaveBeenCalledWith({
      equipment: ['band', 'barbell', 'squat_rack'],
    })
  })

  it('restaure le preset salle complète', () => {
    renderSection(['pullup_bar'])
    fireEvent.click(screen.getByTestId('profile-equipment-full_gym'))
    expect(updateProfileMock).toHaveBeenCalledWith({ equipment: GYM_PRESET })
  })
})
