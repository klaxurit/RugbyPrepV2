/**
 * Libellés des surfaces « programme » (bannières saison, scheduling, notices, coach).
 * Complète appLabels pour les textes longs / dynamiques.
 */
import type { AnnualCycle, OffSeasonPhase, PreSeasonPhase } from '../types/annualPlanning'
import type { SeasonTransition } from '../services/season/detectSeasonTransitions'
import { formatMatchDate, formatShortLocaleDate } from '../services/program/formatMatchDateFr'
import type { Lang } from './appLabels'

type L = { fr: string; en: string }

function pick(entry: L, lang: Lang): string {
  return entry[lang]
}

// ── Program change modal ─────────────────────────────────────────────

export const programModalLabels = {
  eyebrow: { fr: 'Ton programme évolue', en: 'Your program is evolving' },
  cta_ack: { fr: "C'est compris, on y va", en: "Got it, let's go" },
  cta_postpone: { fr: "Reporter d'une semaine", en: 'Postpone one week' },
  already_postponed: {
    fr: 'Tu as déjà reporté ce changement la semaine dernière.',
    en: 'You already postponed this change last week.',
  },
} as const satisfies Record<string, L>

export function programModalLabel(key: keyof typeof programModalLabels, lang: Lang): string {
  return pick(programModalLabels[key], lang)
}

// ── Program evolution sheet (defaults) ───────────────────────────────

export const programEvolutionDefaults = {
  eyebrow: programModalLabels.eyebrow,
  section_match: { fr: 'Semaine de match', en: 'Match week' },
  section_season_end: { fr: 'Fin de saison', en: 'End of season' },
  section_playoffs: { fr: 'Phase finale', en: 'Knockout phase' },
  cta_default: programModalLabels.cta_ack,
  bullet_1: {
    fr: "Charge réduite à mesure qu'on approche du match",
    en: 'Load tapers as match day approaches',
  },
  bullet_2: {
    fr: 'Dernière séance au moins 48h avant',
    en: 'Last session at least 48h before kickoff',
  },
  bullet_3: {
    fr: 'Mobilité et activation ajoutées',
    en: 'Mobility and activation added',
  },
  summary_calendar: {
    fr: 'Ton calendrier a été mis à jour — la semaine est calée pour arriver frais.',
    en: 'Your calendar was updated — the week is set up so you arrive fresh.',
  },
} as const

export function defaultProgramEvolutionBullets(lang: Lang): string[] {
  return [
    pick(programEvolutionDefaults.bullet_1, lang),
    pick(programEvolutionDefaults.bullet_2, lang),
    pick(programEvolutionDefaults.bullet_3, lang),
  ]
}

export function programEvolutionSectionTitle(
  type: 'match_changed' | 'season_ended' | 'playoffs_suggested',
  lang: Lang,
): string {
  switch (type) {
    case 'match_changed':
      return pick(programEvolutionDefaults.section_match, lang)
    case 'season_ended':
      return pick(programEvolutionDefaults.section_season_end, lang)
    case 'playoffs_suggested':
      return pick(programEvolutionDefaults.section_playoffs, lang)
  }
}

// ── Week snapshot toasts / confirmations ─────────────────────────────

export const weekSnapshotLabels = {
  toast_match_removed: {
    fr: 'Match retiré · Programme mis à jour',
    en: 'Match removed · Program updated',
  },
  toast_undo: { fr: 'Correction annulée', en: 'Change undone' },
  toast_updated: { fr: 'Programme mis à jour', en: 'Program updated' },
  toast_skip: { fr: 'Séance passée', en: 'Session skipped' },
  toast_unavailable: {
    fr: 'Jour indisponible · Séance déplacée',
    en: 'Day unavailable · Session moved',
  },
  confirm_match_changed: {
    fr: 'Un match de cette semaine a changé.',
    en: 'A match this week has changed.',
  },
  confirm_cta: {
    fr: 'Mettre à jour mon programme',
    en: 'Update my program',
  },
  pending_calendar: {
    fr: 'Calendrier mis à jour',
    en: 'Calendar updated',
  },
} as const

