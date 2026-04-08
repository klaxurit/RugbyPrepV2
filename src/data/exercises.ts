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
  youtubeEmbedUrl: string
  youtubeWatchUrl: string
  isCurated: boolean
  equipment: Exercise['equipment']
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

export const getExerciseDemo = (
  id: string,
  lang: ExerciseDemoLang = 'fr',
): ExerciseDemoContent | null => {
  const exercise = getExerciseById(id)
  if (!exercise) return null

  const demo = EXERCISE_DEMOS[id]
  // Curated demo (with cues) takes priority, then fall back to videoUrl from exercise data
  const youtubeUrl = demo?.youtubeUrl ?? exercise.videoUrl
  if (!youtubeUrl) return null

  const fallbackLang: ExerciseDemoLang = lang === 'fr' ? 'en' : 'fr'
  const cues = demo?.cues?.[lang] ?? demo?.cues?.[fallbackLang] ?? []

  return {
    exerciseId: id,
    title: getExerciseName(id, lang),
    notes: exercise.defaultNotes ?? exercise.notes,
    cues,
    youtubeEmbedUrl: buildYouTubeEmbedUrl(youtubeUrl, demo?.startSeconds),
    youtubeWatchUrl: buildYouTubeWatchUrl(youtubeUrl, demo?.startSeconds),
    isCurated: Boolean(demo?.youtubeUrl),
    equipment: exercise.equipment,
  }
}

export const hasExerciseDemo = (id: string): boolean => {
  if (EXERCISE_DEMOS[id]?.youtubeUrl) return true
  const exercise = getExerciseById(id)
  return Boolean(exercise?.videoUrl)
}
