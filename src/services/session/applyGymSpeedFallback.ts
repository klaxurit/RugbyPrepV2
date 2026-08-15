/**
 * Speed salle / maison — pas de piste requise.
 * Réécrit le bloc accélération si le profil n’a pas `sprint_track`.
 * Ne modifie pas le corpus mother sessions : appliqué dans prepareSessionForRender.
 */

import type { Exercise, MotherSession } from '../../types/motherSession'
import type { Equipment } from '../../types/training'

const TRACK_SPRINT_IDS = new Set([
  'sprint__short_acceleration',
  'sprint__free_acceleration',
  'sprint__resisted_acceleration',
])

const TRACK_SPRINT_NAME =
  /acceleration sprint|resisted acceleration|free acceleration|short acceleration|sprint accélération|accélération résistée|accélération libre/i

const NOTE_TOKEN = 'pas de piste requise'
const NOTE_FR =
  'Salle / maison : pas de piste requise. Mur + départs 3–5 pas. Les sprints 10–20 m restent dans Alternatives si tu as l’espace.'
const NOTE_EN =
  'Gym / home: no track required. Wall drill + 3–5 step starts. 10–20 m sprints stay in Alternatives if you have space.'

const COD_NOTE_TOKEN = 'Sans 15 m'
const COD_NOTE_FR =
  'Sans 15 m : T court ou départs 5 m — pas la navette complète.'
const COD_NOTE_EN =
  'Without 15 m: short T-drill or 5 m starts — skip the full shuttle.'

export function hasDeclaredSprintTrack(equipment: Equipment[] | undefined): boolean {
  return equipment?.includes('sprint_track') === true
}

function isTrackSprint(exo: Exercise): boolean {
  if (exo.exerciseId && TRACK_SPRINT_IDS.has(exo.exerciseId)) return true
  return TRACK_SPRINT_NAME.test(exo.name)
}

function isResisted(exo: Exercise): boolean {
  if (exo.exerciseId === 'sprint__resisted_acceleration') return true
  return /resisted|résistée/i.test(exo.name)
}

function isCodBlock(block: MotherSession['blocks'][number]): boolean {
  const blob = `${block.name} ${block.exercises.map((e) => e.name).join(' ')}`
  return /5-10-5|shuttle|navette|COD|changement de direction|lateral shuffle/i.test(blob)
}

function gymAccelReplacement(
  exo: Exercise,
  equipment: Equipment[] | undefined,
  lang: 'fr' | 'en',
): Exercise {
  if (isResisted(exo) && equipment?.includes('band')) {
    return {
      ...exo,
      name: lang === 'en' ? 'Band-resisted acceleration' : 'Accélération résistée (bande)',
      exerciseId: 'sprint__resisted_acceleration',
      prescription: lang === 'en' ? '4–6 × 6–8 m' : '4–6 × 6–8 m',
    }
  }
  if (isResisted(exo)) {
    return {
      ...exo,
      name: lang === 'en' ? 'Wall drill march' : 'Montées de genoux contre le mur',
      exerciseId: 'warmup__wall_drill_march',
      prescription: lang === 'en' ? '3×6/side' : '3×6/côté',
    }
  }
  return {
    ...exo,
    name: lang === 'en' ? 'Falling start (3–5 steps)' : 'Départ penché (3–5 pas)',
    exerciseId: 'sprint__falling_start_short',
    prescription: '6 reps',
  }
}

function upsertNote(notes: string[], token: string, note: string): string[] {
  if (notes.some((n) => n.includes(token))) {
    return notes.map((n) => (n.includes(token) ? note : n))
  }
  return [...notes, note]
}

function mergeFallbackLines(
  existing: string[] | undefined,
  incoming: string[],
): string[] {
  const next = [...(existing ?? [])]
  for (const line of incoming) {
    if (!next.includes(line)) next.push(line)
  }
  return next
}

/**
 * Remplace les accels 10–20 m par le fallback espace réduit
 * sauf si le joueur a déclaré une piste.
 */
export function applyGymSpeedFallback(
  session: MotherSession,
  equipment: Equipment[] | undefined,
  lang: 'fr' | 'en' = 'fr',
): MotherSession {
  if (session.metadata.sessionType !== 'speed_power') return session
  if (hasDeclaredSprintTrack(equipment)) return session

  const accelNote = lang === 'en' ? NOTE_EN : NOTE_FR
  const codNote = lang === 'en' ? COD_NOTE_EN : COD_NOTE_FR
  let touched = false

  const blocks = session.blocks.map((block) => {
    let next = block
    const hasTrackSprint = block.exercises.some(isTrackSprint)
    if (hasTrackSprint) {
      touched = true
      const originals = next.exercises.filter(isTrackSprint)
      const altLines = originals.map((exo) =>
        lang === 'en'
          ? `If you have 10–15 m: \`${exo.name}\`.`
          : `Si tu as 10–15 m : \`${exo.name}\`.`,
      )
      next = {
        ...next,
        exercises: next.exercises.map((exo) =>
          isTrackSprint(exo) ? gymAccelReplacement(exo, equipment, lang) : exo,
        ),
        coachingNotes: upsertNote(next.coachingNotes ?? [], NOTE_TOKEN, accelNote),
        fallbackOptions: mergeFallbackLines(next.fallbackOptions, altLines),
      }
    }
    if (isCodBlock(next)) {
      touched = true
      next = {
        ...next,
        coachingNotes: upsertNote(next.coachingNotes ?? [], COD_NOTE_TOKEN, codNote),
      }
    }
    return next
  })

  return touched ? { ...session, blocks } : session
}
