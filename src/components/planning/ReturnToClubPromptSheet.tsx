import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { ClubSearchInput } from '../match/ClubSearchInput'
import { tr, type Lang } from '../../i18n/appLabels'
import { isValidPlanningIsoDate } from '../../services/dates/localIsoDate'

interface ReturnToClubPromptSheetProps {
  open: boolean
  lang: Lang
  today: string
  needsClub: boolean
  initialClubName?: string
  initialClubCode?: string
  isSaving?: boolean
  onSave: (payload: { returnDate: string; clubName?: string; clubCode?: string }) => void
  onLater: () => void
}

interface ReturnToClubPromptFormProps {
  lang: Lang
  today: string
  needsClub: boolean
  initialClubName: string
  initialClubCode?: string
  isSaving: boolean
  onSave: (payload: { returnDate: string; clubName?: string; clubCode?: string }) => void
  onLater: () => void
}

function ReturnToClubPromptForm({
  lang,
  today,
  needsClub,
  initialClubName,
  initialClubCode,
  isSaving,
  onSave,
  onLater,
}: ReturnToClubPromptFormProps) {
  const [returnDate, setReturnDate] = useState('')
  const [clubName, setClubName] = useState(initialClubName)
  const [clubCode, setClubCode] = useState<string | undefined>(initialClubCode)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    if (!returnDate || !isValidPlanningIsoDate(returnDate)) {
      setError(tr('return_club_prompt_date_required', lang))
      return
    }
    setError(null)
    onSave({
      returnDate,
      ...(needsClub && clubCode ? { clubName, clubCode } : {}),
    })
  }

  return (
    <div className="space-y-5 pb-2">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
          <CalendarDays className="h-8 w-8" strokeWidth={2.2} />
        </div>
      </div>

      <p className="text-center text-sm leading-relaxed text-fg-muted [text-wrap:balance]">
        {tr('return_club_prompt_body', lang)}
      </p>

      <div className="space-y-1.5">
        <label htmlFor="return-club-date" className="text-[10px] font-black uppercase tracking-[0.12em] text-fg-faint">
          {tr('return_club_prompt_date_label', lang)}
        </label>
        <input
          id="return-club-date"
          data-testid="return-club-date-input"
          type="date"
          min={today}
          value={returnDate}
          onChange={(e) => {
            setReturnDate(e.target.value)
            setError(null)
          }}
          style={{ colorScheme: 'dark' }}
          className="w-full py-3 px-4 rounded-2xl text-sm font-bold bg-layer-5 text-fg-soft border border-border-app hover:border-brand/30 transition-all [&::-webkit-calendar-picker-indicator]:brightness-[0.7] [&::-webkit-calendar-picker-indicator]:invert"
        />
      </div>

      {needsClub && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-fg-faint">
            {tr('return_club_prompt_club_label', lang)}
          </p>
          <p className="text-[11px] text-fg-muted leading-relaxed">
            {tr('return_club_prompt_club_hint', lang)}
          </p>
          <ClubSearchInput
            value={clubName}
            clubCode={clubCode}
            placeholder={tr('return_club_prompt_club_placeholder', lang)}
            onChange={(name, code) => {
              setClubName(name)
              setClubCode(code)
            }}
          />
        </div>
      )}

      {error && (
        <p className="text-xs font-bold text-critical text-center" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-2.5">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          data-testid="return-club-prompt-save"
          className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-black text-on-brand shadow-brand-float transition-colors hover:bg-brand-hover disabled:opacity-60 rf-focus-ring"
        >
          {tr('return_club_prompt_save', lang)}
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={onLater}
          data-testid="return-club-prompt-later"
          className="flex h-11 w-full items-center justify-center rounded-full border border-border-app text-sm font-bold text-fg-muted transition-colors hover:border-brand/30 hover:text-fg rf-focus-ring"
        >
          {tr('return_club_prompt_later', lang)}
        </button>
      </div>
    </div>
  )
}

export function ReturnToClubPromptSheet({
  open,
  lang,
  today,
  needsClub,
  initialClubName = '',
  initialClubCode,
  isSaving = false,
  onSave,
  onLater,
}: ReturnToClubPromptSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onLater}
      ariaLabel={tr('return_club_prompt_aria', lang)}
      eyebrow={tr('return_club_prompt_eyebrow', lang)}
      title={tr('return_club_prompt_title', lang)}
      disableBackdropDismiss
      disableSwipeDismiss
      showClose={false}
    >
      <ReturnToClubPromptForm
        key={`${initialClubName}-${initialClubCode ?? ''}`}
        lang={lang}
        today={today}
        needsClub={needsClub}
        initialClubName={initialClubName}
        initialClubCode={initialClubCode}
        isSaving={isSaving}
        onSave={onSave}
        onLater={onLater}
      />
    </BottomSheet>
  )
}