export function weekSnapshotLabel(
  key: Exclude<keyof typeof weekSnapshotLabels, 'reschedule'>,
  lang: Lang,
): string {
  return pick(weekSnapshotLabels[key], lang)
}

export function weekSnapshotRescheduleToast(day: string, lang: Lang): string {
  return lang === 'fr' ? `Séance reportée à ${day}` : `Session moved to ${day}`
}

const DAY_NAMES: Record<Lang, string[]> = {
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}

export function dayOfWeekLabel(dow: number, lang: Lang): string {
  return DAY_NAMES[lang][dow] ?? DAY_NAMES.fr[dow] ?? ''
}

// ── Scheduling transitions ───────────────────────────────────────────

export const schedulingTransitionLabels = {
  calendar_mode: {
    fr: "Match détecté — ton programme s'adapte à ton calendrier.",
    en: 'Match detected — your program adapts to your calendar.',
  },
  block_mode: {
    fr: 'Plus de match prévu — ton programme continue en mode progression.',
    en: 'No upcoming match — your program continues in progression mode.',
  },
  return_break: {
    fr: 'Content de te revoir ! Semaine de reprise progressive.',
    en: 'Good to see you back! Progressive return week.',
  },
  cta_ok: { fr: 'OK', en: 'OK' },
  cta_go: { fr: "C'est parti", en: "Let's go" },
} as const

export function schedulingTransitionLabel(
  key: keyof typeof schedulingTransitionLabels,
  lang: Lang,
): string {
  const entry = schedulingTransitionLabels[key]
  return typeof entry === 'string' ? entry : pick(entry, lang)
}

// ── Season transition banners ──────────────────────────────────────────

export const seasonBannerCta = {
  season_ended: { fr: 'Passer en inter-saison', en: 'Switch to off-season' },
  playoffs_suggested: { fr: 'Activer la phase finale', en: 'Enable knockout phase' },
  pre_season_suggested: { fr: 'Indiquer ma date de reprise', en: 'Set my return date' },
  match_confirm: { fr: 'Oui, ma saison reprend', en: 'Yes, my season resumes' },
  match_defer: { fr: 'Non, pas maintenant', en: 'Not now' },
  match_hide: { fr: "Ce n'est pas mon équipe", en: 'Not my team' },
  scheduling_ok: schedulingTransitionLabels.cta_ok,
  scheduling_go: schedulingTransitionLabels.cta_go,
} as const

export function seasonBannerCtaLabel(
  key: keyof typeof seasonBannerCta,
  lang: Lang,
): string {
  return pick(seasonBannerCta[key], lang)
}

export function seasonTransitionMessage(transition: SeasonTransition, lang: Lang): string {
  switch (transition.type) {
    case 'season_ended':
      return lang === 'fr'
        ? `Ta saison semble terminée — ${transition.daysSinceLastMatch}j depuis ton dernier match.`
        : `Your season looks over — ${transition.daysSinceLastMatch} days since your last match.`
    case 'treve_detected':
      if (transition.subMode === 'treve_deep') {
        return lang === 'fr'
          ? `Période de trêve (~${transition.gapWeeks} sem.). Le programme est adapté : bloc force opportuniste pour capitaliser sur cette pause.`
          : `Break period (~${transition.gapWeeks} wks). Program adapted: opportunistic strength block to use this pause.`
      }
      if (transition.subMode === 'treve_return') {
        return lang === 'fr'
          ? 'Reprise progressive cette semaine — intensité en rampe avant le retour en compétition.'
          : 'Progressive return this week — intensity ramps before competition resumes.'
      }
      if (transition.subMode === 'treve_rampup') {
        return lang === 'fr'
          ? 'Match imminent — programme allégé pour la ré-acclimation.'
          : 'Match soon — lighter program for re-acclimation.'
      }
      return lang === 'fr'
        ? `Période sans match détectée (~${transition.gapWeeks} sem.). Programme adapté automatiquement.`
        : `No-match period detected (~${transition.gapWeeks} wks). Program adapted automatically.`
    case 'playoffs_suggested':
      return lang === 'fr'
        ? "Phase finale ? Active le mode phase finale pour un programme d'affûtage."
        : 'Knockout phase? Enable knockout mode for a taper-focused program.'
    case 'pre_season_suggested':
      return transition.reason === 'calendar_date'
        ? lang === 'fr'
          ? 'La reprise approche. Indique ta date de retour au club pour lancer ta pré-saison.'
          : 'Return is coming. Set your club return date to start pre-season.'
        : lang === 'fr'
          ? 'Tu avances bien dans ton inter-saison. Prêt à lancer la pré-saison ?'
          : 'You are progressing in off-season. Ready to start pre-season?'
    case 'match_detected_in_offseason': {
      const when = formatShortLocaleDate(transition.matchDate, lang)
      return transition.opponent
        ? lang === 'fr'
          ? `Un match a été ajouté le ${when} contre ${transition.opponent}. Ta saison reprend ?`
          : `A match was added on ${when} vs ${transition.opponent}. Does your season resume?`
        : lang === 'fr'
          ? `Un match a été ajouté le ${when}. Ta saison reprend ?`
          : `A match was added on ${when}. Does your season resume?`
    }
  }
}

