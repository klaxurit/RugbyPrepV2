import { Link } from 'react-router-dom'
import { Building2, Ruler, UserRound } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { useHintVisibility } from '../../hooks/useHintVisibility'
import { tr, type Lang } from '../../i18n/appLabels'
import {
  resolveCompleteProfileKind,
  type CompleteProfileKind,
} from '../../services/profile/completeProfilePrompts'

const HINT_IDS: Record<CompleteProfileKind, string> = {
  club: 'complete_profile_club',
  morpho: 'complete_profile_morpho',
  gender: 'complete_profile_gender',
}

export function CompleteProfileCards() {
  const { profile, updateProfile } = useProfile()
  const lang: Lang = profile.preferredLanguage === 'en' ? 'en' : 'fr'

  const clubHint = useHintVisibility(HINT_IDS.club, { cooldownDays: 21 })
  const morphoHint = useHintVisibility(HINT_IDS.morpho, { cooldownDays: 21 })
  const genderHint = useHintVisibility(HINT_IDS.gender, { cooldownDays: 21 })

  const kind = resolveCompleteProfileKind({
    clubCode: profile.clubCode,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    populationSegment: profile.populationSegment,
    dismissed: {
      club: !clubHint.visible,
      morpho: !morphoHint.visible,
      gender: !genderHint.visible,
    },
  })

  if (!kind) return null

  if (kind === 'gender') {
    return (
      <section
        data-testid="complete-profile-card"
        className="rounded-[24px] border border-border-app bg-layer-5 p-5 space-y-3"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
            <UserRound className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-fg">{tr('complete_profile_gender_title', lang)}</p>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              {tr('complete_profile_gender_body', lang)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="h-11 rounded-full bg-brand text-xs font-black text-on-brand rf-focus-ring"
            onClick={() => {
              updateProfile({ populationSegment: 'male_senior', ageBand: 'adult' })
              genderHint.dismiss()
            }}
          >
            {tr('complete_profile_gender_male', lang)}
          </button>
          <button
            type="button"
            className="h-11 rounded-full border border-border-app text-xs font-bold text-fg rf-focus-ring"
            onClick={() => {
              updateProfile({ populationSegment: 'female_senior', ageBand: 'adult' })
              genderHint.dismiss()
            }}
          >
            {tr('complete_profile_gender_female', lang)}
          </button>
        </div>
        <button
          type="button"
          className="w-full text-center text-[11px] font-bold text-fg-faint rf-focus-ring"
          onClick={() => genderHint.dismiss()}
        >
          {tr('complete_profile_later', lang)}
        </button>
      </section>
    )
  }

  const isClub = kind === 'club'
  const href = isClub ? '/profile#club' : '/profile#morpho'
  const Icon = isClub ? Building2 : Ruler

  return (
    <section
      data-testid="complete-profile-card"
      className="rounded-[24px] border border-border-app bg-layer-5 p-5 space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-fg">
            {tr(isClub ? 'complete_profile_club_title' : 'complete_profile_morpho_title', lang)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
            {tr(isClub ? 'complete_profile_club_body' : 'complete_profile_morpho_body', lang)}
          </p>
        </div>
      </div>
      <Link
        to={href}
        className="flex h-11 w-full items-center justify-center rounded-full bg-brand text-xs font-black text-on-brand rf-focus-ring"
      >
        {tr(isClub ? 'complete_profile_club_cta' : 'complete_profile_morpho_cta', lang)}
      </Link>
      <button
        type="button"
        className="w-full text-center text-[11px] font-bold text-fg-faint rf-focus-ring"
        onClick={() => (isClub ? clubHint : morphoHint).dismiss()}
      >
        {tr('complete_profile_later', lang)}
      </button>
    </section>
  )
}
