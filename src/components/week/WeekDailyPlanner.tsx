import { useMemo, useState } from 'react'
import type { DatedSession, DayOfWeek, PresentedMatchEvent } from '../../types/scheduling'
import type { MotherSessionType } from '../../types/motherSession'
import type { SessionLog } from '../../types/training'
import { mapMotherSessionType } from '../../services/program/buildProgramSessionLog'
import { findSessionLogForPlannedSlot } from '../../services/scheduling/mergeDatedSessionCompletion'
import { Icon, Pill, SectionLabel, type IconName } from '../ui'
import { plannedSessionCardStats } from './plannedSessionCardStats'

const SESSION_SUBTITLE: Record<MotherSessionType, string> = {
  upper: 'Haut du corps',
  lower: 'Bas du corps',
  full: 'Corps complet',
  full_light_primer: 'Activation',
  speed_power: 'Vitesse · Puissance',
}

const DAY_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0] // Lun → Dim
const DAY_LONG: Record<DayOfWeek, string> = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
}
const DAY_LONG_EN: Record<DayOfWeek, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}
const DAY_SHORT: Record<DayOfWeek, string> = {
  0: 'Dim',
  1: 'Lun',
  2: 'Mar',
  3: 'Mer',
  4: 'Jeu',
  5: 'Ven',
  6: 'Sam',
}

// ─── Types résolus jour par jour ─────────────────────────────────────────────

export type DayType = 'rest' | 'gym' | 'recovery' | 'match' | 'unavailable'

interface ResolvedDay {
  dow: DayOfWeek
  dateISO: string
  dateNum: string
  isToday: boolean
  type: DayType
  hasGym: boolean
  isClubDay: boolean
  /** Pour gym */
  sessionIndex?: number
  sessionLabel?: string
  sessionSubtitle?: string
  blocs?: number
  durationMin?: number
  /** `true` si `durationMin` vient d'un log réel (séance faite), `false` si prévue. */
  durationIsActual?: boolean
  /** Club dur / décharge : séance light. */
  isLight?: boolean
  isCompleted?: boolean
  isSkipped?: boolean
  /** Log historique quand la séance est déjà faite (consultation). */
  sessionLogId?: string
  /** Pour match */
  match?: PresentedMatchEvent
  /** Pour recovery */
  arDone?: boolean
  arEligible?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatTitle(rawTitle: string): string {
  return rawTitle.replace(/\s·\s/g, ' — ')
}

function getMondayOfWeek(todayISO: string): Date {
  const d = new Date(`${todayISO}T12:00:00`)
  const dow = d.getDay() // 0=Sun..6=Sat
  const offset = dow === 0 ? -6 : 1 - dow // back to Monday
  d.setDate(d.getDate() + offset)
  return d
}

// ─── Public component ────────────────────────────────────────────────────────

export interface WeekDailyPlannerProps {
  sessions: readonly DatedSession[]
  matchEvents: readonly PresentedMatchEvent[]
  unavailableDays: readonly DayOfWeek[]
  clubDays: readonly DayOfWeek[]
  activeRecoveryDates: readonly string[]
  activeRecoveryEligibleDays: readonly DayOfWeek[]
  /**
   * Logs de séances — utilisés pour afficher la durée RÉELLE quand une séance
   * est loguée (à la place de la durée prévue de la mother session).
   */
  logs?: readonly SessionLog[]
  todayISO: string
  lang: 'fr' | 'en'
  /** Renvoie un titre formaté à partir d'un sessionSlot (mère-séance ID). */
  formatSessionTitle: (motherSessionId: string) => string

