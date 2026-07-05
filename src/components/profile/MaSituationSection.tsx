import { useState } from 'react'
import type { AnnualCycle, AnnualPlanningContext } from '../../types/annualPlanning'
import type { CalendarEvent, TransitionEntry, UserProfile } from '../../types/training'
import type { SeasonTransition } from '../../services/season/detectSeasonTransitions'
import { appendTransitionEntry, restoreLastTransition, cycleToSeasonMode } from '../../services/season/transitionJournal'
import { shouldShowProfileSeasonActions } from './shouldShowProfileSeasonActions'
import {
  isTreveInSeasonSubMode,
  shouldShowAutoEndOfSeasonConfirm,
  treveGapWeeks,
} from './profileSituationUi'
import { tr, type Lang } from '../../i18n/appLabels'
import { isValidPlanningIsoDate, parseLocalDateOnly } from '../../services/dates/localIsoDate'

/**
 * Season transition ownership (M2):
 * - Home (`useSeasonTransitions` + `SeasonTransitionBanner`) is the primary surface for
 *   passive lifecycle prompts (fin de saison, trêve, playoffs, etc.).
 * - Profile here is for explicit manual overrides (anchors, reprise, inter-saison) when
 *   detection does not match reality — not a second banner stack.
 */

export type MaSituationData = {
  cycleLabel: string
  nextMatchLabel: string
  lastMatchDate: string | null
  nextMatch: CalendarEvent | null
  detectedCycle: AnnualCycle
  showSkipOffSeasonRecovery: boolean
  planningContext: AnnualPlanningContext | null
}

function formatReturnDateLabel(iso: string, lang: Lang): string | null {
  const d = parseLocalDateOnly(iso)
  if (!d) return null
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
  })
}

type MaSituationSectionProps = {
  situationData: MaSituationData
  profile: UserProfile
  updateProfile: (patch: Partial<UserProfile>) => void
  today: string
  lang: Lang
  seasonTransition?: SeasonTransition | null
}

export function MaSituationSection({
  situationData,
  profile,
  updateProfile,
  today,
  lang,
  seasonTransition,
}: MaSituationSectionProps) {
  const mode = situationData.detectedCycle ?? profile.seasonMode ?? 'in_season'
  const [overrideOpen, setOverrideOpen] = useState(false)
  const showInSeasonManualActions = shouldShowProfileSeasonActions({
    seasonTransition,
    cycle: mode,
  })

  return (
    <div className="space-y-3" data-testid="ma-situation">
      <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">
        {tr('profile_label_situation', lang)}
      </label>

      <div className="rounded-2xl border border-border-app bg-layer-5 p-4 space-y-2">
        <p className="text-xs leading-relaxed" data-testid="situation-program-adapted">
          <span className="font-bold text-fg-muted">{tr('profile_situation_program_adapted', lang)}</span>{' '}
          <span className="font-black text-fg" data-testid="situation-cycle">
            {situationData.cycleLabel}
          </span>
        </p>
        <p className="text-[10px] text-fg-muted">
          {tr('profile_label_next_match', lang)} :{' '}
          <span className="font-bold text-fg-emphasis" data-testid="situation-next-match">
            {situationData.nextMatchLabel}
          </span>
        </p>
      </div>

      {mode === 'off_season' && (
        <OffSeasonSituationActions
          situationData={situationData}
          profile={profile}
          updateProfile={updateProfile}
          today={today}
          lang={lang}
        />
      )}
      {mode === 'pre_season' && (
        <PreSeasonSituationActions profile={profile} updateProfile={updateProfile} lang={lang} />
      )}
      {mode !== 'off_season' && mode !== 'pre_season' && (
        <InSeasonSituationPanel
          situationData={situationData}
          profile={profile}
          updateProfile={updateProfile}
          today={today}
          lang={lang}
          showManualActions={showInSeasonManualActions}
          overrideOpen={overrideOpen}
          onOpenOverride={() => setOverrideOpen(true)}
        />
      )}
    </div>
  )
}

