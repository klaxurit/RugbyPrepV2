// @vitest-environment jsdom

import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, screen, fireEvent, render } from '@testing-library/react'
import { EquipmentSettingsSection } from '../EquipmentSettingsSection'
import { GYM_PRESET } from '../../../services/equipment/equipmentPresets'

const updateProfileMock = vi.fn()

function renderSection(equipment: string[] = GYM_PRESET) {
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

  it('bascule vers poids de corps sans toucher au cycle', () => {
    renderSection(GYM_PRESET)
    fireEvent.click(screen.getByTestId('profile-equipment-bodyweight'))
    expect(updateProfileMock).toHaveBeenCalledWith({ equipment: [] })
  })

  it('restaure le preset salle complète', () => {
    renderSection([])
    fireEvent.click(screen.getByTestId('profile-equipment-full_gym'))
    expect(updateProfileMock).toHaveBeenCalledWith({ equipment: GYM_PRESET })
  })
})
