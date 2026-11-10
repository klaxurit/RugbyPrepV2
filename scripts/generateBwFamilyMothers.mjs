#!/usr/bin/env node
/**
 * Génère mothers BW enveloppe B : 6 familles × A/B Upper/Lower + Full B + Power backs.
 * Usage: node scripts/generateBwFamilyMothers.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const IN = path.join(ROOT, 'docs/training/mother-sessions/in-season')
const PRE = path.join(ROOT, 'docs/training/mother-sessions/pre-season')

const FAMILIES = [
  'FRONT_ROW',
  'SECOND_ROW',
  'BACK_ROW',
  'HALF_BACKS',
  'CENTERS',
  'BACK_THREE',
]

const BACKS = new Set(['HALF_BACKS', 'CENTERS', 'BACK_THREE'])

/** @typedef {{ a: string, aRx: string, b: string, bRx: string, notes: string[] }} Pair */

/** @type {Record<string, { A: { contrast: Pair, pull: Pair, finisher: Pair, title: string }, B: { contrast: Pair, pull: Pair, finisher: Pair, title: string } }>} */
const UPPER = {
  FRONT_ROW: {
    A: {
      title: 'Front-row contact upper (decline + plyo)',
      contrast: {
        a: 'Decline Push-Up',
        aRx: '3-4x3-4 @ RER 2-3',
        b: 'Plyo Push-Up',
        bRx: '3-4 reps',
        notes: [
          'A lourd : sac à dos ou excentrique lente, `RER 2-3`.',
          'Plyo dans les 15-20 s — les mains quittent le sol.',
          'Upgrade A : développé haltères si dispo. Arrêter le plyo si la hauteur chute.',
        ],
      },
      pull: {
        a: 'Rowing inversé pieds surélevés',
        aRx: '3x5 @ RER 2-3',
        b: 'Inverted Row Standard',
        bRx: '3x5-6 @ RER 2-3',
        notes: [
          'Tirage force — amplitude stricte.',
          'Upgrade A : traction si barre dispo.',
        ],
      },
      finisher: {
        a: 'Suitcase Carry',
        aRx: '20m/side',
        b: 'Neck Extension Isometric',
        bRx: '15-20s',
        notes: [
          'Finisher 1ère ligne par défaut : carry + cou.',
          'Fallback A : Bear Crawl 15 m sans charge.',
        ],
      },
    },
    B: {
      title: 'Front-row upper B (standard push + elevated row bias)',
      contrast: {
        a: 'Push-Up',
        aRx: '3-4x4-5 @ RER 2-3',
        b: 'Plyo Push-Up',
        bRx: '3-4 reps',
        notes: [
          'A reste lourd via sac/tempo — pas de séries fluettes à hautes reps.',
          'Plyo dans les 15-20 s après A.',
        ],
      },
      pull: {
        a: 'Neutral-Grip Pull-Up',
        aRx: '3x4-5 @ RER 2-3',
        b: 'Inverted Row Standard',
        bRx: '3x6 @ RER 2-3',
        notes: [
          'Biais tirage vertical vs row pieds surélevés de A — toujours en force.',
          'Fallback A : rowing inversé pieds surélevés sans barre.',
        ],
      },
      finisher: {
        a: 'Farmer Carry',
        aRx: '20m',
        b: 'Neck Extension Isometric',
        bRx: '15-20s',
        notes: [
          'B garde le cou par défaut ; farmer si charge, sinon suitcase / bear crawl.',
        ],
      },
    },
  },
  SECOND_ROW: {
    A: {
      title: 'Second-row upper (push + vertical pull)',
      contrast: {
        a: 'Decline Push-Up',
        aRx: '3-4x3-4 @ RER 2-3',
        b: 'Plyo Push-Up',
        bRx: '3-4 reps',
        notes: [
          'Contraste push propre — soutien touche/maul sans fluff.',
        ],
      },
      pull: {
        a: 'Neutral-Grip Pull-Up',
        aRx: '3x5 @ RER 2-3',
        b: 'Face Pull Band',
        bRx: '3x10-12 @ RER 2-3',
        notes: [
          'Tirage vertical + scap — signature 2e ligne vs volume row pieds hauts.',
          'Fallback A : rowing inversé pieds surélevés.',
        ],
      },
      finisher: {
        a: 'Neck Extension Isometric',
        aRx: '15-20s',
        b: 'Suitcase Carry',
        bRx: '15m/side',
        notes: [
          'Cou + carry en volume réduit vs 1ère ligne.',
        ],
      },
    },
    B: {
      title: 'Second-row upper B (archer contrast + pull-up pair)',
      contrast: {
        a: 'Archer Push-Up',
        aRx: '3x3/side @ RER 2-3',
        b: 'Plyo Push-Up',
        bRx: '3-4 reps',
        notes: [
          'Archer en A vs decline — toujours force → vitesse.',
          'Fallback A : Decline Push-Up si archer trop dur.',
        ],
      },
      pull: {
        a: 'Neutral-Grip Pull-Up',
        aRx: '3x4 @ RER 2-3',
        b: 'Inverted Row Standard',
        bRx: '3x5-6 @ RER 2-3',
        notes: [
          'La traction reste l\'ancre verticale ; le row soutient le volume.',
        ],
      },
      finisher: {
        a: 'Neck Extension Isometric',
        aRx: '12-15s',
        b: 'Bear Crawl',
        bRx: '15m',
        notes: [
          'Cou plus court + crawl — moins de carry qu\'en A.',
        ],
      },
    },
  },
  BACK_ROW: {
    A: {
      title: 'Back-row upper (plyo + band rotation block)',
      contrast: {
        a: 'Decline Push-Up',
        aRx: '3-4x3-4 @ RER 2-3',
        b: 'Plyo Push-Up',
        bRx: '3-4 reps',
        notes: [
          'Vitesse de poussée transfert contact pour plaquage/ruck.',
        ],
      },
      pull: {
        a: 'Rowing inversé pieds surélevés',
        aRx: '3x5 @ RER 2-3',
        b: 'Band Rotation Explosive',
        bRx: '3x3-4/side @ RER 2-3',
        notes: [
          'Tirage + rotation au bloc 2 — pas une identité finisher seul.',
          'Fallback B : Side Plank 15 s/côté sans bande.',
        ],
      },
      finisher: {
        a: 'Bear Crawl',
        aRx: '15-20m',
        b: 'Neck Extension Isometric',
        bRx: '10-15s',
        notes: [
          'Crawl + cou court — pas suitcase par défaut.',
        ],
      },
    },
    B: {
      title: 'Back-row upper B (archer + inverted row pair)',
      contrast: {
        a: 'Archer Push-Up',
        aRx: '3x3/side @ RER 2-3',
        b: 'Plyo Push-Up',
        bRx: '3-4 reps',
        notes: [
          'Biais push unilatéral vs decline de A.',
        ],
      },
      pull: {
        a: 'Inverted Row Standard',
        aRx: '3x5-6 @ RER 2-3',
        b: 'Band Rotation Explosive',
        bRx: '3x4/side @ RER 2-3',
        notes: [
          'Row + rotation conservés — tirage A différent du row pieds hauts.',
        ],
      },
      finisher: {
        a: 'Bear Crawl',
        aRx: '15m',
        b: 'Neck Extension Isometric',
        bRx: '10-12s',
        notes: [
          'Iso cou court — option contact via accent si besoin.',
        ],
      },
    },
  },
  HALF_BACKS: {
    A: {
      title: 'Half-backs upper (archer/scap + rotation)',
      contrast: {
        a: 'Archer Push-Up',
        aRx: '3x3/side @ RER 2-3',
        b: 'Scap Push-Up',
        bRx: '6-8 reps',
        notes: [
          'Push bas coût articulaire — contrôle scap entre les reps force.',
          'Fallback A : Push-Up si archer indisponible.',
        ],
      },
      pull: {
        a: 'Inverted Row Standard',
        aRx: '3x5-6 @ RER 2-3',
        b: 'Band Rotation Explosive',
        bRx: '3x3-4/side @ RER 2-3',
        notes: [
          'Row + rotation explosive — transfert demis sans cou lourd.',
        ],
      },
      finisher: {
        a: 'Face Pull Band',
        aRx: '10-12 reps',
        b: 'Side Plank',
        bRx: '15-20s/side',
        notes: [
          'Finisher rotation/scap — PAS de cou + suitcase par défaut.',
          'Fallback A : Band Pull-Apart sans face pull.',
        ],
      },
    },
    B: {
      title: 'Half-backs upper B (pike/scap + face pull progress)',
      contrast: {
        a: 'Pike Push-Up',
        aRx: '3x4-5 @ RER 2-3',
        b: 'Scap Push-Up',
        bRx: '8 reps',
        notes: [
          'Biais push vertical vs archer de A — coût résiduel bas.',
          'Fallback A : Decline Push-Up si pike trop dur.',
        ],
      },
      pull: {
        a: 'Inverted Row Standard',
        aRx: '3x6 @ RER 2-3',
        b: 'Face Pull Band',
        bRx: '3x12 @ RER 2-3',
        notes: [
          'Emphase scap/pull au bloc 2 vs paire rotation de A.',
        ],
      },
      finisher: {
        a: 'Band Rotation Explosive',
        aRx: '3-4/side',
        b: 'Side Plank',
        bRx: '15s/side',
        notes: [
          'Rotation + anti-latéral — toujours sans cou/suitcase par défaut.',
        ],
      },
    },
  },
  CENTERS: {
    A: {
      title: 'Centres upper (plyo + neutral pull + rotation)',
      contrast: {
        a: 'Decline Push-Up',
        aRx: '3-4x3-4 @ RER 2-3',
        b: 'Plyo Push-Up',
        bRx: '3-4 reps',
        notes: [
          'Vitesse de poussée contact pour le centre du terrain.',
        ],
      },
      pull: {
        a: 'Neutral-Grip Pull-Up',
        aRx: '3x5 @ RER 2-3',
        b: 'Band Rotation Explosive',
        bRx: '3x3/side @ RER 2-3',
        notes: [
          'Tirage vertical + rotation — compromis centres.',
          'Fallback A : Inverted Row Standard.',
        ],
      },
      finisher: {
        a: 'Bear Crawl',
        aRx: '12-15m',
        b: 'Band Rotation Explosive',
        bRx: '3/side',
        notes: [
          'Crawl court + rotation — PAS de cou par défaut.',
        ],
      },
    },
    B: {
      title: 'Centres upper B (archer + face pull pair)',
      contrast: {
        a: 'Archer Push-Up',
        aRx: '3x3/side @ RER 2-3',
        b: 'Plyo Push-Up',
        bRx: '3-4 reps',
        notes: [
          'Push unilatéral vs decline de A — toujours contraste plyo.',
        ],
      },
      pull: {
        a: 'Neutral-Grip Pull-Up',
        aRx: '3x4-5 @ RER 2-3',
        b: 'Face Pull Band',
        bRx: '3x10-12 @ RER 2-3',
        notes: [
          'Fin scap au bloc 2 vs rotation de A — A≠B sur la paire tirage.',
        ],
      },
      finisher: {
        a: 'Bear Crawl',
        aRx: '15m',
        b: 'Side Plank',
        bRx: '15s/side',
        notes: [
          'Crawl + tronc — cou seulement via accent Contact si besoin.',
        ],
      },
    },
  },
  BACK_THREE: {
    A: {
      title: 'Back-three upper (archer + inverted row + face pull)',
      contrast: {
        a: 'Archer Push-Up',
        aRx: '3x3/side @ RER 2-3',
        b: 'Plyo Push-Up',
        bRx: '3-4 reps',
        notes: [
          'Biais push unilatéral athlétique — pas le template contact 1ère ligne. Évite le Pike (primer).',
          'Fallback A : Decline Push-Up.',
        ],
      },
      pull: {
        a: 'Inverted Row Standard',
        aRx: '3x5-6 @ RER 2-3',
        b: 'Pallof Press Hold',
        bRx: '3x15s/side @ RER 2-3',
        notes: [
          'Tirage + anti-rotation — volume scap réservé au finisher léger (budget semaine).',
        ],
      },
      finisher: {
        a: 'Face Pull Band',
        aRx: '8-10 reps',
        b: 'Side Plank',
        bRx: '15s/side',
        notes: [
          'Finisher scap/pull — PAS cou + suitcase. Volume face pull léger.',
          'Fallback A : Band Pull-Apart sans face pull.',
        ],
      },
    },
    B: {
      title: 'Back-three upper B (decline speed + elevated row)',
      contrast: {
        a: 'Decline Push-Up',
        aRx: '3-4x3-4 @ RER 2-3',
        b: 'Plyo Push-Up',
        bRx: '3-4 reps',
        notes: [
          'Force-vitesse horizontale vs A — toujours profil arrières.',
        ],
      },
      pull: {
        a: 'Rowing inversé pieds surélevés',
        aRx: '3x5 @ RER 2-3',
        b: 'Pallof Press Hold',
        bRx: '3x15s/side @ RER 2-3',
        notes: [
          'Angle de row plus dur vs A ; tronc plutôt que stack scap.',
        ],
      },
      finisher: {
        a: 'Band Pull-Apart',
        aRx: '10-12 reps',
        b: 'Side Plank',
        bRx: '15s/side',
        notes: [
          'Scap léger + tronc — toujours sans cou/suitcase par défaut.',
        ],
      },
    },
  },
}

