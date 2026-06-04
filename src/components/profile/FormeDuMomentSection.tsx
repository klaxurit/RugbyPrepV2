import { useState } from 'react'
import { RefreshCw, Activity, Flame } from 'lucide-react'
import type { TrainingBaseline, UserProfile } from '../../types/training'
import { isRestartRampUpActive, RESTART_RAMP_UP_DAYS } from '../../services/program/restartRampUp'
import { tr, type Lang } from '../../i18n/appLabels'

const FORME_AUTO_HIDE_DAYS = 14
const FORME_AUTO_HIDE_SESSIONS = 3

type TrainingBaselineDef = {
  value: TrainingBaseline
  label: string
  sub: string
  icon: typeof RefreshCw
}

function getTrainingBaselinesProfile(lang: Lang): TrainingBaselineDef[] {
  return [
    { value: 'restart', label: tr('baseline_restart', lang), sub: tr('baseline_restart_sub', lang), icon: RefreshCw },
    { value: 'active', label: tr('baseline_active', lang), sub: tr('baseline_active_sub', lang), icon: Activity },
    { value: 'peak', label: tr('baseline_peak', lang), sub: tr('baseline_peak_sub', lang), icon: Flame },
  ]
}

export function FormeDuMomentSection({
  profile,
  loggedSessions,
  onUpdateBaseline,
  lang,
}: {
  profile: UserProfile
  loggedSessions: number
  onUpdateBaseline: (value: TrainingBaseline) => void
  lang: Lang
}) {
  const TRAINING_BASELINES = getTrainingBaselinesProfile(lang)
  const [forceOpen, setForceOpen] = useState(false)
  const [mountedAt] = useState(() => Date.now())
  const restartActive = isRestartRampUpActive(profile)

  let settled = false
  if (profile.trainingBaselineSetAt) {
    const ageDays = (mountedAt - new Date(profile.trainingBaselineSetAt).getTime()) / 86_400_000
    settled = ageDays >= FORME_AUTO_HIDE_DAYS || loggedSessions >= FORME_AUTO_HIDE_SESSIONS
  }

  const shouldShow = forceOpen || !settled || restartActive || !profile.trainingBaseline

  if (!shouldShow) {
    const currentLabel = TRAINING_BASELINES.find((o) => o.value === profile.trainingBaseline)?.label ?? '—'
    return (
      <button
        type="button"
        onClick={() => setForceOpen(true)}
        data-testid="profile-baseline-reveal"
        className="w-full flex items-center justify-between gap-3 py-2.5 px-4 rounded-2xl bg-layer-5 border border-border-app text-fg-soft hover:border-layer-20 transition-colors"
      >
        <span className="text-xs font-bold">
          {lang === 'fr' ? 'Forme du moment' : 'Current shape'} —{' '}
          <span className="text-fg-muted font-normal">{currentLabel}</span>
        </span>
        <span className="text-[10px] font-black text-brand-tint uppercase tracking-wide">
          {tr('profile_situation_modify', lang)}
        </span>
      </button>
    )
  }

  return (
    <section
      className="bg-layer-5 border border-border-app rounded-[24px] p-6 space-y-3"
      data-testid="profile-section-baseline"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-fg">{lang === 'fr' ? 'Forme du moment' : 'Current shape'}</h2>
          <p className="text-xs text-fg-muted">
            {lang === 'fr'
              ? 'Module la charge des 2 premières semaines selon ton état de reprise.'
              : 'Adjusts the load of the first 2 weeks based on your return state.'}
          </p>
        </div>
        {restartActive && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand-soft border border-brand-border text-[10px] font-black text-brand-tint">
            <RefreshCw className="w-3 h-3" />
            {lang === 'fr' ? 'Rampe active' : 'Ramp active'}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {TRAINING_BASELINES.map((opt) => {
          const active = profile.trainingBaseline === opt.value
          const Icon = opt.icon
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`profile-baseline-${opt.value}`}
              onClick={() => onUpdateBaseline(opt.value)}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-2xl text-xs font-bold text-left transition-all ${
                active
                  ? 'bg-brand text-on-brand shadow-sm'
                  : 'bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="font-black">{opt.label}</p>
                <p className={`text-[10px] font-normal ${active ? 'text-on-brand/80' : 'text-fg-muted'}`}>{opt.sub}</p>
              </div>
            </button>
          )
        })}
      </div>
      {profile.trainingBaseline === 'restart' && restartActive && profile.trainingBaselineSetAt && (
        <p className="text-[11px] text-fg-muted">
          Volume réduit jusqu'au{' '}
          <span className="font-black text-fg-soft">
            {new Date(new Date(profile.trainingBaselineSetAt).getTime() + RESTART_RAMP_UP_DAYS * 86_400_000).toLocaleDateString(
              'fr-FR',
              { day: '2-digit', month: 'short' }
            )}
          </span>
          , puis retour automatique au programme normal.
        </p>
      )}
      {settled && forceOpen && (
        <button
          type="button"
          onClick={() => setForceOpen(false)}
          className="text-[10px] font-bold text-fg-faint hover:text-fg-soft transition-colors"
        >
          Replier
        </button>
      )}
    </section>
  )
}
