import exercises from './exercices.v1.json'
import type { Exercise } from '../types/training'
import { EXERCISE_DEMOS, type ExerciseDemoLang } from './exerciseDemos'

export const exercisesList = exercises as Exercise[]

const exercisesById = new Map<string, Exercise>()

for (const exercise of exercisesList) {
  const primaryId = exercise.exerciseId ?? exercise.id
  if (primaryId) exercisesById.set(primaryId, exercise)
  if (exercise.id && exercise.exerciseId && exercise.id !== exercise.exerciseId) {
    exercisesById.set(exercise.id, exercise)
  }
}

export const getExerciseById = (id: string): Exercise | undefined => exercisesById.get(id)

export const getExerciseName = (id: string, lang: 'fr' | 'en' = 'fr'): string => {
  const exercise = getExerciseById(id)
  if (!exercise) return id
  if (lang === 'en') return exercise.name ?? exercise.nameFr ?? id
  return exercise.nameFr ?? exercise.name ?? id
}

export interface ExerciseDemoContent {
  exerciseId: string
  title: string
  notes?: string
  cues: string[]
  youtubeEmbedUrl: string | null
  youtubeWatchUrl: string | null
  isCurated: boolean
  equipment: Exercise['equipment']
  /** Vidéo d’une variante proche (ex. bilatéral pour unilatéral). */
  isFallbackVariant?: boolean
  fallbackOfId?: string
  /** Pas de vidéo : consignes texte seulement. */
  textOnly?: boolean
}

/** Variantes sans démo → démo bilatérale / proche. */
const DEMO_FALLBACK_BY_ID: Record<string, string> = {
  hinge__hip_thrust__bodyweight: 'hinge__hip_thrust__barbell',
}

function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id || null
    }

    if (host.endsWith('youtube.com')) {
      if (parsed.pathname.startsWith('/watch')) {
        return parsed.searchParams.get('v')
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/').filter(Boolean)[1]
        return id || null
      }
      if (parsed.pathname.startsWith('/embed/')) {
        const id = parsed.pathname.split('/').filter(Boolean)[1]
        return id || null
      }
    }
  } catch {
    return null
  }

  return null
}

function buildYouTubeEmbedUrl(url: string, startSeconds?: number): string {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) return url

  const embed = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`)
  embed.searchParams.set('rel', '0')
  embed.searchParams.set('modestbranding', '1')
  embed.searchParams.set('mute', '1')
  if (startSeconds && startSeconds > 0) {
    embed.searchParams.set('start', String(startSeconds))
  }
  return embed.toString()
}

function buildYouTubeWatchUrl(url: string, startSeconds?: number): string {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) return url

  const watch = new URL('https://www.youtube.com/watch')
  watch.searchParams.set('v', videoId)
  if (startSeconds && startSeconds > 0) {
    watch.searchParams.set('t', `${startSeconds}s`)
  }
  return watch.toString()
}

export const hasExerciseDemo = (id: string): boolean => {
  if (EXERCISE_DEMOS[id]?.youtubeUrl) return true
  const exercise = getExerciseById(id)
  return Boolean(exercise?.videoUrl)
}

export function resolveDemoFallbackId(exerciseId: string): string | null {
  if (DEMO_FALLBACK_BY_ID[exerciseId]) return DEMO_FALLBACK_BY_ID[exerciseId]
  const stripped = exerciseId
    .replace(/__single_leg(?:__|$)/, '__')
    .replace(/__unilateral(?:__|$)/, '__')
    .replace(/_single_leg$/, '')
    .replace(/__$/, '')
  if (stripped !== exerciseId && hasExerciseDemo(stripped)) return stripped
  return null
}

/** Corpus sans démo vidéo (curated ni videoUrl). */
export function listExercisesMissingDemo(): Exercise[] {
  return exercisesList.filter((ex) => {
    const id = ex.exerciseId ?? ex.id
    return id ? !hasExerciseDemo(id) : true
  })
}

function buildDemoContent(
  id: string,
  lang: ExerciseDemoLang,
  opts?: { isFallbackVariant?: boolean; fallbackOfId?: string },
): ExerciseDemoContent | null {
  const exercise = getExerciseById(id)
  if (!exercise) return null

  const demo = EXERCISE_DEMOS[id]
  const youtubeUrl = demo?.youtubeUrl ?? exercise.videoUrl
  const fallbackLang: ExerciseDemoLang = lang === 'fr' ? 'en' : 'fr'
  const cues = demo?.cues?.[lang] ?? demo?.cues?.[fallbackLang] ?? []
  const notes = exercise.defaultNotes ?? exercise.notes

  if (!youtubeUrl) {
    if (!notes && cues.length === 0) return null
    return {
      exerciseId: id,
      title: getExerciseName(id, lang),
      notes,
      cues,
      youtubeEmbedUrl: null,
      youtubeWatchUrl: null,
      isCurated: false,
      equipment: exercise.equipment,
      textOnly: true,
      isFallbackVariant: opts?.isFallbackVariant,
      fallbackOfId: opts?.fallbackOfId,
    }
  }

  return {
    exerciseId: id,
    title: getExerciseName(id, lang),
    notes,
    cues,
    youtubeEmbedUrl: buildYouTubeEmbedUrl(youtubeUrl, demo?.startSeconds),
    youtubeWatchUrl: buildYouTubeWatchUrl(youtubeUrl, demo?.startSeconds),
    isCurated: Boolean(demo?.youtubeUrl),
    equipment: exercise.equipment,
    isFallbackVariant: opts?.isFallbackVariant,
    fallbackOfId: opts?.fallbackOfId,
  }
}

/**
 * Démo de l’exo, sinon variante bilatérale, sinon consignes texte.
 * Toujours un contenu joueur quand l’exo existe.
 */
export const getExerciseDemo = (
  id: string,
  lang: ExerciseDemoLang = 'fr',
): ExerciseDemoContent | null => {
  const direct = buildDemoContent(id, lang)
  if (direct && !direct.textOnly) return direct

  const fallbackId = resolveDemoFallbackId(id)
  if (fallbackId) {
    const fallback = buildDemoContent(fallbackId, lang, {
      isFallbackVariant: true,
      fallbackOfId: id,
    })
    if (fallback && !fallback.textOnly) {
      const original = getExerciseById(id)
      return {
        ...fallback,
        title: getExerciseName(id, lang),
        notes:
          (lang === 'fr'
            ? `Variante proche : ${getExerciseName(fallbackId, 'fr')}. Même intention, un appui ou charge différente.`
            : `Close variant: ${getExerciseName(fallbackId, 'en')}. Same intent, different stance or load.`) +
          (original?.defaultNotes || original?.notes
            ? `\n${original.defaultNotes ?? original.notes}`
            : ''),
      }
    }
  }

  return direct
}
