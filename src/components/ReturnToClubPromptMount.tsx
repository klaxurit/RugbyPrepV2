import { ReturnToClubPromptSheet } from './planning/ReturnToClubPromptSheet'
import { useReturnToClubPrompt } from '../hooks/useReturnToClubPrompt'

/**
 * Pop-up hebdomadaire (tant que pas de date de reprise) pendant l'inter-saison.
 * Montée globalement dans App.tsx — après onboarding, une fois par semaine max.
 */
export function ReturnToClubPromptMount() {
  const {
    open,
    lang,
    today,
    needsClub,
    initialClubName,
    initialClubCode,
    saving,
    save,
    remindLater,
  } = useReturnToClubPrompt()

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