function InSeasonSituationPanel({
  situationData,
  profile,
  updateProfile,
  today,
  lang,
  showManualActions,
  overrideOpen,
  onOpenOverride,
}: Pick<MaSituationSectionProps, 'situationData' | 'profile' | 'updateProfile' | 'today' | 'lang'> & {
  showManualActions: boolean
  overrideOpen: boolean
  onOpenOverride: () => void
}) {
  const ctx = situationData.planningContext
  const subMode = ctx?.inSeasonSubMode

  if (isTreveInSeasonSubMode(subMode)) {
    const weeks = treveGapWeeks(ctx?.daysUntilNextMatch ?? null)
    return (
      <div
        className="rounded-2xl border border-border-app bg-layer-5 p-3 space-y-1"
        data-testid="situation-treve-readonly"
      >
        <p className="text-xs font-bold text-fg-soft">
          {weeks != null
            ? tr('profile_situation_treve_next_match_weeks', lang).replace('{weeks}', String(weeks))
            : tr('profile_situation_treve_detected', lang)}
        </p>
        <p className="text-[10px] text-fg-muted leading-relaxed">
          {tr('profile_situation_treve_readonly_hint', lang)}
        </p>
      </div>
    )
  }

  if (shouldShowAutoEndOfSeasonConfirm(ctx, profile)) {
    return (
      <AutoEndOfSeasonConfirmCard
        situationData={situationData}
        profile={profile}
        updateProfile={updateProfile}
        today={today}
        lang={lang}
        daysSinceLastMatch={ctx?.daysSinceLastMatch ?? null}
      />
    )
  }

  if (!showManualActions) {
    return (
      <p className="text-[10px] text-fg-muted leading-relaxed" data-testid="situation-home-banner-hint">
        {tr('profile_situation_home_banner_hint', lang)}
      </p>
    )
  }

  if (!overrideOpen) {
    return (
      <button
        type="button"
        data-testid="situation-override-toggle"
        onClick={onOpenOverride}
        className="w-full py-2.5 px-3 rounded-2xl text-xs font-bold text-left bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all rf-focus-ring"
      >
        {tr('profile_situation_not_my_case', lang)}
      </button>
    )
  }

  return (
    <div className="space-y-2" data-testid="situation-override-actions">
      <InSeasonSituationActions
        situationData={situationData}
        profile={profile}
        updateProfile={updateProfile}
        today={today}
        lang={lang}
      />
    </div>
  )
}

