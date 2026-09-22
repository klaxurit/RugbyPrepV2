/**
 * Gamification — types partagés.
 *
 * Principe directeur (cf. `docs/gamification-competition-plan.md` § 3) : le
 * score récompense la **conformité au plan**, jamais le volume. Aucun terme de
 * la formule n'est indexé sur le tonnage, la charge en kg ou la valeur du RPE.
 * Indexer les points sur la quantité d'entraînement pousserait les athlètes
 * vers un ACWR > 1,5, que `src/knowledge/load-budgeting.md` classe en risque
 * élevé de blessure.
 */

/**
 * Périmètre de visibilité des données de gamification par les autres
 * athlètes. `private` est le défaut : aucune exposition sans opt-in explicite
 * et séparé des CGU.
 *
 * Volontairement sans mode « monde entier » nominatif.
 */
export type SocialVisibility = 'private' | 'club' | 'cohort'

/** Niveau cumulatif, dérivé de l'XP totale. Ne décroît jamais. */
export type AthleteLevel = 'espoir' | 'titulaire' | 'cadre' | 'capitaine' | 'legende'

/** Palier de ligue hebdomadaire, sujet à promotion et relégation. */
export type LeagueTier = 'reserve' | 'espoirs' | 'premiere' | 'federale' | 'elite'

/** Issue d'un athlète à la clôture d'une cohorte hebdomadaire. */
export type LeagueOutcome = 'promoted' | 'stayed' | 'relegated'

/**
 * Détail des points d'une semaine. Persisté en JSONB pour que l'UI puisse
 * expliquer chaque point au lieu d'afficher un total opaque.
 */
export interface WeeklyScoreBreakdown {
  /** Séances prévues au programme et complétées (plafonné au nombre prévu). */
  plannedSessions: number
  /** Séances hors plan créditées (une seule par semaine, 0 si ACWR en surcharge). */
  offPlanSessions: number
  /** Jours de repos prescrits respectés (J-1 / J+1 de match, plafonné à 2). */
  prescribedRest: number
  /** Bonus plan intégralement tenu. */
  fullPlanBonus: number
  /**
   * Compensation de semaine de décharge : porte une semaine de deload
   * respectée au niveau d'une semaine de charge respectée.
   */
  deloadCompensation: number
  /** Bonus de complétude des logs (RPE et durée renseignés partout). */
  logQualityBonus: number
  /** Bonus de régularité, proportionnel aux semaines consécutives tenues. */
  streakBonus: number
}

/** Score hebdomadaire calculé. Une ligne par (athlète × semaine). */
export interface WeeklyScore {
  /** Lundi de la semaine ISO, au format YYYY-MM-DD. */
  weekStartISO: string
  points: number
  sessionsPlanned: number
  sessionsCompleted: number
  /** Semaine de décharge menée correctement. */
  deloadRespected: boolean
  /**
   * L'athlète était en zone de surcharge (ACWR ≥ 1,5) : les séances hors plan
   * n'ont rien rapporté. Sert à afficher l'explication plutôt qu'un score
   * silencieusement amputé.
   */
  acwrCapped: boolean
  breakdown: WeeklyScoreBreakdown
}

/** État cumulatif d'un athlète. Une ligne par athlète. */
export interface GamificationProfile {
  totalXp: number
  level: AthleteLevel
  /** Semaines consécutives où le plan a été tenu. */
  currentWeekStreak: number
  longestWeekStreak: number
  /**
   * Date d'utilisation de la tolérance de streak (une semaine ratée
   * pardonnée). Évite le tout-ou-rien en cas de blessure ou de déplacement.
   */
  freezeUsedAt: string | null
  leagueTier: LeagueTier
  socialVisibility: SocialVisibility
}

/** Badge débloqué, avec la date réelle de déblocage. */
export interface UnlockedBadge {
  badgeId: string
  unlockedAt: string
}

/**
 * Entrée de classement. Liste blanche stricte : aucun champ de santé (RPE,
 * fatigue, blessures, poids, charges) ne transite par cette structure.
 */
export interface LeaderboardEntry {
  userId: string
  displayName: string
  avatarUrl: string | null
  /** Code FFR du club — sert au logo ; null si profil sans club. */
  clubCode: string | null
  clubName: string | null
  points: number
  sessionsCompleted: number
  /**
   * Jours depuis la dernière séance loguée. `null` = jamais logué.
   * Sert uniquement à l'indice de forme (glyphe hot / dormant) — pas une donnée de santé.
   */
  daysSinceLastSession: number | null
  level: AthleteLevel
  /** Rang dans le périmètre interrogé, 1-indexé. */
  rank: number
  isSelf: boolean
}

/** Cohorte de ligue hebdomadaire. */
export interface LeagueCohort {
  id: string
  weekStartISO: string
  tier: LeagueTier
  entries: LeaderboardEntry[]
  /** Rangs promus (1-indexés) pour cette taille de cohorte. */
  promotionCutoff: number
  /** Premier rang relégué (1-indexé) pour cette taille de cohorte. */
  relegationCutoff: number
}

/** Défi collectif de club sur une semaine. */
export interface ClubChallenge {
  clubCode: string
  weekStartISO: string
  target: number
  current: number
  participantCount: number
}

export type DuelStatus = 'pending' | 'active' | 'completed' | 'declined'

/** Duel volontaire entre deux athlètes sur une semaine. */
export interface Duel {
  id: string
  weekStartISO: string
  status: DuelStatus
  opponentDisplayName: string
  opponentAvatarUrl: string | null
  selfPoints: number
  opponentPoints: number
  /** True si l'athlète courant a lancé l'invitation. */
  isChallenger: boolean
}

/**
 * Nature d'un nudge social. Chaque type correspond à un **événement réel** :
 * si l'événement n'a pas eu lieu, aucun nudge n'est produit. Pas de relance
 * générique (cf. `PROJECT_RULES.md` § 5 — ne jamais inventer).
 */
export type NudgeKind =
  | 'level_up'
  | 'league_promotion'
  | 'league_overtaken'
  | 'duel_result'
  | 'duel_invite'
  | 'kudos_received'
  | 'club_pulse'
  | 'peer_emulation'

/** Nudge social prêt à être affiché. */
export interface SocialNudge {
  id: string
  kind: NudgeKind
  /** Titre court (eyebrow). */
  title: string
  /** Corps du message. Toujours un fait vérifiable. */
  body: string
  /** Lien d'action optionnel. */
  actionHref?: string
  actionLabel?: string
  createdAt: string
}
