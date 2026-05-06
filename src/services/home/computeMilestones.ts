import type { SessionLog } from '../../types/training'
import type { IconName } from '../../components/ui/Icon'

export type MilestoneTone = 'gold' | 'wine' | 'green'

export interface Milestone {
  id: string
  icon: IconName
  tone: MilestoneTone
  /** Titre court (1-2 mots, gras). */
  title: string
  /** Sous-titre meta (catégorie / contexte). */
  sub: string
  /** Affiche le badge "Nouveau" — true si la condition a été remplie dans les 7 derniers jours. */
  isNew?: boolean
  /**
   * Placeholder verrouillé : jalon pas encore débloqué, affiché en grisé pour
   * suggérer la progression. Mutuellement exclusif avec `isNew`.
   */
  locked?: boolean
}

const NEW_WINDOW_DAYS = 7

interface ComputeContext {
  logs: readonly SessionLog[]
  todayISO: string
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T12:00:00`).getTime()
  const to = new Date(`${toISO}T12:00:00`).getTime()
  return Math.round((to - from) / 86_400_000)
}

/**
 * Vrai si l'événement déclencheur date d'<= 7j → affiche le tag "Nouveau".
 * `triggerDateISO` = la date à laquelle le seuil a été atteint (ex: la date
 * de la 10e séance pour le jalon "10 séances").
 */
function isFresh(triggerDateISO: string | null, todayISO: string): boolean {
  if (!triggerDateISO) return false
  const days = daysBetween(triggerDateISO, todayISO)
  return days >= 0 && days <= NEW_WINDOW_DAYS
}

/**
 * Date à laquelle le N-ième log (chronologiquement) a été enregistré, ou null
 * si on n'a pas atteint N. Retourne YYYY-MM-DD.
 */
function dateOfNthLog(logs: readonly SessionLog[], n: number): string | null {
  if (logs.length < n) return null
  const sorted = [...logs].sort((a, b) => a.dateISO.localeCompare(b.dateISO))
  return sorted[n - 1].dateISO.slice(0, 10)
}

/**
 * Compte de semaines ISO distinctes contenant au moins une séance loguée
 * dans les 30 derniers jours. Utilisé pour le jalon "régularité".
 */
function consecutiveWeeksWithLog(logs: readonly SessionLog[], todayISO: string): number {
  const today = new Date(`${todayISO}T12:00:00`)
  const weekKey = (iso: string) => {
    // Semaine ISO simplifiée : on regroupe par lundi-de-cette-semaine.
    const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
    d.setDate(d.getDate() - dow)
    return d.toISOString().slice(0, 10)
  }
  const weeksWithLog = new Set(logs.map((l) => weekKey(l.dateISO)))

  let consecutive = 0
  for (let w = 0; w < 12; w++) {
    const ref = new Date(today)
    ref.setDate(ref.getDate() - w * 7)
    const key = weekKey(ref.toISOString())
    if (weeksWithLog.has(key)) {
      consecutive += 1
    } else if (w > 0) {
      // Tolérance : la semaine en cours peut être "en construction"
      break
    }
  }
  return consecutive
}

/**
 * Total cumulé de minutes loguées (logs.durationMin) — pour le jalon "X heures jouées".
 */
function totalMinutes(logs: readonly SessionLog[]): number {
  let sum = 0
  for (const l of logs) sum += l.durationMin ?? 0
  return sum
}

/**
 * Construit la liste des jalons à afficher (max 6, ordre de priorité).
 *
 * Tous les jalons sont calculés depuis les logs réels — pas d'invention.
 * Note : "1ère victoire" du design d'origine n'est pas calculable (pas de
 * scores stockés en base), remplacé par "1ère séance complétée".
 */
export function computeMilestones(ctx: ComputeContext): Milestone[] {
  const { logs, todayISO } = ctx
  const out: Milestone[] = []

  // ── 1. Première séance ─────────────────────────────────────────────
  const firstSessionDate = dateOfNthLog(logs, 1)
  if (firstSessionDate) {
    out.push({
      id: 'first-session',
      icon: 'star',
      tone: 'wine',
      title: '1ère séance',
      sub: 'Premier pas',
      isNew: isFresh(firstSessionDate, todayISO),
    })
  }

  // ── 2. Cap des 10 séances (cadence installée) ──────────────────────
  const tenthSessionDate = dateOfNthLog(logs, 10)
  if (tenthSessionDate) {
    out.push({
      id: 'ten-sessions',
      icon: 'flame',
      tone: 'gold',
      title: '10 séances',
      sub: 'Cadence',
      isNew: isFresh(tenthSessionDate, todayISO),
    })
  }

  // ── 3. Cap des 25 séances ──────────────────────────────────────────
  const twentyFifthDate = dateOfNthLog(logs, 25)
  if (twentyFifthDate) {
    out.push({
      id: 'twentyfive-sessions',
      icon: 'trophy',
      tone: 'gold',
      title: '25 séances',
      sub: 'Cap franchi',
      isNew: isFresh(twentyFifthDate, todayISO),
    })
  }

  // ── 4. Régularité (4+ semaines consécutives loguées) ───────────────
  const weeks = consecutiveWeeksWithLog(logs, todayISO)
  if (weeks >= 4) {
    out.push({
      id: 'regular-weeks',
      icon: 'medal',
      tone: 'green',
      title: 'Régulier',
      sub: `${weeks} sem. d'affilée`,
    })
  }

  // ── 5. Heures cumulées (palier 25h, 50h, 100h) ─────────────────────
  const minutes = totalMinutes(logs)
  const hours = Math.floor(minutes / 60)
  const tier = hours >= 100 ? 100 : hours >= 50 ? 50 : hours >= 25 ? 25 : null
  if (tier !== null) {
    out.push({
      id: `hours-${tier}`,
      icon: 'bolt',
      tone: 'green',
      title: `${tier}h cumulées`,
      sub: 'Volume saison',
    })
  }

  // ── 6. 50e séance ──────────────────────────────────────────────────
  const fiftiethDate = dateOfNthLog(logs, 50)
  if (fiftiethDate) {
    out.push({
      id: 'fifty-sessions',
      icon: 'trophy',
      tone: 'wine',
      title: '50 séances',
      sub: 'Inarrêtable',
      isNew: isFresh(fiftiethDate, todayISO),
    })
  }

  // ─── Placeholders "à débloquer" ──────────────────────────────────────
  // Si l'utilisateur a peu de jalons réels (<4), on complète avec des
  // placeholders verrouillés pour donner du contexte de progression et
  // éviter une strip avec une seule card seule.
  const unlockedIds = new Set(out.map((m) => m.id))
  const candidates: Milestone[] = []

  if (!unlockedIds.has('ten-sessions')) {
    candidates.push({
      id: 'placeholder-ten-sessions',
      icon: 'flame',
      tone: 'gold',
      title: '10 séances',
      sub: 'Cadence',
      locked: true,
    })
  }
  if (!unlockedIds.has('regular-weeks')) {
    candidates.push({
      id: 'placeholder-regular-weeks',
      icon: 'medal',
      tone: 'green',
      title: 'Régulier',
      sub: '4 sem. d\'affilée',
      locked: true,
    })
  }
  if (!unlockedIds.has('twentyfive-sessions')) {
    candidates.push({
      id: 'placeholder-twentyfive-sessions',
      icon: 'trophy',
      tone: 'gold',
      title: '25 séances',
      sub: 'Cap franchi',
      locked: true,
    })
  }
  // Heures cumulées : prochain palier non atteint.
  const nextHourTier = hours >= 50 ? 100 : hours >= 25 ? 50 : 25
  if (hours < nextHourTier) {
    candidates.push({
      id: `placeholder-hours-${nextHourTier}`,
      icon: 'bolt',
      tone: 'green',
      title: `${nextHourTier}h cumulées`,
      sub: 'Volume saison',
      locked: true,
    })
  }
  if (!unlockedIds.has('fifty-sessions') && unlockedIds.has('twentyfive-sessions')) {
    candidates.push({
      id: 'placeholder-fifty-sessions',
      icon: 'trophy',
      tone: 'wine',
      title: '50 séances',
      sub: 'Inarrêtable',
      locked: true,
    })
  }

  // Tri unlocked first (isNew d'abord), puis on complète avec des locked
  // jusqu'à viser ~4 jalons visibles minimum (max 6 au total).
  const sorted = out.sort(
    (a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false),
  )
  const TARGET = 4
  const HARD_MAX = 6
  const result = [...sorted]
  if (result.length < TARGET) {
    const slotsRemaining = TARGET - result.length
    result.push(...candidates.slice(0, slotsRemaining))
  }
  return result.slice(0, HARD_MAX)
}
