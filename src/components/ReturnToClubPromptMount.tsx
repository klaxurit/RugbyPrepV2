import { ReturnToClubPromptSheet } from './planning/ReturnToClubPromptSheet'
import { useReturnToClubPrompt } from '../hooks/useReturnToClubPrompt'
import { useOverlayPermission } from '../hooks/useOverlayPermission'

/**
 * Pop-up hebdomadaire (tant que pas de date de reprise) pendant l'inter-saison.
 * Montée globalement dans App.tsx — après onboarding, une fois par semaine max.
 * Gate : priorité 70 — cède à password / cookies / program evolution.
 */
export function ReturnToClubPromptMount() {
  const {
    open: naturalOpen,
    lang,
    today,
    needsClub,
    initialClubName,
    initialClubCode,
    saving,
    save,
    remindLater,
  } = useReturnToClubPrompt()

  const open = useOverlayPermission('return_to_club', naturalOpen)

  if (!open) return null

  return (
    <ReturnToClubPromptSheet
      open={open}
      lang={lang}
      today={today}
      needsClub={needsClub}
      initialClubName={initialClubName}
      initialClubCode={initialClubCode}
      isSaving={saving}
      onSave={save}
      onLater={remindLater}
    />
  )
}
