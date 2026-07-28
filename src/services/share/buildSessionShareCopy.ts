import { formatTonnage } from '../home/formatTonnage'
import type { Lang } from '../../i18n/appLabels'
import { resolveSessionShareDifficulty } from './resolveSessionShareDifficulty'
import {
  SESSION_SHARE_LANDING_URL,
  type SessionSharePayload,
} from './sessionShareTypes'

export function formatShareDuration(min: number, lang: Lang): string {
  const safe = Math.max(0, Math.round(min))
  return lang === 'en' ? `${safe} min` : `${safe} min`
}

export function formatShareSets(completed: number, total: number): string {
  if (total > 0) return `${completed}/${total}`
  return String(completed)
}

export function formatShareTonnage(kg: number | null): string | null {
  if (kg == null || kg <= 0) return null
  return formatTonnage(kg)
}

export function formatShareFatigue(
  fatigue: SessionSharePayload['fatigue'],
  lang: Lang,
): string {
  if (fatigue === 'FATIGUE') {
    return lang === 'en' ? 'Fatigued' : 'Fatigué'
  }
  return lang === 'en' ? 'Feeling good' : 'En forme'
}

/** Texte court accompagnant l’image (WhatsApp, Messages, etc.). */
export function buildSessionShareText(payload: SessionSharePayload): string {
  const { lang } = payload
  const difficulty = resolveSessionShareDifficulty(payload.rpe, lang, payload.firstName)
  const parts: string[] = []

  parts.push(payload.congratLine)
  parts.push(payload.purposeLine)

  if (lang === 'en') {
    parts.push(`Just finished: ${payload.sessionLabel}`)
    parts.push(
      `${formatShareDuration(payload.durationMin, lang)} · ${formatShareSets(payload.completedSets, payload.totalSets)} sets · ${difficulty.label} (${difficulty.detail})`,
    )
    parts.push(`Form: ${formatShareFatigue(payload.fatigue, lang)}`)
    if (payload.isPremium) {
      const tonnage = formatShareTonnage(payload.tonnageKg)
      if (tonnage) parts.push(`Volume ${tonnage}`)
      if (payload.exerciseMaxLoads.length > 0) {
        const top = payload.exerciseMaxLoads
          .slice(0, 3)
          .map((e) => `${e.exerciseName} ${e.maxKg} kg`)
          .join(' · ')
        parts.push(`Session max: ${top}`)
      }
      if (payload.prs.length > 0) {
        parts.push(
          payload.prs.length === 1
            ? `PR: ${payload.prs[0]!.exerciseName} ${payload.prs[0]!.newBestKg} kg`
            : `${payload.prs.length} PRs 💪`,
        )
      }
    }
    parts.push(`Forge your prep with RugbyForge → ${SESSION_SHARE_LANDING_URL}`)
  } else {
    parts.push(`Séance terminée : ${payload.sessionLabel}`)
    parts.push(
      `${formatShareDuration(payload.durationMin, lang)} · ${formatShareSets(payload.completedSets, payload.totalSets)} sets · ${difficulty.label} (${difficulty.detail})`,
    )
    parts.push(`Forme : ${formatShareFatigue(payload.fatigue, lang)}`)
    if (payload.isPremium) {
      const tonnage = formatShareTonnage(payload.tonnageKg)
      if (tonnage) parts.push(`Volume ${tonnage}`)
      if (payload.exerciseMaxLoads.length > 0) {
        const top = payload.exerciseMaxLoads
          .slice(0, 3)
          .map((e) => `${e.exerciseName} ${e.maxKg} kg`)
          .join(' · ')
        parts.push(`Max séance : ${top}`)
      }
      if (payload.prs.length > 0) {
        parts.push(
          payload.prs.length === 1
            ? `Record : ${payload.prs[0]!.exerciseName} ${payload.prs[0]!.newBestKg} kg`
            : `${payload.prs.length} records 💪`,
        )
      }
    }
    parts.push(`Forge ta prépa avec RugbyForge → ${SESSION_SHARE_LANDING_URL}`)
  }

  return parts.join('\n')
}

export function buildSessionShareFilename(payload: SessionSharePayload): string {
  const slug = payload.sessionLabel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const date = new Date().toISOString().slice(0, 10)
  return `rugbyforge-${slug || 'session'}-${date}.png`
}