export function programNoticeMatchSummary(matchDateIso: string, lang: Lang): string {
  const when = formatMatchDate(matchDateIso, lang)
  return lang === 'fr'
    ? `Match prévu le ${when} — la semaine est calée pour arriver frais.`
    : `Match on ${when} — your week is set up so you arrive fresh.`
}

export function programNoticeOffSeasonPhaseTitle(lang: Lang): string {
  return lang === 'fr' ? "Nouvelle phase d'inter-saison" : 'New off-season phase'
}

export function programNoticePreSeasonPhaseTitle(lang: Lang): string {
  return lang === 'fr' ? 'Nouvelle phase de pré-saison' : 'New pre-season phase'
}

export function programNoticeOffSeasonPhaseSummary(
  from: OffSeasonPhase,
  to: OffSeasonPhase,
  lang: Lang,
): string {
  return lang === 'fr'
    ? `Tu passes de la phase ${offSeasonPhaseLabel(from, lang)} à ${offSeasonPhaseLabel(to, lang)}.`
    : `You move from ${offSeasonPhaseLabel(from, lang)} to ${offSeasonPhaseLabel(to, lang)}.`
}

export function programNoticePreSeasonPhaseSummary(
  from: PreSeasonPhase,
  to: PreSeasonPhase,
  lang: Lang,
): string {
  return lang === 'fr'
    ? `Tu passes de ${preSeasonPhaseLabel(from, lang)} à ${preSeasonPhaseLabel(to, lang)}.`
    : `You move from ${preSeasonPhaseLabel(from, lang)} to ${preSeasonPhaseLabel(to, lang)}.`
}

export function programNoticeDeloadTitle(lang: Lang): string {
  return lang === 'fr' ? 'Semaine de décharge' : 'Deload week'
}

export function programNoticeDeloadSummary(lang: Lang): string {
  return lang === 'fr'
    ? 'Cette semaine est la 4ᵉ du cycle 3:1 — volume et intensité réduits.'
    : 'This is week 4 of the 3:1 cycle — reduced volume and intensity.'
}

export function programNoticeDeloadBullets(lang: Lang): string[] {
  return lang === 'fr'
    ? [
        '−40% de volume environ',
        'Charges plus légères, focus sur la qualité',
        'Permet de capitaliser sur les 3 semaines précédentes',
      ]
    : [
        'Roughly −40% volume',
        'Lighter loads, focus on quality',
        'Capitalize on the previous 3 weeks',
      ]
}

