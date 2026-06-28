/**
 * Infer the training intent of a Block from its name + format + session
 * context. Used to pick the right KB range when auditing rest times.
 *
 * `Block` has no `intent` field by design — the heuristic derives it
 * from textual signals. Matching is greedy in priority order: the first
 * matching pattern wins. Order matters (specific → generic).
 *
 * Ordering rationale (Phase B refinement, 2026-05-08):
 *   - hypertrophy is matched BEFORE force, because "Hypertrophy"/"Pair"/
 *     "Triplet"/"Push/Pull" + ~90-120s rest is RE method, not max strength.
 *   - force only matches narrow keywords (force max, heavy, max effort)
 *     plus format hints with explicit ≥3min rest.
 *
 * See `docs/b2-rest-times-audit-plan.md` §4 for the full mapping table.
 */

import type { Block, MotherSession } from '../../../types/motherSession'
import type { Intent } from './kbRanges'

interface IntentRule {
  intent: Intent
  /** Match against block.name (lowercased). */
  namePatterns?: RegExp[]
  /** Optional check on block.format (lowercased). */
  formatPatterns?: RegExp[]
  /** Optional context check. */
  contextCheck?: (block: Block, session: MotherSession) => boolean
}

const RULES: IntentRule[] = [
  // 1. Conditioning — EMOM/Tabata/AMRAP/timed format takes precedence
  {
    intent: 'conditioning',
    formatPatterns: [/\b(?:emom|tabata|amrap|for\s*time)\b/],
  },

  // 2. Sprint — explicit running movements
  {
    intent: 'sprint',
    namePatterns: [
      /\bsprint\b/,
      /\bacceleration\b/,
      /\bfree\s+accel/,
      /\bfly\b/,
      /\b10[-\s]?m(?:eter)?\b/,
      /\bshuttle\b/,
      /\bcod\b/,
      /\bchange\s+of\s+direction\b/,
      /\b5-10-5\b/,
    ],
  },

  // 3. Power / contrast / cluster (explosive paired with heavy or plyo alone).
  // Includes "Force + Projection/Power/Maintenance" — heavy compound + dynamic
  // accessory in a triplet/pair structure (corpus convention).
  {
    intent: 'power_contrast',
    namePatterns: [
      /\bcontrast\b/,
      /\bcluster\b/,
      /\bforce[-\s]projection\b/,
      /\bforce[-\s]power\b/,
      /\bspeed[-\s]power\b/,
      /\bforce[-\s]speed\b/,
      /\bpower\s+pair\b/,
      /\bolympic\b/,
      /\bjerk\b/,
      /\b(?:hang\s+)?clean\b/,
      /\bsnatch\b/,
      /\bbroad\s+jump\b/,
      /\bcmj\b/,
      /\bcountermovement\b/,
      /\bjumps?\s*\/\s*plyo/,
      /\bplyometric/,
      /\blower\s+power\b/,
      /\bneural\s+pair\b/,
      /\bneural\s+lower\b/,
      /\bcns\b/,
      /\bactivation\s+circuit\b/,
      /\bforce\s*\+\s*(?:horizontal|rotational|vertical)/,
      /\bforce\s*\+\s*projection\b/,
      /\bforce\s*\+\s*power\b/,
      /\bhinge\s+force\b/,
    ],
  },

  // 4. Dynamic effort / ballistic — sub-maximal high-velocity
  {
    intent: 'dynamic',
    namePatterns: [
      /\bdynamic\b/,
      /\bballistic\b/,
      /\bthrow\b/,
      /\blaunch\b/,
      /\bpogo\b/,
      /\bmedball\b/,
      /\bexplosive\b/,
    ],
  },

  // 5. Activation / prep / warm-up rounds. Note: "Primer" alone is NOT an
  // activation cue — it can appear in block names within FULL_LIGHT_PRIMER
  // sessions where the blocks themselves are real RE working sets.
  {
    intent: 'activation',
    namePatterns: [
      /\bwarm[-\s]?up\b/,
      /\bprep\b/,
      /\bramp[-\s]?up\b/,
      /\brehearsal\b/,
      /\beasy.*round\b/,
      /\bprogressive\b/,
      /\bactivation\b/,
    ],
  },

  // 6. Prehab / stability / groin / neck / shoulder health / micro-dose
  {
    intent: 'prehab',
    namePatterns: [
      /\bprehab\b/,
      /\brehab\b/,
      /\bstability\b/,
      /\bgroin\b/,
      /\blower[-\s]?leg\b/,
      /\btibialis\b/,
      /\bcopenhagen\b/,
      /\badductor\b/,
      /\bhip\s+stability\b/,
      /\bnordic\b/,
      /\by[-\s]?balance\b/,
      /\bshoulder\s+health\b/,
      /\bmicro[-\s]?dose\b/,
      /\bhamstring\s+micro/,
      /\bhealth\b/,
    ],
  },

  // 7. Core / trunk / carry / neck (post-prehab so "shoulder health" wins prehab)
  {
    intent: 'core',
    namePatterns: [
      /\bcore\b/,
      /\btrunk\b/,
      /\banti[-\s]rotation\b/,
      /\bcable\s+chop\b/,
      /\bdead\s+bug\b/,
      /\bhollow\b/,
      /\bfront\s+rack\b/,
      /\bcarry\b/,
      /\bfarmer\b/,
      /\bzercher\b/,
      /\bneck\b/,
    ],
  },

  // 8. Reward / arm pump (often optional)
  {
    intent: 'reward',
    namePatterns: [
      /\breward\b/,
      /\barm\s+pump\b/,
      /\bconfidence\b/,
      /\barms\b/,
    ],
  },

  // 9. Hypertrophy / RE method — pair, triplet, push/pull, support, accessory.
  // Matches BEFORE force because "Hypertrophy"/"Strength Pair"/"Triplet" with
  // 60-120s rest is RE method, not max strength.
  {
    intent: 'hypertrophy',
    namePatterns: [
      /\bhypertrophy\b/,
      /\brenfo\b/,
      /\bpush\s*\/\s*pull\b/,
      /\bpush[-\s]pull\b/,
      /\bpull[-\s]push\b/,
      /\bposterior\s+chain\b/,
      /\bsupport\b/,
      /\baccessory\b/,
      /\bfinisher\b/,
      /\brotation\b/,
      /\bunilateral\b/,
      /\bvertical\s+pull\b/,
      /\bhinge\b/,
      /\bstrength\s+pair\b/,
      /\bstrength\s+triplet\b/,
      /\bforce\s+maintenance\b/,
      /\bmain\s+(?:squat|hinge|press|pull|upper|lower|full)/,
      /\bsecondary\s+(?:push|pull)/,
      /\bbase\s+pair\b/,
      /\b(?:press|pull|push)\s+force\b/,
      /\b(?:vertical|horizontal)\s+(?:press|row|pull|push)/,
      /\bpress\s*\/\s*row\b/,
      /\brow\s*\/\s*press\b/,
      /\bprimer\b/,
    ],
  },

  // 10. Force max — narrow: explicit force/max/heavy or work-sets format with ≥3 min rest
  {
    intent: 'force',
    namePatterns: [
      /\bforce\s+max\b/,
      /\bmax(?:imal)?\s+effort\b/,
      /\bheavy\b/,
      /\b(?:1|3|5)\s*rm\b/,
      /\b(?:85|90|95|100)\s*%\b/,
    ],
    formatPatterns: [
      /full\s+rest\s+(?:3|4|5)\s*(?:-\s*(?:3|4|5)\s*)?min/,
      /\b(?:3|4)\s*-\s*(?:4|5)\s*min\s+rest/,
    ],
  },

  // 11. dup_endurance — corner case, not yet matched in corpus (placeholder)
  {
    intent: 'dup_endurance',
    namePatterns: [/\bdup\s+endurance\b/, /\bin[-\s]season\s+endurance\b/],
  },
]

export function inferBlockIntent(block: Block, session: MotherSession): Intent {
  const name = (block.name ?? '').toLowerCase()
  const format = (block.format ?? '').replace(/`/g, '').toLowerCase()

  for (const rule of RULES) {
    const nameMatch = rule.namePatterns?.some((rx) => rx.test(name)) ?? false
    const formatMatch = rule.formatPatterns?.some((rx) => rx.test(format)) ?? false

    let matched = false
    if (rule.namePatterns && rule.formatPatterns) {
      matched = nameMatch || formatMatch
    } else if (rule.namePatterns) {
      matched = nameMatch
    } else if (rule.formatPatterns) {
      matched = formatMatch
    }

    if (!matched) continue
    if (rule.contextCheck && !rule.contextCheck(block, session)) continue

    return rule.intent
  }

  return 'unknown'
}