/** @type {Record<string, { A: { contrast: Pair, support: Pair, finisher: Pair, title: string }, B: { contrast: Pair, support: Pair, finisher: Pair, title: string } }>} */
const LOWER = {
  FRONT_ROW: {
    A: {
      title: 'Front-row lower (BSS + broad)',
      contrast: {
        a: 'Bulgarian Split Squat',
        aRx: '3-4x3/side @ RER 2-3',
        b: 'Broad Jump',
        bRx: '3 reps',
        notes: ['Unilatéral lourd + projection — biais force 1ère ligne.'],
      },
      support: {
        a: 'Single-Leg Glute Bridge',
        aRx: '3x5-6/side @ RER 2-3',
        b: 'Reverse Lunge Bodyweight',
        bRx: '3x5/side @ RER 2-3',
        notes: ['Soutien postérieur + unilatéral.'],
      },
      finisher: {
        a: 'Bear Crawl',
        aRx: '15-20m',
        b: 'Copenhagen Plank',
        bRx: '15-20s/side',
        notes: ['Locomotion + adducteurs.'],
      },
    },
    B: {
      title: 'Front-row lower B (kickstand RDL contrast)',
      contrast: {
        a: 'Kickstand RDL',
        aRx: '3-4x3-4/side @ RER 2-3',
        b: 'Broad Jump',
        bRx: '3 reps',
        notes: ['Contraste hinge vs BSS de A — toujours force → projection.'],
      },
      support: {
        a: 'Bulgarian Split Squat',
        aRx: '3x4/side @ RER 2-3',
        b: 'Single-Leg Glute Bridge',
        bRx: '3x6/side @ RER 2-3',
        notes: ['BSS passe en soutien quand le hinge mène le bloc 1.'],
      },
      finisher: {
        a: 'Bear Crawl',
        aRx: '15m',
        b: 'Copenhagen Plank',
        bRx: '15s/side',
        notes: ['Même intention de finisher rugby qu\'en A.'],
      },
    },
  },
  SECOND_ROW: {
    A: {
      title: 'Second-row lower (BSS + CMJ)',
      contrast: {
        a: 'Bulgarian Split Squat',
        aRx: '3-4x3/side @ RER 2-3',
        b: 'Countermovement Jump',
        bRx: '3 reps',
        notes: ['Biais saut vertical pour touche/réception.'],
      },
      support: {
        a: 'Single-Leg Glute Bridge',
        aRx: '3x5-6/side @ RER 2-3',
        b: 'Reverse Lunge Bodyweight',
        bRx: '3x5/side @ RER 2-3',
        notes: ['Volume de soutien contrôlé.'],
      },
      finisher: {
        a: 'Copenhagen Plank',
        aRx: '15-20s/side',
        b: 'Single-Leg Calf Raise',
        bRx: '8-10/side',
        notes: ['Adducteurs + mollet — pas une copie bear-crawl 1ère ligne.'],
      },
    },
    B: {
      title: 'Second-row lower B (broad instead of CMJ)',
      contrast: {
        a: 'Bulgarian Split Squat',
        aRx: '3-4x3/side @ RER 2-3',
        b: 'Broad Jump',
        bRx: '3 reps',
        notes: ['Projection horizontale vs CMJ de A — A≠B sur le contraste B.'],
      },
      support: {
        a: 'Kickstand RDL',
        aRx: '3x4/side @ RER 2-3',
        b: 'Reverse Lunge Bodyweight',
        bRx: '3x5/side @ RER 2-3',
        notes: ['Soutien hinge différent de la paire pont fessier de A.'],
      },
      finisher: {
        a: 'Copenhagen Plank',
        aRx: '15s/side',
        b: 'Single-Leg Calf Raise',
        bRx: '8/side',
        notes: ['Garder signature mollet + Copenhagen.'],
      },
    },
  },
  BACK_ROW: {
    A: {
      title: 'Back-row lower (kickstand + broad)',
      contrast: {
        a: 'Kickstand RDL',
        aRx: '3-4x3-4/side @ RER 2-3',
        b: 'Broad Jump',
        bRx: '3 reps',
        notes: ['Hinge + projection pour plaquage/percée.'],
      },
      support: {
        a: 'Bulgarian Split Squat',
        aRx: '3x4/side @ RER 2-3',
        b: 'Single-Leg Glute Bridge',
        bRx: '3x5/side @ RER 2-3',
        notes: ['Soutien unilatéral sous contrôle de fatigue.'],
      },
      finisher: {
        a: 'Copenhagen Plank',
        aRx: '15-20s/side',
        b: 'Lateral Bound',
        bRx: '3/side',
        notes: ['Adducteurs + puissance latérale — pas crawl 1ère ligne par défaut.'],
      },
    },
    B: {
      title: 'Back-row lower B (BSS + lateral bound contrast)',
      contrast: {
        a: 'Bulgarian Split Squat',
        aRx: '3-4x3/side @ RER 2-3',
        b: 'Lateral Bound',
        bRx: '3/side',
        notes: ['Contraste latéral vs broad de A — toujours athlétique.'],
      },
      support: {
        a: 'Kickstand RDL',
        aRx: '3x4/side @ RER 2-3',
        b: 'Reverse Lunge Bodyweight',
        bRx: '3x5/side @ RER 2-3',
        notes: ['Soutien hinge + fente.'],
      },
      finisher: {
        a: 'Copenhagen Plank',
        aRx: '15s/side',
        b: 'Broad Jump',
        bRx: '3 reps',
        notes: ['Garder Copenhagen ; projection à la minute finisher.'],
      },
    },
  },
  HALF_BACKS: {
    A: {
      title: 'Half-backs lower (reverse lunge + lateral bound)',
      contrast: {
        a: 'Reverse Lunge Bodyweight',
        aRx: '3-4x3/side @ RER 2-3',
        b: 'Lateral Bound',
        bRx: '3/side',
        notes: ['Unilatéral bas coût + athlétisme latéral.'],
      },
      support: {
        a: 'Single-Leg Glute Bridge',
        aRx: '3x6/side @ RER 2-3',
        b: 'Kickstand RDL',
        bRx: '3x4/side @ RER 2-3',
        notes: ['Soutien postérieur léger.'],
      },
      finisher: {
        a: 'Tibialis Raise',
        aRx: '10-12 reps',
        b: 'A-Skip',
        bRx: '15-20m',
        notes: ['Bas de jambe + rythme — spécifique demis, pas Copenhagen par défaut.'],
      },
    },
    B: {
      title: 'Half-backs lower B (BSS + broad light)',
      contrast: {
        a: 'Bulgarian Split Squat',
        aRx: '3x3/side @ RER 2-3',
        b: 'Broad Jump',
        bRx: '3 reps',
        notes: ['Contraste un peu plus lourd vs A — résiduel bas.'],
      },
      support: {
        a: 'Reverse Lunge Bodyweight',
        aRx: '3x5/side @ RER 2-3',
        b: 'Single-Leg Glute Bridge',
        bRx: '3x6/side @ RER 2-3',
        notes: ['Fente en soutien quand BSS mène.'],
      },
      finisher: {
        a: 'Tibialis Raise',
        aRx: '10 reps',
        b: 'A-Skip',
        bRx: '15m',
        notes: ['Garder signature tibialis + A-skip.'],
      },
    },
  },
  CENTERS: {
    A: {
      title: 'Centres lower (BSS + broad)',
      contrast: {
        a: 'Bulgarian Split Squat',
        aRx: '3-4x3/side @ RER 2-3',
        b: 'Broad Jump',
        bRx: '3 reps',
        notes: ['Force-projection pour contact centres.'],
      },
      support: {
        a: 'Single-Leg Glute Bridge',
        aRx: '3x5-6/side @ RER 2-3',
        b: 'Reverse Lunge Bodyweight',
        bRx: '3x5/side @ RER 2-3',
        notes: ['Soutien unilatéral stable.'],
      },
      finisher: {
        a: 'Copenhagen Plank',
        aRx: '15-20s/side',
        b: 'Short Acceleration Sprint',
        bRx: '2x10-15m',
        notes: ['Adducteurs + accel courte — transfert centres.'],
      },
    },
    B: {
      title: 'Centres lower B (kickstand + lateral)',
      contrast: {
        a: 'Kickstand RDL',
        aRx: '3-4x3/side @ RER 2-3',
        b: 'Lateral Bound',
        bRx: '3/side',
        notes: ['Hinge + latéral vs BSS/broad de A.'],
      },
      support: {
        a: 'Bulgarian Split Squat',
        aRx: '3x4/side @ RER 2-3',
        b: 'Single-Leg Glute Bridge',
        bRx: '3x6/side @ RER 2-3',
        notes: ['BSS en soutien quand hinge mène.'],
      },
      finisher: {
        a: 'Copenhagen Plank',
        aRx: '15s/side',
        b: 'Short Acceleration Sprint',
        bRx: '2x10m',
        notes: ['Garder signature Copenhagen + accel.'],
      },
    },
  },
  BACK_THREE: {
    A: {
      title: 'Back-three lower (Nordic + reverse lunge)',
      contrast: {
        a: 'Nordic Eccentric',
        aRx: '3x3-4 @ RER 2-3',
        b: 'Broad Jump',
        bRx: '3 reps',
        notes: [
          'Qualité ischio pour le soutien vitesse.',
          'Si l\'excentrique complet est trop dur : Nordic assisté élastique.',
        ],
      },
      support: {
        a: 'Reverse Lunge Bodyweight',
        aRx: '3x5/side @ RER 2-3',
        b: 'Single-Leg Glute Bridge',
        bRx: '3x6/side @ RER 2-3',
        notes: ['Unilateral support after Nordic.'],
      },
      finisher: {
        a: 'Short Acceleration Sprint',
        aRx: '2x15m',
        b: 'Copenhagen Plank',
        bRx: '15s/side',
        notes: ['Accel + adducteurs — robustesse grand terrain.'],
      },
    },
    B: {
      title: 'Back-three lower B (BSS + shrug-free speed)',
      contrast: {
        a: 'Bulgarian Split Squat',
        aRx: '3-4x3/side @ RER 2-3',
        b: 'Countermovement Jump',
        bRx: '3 reps',
        notes: ['Force unilatérale + saut vertical vs Nordic/broad de A.'],
      },
      support: {
        a: 'Nordic Eccentric',
        aRx: '3x3 @ RER 2-3',
        b: 'Reverse Lunge Bodyweight',
        bRx: '3x5/side @ RER 2-3',
        notes: ['Nordic en soutien — toujours présent pour les ischios.'],
      },
      finisher: {
        a: 'Short Acceleration Sprint',
        aRx: '2x10-15m',
        b: 'Copenhagen Plank',
        bRx: '15s/side',
        notes: ['Garder accel + Copenhagen.'],
      },
    },
  },
}

