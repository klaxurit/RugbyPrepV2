import type { Block } from '../../types/motherSession'
import { parseBlockFormat } from '../ui/parseBlockFormat'

/**
 * Catégorie visuelle d'un bloc dans la page Séance refondue (mai 2026).
 *
 * Pilote le composant rendu et le pattern d'interaction :
 *  - `warmup` : items numérotés 01..N, no validation set-par-set
 *  - `tours`  : sets × tours classiques avec ratios kg/reps (Premium logging)
 *  - `emom`   : pattern minutes + chrono pleine page
 *  - `prehab` : exos courts avec mini-chrono iso (15s/20s)
 */
export type SessionBlockKind = 'warmup' | 'tours' | 'emom' | 'prehab'

const WARMUP_RE = /échauff|warm[-\s]?up|activation/i
const PREHAB_RE = /préhab|prehab|mobil|épaule|cou(?:\s|$)|micro[-\s]?bloc/i

/**
 * Détecte la catégorie d'un bloc à partir de sa structure réelle. Pur, déterministe,
 * tolérant aux entrées partielles. Heuristique :
 *  1. format reconnu comme EMOM/Tabata/AMRAP → 'emom' (overlay chrono)
 *  2. nom évoque échauffement/activation → 'warmup'
 *  3. nom évoque mobilité/préhab → 'prehab'
 *  4. fallback → 'tours' (le format le plus courant en muscu)
 */
export function detectBlockKind(block: Block): SessionBlockKind {
  const fmt = parseBlockFormat(block.format)
  if (fmt.type === 'emom' || fmt.type === 'tabata' || fmt.type === 'amrap') {
    return 'emom'
  }
  const name = block.name ?? ''
  if (WARMUP_RE.test(name)) return 'warmup'
  if (PREHAB_RE.test(name)) return 'prehab'
  return 'tours'
}
