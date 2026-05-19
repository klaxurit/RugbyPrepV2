import { BottomSheet } from '../ui/BottomSheet'
import { MatchKindPicker } from './MatchKindPicker'
import type { MatchKind } from '../../types/training'

export interface MatchKindFollowUpSheetProps {
  open: boolean
  lang: 'fr' | 'en'
  matchDateISO?: string
  opponent?: string
  onSelect: (kind: MatchKind) => void
}

const COPY: Record<'fr' | 'en', { title: string; subtitle: string }> = {
  fr: {
    title: 'Type de match',
    subtitle: 'Pour ajuster ton programme et les suggestions.',
  },
  en: {
    title: 'Match type',
    subtitle: 'So we can tune your programme and prompts.',
  },
}

export function MatchKindFollowUpSheet({
  open,
  lang,
  matchDateISO,
  opponent,
  onSelect,
}: MatchKindFollowUpSheetProps) {
  const c = COPY[lang]
  const detail =
    opponent && matchDateISO
      ? `${opponent} · ${matchDateISO}`
      : opponent ?? matchDateISO ?? ''

  return (
    <BottomSheet
      open={open}
      onClose={() => {}}
      ariaLabel={c.title}
      eyebrow={lang === 'fr' ? 'Calendrier' : 'Calendar'}
      title={c.title}
      showClose={false}
      disableSwipeDismiss
      disableBackdropDismiss
    >
      <div className="px-5 pb-4 space-y-4">
        <p className="text-sm text-fg-muted">{c.subtitle}</p>
        {detail ? <p className="text-xs font-semibold text-fg">{detail}</p> : null}
        <MatchKindPicker lang={lang} onSelect={onSelect} testIdPrefix="followup-match-kind" />
      </div>
    </BottomSheet>
  )
}