function familyLabel(family) {
  return {
    FRONT_ROW: 'front_row',
    SECOND_ROW: 'second_row',
    BACK_ROW: 'back_row',
    HALF_BACKS: 'half_backs',
    CENTERS: 'centers',
    BACK_THREE: 'back_three',
  }[family]
}

function pairBlock(name, format, pair) {
  return `### ${name}
- Format: \`${format}\`
- Exercise A: \`${pair.a}\` \`${pair.aRx}\`
- Exercise B: \`${pair.b}\` \`${pair.bRx}\`
- Coaching notes:
${pair.notes.map((n) => `  - ${n}`).join('\n')}
`
}

const FMT_CONTRAST = '4 rounds, full rest 2 min 30 to 3 min after each round'
const FMT_PAIR = '3 rounds, 75-90s rest after the pair'
const FMT_EMOM = "EMOM 8'"

function writeUpper(family, ab) {
  const spec = UPPER[family][ab]
  const id = `UPPER_BW_IN_SEASON_${family}_${ab}_V1`
  const md = `# ${id}

- \`status\`: validated
- \`version\`: V1
- \`cycle\`: in_season
- \`session_type\`: upper
- \`target_level\`: builder
- \`target_position_group\`: ${familyLabel(family)}
- \`equipment\`: bodyweight
- \`target_duration\`: 35-45 min
- \`reduction_order\`: 3, 2, 1

## Goal
- Maintain upper-body force useful for rugby at bodyweight for ${familyLabel(family)}.
- Keep one clear force -> speed exposure.
- Finish with a family-specific rugby block (not a generic contact template).

## Session Identity
- ${spec.title}
- In-season upper maintenance — controlled volume, high movement quality.
- Variant ${ab}: differs from the other variant on contrast and/or block 2 (not finisher-only).
- Deload week 4: \`-30%\` volume — cut Block 3 first.

## Warm-Up
Warm-up is stored as a collapsible recommendation rather than a mandatory visible block.

### Recommended warm-up
- \`thoracic rotation\` \`1x6-8/side\`
- \`scap push-up\` \`1x8\`
- \`band pull-apart\` \`1x10\`
- \`2 progressive ramp-up sets\` \`\`

### Notes
- Activation épaule et thorax avant les poussées.
- Court — préparation, pas une séance séparée.

## Visible Blocks

${pairBlock('Block 1 - Contrast Upper', FMT_CONTRAST, spec.contrast)}
${pairBlock('Block 2 - Pull / Scap Strength Pair', FMT_PAIR, spec.pull)}
${pairBlock(`Block 3 - ${family.replace(/_/g, ' ')} Finisher`, FMT_EMOM, spec.finisher)}
## Progression Rules
- Prioriser la qualité de mouvement sur les sauts de charge.
- Progresser via sac à dos / difficulté de tirage avant d'ajouter des reps.
- Deload semaine 4 : réduire le bloc 3 à 6 min EMOM ou le couper ; enlever un tour du bloc 2.
- Fatigue hebdo élevée : couper le bloc 3 d'abord, puis un tour du bloc 2.

## Position Accent
- Le Focus Contact / Puissance reste une couche de surface — ne pas confondre avec l'identité de cette mother.
${BACKS.has(family) ? '- Iso cou optionnel via accent Contact — pas le défaut de cette mother.\n' : '- Cou / carry peuvent monter un peu via accent Contact.\n'}
## Coaching Warnings
- Contraste propre — pas un circuit.
- Placer la séance assez tôt en semaine de match.

## Source References
- [bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)
- [UPPER_BW_IN_SEASON_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/in-season/UPPER_BW_IN_SEASON_V1.md)
`
  fs.writeFileSync(path.join(IN, `${id}.md`), md)
  return id
}