function OffSeasonSituationActions({
  situationData,
  profile,
  updateProfile,
  today,
  lang,
}: MaSituationSectionProps) {
  const goInSeason = () => {
    const restored = restoreLastTransition(profile.seasonTransitionState)
    if (restored) {
      updateProfile({
        planningAnchors: restored.restoredAnchors,
        seasonMode: cycleToSeasonMode(restored.restoredCycle),
        seasonTransitionState: restored.updatedTransitionState,
      })
    } else {
      const cleanAnchors = { ...profile.planningAnchors }
      delete cleanAnchors.seasonEndedAt
      delete cleanAnchors.seasonEndedSource
      delete cleanAnchors.returnToTeamTrainingAt
      delete cleanAnchors.skipOffSeasonRecoveryIntro
      updateProfile({ planningAnchors: cleanAnchors, seasonMode: 'in_season' })
    }
  }

  return (
    <div className="space-y-2" id="reprise">
      <div
        className="flex items-center gap-2 py-2.5 px-3 rounded-2xl bg-ok-bg-muted border border-ok-bd"
        data-testid="situation-confirmed"
      >
        <span className="text-xs font-bold text-ok-strong">{tr('profile_situation_offseason_active', lang)}</span>
      </div>

      {situationData.showSkipOffSeasonRecovery && (
        <div
          className="rounded-2xl border border-border-app bg-layer-5 p-3 space-y-2"
          data-testid="situation-skip-recovery-card"
        >
          <p className="text-[10px] text-fg-muted leading-relaxed">{tr('profile_skip_recovery_intro_hint', lang)}</p>
          <button
            type="button"
            data-testid="situation-skip-recovery-intro"
            onClick={() =>
              updateProfile({
                planningAnchors: {
                  ...profile.planningAnchors,
                  skipOffSeasonRecoveryIntro: true,
                },
              })
            }
            className="w-full rounded-xl border border-brand-border bg-brand-soft px-3 py-2 text-[11px] font-bold text-brand-tint hover:bg-brand-soft/80 rf-focus-ring"
          >
            {tr('profile_skip_recovery_intro_btn', lang)}
          </button>
        </div>
      )}

      {profile.planningAnchors?.skipOffSeasonRecoveryIntro && (
        <button
          type="button"
          data-testid="situation-undo-skip-recovery"
          onClick={() => {
            const clean = { ...profile.planningAnchors }
            delete clean.skipOffSeasonRecoveryIntro
            updateProfile({ planningAnchors: clean })
          }}
          className="w-full text-center text-[10px] font-bold text-fg-muted hover:text-fg-soft underline-offset-2 hover:underline rf-focus-ring py-1"
        >
          {tr('profile_skip_recovery_intro_undo', lang)}
        </button>
      )}
      {profile.planningAnchors?.returnToTeamTrainingAt ? (
        <div
          className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-brand-soft border border-brand-border"
          data-testid="situation-return-set"
        >
          <span className="text-xs font-bold text-brand-tint">
            Reprise le{' '}
            {formatReturnDateLabel(profile.planningAnchors.returnToTeamTrainingAt, lang) ?? '—'}
          </span>
          <button
            type="button"
            data-testid="situation-clear-return"
            onClick={() => {
              const cleanAnchors = { ...profile.planningAnchors }
              delete cleanAnchors.returnToTeamTrainingAt
              updateProfile({ planningAnchors: cleanAnchors })
            }}
            className="text-[10px] font-bold text-brand-muted hover:text-brand-tint"
          >
            {tr('profile_situation_modify', lang)}
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[10px] text-fg-faint">{tr('profile_situation_return_hint', lang)}</p>
          <input
            type="date"
            data-testid="situation-return-date"
            min={today}
            onChange={(e) => {
              const value = e.target.value
              if (!value || !isValidPlanningIsoDate(value)) return
              updateProfile({
                planningAnchors: {
                  ...profile.planningAnchors,
                  returnToTeamTrainingAt: value,
                },
                seasonMode: 'pre_season',
              })
            }}
            style={{ colorScheme: 'dark' }}
            className="w-full py-2.5 px-3 rounded-2xl text-xs font-bold bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all [&::-webkit-calendar-picker-indicator]:brightness-[0.7] [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>
      )}

      <button
        type="button"
        data-testid="situation-resume-season"
        onClick={goInSeason}
        className="py-2.5 px-3 rounded-2xl text-xs font-bold text-left bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all"
      >
        {tr('profile_situation_resume', lang)}
      </button>
    </div>
  )
}

function PreSeasonSituationActions({
  profile,
  updateProfile,
  lang,
}: Pick<MaSituationSectionProps, 'profile' | 'updateProfile' | 'lang'>) {
  return (
    <div className="space-y-2" id="reprise">
      <div
        className="flex items-center gap-2 py-2.5 px-3 rounded-2xl bg-brand-soft border border-brand-border"
        data-testid="situation-confirmed"
      >
        <span className="text-xs font-bold text-brand-tint">{tr('profile_situation_preseason_active', lang)}</span>
      </div>

      {profile.planningAnchors?.returnToTeamTrainingAt && (
        <div
          className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-layer-5 border border-border-app"
          data-testid="situation-return-set"
        >
          <span className="text-xs font-bold text-fg-soft">
            Reprise prévue le{' '}
            {formatReturnDateLabel(profile.planningAnchors.returnToTeamTrainingAt, lang) ?? '—'}
          </span>
          <button
            type="button"
            data-testid="situation-clear-return"
            onClick={() => {
              const cleanAnchors = { ...profile.planningAnchors }
              delete cleanAnchors.returnToTeamTrainingAt
              updateProfile({ planningAnchors: cleanAnchors })
            }}
            className="text-[10px] font-bold text-fg-muted hover:text-fg"
          >
            {tr('profile_situation_modify', lang)}
          </button>
        </div>
      )}

      <button
        type="button"
        data-testid="situation-season-started"
        onClick={() => {
          const cleanAnchors = { ...profile.planningAnchors }
          delete cleanAnchors.seasonEndedAt
          delete cleanAnchors.seasonEndedSource
          delete cleanAnchors.returnToTeamTrainingAt
          delete cleanAnchors.skipOffSeasonRecoveryIntro
          updateProfile({ planningAnchors: cleanAnchors, seasonMode: 'in_season' })
        }}
        className="py-2.5 px-3 rounded-2xl text-xs font-bold text-left bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all"
      >
        La saison a commencé
      </button>
    </div>
  )
}

