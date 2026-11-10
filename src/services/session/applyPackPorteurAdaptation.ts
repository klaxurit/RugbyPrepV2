/**
 * Plan A — DNA pack « porteur » (2ᵉ / 3ᵉ ligne) sur mothers FRONT_ROW
 * (pré Power + Primer + Full). Pas de nouvelles mothers, pas d’UI.
 *
 * Remplace Zercher / neck-first / projection pilier par carry, rotation,
 * accélération horizontale. Accents Contact + vague Bench inchangés (appliqués après).
 */

import type { ContentFamily } from '../../data/contentFamily'
import type { Block, MotherSession } from '../../types/motherSession'

type SessionExercise = Block['exercises'][number]

const PORTEUR_FAMILIES: ReadonlySet<ContentFamily> = new Set(['back_row', 'second_row'])

const ZERCHER = /zercher/i
const NECK = /neck|cou\b|cervical|banded neck/i
const BOX_SQUAT = /^box squat$/i
const BANDED_SWING = /banded (?:kettlebell |kb )?swing/i
const CMJ = /countermovement jump/i
const FRONT_ROW_TOKEN = /front[-\s]?row|premi[eè]res? lignes?|1[eè]re ligne|avants?\b/i

export function isPackPorteurFamily(family: ContentFamily | null | undefined): boolean {
  return family != null && PORTEUR_FAMILIES.has(family)
}

export function isPackPorteurEligibleSession(session: MotherSession): boolean {
  const id = session.metadata.id
  if (!/_FRONT_ROW/i.test(id)) return false
  return (
    /_PRESEASON_POWER_FRONT_ROW/i.test(id) ||
    /FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW/i.test(id) ||
    /FULL_BODY_IN_SEASON_FRONT_ROW/i.test(id)
  )
}

function familyWord(family: ContentFamily, lang: 'fr' | 'en'): string {
  if (lang === 'en') {
    return family === 'second_row' ? 'second-row' : 'back-row'
  }
  return family === 'second_row' ? '2ème ligne' : '3ème ligne'
}

function rewriteIdentityText(text: string, family: ContentFamily, lang: 'fr' | 'en'): string {
  const label = familyWord(family, lang)
  return text
    .replace(/front-row/gi, label)
    .replace(/Front-row/g, label.charAt(0).toUpperCase() + label.slice(1))
    .replace(/premi[eè]res? lignes?/gi, label)
    .replace(/\bAvants\b/gi, lang === 'fr' ? 'Pack' : 'Pack')
    .replace(/1[eè]re ligne/gi, label)
}

function rewriteExo(exo: SessionExercise, lang: 'fr' | 'en'): SessionExercise {
  const name = exo.name
  // Zercher → Farmer (porteur = portage dynamique, pas projection mêlée).
  if (ZERCHER.test(name)) {
    return {
      ...exo,
      name: lang === 'en' ? 'Farmer Carry' : 'Marche du fermier',
      exerciseId: 'carry__farmer_walk__dumbbell',
      prescription: exo.prescription?.includes('20') ? exo.prescription : '20m',
    }
  }
  // Neck (y compris isométries Full support) → rotation landmine.
  if (NECK.test(name)) {
    return {
      ...exo,
      name: lang === 'en' ? 'Landmine Rotation' : 'Rotation à la landmine',
      exerciseId: 'core_rotation__landmine_rotation',
      prescription: /side|côté/i.test(exo.prescription ?? '')
        ? exo.prescription!
        : lang === 'en'
          ? '3-4/side'
          : '3-4/côté',
    }
  }
  if (BANDED_SWING.test(name)) {
    return {
      ...exo,
      name: 'Broad Jump',
      exerciseId: 'power__jump__broad_jump',
      prescription: '3 reps',
    }
  }
  if (CMJ.test(name)) {
    return {
      ...exo,
      name: 'Split Jump',
      exerciseId: 'power__split_jump__bodyweight',
      prescription: '2-3/side',
    }
  }
  return exo
}

