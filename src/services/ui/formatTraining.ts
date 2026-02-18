import type { TrainingBlock } from '../../types/training'

export type EmomDisplay = {
  minutes: number
  exoCount: number
  tours?: number
  label: string
}

const formatToursLabel = (tours: number, approximate: boolean) => {
  const label = `${tours} tour${tours > 1 ? 's' : ''}`
  return approximate ? `~${label}` : label
}

export const getEmomDisplay = (
  block: Pick<TrainingBlock, 'exercises'>,
  version: TrainingBlock['versions'][number]
): EmomDisplay | null => {
  if (version.scheme.kind !== 'emom') return null
  const minutes = version.scheme.minutes
  const exoCount = Math.max(1, block.exercises.length)
  if (exoCount <= 1) {
    return {
      minutes,
      exoCount,
      label: `EMOM ${minutes}'`
    }
  }

  const tours = Math.floor(minutes / exoCount)
  const approximate = minutes % exoCount !== 0
  const toursLabel = formatToursLabel(tours, approximate)

  return {
    minutes,
    exoCount,
    tours,
    label: `EMOM ${minutes}' — alterne ${exoCount} exos (${toursLabel})`
  }
}

export const formatBlockVolume = (version: TrainingBlock['versions'][number]): string => {
  if (version.scheme.kind === 'emom') {
    const work = version.scheme.work
    if (!work) return `EMOM ${version.scheme.minutes}'`
    if (work.kind === 'reps') {
      return `EMOM ${version.scheme.minutes}' · ${work.reps} reps`
    }
    return `EMOM ${version.scheme.minutes}' · ${work.seconds}s`
  }
  if (version.scheme.kind === 'time') {
    return `${version.sets}×${version.scheme.seconds}s`
  }

  const reps = version.scheme.reps
  const hasStructuredRepPattern = /[/+-]/.test(reps)
  if (hasStructuredRepPattern) {
    return `${version.sets}×(${reps})`
  }
  return `${version.sets}×${reps}`
}

export const formatEmomDetail = (
  version: TrainingBlock['versions'][number]
): string | null => {
  if (version.scheme.kind !== 'emom') return null
  const work = version.scheme.work
  if (!work) return null
  if (work.kind === 'reps') {
    return `Au debut de chaque minute: ${work.reps} reps.`
  }
  return `Au debut de chaque minute: ${work.seconds}s de travail.`
}

export const formatRest = (restSeconds: number): string => {
  const minutes = Math.floor(restSeconds / 60)
  const seconds = restSeconds % 60
  return `Repos ${minutes}:${String(seconds).padStart(2, '0')}`
}

export const formatRer = (rer?: number): string => (rer === undefined ? '' : `RER ${rer}`)
