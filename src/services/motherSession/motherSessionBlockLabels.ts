/**
 * Translations EN → FR pour les `block.name` et `block.format` des Mother Sessions.
 *
 * Source : 111 noms uniques + 45 formats uniques extraits de
 * `src/data/motherSessions.generated.ts` (scripts/extract_block_names.mjs).
 *
 * Convention de traduction (rugby/gym FR) :
 *  - Anglicismes méthodologiques gardés : Cluster, Triplet, Finisher, Reset,
 *    Pump, COD (change of direction).
 *  - Traductions FR pour les termes métier classiques : Lower/Upper → Bas/Haut
 *    du corps, Power → Puissance, Strength → Force, Pull/Push → Tirage/Poussée.
 *
 * Helpers :
 *  - `localizeBlockName(name, lang)` : lookup direct, fallback nom brut EN.
 *  - `localizeBlockFormat(format, lang)` : transforme via regex les patterns
 *    récurrents (rounds, rest, work sets, between, after the pair/triplet/round).
 */

import type { Lang } from '../../i18n/appLabels'

const BLOCK_NAME_FR: Record<string, string> = {
  // ── In-season ──────────────────────────────────────────────────────────
  'Lower Power Pair': 'Paire de puissance bas du corps',
  'Upper Push/Pull Strength': 'Force pousser/tirer haut du corps',
  'Posterior Chain / Rotation Support': 'Support chaîne postérieure / rotation',
  'Lower Leg / Groin Support': 'Support mollets / adducteurs',
  'Arm Pump / Reward Block': 'Pump bras / bloc bonus',
  'Posterior Chain / Trunk Support': 'Support chaîne postérieure / tronc',
  'Lower Neural Pair': 'Paire neurale bas du corps',
  'Upper Push Primer': 'Primer poussée haut du corps',
  'Pull Strength Pair': 'Paire force tirage',
  'Front Row Support': 'Support première ligne',
  'Pull / Rotation Primer': 'Primer tirage / rotation',
  'Arm Pump / Confidence Block': 'Pump bras / bloc confiance',
  'Pull / Trunk Primer': 'Primer tirage / tronc',
  'Contact Confidence / Pump': 'Confiance contact / pump',
  'Front Row Finisher': 'Finisher première ligne',
  'Back Three Finisher': 'Finisher arrières',
  'Contrast Lower Speed-Projection': 'Contraste bas vitesse-projection',
  'Posterior Chain + Unilateral Strength Pair': 'Paire chaîne postérieure + force unilatérale',
  'Contrast Lower Force-Power': 'Contraste bas force-puissance',
  'Contrast Upper Speed-Power': 'Contraste haut vitesse-puissance',
  'Contrast Upper Push': 'Contraste poussée haut',
  'Shoulder Prehab Micro-Block': 'Micro-bloc préhab épaule',

  // ── Off-season ─────────────────────────────────────────────────────────
  'Finisher Rugby': 'Finisher rugby',
  'Main Full-Body Hinge': 'Hinge full body principal',
  'Upper Push / Pull Support': 'Support poussée / tirage haut',
  'Lower Support / Trunk Pair': 'Paire support bas / tronc',
  'Main Squat Hypertrophy': 'Squat hypertrophie principal',
  'Posterior Chain / Groin Support': 'Support chaîne postérieure / adducteurs',
  'Trunk / Shoulder Prevention': 'Prévention tronc / épaule',
  'Vertical Support Pair': 'Paire support vertical',
  'Lower Force + Horizontal Projection': 'Force bas + projection horizontale',
  'Upper Force + Rotational Power': 'Force haut + puissance rotationnelle',
  'Reactive Support / Anti-Rotation': 'Support réactif / anti-rotation',
  'Lower Force + Explosive Contrast': 'Force bas + contraste explosif',
  'Upper Force + Explosive Contrast': 'Force haut + contraste explosif',
  'Unilateral / Trunk Support': 'Support unilatéral / tronc',
  'Rotational Press / Unilateral Pull': 'Press rotationnel / tirage unilatéral',
  'Unilateral Lower / Rotation': 'Bas unilatéral / rotation',
  'Main Full-Body Hinge Hypertrophy': 'Hinge full body hypertrophie principal',
  'Squat / Hinge Re-Entry': 'Reprise squat / hinge',
  'Push / Pull Re-Entry': 'Reprise poussée / tirage',
  'Trunk / Mobility / Tissue Reset': 'Tronc / mobilité / reset tissulaire',
  'Unilateral / Locomotion Reset': 'Reset unilatéral / locomotion',
  'Push / Pull Reset': 'Reset poussée / tirage',
  'Lower-Leg / Groin / Trunk Support': 'Support mollets / adducteurs / tronc',
  'Hinge Force + Horizontal Projection': 'Force hinge + projection horizontale',
  'Unilateral Force + Reactive Contrast': 'Force unilatérale + contraste réactif',
  'Posterior Chain Support': 'Support chaîne postérieure',
  'Lower-Leg / Reactive Stiffness': 'Mollets / raideur réactive',
  'Squat Force + Explosive Contrast': 'Force squat + contraste explosif',
  'Hinge Force + Dynamic Contrast': 'Force hinge + contraste dynamique',
  'Unilateral Strength + Posterior Support': 'Force unilatérale + support postérieur',
  'Lower-Leg / Groin Prevention': 'Prévention mollets / adducteurs',
  'Unilateral Hinge / Quad Pair': 'Paire hinge unilatéral / quadri',
  'Lower-Leg / Stiffness Prep': 'Prép mollets / raideur',
  'Main Hinge / Unilateral Pair': 'Paire hinge / unilatéral principale',
  'Lower-Leg / Optional Reward': 'Mollets / bonus optionnel',
  'Squat / Hinge Base Pair': 'Paire base squat / hinge',
  'Unilateral Support Pair': 'Paire support unilatéral',
  'Groin / Trunk / Lower-Leg Support': 'Support adducteurs / tronc / mollets',
  'Press Force + Speed Contrast': 'Force press + contraste vitesse',
  'Pull Force + Rotational Power': 'Force tirage + puissance rotationnelle',
  'Unilateral Rotational Strength': 'Force rotationnelle unilatérale',
  'Press Force + Explosive Contrast': 'Force press + contraste explosif',
  'Pull Force + Power Contrast': 'Force tirage + contraste puissance',
  'Vertical Press/Row Strength': 'Force press/rowing vertical',
  'Main Upper Press': 'Press haut principal',
  'Unilateral Pull / Rotational Press': 'Tirage unilatéral / press rotationnel',
  'Anti-Rotation / Vertical Pull': 'Anti-rotation / tirage vertical',
  'Arms / Rotational Prep': 'Bras / prép rotationnelle',
  'Main Upper Push Hypertrophy': 'Hypertrophie haut poussée principale',
  'Main Upper Pull / Secondary Push Pair': 'Tirage haut principal / paire push secondaire',
  'Arms (Curl + Pressdown)': 'Bras (curl + pushdown)',
  'Shoulder Health': 'Santé épaule',
  'Main Press / Pull Base Pair': 'Paire base press / tirage principale',
  'Shoulder / Trunk Support': 'Support épaule / tronc',

  // ── Pre-season ─────────────────────────────────────────────────────────
  'Position Support Finisher': 'Finisher support poste',
  'Mandatory Shoulder Prehab Micro-Block': 'Micro-bloc préhab épaule obligatoire',
  'Upper Power Pair': 'Paire puissance haut',
  'Pull / Posterior Cluster': 'Cluster tirage / postérieur',
  'Lower Strength Triplet': 'Triplet force bas',
  'Posterior Chain Force Maintenance': 'Maintien force chaîne postérieure',
  'Athletic Finisher': 'Finisher athlétique',
  'Optional Lower-Leg Support': 'Support mollets optionnel',
  'Main Upper Pull': 'Tirage haut principal',
  'Upper Support Strength Pair': 'Paire force support haut',
  'Upper Pull Cluster': 'Cluster tirage haut',
  'Full-Body Force-Projection Pair': 'Paire force-projection full body',
  'Upper Push/Pull Support Pair': 'Paire support poussée/tirage haut',
  'Main Full-Body Force': 'Force full body principale',
  'Upper Push/Pull Strength Pair': 'Paire force poussée/tirage haut',
  'Contrast Lower Force-Projection': 'Contraste bas force-projection',
  'Main Lower Force': 'Force bas principale',
  'Hinge + Unilateral Strength Pair': 'Paire hinge + force unilatérale',
  'Posterior Chain / Lower Leg Support': 'Support chaîne postérieure / mollets',
  'Back Three Power Cluster': 'Cluster puissance arrières',
  'Hamstring / Lower-Leg Micro-Dose': 'Micro-dose ischios / mollets',
  'Front Row Power Cluster': 'Cluster puissance première ligne',
  'Hamstring Micro-Dose': 'Micro-dose ischios',
  'Sprint / Acceleration': 'Sprint / accélération',
  'Jumps / Plyometrics': 'Sauts / pliométrie',
  'Upper Ballistic / Explosive Trunk': 'Haut balistique / tronc explosif',
  'Athletic COD Work': 'Travail COD athlétique',
  'Acceleration Contrast': 'Contraste accélération',
  'Structured Plyometric Cluster': 'Cluster pliométrique structuré',
  'Upper Ballistic Pair': 'Paire balistique haut',
  'COD / Athletic Change of Direction': 'COD / changement d\'appui athlétique',
  'Contrast Upper Force-Speed': 'Contraste haut force-vitesse',
  'Main Upper Force': 'Force haut principale',
  'Back Three Upper Power Cluster': 'Cluster puissance haut arrières',
  'Front Row Upper Power Cluster': 'Cluster puissance haut première ligne',
}