export function programNoticeAcwrCritical(lang: Lang): {
  title: string
  summary: string
  bullets: string[]
} {
  return lang === 'fr'
    ? {
        title: "Charge d'entraînement très élevée",
        summary:
          'Ton ratio aigu/chronique est en zone critique. Le programme va réduire la charge cette semaine.',
        bullets: [
          '1 séance maximum cette semaine',
          'Privilégie mobilité et sommeil',
          'Reprise progressive la semaine prochaine',
        ],
      }
    : {
        title: 'Very high training load',
        summary:
          'Your acute/chronic ratio is critical. The program will reduce load this week.',
        bullets: [
          '1 session maximum this week',
          'Prioritize mobility and sleep',
          'Progressive return next week',
        ],
      }
}

export function programNoticeAcwrDanger(lang: Lang): {
  title: string
  summary: string
  bullets: string[]
} {
  return lang === 'fr'
    ? {
        title: "Charge d'entraînement élevée",
        summary:
          'Ton ratio aigu/chronique est en zone à risque. On retire une séance cette semaine.',
        bullets: [
          '−1 séance par rapport au programme prévu',
          "Garde de l'intensité mais réduit le volume",
          'Surveille ton sommeil et tes courbatures',
        ],
      }
    : {
        title: 'High training load',
        summary: 'Your acute/chronic ratio is at risk. One session removed this week.',
        bullets: [
          '−1 session vs planned program',
          'Keep intensity but reduce volume',
          'Watch sleep and soreness',
        ],
      }
}

export function programNoticeMatchWeek(
  matchDateIso: string,
  lang: Lang,
): { title: string; summary: string; bullets: string[] } {
  const when = formatMatchDate(matchDateIso, lang)
  return lang === 'fr'
    ? {
        title: 'Semaine de match',
        summary: `Match prévu le ${when} — la semaine est calée pour arriver frais.`,
        bullets: defaultProgramEvolutionBullets(lang),
      }
    : {
        title: 'Match week',
        summary: `Match on ${when} — your week is set up so you arrive fresh.`,
        bullets: defaultProgramEvolutionBullets(lang),
      }
}

export function phaseBulletsForNotice(
  cycle: AnnualCycle,
  phase: OffSeasonPhase | PreSeasonPhase,
  lang: Lang,
): string[] {
  if (cycle === 'off_season') {
    switch (phase as OffSeasonPhase) {
      case 1:
        return lang === 'fr'
          ? ['Volume très bas, focus mobilité', 'Récupération de la saison précédente', 'Pas de charges lourdes']
          : ['Very low volume, mobility focus', 'Recovery from last season', 'No heavy loads']
      case 2:
        return lang === 'fr'
          ? [
              'Réintroduction progressive du tonnage',
              'Mouvements composés à charge modérée',
              "Préparation pour l'hypertrophie",
            ]
          : [
              'Progressive tonnage reintroduction',
              'Compound lifts at moderate load',
              'Prep for hypertrophy',
            ]
      case 3:
        return lang === 'fr'
          ? ['Bloc principal de prise de muscle', 'Séries 8–12 reps, volume élevé', 'Tempo contrôlé']
          : ['Main muscle-gain block', '8–12 rep sets, high volume', 'Controlled tempo']
      case 4:
        return lang === 'fr'
          ? ['Bascule sur la force', 'Charges plus lourdes (4–6 reps)', 'Pont vers la pré-saison']
          : ['Shift to strength', 'Heavier loads (4–6 reps)', 'Bridge to pre-season']
      case 5:
        return lang === 'fr'
          ? ['Maintien acquis force/puissance', 'Volume modéré, qualité prioritaire']
          : ['Maintain strength/power gains', 'Moderate volume, quality first']
    }
  }
  if (cycle === 'pre_season') {
    switch (phase as PreSeasonPhase) {
      case 1:
        return lang === 'fr'
          ? [
              'Préparation générale (force, hypertrophie)',
              'Volume élevé, intensité modérée',
              'Construction des bases',
            ]
          : ['General prep (strength, hypertrophy)', 'High volume, moderate intensity', 'Build the base']
      case 2:
        return lang === 'fr'
          ? ['Préparation spécifique au rugby', 'Puissance, plyo, contrastes', 'Travail explosif']
          : ['Rugby-specific prep', 'Power, plyo, contrasts', 'Explosive work']
      case 3:
        return lang === 'fr'
          ? ['Affûtage avant le premier match', 'Volume réduit, intensité maintenue', 'Récupération prioritaire']
          : ['Taper before first match', 'Reduced volume, maintained intensity', 'Recovery priority']
    }
  }
  return []
}