function writeLower(family, ab) {
  const spec = LOWER[family][ab]
  const id = `LOWER_BW_IN_SEASON_${family}_${ab}_V1`
  const md = `# ${id}

- \`status\`: validated
- \`version\`: V1
- \`cycle\`: in_season
- \`session_type\`: lower
- \`target_level\`: builder
- \`target_position_group\`: ${familyLabel(family)}
- \`equipment\`: bodyweight
- \`target_duration\`: 35-45 min
- \`reduction_order\`: 3, 2

## Goal
- Maintain lower-body force useful for rugby at bodyweight for ${familyLabel(family)}.
- Keep one clean force -> projection contrast without excessive residual fatigue.
- Finish with a family-specific short rugby block.

## Session Identity
- ${spec.title}
- In-season lower maintenance — not pre-season build.
- Variant ${ab}: differs from the other variant on contrast and/or block 2 (not finisher-only).
- Deload week 4: \`-30%\` volume — cut Block 3 first.

## Warm-Up
Warm-up is stored as a collapsible recommendation rather than a mandatory visible block.

### Recommended warm-up
- \`ankle rocks\` \`1x8/side\`
- \`adductor rock-back\` \`1x8/side\`
- \`glute bridge\` \`1x8\`
- \`bodyweight squat\` \`1x8\`
- \`2 progressive ramp-up sets\` \`\`

### Notes
- Court et spécifique — préparation, pas du volume.

## Visible Blocks

${pairBlock('Block 1 - Contrast Lower Force-Projection', FMT_CONTRAST, spec.contrast)}
${pairBlock('Block 2 - Posterior / Unilateral Support', FMT_PAIR, spec.support)}
${pairBlock(`Block 3 - ${family.replace(/_/g, ' ')} Finisher`, FMT_EMOM, spec.finisher)}
## Progression Rules
- Prioriser qualité de mouvement et projection sur les sauts de charge.
- Deload semaine 4 : réduire le bloc 3 à 6 min EMOM ou le couper ; enlever un tour du bloc 2.
- Si fatigue hebdo élevée : couper le bloc 3 d'abord, puis un tour du bloc 2.

## Position Accent
- Le Focus Contact / Puissance reste une couche de surface — l'identité est cette structure de séance.

## Coaching Warnings
- Ne pas laisser le travail unilatéral lourd devenir du grind de survie.
- En semaine de match, placer assez tôt pour récupérer le week-end.

## Source References
- [bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)
- [LOWER_BW_IN_SEASON_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/in-season/LOWER_BW_IN_SEASON_V1.md)
`
  fs.writeFileSync(path.join(IN, `${id}.md`), md)
  return id
}

