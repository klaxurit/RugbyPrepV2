import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, Leaf, HeartPulse } from 'lucide-react'
import { posthog } from '../services/analytics/posthog'
import { useFatigue } from '../hooks/useFatigue'
import { useHistory } from '../hooks/useHistory'
import { useProfile } from '../hooks/useProfile'
import { useWeek } from '../hooks/useWeek'
import { useCalendar } from '../hooks/useCalendar'
import { useACWR } from '../hooks/useACWR'
import { useProgramFeatureFlags } from '../hooks/useProgramFeatureFlags'
import { useWeeklyProgramSurface } from '../hooks/useWeeklyProgramSurface'
import { markWeekViewed, useUpsellTiming, isDismissed, dismissUpsell } from '../hooks/useUpsellTiming'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { PremiumUpsellCard } from '../components/PremiumUpsellCard'
import { getGlobalProgramHardBlock } from '../services/program/hasGlobalProgramHardBlock'
import { BETA_ELIGIBILITY_MESSAGES } from '../services/betaEligibility'
import type { RehabPhase } from '../types/training'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { AnnualPlanningSummaryCard } from '../components/motherSession/AnnualPlanningSummaryCard'
import { MotherSessionWeekPanel } from '../components/motherSession/MotherSessionWeekPanel'

const REHAB_CRITERIA: Record<RehabPhase, string> = {
  1: 'P2 : absence douleur au repos · mobilité partielle retrouvée · 1-2 semaines',
  2: 'P3 : force ≥ 70% côté sain · ROM complet sans douleur · 2-4 semaines',
  3: 'Fin : force ≥ 90% · tests fonctionnels OK · course/sauts sans douleur',
}

function localDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function WeekPage() {
  const { profile } = useProfile()
  const lang = (profile.preferredLanguage as 'fr' | 'en' | undefined) ?? 'fr'
  const weekPageTitle = lang === 'fr' ? 'Ma Semaine' : 'My Week'
  const { week, lastNonDeloadWeek } = useWeek()
  const { fatigue, setFatigue } = useFatigue()
  const { logs } = useHistory()
  const { events } = useCalendar()
  const navigate = useNavigate()

  const acwrResult = useACWR(logs, events)
  const { isPremium: weekIsPremium } = useFeatureAccess()
  const { canShowUpsell: weekCanShowUpsell } = useUpsellTiming()
  const { featureFlags: programFeatureFlags } = useProgramFeatureFlags()

  useEffect(() => {
    posthog.capture('week_viewed')
    markWeekViewed()
  }, [])

  // Match non chargé hier → bannière rappel + suggestion mobilité
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const unmatchedYesterdayMatch = events.find(
    (e) => e.type === 'match' && e.date === yesterdayStr && !e.rpe
  ) ?? null
  const isRecoveryDay = events.some((e) => e.type === 'match' && e.date === yesterdayStr)

  // ── Surface unifiée ────────────────────────────────────────────────────────
  const today = useMemo(() => localDateISO(new Date()), [])
  const surfaceParams = useMemo(() => ({
    profile,
    events,
    logs,
    today,
    fatigue,
    acwrZone: acwrResult.hasSufficientData ? acwrResult.zone : null,
    week,
    lastNonDeloadWeek,
    ignoreAcwrOverload: false,
    hasSufficientACWRData: acwrResult.hasSufficientData,
    featureFlags: programFeatureFlags,
  }), [profile, events, logs, today, fatigue, acwrResult.hasSufficientData, acwrResult.zone, week, lastNonDeloadWeek, programFeatureFlags])
  const { surface } = useWeeklyProgramSurface(surfaceParams)

  // ── Hard-block global ──────────────────────────────────────────────────────
  const { hasHardBlock, hardBlockReasons } = getGlobalProgramHardBlock(profile)

  useEffect(() => {
    if (hasHardBlock) {
      posthog.capture('beta_eligibility_blocked', {
        surface: 'week_page',
        primaryReason: hardBlockReasons[0] ?? null,
        reasons: hardBlockReasons,
      })
    }
  }, [hasHardBlock, hardBlockReasons])

  if (hasHardBlock) {
    return (
      <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24">
        <PageHeader title={weekPageTitle} backTo="/home" />
        <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-5 space-y-3">
            <p className="font-bold text-amber-400">Profil non encore supporté en bêta self-serve</p>
            <ul className="space-y-2">
              {hardBlockReasons.map((r) => (
                <li key={r} className="text-sm text-amber-300/80">
                  <span className="font-semibold">{BETA_ELIGIBILITY_MESSAGES[r].reason}</span>
                  <br />{BETA_ELIGIBILITY_MESSAGES[r].detail}
                </li>
              ))}
            </ul>
            <p className="text-xs text-white/40">
              Ton compte et ton profil sont conservés. Modifie ton profil pour revenir dans le périmètre supporté, ou contacte-nous.
            </p>
            <Link to="/profile" className="inline-block text-sm font-bold text-[#ff6b35] hover:text-[#e55a2b]">
              Modifier mon profil →
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // ── Décision moteur ────────────────────────────────────────────────────────
  const primarySource = surface?.primarySource ?? 'mother_session'
  const isUnavailable = primarySource === 'unavailable'
  const msResolution = surface?.motherSession ?? null

  return (
    <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader
        title={weekPageTitle}
        backTo="/home"
        titleSuffix={surface?.planningContext.weekLabel ?? week}
      />

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto relative">

        {isUnavailable && (
          <section className="rounded-[24px] border border-amber-500/25 bg-amber-900/10 p-5 space-y-3">
            <p className="text-sm font-bold text-amber-300">Programme en préparation</p>
            <p className="text-xs text-white/50">
              Le plan annuel n'a pas pu être résolu pour cette semaine. Vérifie ton profil ou réessaie après une mise à jour.
            </p>
          </section>
        )}

        {msResolution && surface && (
          <section
            className="space-y-5"
            data-testid="annual-plan-section"
            aria-label="Programme de la semaine"
          >
            {/* Bannière match hier sans charge */}
            {unmatchedYesterdayMatch && (
              <Link
                to="/calendar"
                className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-500/20 rounded-2xl hover:bg-amber-900/30 transition-colors"
              >
                <div className="p-1.5 rounded-xl bg-amber-900/20 text-amber-400 flex-shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-amber-300">
                    Match hier{unmatchedYesterdayMatch.opponent ? ` vs ${unmatchedYesterdayMatch.opponent}` : ''} — enregistre ta charge
                  </p>
                  <p className="text-[10px] text-amber-400 mt-0.5">Mise à jour ACWR → Calendrier</p>
                </div>
              </Link>
            )}

            {/* Bannière mobilité (lendemain de match) */}
            {isRecoveryDay && (
              <Link
                to="/mobility"
                className="flex items-center gap-3 px-4 py-3 bg-teal-900/20 border border-teal-500/20 rounded-2xl hover:bg-teal-900/30 transition-colors"
              >
                <div className="p-1.5 rounded-xl bg-teal-900/20 text-teal-400 flex-shrink-0">
                  <Leaf className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-teal-300">Session mobilité suggérée</p>
                  <p className="text-[10px] text-teal-400 mt-0.5">Récupération active · 10-15 min</p>
                </div>
              </Link>
            )}

            {/* Bannière rehab active */}
            {profile.rehabInjury && (
              <div className="p-4 bg-rose-900/20 border border-rose-500/20 rounded-3xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <p className="text-xs font-black text-rose-400">
                      Mode Réhab — Phase {profile.rehabInjury.phase}/3
                    </p>
                  </div>
                  <span className="text-[10px] text-rose-400">
                    {profile.rehabInjury.zone === 'upper' ? 'Épaule/Bras/Cou' : 'Genou/Hanche/Cheville'}
                  </span>
                </div>
                <p className="text-xs text-rose-400 leading-snug">
                  {REHAB_CRITERIA[profile.rehabInjury.phase]}
                </p>
              </div>
            )}

            {/* Fatigue check-in discret */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5">
              <span className="text-[11px] font-bold text-white/50">Forme</span>
              <div className="flex gap-1.5 bg-white/10 rounded-xl p-0.5">
                {(['OK', 'FATIGUE'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFatigue(f)}
                    className={`px-3 py-1 rounded-[10px] text-[10px] font-black transition-all ${
                      fatigue === f ? 'bg-white/20 text-white shadow-sm' : 'text-white/40'
                    }`}
                  >
                    {f === 'OK' ? 'En forme' : 'Fatigué'}
                  </button>
                ))}
              </div>
            </div>

            <AnnualPlanningSummaryCard
              planningContext={surface.planningContext}
              planningInputsWarnings={surface.planningInputWarnings}
              resolutionWarnings={msResolution.warnings}
              companionRecommendations={msResolution.companionRecommendations}
              fatigueLevel={surface.planningContext.fatigueLevel}
              lang={lang}
            />

            {/* Séances de la semaine — navigation vers /session/:id */}
            {/* Warnings/companions déjà montrés dans AnnualPlanningSummaryCard ci-dessus */}
            <MotherSessionWeekPanel
              sessions={msResolution.sessions}
              warnings={[]}
              companionRecommendations={[]}
              status={msResolution.status}
              missingMessage={msResolution.message}
              scSchedule={profile.scSchedule}
              clubSchedule={profile.clubSchedule}
              lang={lang}
              onSessionSelect={(index) => navigate(`/session/${index}`)}
            />
          </section>
        )}

        {/* T2.5: Upsell contextuel — match dans les 3 jours */}
        {!weekIsPremium && weekCanShowUpsell && !isDismissed('week_match') && (() => {
          const now = new Date()
          now.setHours(0, 0, 0, 0)
          const in3days = new Date(now)
          in3days.setDate(in3days.getDate() + 3)
          const hasMatchSoon = events.some(e =>
            e.type === 'match' &&
            new Date(e.date + 'T00:00:00') >= now &&
            new Date(e.date + 'T00:00:00') <= in3days
          )
          if (!hasMatchSoon) return null
          return (
            <PremiumUpsellCard
              title="Match dans les prochains jours"
              body="Adapte ta semaine automatiquement en fonction du match — Premium."
              onDismiss={() => dismissUpsell('week_match')}
            />
          )
        })()}
      </main>

      <BottomNav />
    </div>
  )
}