// ── detectProgramChange labels ───────────────────────────────────────

export function cycleLabel(cycle: AnnualCycle, lang: Lang): string {
  const labels: Record<AnnualCycle, L> = {
    off_season: { fr: 'inter-saison', en: 'off-season' },
    pre_season: { fr: 'pré-saison', en: 'pre-season' },
    in_season: { fr: 'en saison', en: 'in-season' },
    playoffs: { fr: 'phase finale', en: 'knockout phase' },
  }
  return pick(labels[cycle], lang)
}

export function offSeasonPhaseLabel(phase: OffSeasonPhase, lang: Lang): string {
  const labels: Record<OffSeasonPhase, L> = {
    1: { fr: 'Récupération', en: 'Recovery' },
    2: { fr: 'Transition', en: 'Transition' },
    3: { fr: 'Hypertrophie', en: 'Hypertrophy' },
    4: { fr: 'Force-Pont', en: 'Strength bridge' },
    5: { fr: 'Entretien', en: 'Maintenance' },
  }
  return pick(labels[phase], lang)
}

export function preSeasonPhaseLabel(phase: PreSeasonPhase, lang: Lang): string {
  const labels: Record<PreSeasonPhase, L> = {
    1: { fr: 'Phase générale', en: 'General phase' },
    2: { fr: 'Phase spécifique', en: 'Specific phase' },
    3: { fr: 'Affûtage', en: 'Taper' },
  }
  return pick(labels[phase], lang)
}

export function describeCycleChangeBullets(
  from: AnnualCycle,
  to: AnnualCycle,
  lang: Lang,
): string[] {
  if (from === 'off_season' && to === 'pre_season') {
    return lang === 'fr'
      ? [
          'Travail de force et de puissance plus intense',
          'Volume légèrement réduit, charge plus lourde (4–5 reps)',
          'Première semaine = adaptation progressive',
        ]
      : [
          'Heavier strength and power work',
          'Slightly lower volume, heavier loads (4–5 reps)',
          'First week = progressive adaptation',
        ]
  }
  if (from === 'pre_season' && to === 'in_season') {
    return lang === 'fr'
      ? [
          'Bascule sur le cycle de match (3 semaines + 1 décharge)',
          'Volume ajusté autour des matchs',
          'Maintien de la force, puissance prioritaire',
        ]
      : [
          'Switch to match cycle (3 weeks + 1 deload)',
          'Volume adjusted around matches',
          'Strength maintained, power prioritized',
        ]
  }
  if (from === 'in_season' && to === 'off_season') {
    return lang === 'fr'
      ? [
          'Récupération active sur 1–2 semaines',
          'Volume réduit, intensité faible',
          "Reprise progressive de l'hypertrophie ensuite",
        ]
      : [
          'Active recovery for 1–2 weeks',
          'Reduced volume, low intensity',
          'Progressive return to hypertrophy after',
        ]
  }
  if (from === 'in_season' && to === 'pre_season') {
    return lang === 'fr'
      ? [
          'Reprise structurée sur 6–12 semaines',
          'Force et puissance en montée progressive',
          'Programme calé sur ta date de premier match',
        ]
      : [
          'Structured restart over 6–12 weeks',
          'Strength and power build progressively',
          'Program aligned to your first match date',
        ]
  }
  return lang === 'fr'
    ? [
        `Tu passes de ${cycleLabel(from, lang)} à ${cycleLabel(to, lang)}`,
        'Le programme s\'adapte automatiquement à ta nouvelle phase',
      ]
    : [
        `You move from ${cycleLabel(from, lang)} to ${cycleLabel(to, lang)}`,
        'The program adapts automatically to your new phase',
      ]
}