function writeFullB() {
  const id = 'FULL_BW_BODY_IN_SEASON_B_V1'
  const md = `# ${id}

- \`status\`: validated
- \`version\`: V1
- \`cycle\`: in_season
- \`session_type\`: full
- \`target_level\`: builder
- \`target_position_group\`: front_row + back_three (common base with position accents)
- \`equipment\`: bodyweight
- \`target_duration\`: 40-50 min
- \`reduction_order\`: 4, 3, 2, 1

## Goal
- Variante B du full body in-season BW — même logique, contraste et push/pull différents de A.
- Maintenir force globale utile en semaine sans match.

## Session Identity
- Full body in-season B — volume contenu.
- Differs from \`FULL_BW_BODY_IN_SEASON_V1\` (A) on Block 1 contrast and Block 2 pair.

## Warm-Up
Warm-up is stored as a collapsible recommendation rather than a mandatory visible block.

### Recommended warm-up
- \`ankle rocks\` \`1x8/side\`
- \`glute bridge\` \`1x8\`
- \`scap push-up\` \`1x8\`
- \`bodyweight squat\` \`1x8\`
- \`2 progressive ramp-up sets\` \`\`

## Visible Blocks

### Block 1 - Hinge + Jump
- Format: \`3 rounds\`, \`2 min 30\` rest between rounds
- Exercise A: \`Bulgarian Split Squat\` \`3x3/side @ RER 2-3\`
- Exercise B: \`Countermovement Jump\` \`3 reps\`
- Coaching notes:
  - Contraste unilatéral vs la variante A (Kickstand RDL + Broad Jump).
  - Saut dans les 15-20 s après A — projection nette.

### Block 2 - Push / Pull
- Format: \`3 rounds\`, \`90s\` rest after the pair
- Exercise A: \`Decline Push-Up\` \`3x4 @ RER 2-3\`
- Exercise B: \`Inverted Row Standard\` \`3x5-6 @ RER 2-3\`
- Coaching notes:
  - Decline + rowing inversé vs A (dips chaise + traction) — A≠B sur le bloc 2.
  - Fallback B : Face Pull Band si pas de rowing.

### Block 3 - Unilateral + Trunk
- Format: \`2 rounds\`, \`75s\` rest after the pair
- Exercise A: \`Reverse Lunge Bodyweight\` \`2x6/side @ RER 2-3\`
- Exercise B: \`Pallof Press Hold\` \`2x15s/side\`
- Coaching notes:
  - Fente + anti-rotation — volume léger.

### Block 4 - Light Finisher
- Format: \`2 rounds\`, \`60s\` rest
- Exercise A: \`Bear Crawl\` \`2x15m\`
- Exercise B: \`Side Plank\` \`2x15s/side\`
- Coaching notes:
  - Finisher tronc plus léger que le cou de la variante A — à couper en premier si fatigue.

## Progression Rules
- Prioritize quality over load.
- Deload S4: cut block 4, then one round from block 3.

## Source References
- [FULL_BW_BODY_IN_SEASON_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/in-season/FULL_BW_BODY_IN_SEASON_V1.md)
`
  fs.writeFileSync(path.join(IN, `${id}.md`), md)
  return id
}