function AutoEndOfSeasonConfirmCard({
  situationData,
  profile,
  updateProfile,
  today,
  lang,
  daysSinceLastMatch,
}: MaSituationSectionProps & { daysSinceLastMatch: number | null }) {
  const endSeason = (endedAt: string) => {
    const prevAnchors = { ...profile.planningAnchors }
    const entry: TransitionEntry = {
      id: `t-${Date.now()}`,
      at: today,
      trigger: 'user_manual',
      from: {
        cycle: situationData.detectedCycle ?? 'in_season',
        weekNumber: 1,
        schedulingMode: 'calendar',
      },
      anchorsSnapshot: prevAnchors,
      to: 'off_season',
    }
    const cleanAnchors = { ...prevAnchors }
    delete cleanAnchors.manualPlayoffs
    updateProfile({
      planningAnchors: { ...cleanAnchors, seasonEndedAt: endedAt, seasonEndedSource: 'manual' },
      seasonMode: 'off_season',
      seasonTransitionState: appendTransitionEntry(profile.seasonTransitionState, entry),
    })
  }

  return (
    <div
      className="rounded-2xl border border-ok-bd bg-ok-bg-muted p-3 space-y-2"
      data-testid="situation-auto-end-detected"
    >
      <p className="text-xs font-bold text-ok-strong">
        {daysSinceLastMatch != null
          ? tr('profile_situation_auto_offseason_detected', lang).replace(
              '{days}',
              String(daysSinceLastMatch),
            )
          : tr('profile_situation_auto_offseason_detected_short', lang)}
      </p>
      <p className="text-[10px] text-fg-muted leading-relaxed">
        {tr('profile_situation_auto_offseason_hint', lang)}
      </p>
      <button
        type="button"
        data-testid="situation-confirm-end-season"
        onClick={() => endSeason(situationData.lastMatchDate ?? today)}
        className="w-full py-2.5 px-3 rounded-2xl text-xs font-bold text-left bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all rf-focus-ring"
      >
        {tr('profile_situation_confirm_end_season', lang)}
      </button>
    </div>
  )
}

function InSeasonSituationActions({
  situationData,
  profile,
  updateProfile,
  today,
  lang,
}: MaSituationSectionProps) {
  const endSeason = (endedAt: string) => {
    const prevAnchors = { ...profile.planningAnchors }
    const entry: TransitionEntry = {
      id: `t-${Date.now()}`,
      at: today,
      trigger: 'user_manual',
      from: {
        cycle: situationData.detectedCycle ?? 'in_season',
        weekNumber: 1,
        schedulingMode: 'calendar',
      },
      anchorsSnapshot: prevAnchors,
      to: 'off_season',
    }
    const cleanAnchors = { ...prevAnchors }
    delete cleanAnchors.manualPlayoffs
    updateProfile({
      planningAnchors: { ...cleanAnchors, seasonEndedAt: endedAt, seasonEndedSource: 'manual' },
      seasonMode: 'off_season',
      seasonTransitionState: appendTransitionEntry(profile.seasonTransitionState, entry),
    })
  }

  return (
    <>
      <p className="text-[10px] text-fg-faint">{tr('profile_label_situation_change_q', lang)}</p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          data-testid="situation-season-ended"
          onClick={() => endSeason(situationData.lastMatchDate ?? today)}
          className="py-2.5 px-3 rounded-2xl text-xs font-bold text-left bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all"
        >
          La saison est finie
        </button>
        <button
          type="button"
          data-testid="situation-no-match"
          onClick={() => endSeason(today)}
          className="py-2.5 px-3 rounded-2xl text-xs font-bold text-left bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all"
        >
          {tr('profile_situation_no_match_now', lang)}
        </button>
      </div>
    </>
  )
}