export function cycleChangeTitle(next: AnnualCycle, lang: Lang): string {
  return lang === 'fr'
    ? `Tu démarres ${cycleLabel(next, lang)} lundi`
    : `You start ${cycleLabel(next, lang)} on Monday`
}

export function cycleChangeSummary(from: AnnualCycle, to: AnnualCycle, lang: Lang): string {
  return lang === 'fr'
    ? `Ton programme change de cycle : ${cycleLabel(from, lang)} → ${cycleLabel(to, lang)}.`
    : `Your program changes cycle: ${cycleLabel(from, lang)} → ${cycleLabel(to, lang)}.`
}

// Coach insights
export type CoachInsightId =
  | 'highLoad'
  | 'tapering'
  | 'postMatch'
  | 'highCadence'
  | 'lowScore'
  | 'prolongedBreak'
  | 'underload'
  | 'baseline'

const COACH_INSIGHT_COPY: Record<CoachInsightId, { eyebrow: L; text: L }> = {
  highLoad: {
    eyebrow: { fr: 'Charge élevée', en: 'High load' },
    text: {
      fr: "ACWR au-dessus de 1.3. Allège l'intensité aujourd'hui — un bloc en moins, ça vaut mieux qu'une blessure dans deux semaines.",
      en: 'ACWR above 1.3. Ease intensity today — one less block beats an injury in two weeks.',
    },
  },
  tapering: {
    eyebrow: { fr: 'Affûtage', en: 'Taper' },
    text: {
      fr: 'Match dans 2 jours. Volume bas, intensité courte et nerveuse — tu dois sortir frais, pas vidé.',
      en: 'Match in 2 days. Low volume, short sharp intensity — arrive fresh, not emptied.',
    },
  },
  postMatch: {
    eyebrow: { fr: 'Lendemain de match', en: 'Day after match' },
    text: {
      fr: "Mobilité, marche active, hydratation. La vraie séance d'aujourd'hui, c'est ta récup.",
      en: 'Mobility, active walk, hydration. Today’s real session is recovery.',
    },
  },
  highCadence: {
    eyebrow: { fr: 'Cadence soutenue', en: 'High cadence' },
    text: {
      fr: '11 séances sur 14 jours. Ton corps encaisse — garde le cap mais place une vraie journée off cette semaine.',
      en: '11 sessions in 14 days. Your body is absorbing it — stay on plan but schedule a real off day this week.',
    },
  },
  lowScore: {
    eyebrow: { fr: 'Signal repos', en: 'Rest signal' },
    text: {
      fr: "Score sous 50. Aujourd'hui c'est mobilité, sommeil tôt, et on relance demain. Pas de héros.",
      en: 'Score under 50. Today is mobility, early sleep, back tomorrow. No heroics.',
    },
  },
  prolongedBreak: {
    eyebrow: { fr: 'Pause prolongée', en: 'Extended break' },
    text: {
      fr: "Plus d'une semaine sans charge significative. Le score en prudence est normal — reprends par des séances courtes, pas un gros bloc d'un coup.",
      en: 'Over a week without meaningful load. A cautious score is expected — restart with short sessions, not a big block all at once.',
    },
  },
  underload: {
    eyebrow: { fr: 'Charge basse', en: 'Low load' },
    text: {
      fr: "Volume en baisse — OK si c'est voulu. En remontée, garde l'intensité modérée et laisse le corps s'adapter.",
      en: 'Volume is down — fine if intentional. When building back, keep intensity moderate and let your body adapt.',
    },
  },
  baseline: {
    eyebrow: { fr: 'Tu es affûté', en: 'You are sharp' },
    text: {
      fr: "Charge bien encaissée, RPE stable. Tiens le plan — c'est exactement ce qu'on veut voir.",
      en: 'Load well absorbed, RPE stable. Stick to the plan — exactly what we want to see.',
    },
  },
}

export function coachInsightCopy(id: CoachInsightId, lang: Lang): { eyebrow: string; text: string } {
  const row = COACH_INSIGHT_COPY[id]
  return { eyebrow: pick(row.eyebrow, lang), text: pick(row.text, lang) }
}