/**
 * Renvoie le nom d'un bloc dans la langue voulue.
 * Fallback : nom brut (EN par convention dans la source MD).
 */
export function localizeBlockName(name: string | undefined, lang: Lang = 'fr'): string {
  if (!name) return ''
  if (lang === 'en') return name
  return BLOCK_NAME_FR[name] ?? name
}

/**
 * Transforme un format de bloc EN → FR via regex.
 * Templates EN courants :
 *  - "`3 rounds`, full rest `3 min`"
 *  - "`3 rounds`, `90-120s` rest after the pair"
 *  - "`4 work sets`, `2 min` rest between sets"
 *  - "`4 rounds`, `3-4 min` rest between rounds"
 *
 * Stratégie : ordre des replace IMPORTANT — patterns spécifiques d'abord
 * pour éviter les recouvrements. "rest after the X" doit matcher avant "rest".
 */
export function localizeBlockFormat(format: string | undefined, lang: Lang = 'fr'): string {
  if (!format) return ''
  if (lang === 'en') return format
  return format
    .replace(/\bfull rest\b/gi, 'récup complète')
    .replace(/\brest after the pair\b/gi, 'récup après la paire')
    .replace(/\brest after the triplet\b/gi, 'récup après le triplet')
    .replace(/\brest after the round\b/gi, 'récup après le tour')
    .replace(/\brest after the cluster\b/gi, 'récup après le cluster')
    .replace(/\brest between rounds\b/gi, 'récup entre tours')
    .replace(/\brest between sets\b/gi, 'récup entre séries')
    .replace(/\brest between sprints\b/gi, 'récup entre sprints')
    .replace(/\brest between work sets\b/gi, 'récup entre séries lourdes')
    .replace(/\bwork sets\b/gi, 'séries lourdes')
    .replace(/\brest\b/gi, 'récup')
    .replace(/\bbetween rounds\b/gi, 'entre tours')
    .replace(/\bbetween sets\b/gi, 'entre séries')
    .replace(/\brounds\b/gi, 'tours')
    .replace(/\bround\b/gi, 'tour')
    .replace(/\bsets\b/gi, 'séries')
    .replace(/\bset\b/gi, 'série')
    .replace(/\beach side\b/gi, 'chaque côté')
    .replace(/\bper side\b/gi, 'par côté')
}