function adaptLowerPowerCluster(block: Block, lang: 'fr' | 'en'): Block {
  const exercises = block.exercises.map((exo, i) => {
    if (i === 0 && BOX_SQUAT.test(exo.name.trim())) {
      return {
        ...exo,
        name: lang === 'en' ? 'Trap Bar Deadlift' : 'Soulevé de terre trap bar',
        exerciseId: 'hinge__deadlift__trap_bar',
        prescription: exo.prescription?.replace(/85-88%/, '80-85%') ?? '4x3 @ 80-85%',
      }
    }
    if (BANDED_SWING.test(exo.name)) {
      return {
        ...exo,
        name: lang === 'en' ? 'Broad Jump' : 'Broad Jump',
        exerciseId: 'power__jump__broad_jump',
        prescription: '3 reps',
      }
    }
    if (CMJ.test(exo.name)) {
      return {
        ...exo,
        name: lang === 'en' ? 'Split Jump' : 'Split Jump',
        exerciseId: 'power__split_jump__bodyweight',
        prescription: '2-3/side',
      }
    }
    return rewriteExo(exo, lang)
  })

  const name = FRONT_ROW_TOKEN.test(block.name)
    ? lang === 'en'
      ? block.name.replace(FRONT_ROW_TOKEN, 'Carrier pack')
      : block.name.replace(FRONT_ROW_TOKEN, 'Pack porteur')
    : block.name

  return {
    ...block,
    name,
    exercises,
    coachingNotes: block.coachingNotes?.map((n) =>
      n
        .replace(/box squat/gi, lang === 'en' ? 'trap bar' : 'trap bar')
        .replace(/front-row power/gi, lang === 'en' ? 'carrier pack power' : 'puissance pack porteur'),
    ),
  }
}

function adaptBlock(block: Block, lang: 'fr' | 'en'): Block {
  const isPowerCluster =
    /power cluster|cluster puissance|front row power/i.test(block.name) ||
    block.exercises.some((e) => BOX_SQUAT.test(e.name.trim()))

  if (isPowerCluster && block.exercises.some((e) => BOX_SQUAT.test(e.name.trim()))) {
    return adaptLowerPowerCluster(block, lang)
  }

  const exercises = block.exercises
    .map((exo) => rewriteExo(exo, lang))
    // Primer / Full optionnel : retirer residual neck du bloc confiance/pump
    // (rewriteExo a déjà swapé la plupart ; accents Contact restent après).
    .filter((exo) => {
      if (NECK.test(exo.name) && /confidence|confiance|pump|reward|récompense/i.test(block.name)) {
        return false
      }
      return true
    })

  let name = block.name
  if (FRONT_ROW_TOKEN.test(name)) {
    name =
      lang === 'en'
        ? name.replace(FRONT_ROW_TOKEN, 'Carrier pack')
        : name.replace(FRONT_ROW_TOKEN, 'Pack porteur')
  }

  return {
    ...block,
    name,
    exercises,
    coachingNotes: block.coachingNotes?.map((n) => {
      let out = n
      if (/neck|cou|zercher/i.test(out) && /replace the throw|remplace/i.test(out)) {
        out =
          lang === 'en'
            ? 'Keep the rotational throw — carrier pack bias is rotation + carry, not neck grind.'
            : 'Garder le lancer rotationnel — biais pack porteur = rotation + portage, pas le cou.'
      }
      return out.replace(/zercher/gi, lang === 'en' ? 'farmer carry' : 'marche du fermier')
    }),
  }
}

/**
 * Pur. No-op si famille ≠ 2ᵉ/3ᵉ ligne ou séance hors scope pré Power / Primer / Full FRONT_ROW.
 */
export function applyPackPorteurAdaptation(
  session: MotherSession,
  opts: {
    contentFamily?: ContentFamily | null
    lang?: 'fr' | 'en'
  },
): MotherSession {
  const family = opts.contentFamily
  if (!isPackPorteurFamily(family)) return session
  if (!isPackPorteurEligibleSession(session)) return session

  const lang = opts.lang ?? 'fr'
  const blocks = session.blocks.map((b) => adaptBlock(b, lang))

  return {
    ...session,
    goal: session.goal?.map((g) => rewriteIdentityText(g, family!, lang)),
    sessionIdentity: session.sessionIdentity?.map((s) => rewriteIdentityText(s, family!, lang)),
    positionAccent: session.positionAccent?.map((s) => rewriteIdentityText(s, family!, lang)),
    blocks,
  }
}