function writePowerBacks(family) {
  const id = `UPPER_BW_PRESEASON_POWER_${family}_V1`
  const md = `# ${id}

- \`status\`: validated
- \`version\`: V1
- \`cycle\`: pre_season
- \`session_type\`: upper
- \`target_level\`: builder
- \`target_position_group\`: ${familyLabel(family)}
- \`equipment\`: bodyweight
- \`target_duration\`: 40-48 min
- \`reduction_order\`: 3, 2, 1

## Goal
- Phase 3 puissance upper pour arrières — push vitesse et finisher scap/rotation.
- Pas de suitcase + cou par défaut (template avants).

## Session Identity
- Phase puissance upper pour ${familyLabel(family)} — vitesse max des mains, pas de grind force.

## Warm-Up
Warm-up is stored as a collapsible recommendation rather than a mandatory visible block.

### Recommended warm-up
- \`scap push-up\` \`1x8\`
- \`thoracic rotation\` \`1x6-8/side\`
- \`2 progressive ramp-up sets\` \`\`

## Visible Blocks

### Block 1 - Speed Push Contrast
- Format: \`4 rounds\`, \`2 min 30\` rest between rounds
- Exercise A: \`Archer Push-Up\` \`4x3/side @ RER 1-2\`
- Exercise B: (contrast) \`Plyo Push-Up\` \`3-4 reps\`
- Coaching notes:
  - A : effort modéré, vitesse de poussée max (évite Pike déjà au primer).
  - Fallback A : Decline Push-Up.
  - Plyo juste après A si la qualité tient.

### Block 2 - Explosive Pull / Scap
- Format: \`3 rounds\`, \`90s\` rest after the pair
- Exercise A: \`Inverted Row Standard\` \`3x4 @ RER 1-2\`
- Exercise B: \`Face Pull Band\` \`3x12-15 @ RER 1-2\`
- Coaching notes:
  - Row concentrique rapide ; qualité scapulaire sur le face pull.

### Block 3 - Finisher
- Format: \`EMOM 6'\`
- Exercise A: minute 1 \`Band Rotation Explosive\` \`3-4/side\`
- Exercise B: minute 2 \`Band Pull-Apart\` \`12 reps\`
- Coaching notes:
  - Rotation + scap — PAS suitcase + cou.
  - Fallback rotation : Side Plank 15 s/côté sans bande.

## Progression Rules
- Arrêter le plyo si la vitesse de poussée chute.
- EMOM optionnel si fatigue upper élevée.

## Source References
- [UPPER_BW_PRESEASON_POWER_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/UPPER_BW_PRESEASON_POWER_V1.md)
`
  fs.writeFileSync(path.join(PRE, `${id}.md`), md)
  return id
}

const created = []
for (const family of FAMILIES) {
  for (const ab of ['A', 'B']) {
    created.push(writeUpper(family, ab))
    created.push(writeLower(family, ab))
  }
}
created.push(writeFullB())
for (const family of ['HALF_BACKS', 'CENTERS', 'BACK_THREE']) {
  created.push(writePowerBacks(family))
}

console.log(`Wrote ${created.length} mothers:`)
for (const id of created) console.log(' -', id)