  onSessionSelect: (index: number, options?: { reviewLogId?: string }) => void
  onSelectMatchByDate: (dateISO: string) => void
  onActiveRecoveryQuick?: (activity: string, dateISO: string) => void
}

/**
 * Planner hebdomadaire éditorial — DayStrip + FeatureCard du jour + IndexLine
 * pour les autres jours. Reproduit fidèlement le pattern du handoff `V4 Pro`.
 *
 * Mécanique conservée :
 * - Clic sur un jour gym actif → ouvre la session (`onSessionSelect`)
 * - Clic sur un match → édition match (`onSelectMatchByDate`)
 * - Clic sur une activité de récup active → log AR (`onActiveRecoveryQuick`)
 * - Clic sur "skip" depuis le menu kebab → `onSkipSession`
 */
export function WeekDailyPlanner({
  sessions,
  matchEvents,
  unavailableDays,
  clubDays,
  activeRecoveryDates,
  activeRecoveryEligibleDays,
  logs,
  todayISO,
  lang,
  formatSessionTitle,
  onSessionSelect,
  onSelectMatchByDate,
  onActiveRecoveryQuick,
}: WeekDailyPlannerProps) {
  // ─── Résolution des 7 jours de la semaine en cours ───
  const days: ResolvedDay[] = useMemo(() => {
    const monday = getMondayOfWeek(todayISO)
    const matchByDate = new Map(matchEvents.map((m) => [m.date, m]))
    const arDoneByDate = new Set(activeRecoveryDates)
    const sessionsByDow = new Map<DayOfWeek, DatedSession[]>()
    for (const s of sessions) {
      const list = sessionsByDow.get(s.dayOfWeek) ?? []
      list.push(s)
      sessionsByDow.set(s.dayOfWeek, list)
    }
    // sessionIndex global aligné sur l'ordre Lun-Dim (id de session-index utilisé pour /session/N)
    const sessionIndexByDow = new Map<DayOfWeek, number>()
    sessions.forEach((s, idx) => {
      // idx est l'ordre dans le tableau passé — c'est ce que `onSessionSelect` attend.
      if (!sessionIndexByDow.has(s.dayOfWeek)) sessionIndexByDow.set(s.dayOfWeek, idx)
    })

    return DAY_ORDER.map((dow) => {
      const offset = DAY_ORDER.indexOf(dow)
      const dateObj = new Date(monday)
      dateObj.setDate(monday.getDate() + offset)
      const dateISO = ymd(dateObj)
      const isToday = dateISO === todayISO

      const match = matchByDate.get(dateISO) ?? null
      const dowSessions = sessionsByDow.get(dow) ?? []
      const session = dowSessions[0] // 1ère session non-skipped en priorité
      const hasGym = Boolean(session && session.completionStatus !== 'skipped')
      const isClubDay = clubDays.includes(dow)
      const isUnavailable = unavailableDays.includes(dow) || isClubDay

      let type: DayType
      if (match) type = 'match'
      else if (hasGym) type = 'gym'
      else if (arDoneByDate.has(dateISO) || activeRecoveryEligibleDays.includes(dow)) type = 'recovery'
      else if (isUnavailable) type = 'unavailable'
      else type = 'rest'

      // Log de la séance PLANIFIÉE (par motherSessionId), pas « n'importe quel
      // log du jour » — sinon Haut planifié + Bas fait le même jour → revue inversée.
      const matchedLog = session
        ? findSessionLogForPlannedSlot(logs, {
            motherSessionId: session.sessionSlot.sessionId,
            plannedDateISO: dateISO,
            weekAnchorISO: todayISO,
            expectedSessionType: mapMotherSessionType(
              session.sessionSlot.session.metadata.sessionType,
            ),
          })
        : undefined
      const realDuration = matchedLog?.durationMin
      const cardStats = session
        ? plannedSessionCardStats(session.sessionSlot)
        : undefined

      return {
        dow,
        dateISO,
        dateNum: String(dateObj.getDate()),
        isToday,
        type,
        hasGym,
        isClubDay,
        sessionIndex: session ? sessionIndexByDow.get(dow) : undefined,
        sessionLabel: session
          ? formatTitle(formatSessionTitle(session.sessionSlot.session.metadata.id))
          : undefined,
        sessionSubtitle: session
          ? SESSION_SUBTITLE[session.sessionSlot.session.metadata.sessionType] ?? undefined
          : undefined,
        blocs: cardStats?.blocs,
        durationMin: realDuration ?? cardStats?.durationMin,
        durationIsActual: realDuration != null,
        isLight: cardStats?.isLight,
        // « Faite » seulement s'il existe un log rejouable — sinon CTA « Revoir »
        // sans sessionLogId (clic → démarrer) après une annulation partielle.
        isCompleted: matchedLog != null,
        isSkipped: session?.completionStatus === 'skipped',
        sessionLogId: matchedLog?.id,
        match: match ?? undefined,
        arDone: arDoneByDate.has(dateISO),
        arEligible: activeRecoveryEligibleDays.includes(dow),
      }
    })
  }, [
    sessions,
    matchEvents,
    unavailableDays,
    clubDays,
    activeRecoveryDates,
    activeRecoveryEligibleDays,
    logs,
    todayISO,
    formatSessionTitle,
  ])

  // ─── Active day = today by default ───
  const todayPos = days.findIndex((d) => d.isToday)
  const [active, setActive] = useState<number>(todayPos >= 0 ? todayPos : 0)
  const activeDay = days[active]

  return (
    <div className="space-y-4">
      <DayStrip days={days} activeIdx={active} onSelect={setActive} lang={lang} />

      <FeatureCardSwitch
        day={activeDay}
        lang={lang}
        onSessionSelect={onSessionSelect}
        onSelectMatchByDate={onSelectMatchByDate}
        onActiveRecoveryQuick={onActiveRecoveryQuick}
      />

      <div className="pt-2">
        <SectionLabel label="Index — la semaine" />
        <ul className="mt-1">
          {days.map((d, i) =>
            i === active ? null : (
              <li key={d.dow}>
                <IndexLine
                  num={i + 1}
                  day={d}
                  onClick={() => setActive(i)}
                />
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  )
}

// ─── DayStrip ────────────────────────────────────────────────────────────────

interface DayStripProps {
  days: ResolvedDay[]
  activeIdx: number
  onSelect: (idx: number) => void
  lang: 'fr' | 'en'
}

// Icônes posées directement sur la bordure haute du jour.
const MATCH_DAY_STRIP_ICON = '🏉'
const GYM_DAY_STRIP_ICON = '🏋️'
const CLUB_DAY_STRIP_ICON = '🏟️'

function DayStrip({ days, activeIdx, onSelect, lang }: DayStripProps) {
  const tablistNeedsBadgeRoom = days.some((d) => d.type === 'match' || d.hasGym || d.isClubDay)

  return (
    <div role="tablist" className={tablistNeedsBadgeRoom ? 'flex gap-1 pt-2' : 'flex gap-1'}>
      {days.map((d, i) => {
        const isActive = i === activeIdx
        const hasMatch = d.type === 'match'
        const dayMarkers = [
          hasMatch ? { icon: MATCH_DAY_STRIP_ICON, labelFr: 'jour de match', labelEn: 'match day' } : null,
          d.hasGym ? { icon: GYM_DAY_STRIP_ICON, labelFr: 'gym', labelEn: 'gym day' } : null,
          d.isClubDay ? { icon: CLUB_DAY_STRIP_ICON, labelFr: 'entraînement club', labelEn: 'club training' } : null,
        ].filter(Boolean) as Array<{ icon: string; labelFr: string; labelEn: string }>
        const ariaDayLong = lang === 'fr' ? DAY_LONG[d.dow] : DAY_LONG_EN[d.dow]
        const ariaMarkers = dayMarkers.length
          ? `, ${dayMarkers.map((marker) => (lang === 'fr' ? marker.labelFr : marker.labelEn)).join(', ')}`
          : ''
        const ariaToday = d.isToday ? (lang === 'fr' ? ', aujourd’hui' : ', today') : ''
        const tooltip = dayMarkers.length
          ? dayMarkers.map((marker) => (lang === 'fr' ? marker.labelFr : marker.labelEn)).join(' + ')
          : undefined

        const cellClass = (() => {
          if (isActive) {
            return 'bg-brand text-app border-transparent'
          }
          if (hasMatch) {
            return 'bg-brand-soft text-fg border-brand'
          }
          if (dayMarkers.length) {
            return 'bg-brand-soft/30 text-fg border-brand-border'
          }
          return 'bg-transparent text-fg border-transparent'
        })()

        return (
          <button
            key={d.dow}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-label={`${ariaDayLong} ${d.dateNum}${ariaMarkers}${ariaToday}`}
            title={tooltip}
            onClick={() => onSelect(i)}
            className={`relative flex-1 rounded-[10px] border-[1.5px] py-2 text-center transition-colors rf-focus-ring ${cellClass}`}
          >
            {dayMarkers.length > 0 && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 z-[1] flex -translate-x-1/2 -translate-y-1/2 items-center gap-[2px] leading-none drop-shadow-[0_1px_0_var(--color-bg-app)] select-none"
              >
                {dayMarkers.map((marker) => (
                  <span key={marker.icon} className="text-[15px]">
                    {marker.icon}
                  </span>
                ))}
              </span>
            )}
            <div
              className={`text-[8px] font-bold uppercase tracking-[0.1em] ${isActive ? 'opacity-70' : 'opacity-50'}`}
            >
              {DAY_SHORT[d.dow]}
            </div>
            <div
              className="mt-1 text-[17px] font-extrabold tabular-nums"
              style={{ letterSpacing: '-0.5px' }}
            >
              {d.dateNum}
            </div>
            {d.isToday && !isActive && (
              <span
                aria-hidden
                className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-brand"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── FeatureCard switch ─────────────────────────────────────────────────────

interface FeatureCardSwitchProps {
  day: ResolvedDay
  lang: 'fr' | 'en'
  onSessionSelect: (index: number, options?: { reviewLogId?: string }) => void
  onSelectMatchByDate: (dateISO: string) => void
  onActiveRecoveryQuick?: (activity: string, dateISO: string) => void
}

function FeatureCardSwitch({
  day,
  onSessionSelect,
  onSelectMatchByDate,
  onActiveRecoveryQuick,
}: FeatureCardSwitchProps) {
  switch (day.type) {
    case 'match':
      return <MatchCard day={day} onClick={() => onSelectMatchByDate(day.dateISO)} />
    case 'gym':
      return (
        <GymCard
          day={day}
          onStart={() => {
            if (day.sessionIndex == null) return
            if (day.isCompleted && day.sessionLogId) {
              onSessionSelect(day.sessionIndex, { reviewLogId: day.sessionLogId })
            } else {
              onSessionSelect(day.sessionIndex)
            }
          }}
        />
      )
    case 'recovery':
      return <RecoveryCard day={day} onQuickLog={onActiveRecoveryQuick} />
    case 'unavailable':
      return <UnavailableCard day={day} />
    case 'rest':
    default:
      return <RestCard day={day} />
  }
}

// ─── Cartes ─────────────────────────────────────────────────────────────────

const CARD_BASE = 'relative overflow-hidden rounded-[24px] animate-rf-slide-up'

function GhostNumber({ n, onWine = false }: { n: string; onWine?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-5 -top-7 select-none font-extrabold leading-none tabular-nums"
      style={{
        fontSize: 220,
        letterSpacing: -10,
        color: onWine ? 'var(--color-bg-app)' : 'var(--color-accent)',
        opacity: onWine ? 0.08 : 0.06,
      }}
    >
      {n}
    </div>
  )
}

function CardTopMeta({
  tag,
  intensity,
  jLabel,
  isToday,
  darkMode = false,
}: {
  tag: string
  intensity?: number
  jLabel?: string
  isToday: boolean
  darkMode?: boolean
}) {
  const tone = darkMode ? 'wine' : 'cream'
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
        <span
          className={`text-[9px] font-extrabold uppercase tracking-[0.16em] whitespace-nowrap ${
            darkMode ? 'text-brand' : 'text-app/85'
          }`}
        >
          {tag}
        </span>
        {intensity != null && (
          <Pill tone={tone} size="xs">{`INT ${String(intensity).padStart(2, '0')}/05`}</Pill>
        )}
        {jLabel && (
          <Pill tone={tone} size="xs">
            {jLabel}
          </Pill>
        )}
      </div>
      {isToday && (
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] ${
            darkMode ? 'bg-brand text-app' : 'bg-app text-brand'
          }`}
        >
          Auj.
        </span>
      )}
    </div>
  )
}

// ── GymCard
function GymCard({ day, onStart }: { day: ResolvedDay; onStart: () => void }) {
  return (
    <div
      className={`${CARD_BASE} bg-brand text-app`}
      style={{ boxShadow: '0 12px 32px rgba(123, 13, 30, 0.18)' }}
    >
      <GhostNumber n={day.dateNum} onWine />
      <div className="relative px-5 pb-6 pt-5">
        <CardTopMeta
          tag="Gym · Musculation"
          isToday={day.isToday}
        />

        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-65">
            {DAY_LONG[day.dow]}
          </div>
          <div
            className="mt-1 font-extrabold leading-[0.95] text-[34px]"
            style={{ letterSpacing: '-1.2px' }}
          >
            {day.sessionLabel ?? 'Séance'}
          </div>
          {(day.sessionSubtitle || day.isLight) && (
            <div className="mt-2 text-[13px] font-medium opacity-75">
              {day.sessionSubtitle}
              {day.isLight ? (day.sessionSubtitle ? ' · allégée' : 'Allégée') : ''}
            </div>
          )}
        </div>

        {(day.blocs != null || day.durationMin != null) && (
          <div
            className="mt-4 grid grid-cols-3 border-t pt-3.5 gap-0"
            style={{ borderColor: 'rgba(245, 242, 238, 0.2)' }}
          >
            <FStat n={day.blocs != null ? String(day.blocs) : '—'} l="Blocs" />
            <FStat
              n={day.durationMin != null ? `${day.durationMin}'` : '—'}
              l={day.durationIsActual ? 'Durée réelle' : 'Durée prévue'}
            />
            <FStat n={day.isCompleted ? 'Faite' : day.isSkipped ? 'Skip' : 'À faire'} l="Statut" />
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onStart}
            disabled={day.sessionIndex == null}
            className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-[14px] bg-app text-brand text-[13px] font-extrabold uppercase tracking-[0.04em] active:scale-[0.97] transition-transform disabled:opacity-50 disabled:active:scale-100 rf-focus-ring"
          >
            <Icon name="play" size={11} color="var(--color-accent)" />
            {day.sessionLogId ? 'Revoir la séance' : 'Démarrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── RecoveryCard
function RecoveryCard({
  day,
  onQuickLog,
}: {
  day: ResolvedDay
  onQuickLog?: (activity: string, dateISO: string) => void
}) {
  const activities: Array<{ icon: IconName; label: string; duration: string; key: string }> = [
    { icon: 'walk', label: 'Marche', duration: "20-30'", key: 'walk' },
    { icon: 'bike', label: 'Vélo', duration: "15-20'", key: 'bike' },
    { icon: 'yoga', label: 'Mobi.', duration: "15-20'", key: 'yoga' },
    { icon: 'swim', label: 'Nat.', duration: "20-30'", key: 'swim' },
  ]
  return (
    <div className={`${CARD_BASE} bg-app text-fg border-[1.5px] border-brand`}>
      <GhostNumber n={day.dateNum} />
      <div className="relative px-5 pb-6 pt-5">
        <CardTopMeta tag="Récup active" isToday={day.isToday} darkMode />

        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand">
            {DAY_LONG[day.dow]}
          </div>
          <div
            className="mt-1 font-extrabold leading-[0.95] text-[30px] font-serif italic"
            style={{ letterSpacing: '-0.9px' }}
          >
            {day.arDone ? 'Récup faite.' : 'Récup active'}
          </div>
          <div className="mt-2 text-[13px] font-medium opacity-65">
            Accélère ta récup. Choisis ton activité.
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1.5 border-t border-fg/10 pt-3.5">
          {activities.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => onQuickLog?.(a.key, day.dateISO)}
              disabled={!onQuickLog || day.arDone}
              className="flex flex-col items-center gap-1 rounded-[12px] border border-fg/10 bg-app py-2.5 hover:border-brand transition-colors disabled:opacity-50 disabled:cursor-default rf-focus-ring"
            >
              <Icon name={a.icon} size={18} color="var(--color-accent)" strokeWidth={1.7} />
              <div className="text-[10px] font-bold">{a.label}</div>
              <div className="text-[9px] tabular-nums opacity-55">{a.duration}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── RestCard
function RestCard({ day }: { day: ResolvedDay }) {
  return (
    <div className={`${CARD_BASE} bg-paper-deep text-fg`}>
      <GhostNumber n={day.dateNum} />
      <div className="relative px-5 pb-6 pt-5">
        <CardTopMeta tag="Repos" isToday={day.isToday} darkMode />

        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand opacity-70">
            {DAY_LONG[day.dow]}
          </div>
          <div
            className="mt-1 font-serif italic font-extrabold leading-[0.95] text-[30px]"
            style={{ letterSpacing: '-0.9px' }}
          >
            Jour
            <br />
            de repos
          </div>
        </div>

        <div className="mt-4 border-t border-fg/10 pt-3 font-serif italic text-[13px] leading-relaxed opacity-70">
          Sommeil · hydratation · nutrition. La récup, c&apos;est l&apos;autre moitié.
        </div>
      </div>
    </div>
  )
}

// ── UnavailableCard
function UnavailableCard({ day }: { day: ResolvedDay }) {
  return (
    <div className={`${CARD_BASE} bg-paper-soft text-fg border border-fg/10`}>
      <GhostNumber n={day.dateNum} />
      <div className="relative px-5 pb-6 pt-5">
        <CardTopMeta tag="Indisponible" isToday={day.isToday} darkMode />
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand opacity-70">
            {DAY_LONG[day.dow]}
          </div>
          <div
            className="mt-1 font-extrabold leading-[0.95] text-[26px]"
            style={{ letterSpacing: '-0.7px' }}
          >
            Jour bloqué
          </div>
          <p className="mt-2 text-[13px] text-fg/65">
            Entraînement club ou indisponibilité programmée.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── MatchCard
function MatchCard({ day, onClick }: { day: ResolvedDay; onClick: () => void }) {
  const m = day.match!
  const venueLabel = m.is_neutral ? 'Neutre' : m.is_home ? 'Domicile' : 'Extérieur'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${CARD_BASE} block w-full text-left bg-fg text-app active:scale-[0.99] transition-transform rf-focus-ring`}
      style={{ boxShadow: '0 16px 36px rgba(0, 0, 0, 0.25)' }}
    >
      {/* Trame diagonale subtile */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent 0, transparent 8px, rgba(123,13,30,0.2) 8px, rgba(123,13,30,0.2) 9px)',
        }}
      />
      <div className="relative px-5 pb-6 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full bg-brand animate-rf-pulse"
              aria-hidden
            />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.16em]">
              Match-day
            </span>
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] opacity-70">
            {venueLabel}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3.5">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand text-app flex-shrink-0"
            style={{ boxShadow: '0 0 0 1.5px rgba(245,242,238,0.15)' }}
          >
            <Icon name="rugby-ball" size={32} color="var(--color-bg-app)" strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.14em] opacity-60">
              {DAY_LONG[day.dow]} {day.dateNum}
              {m.kickoff_time && ` · Coup d'envoi ${m.kickoff_time.slice(0, 5)}`}
            </div>
            <div
              className="mt-1 font-serif italic font-extrabold leading-tight text-[22px]"
              style={{ letterSpacing: '-0.6px' }}
            >
              vs. {m.opponent ?? 'Adversaire'}
            </div>
          </div>
        </div>

        <div
          className="mt-5 grid grid-cols-3 border-t pt-3.5 gap-0"
          style={{ borderColor: 'rgba(245, 242, 238, 0.15)' }}
        >
          <FStat n={m.kickoff_time ? m.kickoff_time.slice(0, 5) : '—'} l="Coup d'envoi" />
          <FStat n={venueLabel} l="Lieu" />
          <FStat n="J0" l="J-day" />
        </div>

        <div className="mt-4 flex gap-2">
          <span className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-[14px] bg-brand text-app text-[12px] font-extrabold uppercase tracking-[0.1em]">
            <Icon name="calendar" size={12} color="var(--color-bg-app)" /> Détails du match
          </span>
        </div>
      </div>
    </button>
  )
}

// ── FStat (used inside cards)
function FStat({ n, l }: { n: string; l: string }) {
  return (
    <div className="min-w-0">
      <div
        className="text-[18px] font-extrabold tabular-nums whitespace-nowrap overflow-hidden text-ellipsis"
        style={{ letterSpacing: '-0.5px' }}
      >
        {n}
      </div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] opacity-60">
        {l}
      </div>
    </div>
  )
}

// ─── IndexLine ──────────────────────────────────────────────────────────────

const TAG_BY_TYPE: Record<DayType, string> = {
  rest: 'Repos',
  gym: 'Gym',
  recovery: 'Récup',
  match: 'Match',
  unavailable: 'Bloqué',
}

function IndexLine({ num, day, onClick }: { num: number; day: ResolvedDay; onClick: () => void }) {
  const tag = TAG_BY_TYPE[day.type]
  const title =
    day.type === 'match'
      ? `vs. ${day.match?.opponent ?? 'Adversaire'}`
      : day.type === 'gym'
        ? day.sessionLabel ?? 'Séance'
        : day.type === 'recovery'
          ? day.arDone
            ? 'Récup faite'
            : 'Récup active'
          : day.type === 'unavailable'
            ? 'Jour bloqué'
            : 'Repos'
  const isDone = day.isCompleted || day.arDone
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-baseline gap-3.5 border-b border-paper-deep py-3.5 text-left rf-focus-ring"
    >
      <span className="min-w-[22px] text-[11px] font-bold tabular-nums tracking-[0.05em] text-brand">
        {String(num).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-fg/45">
            {DAY_LONG[day.dow].toUpperCase()} · {tag.toUpperCase()}
          </span>
          {day.type === 'match' && day.match?.is_home && (
            <span className="rounded-sm border border-brand px-1.5 py-px text-[9px] font-extrabold uppercase tracking-[0.08em] text-brand">
              Home
            </span>
          )}
          {isDone && <Icon name="check" size={11} color="var(--color-accent)" strokeWidth={2.4} />}
        </div>
        <div
          className={`mt-0.5 truncate text-[16px] font-bold ${isDone ? 'opacity-55 line-through decoration-[var(--color-accent)]' : ''}`}
          style={{ letterSpacing: '-0.3px' }}
        >
          {title}
        </div>
      </div>
      <span
        className="text-[24px] font-extrabold tabular-nums text-brand opacity-85"
        style={{ letterSpacing: '-0.6px' }}
      >
        {day.dateNum}
      </span>
    </button>
  )
}
