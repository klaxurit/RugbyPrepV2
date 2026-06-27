/**
 * AUTO-GÉNÉRÉ — ne pas modifier à la main.
 * Source : docs/training/mother-sessions/
 * Régénérer : node scripts/generateMotherSessionsDataset.mjs
 */

import type { MotherSession } from '../types/motherSession'

export const MOTHER_SESSIONS: MotherSession[] = [
  {
    "metadata": {
      "id": "FULL_BODY_IN_SEASON_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "in_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "50-65 min"
    },
    "title": "FULL_BODY_IN_SEASON_BACK_THREE_V1",
    "goal": [
      "Maintain whole-body force and power in weeks without a match.",
      "Keep a clear athletic identity with slightly more muscular support than the primer session.",
      "Expose the player to one lower power pairing, one upper push/pull strength block, one posterior-chain support block, and a small accessory finish.",
      "Keep the session readable and transferable to rugby."
    ],
    "sessionIdentity": [
      "Rugby-specific through one lower power pairing, useful push/pull work, posterior-chain support, and lower-leg/groin resilience.",
      "Back-three specific through speed bias, unilateral control, posterior-chain support, and a slightly more enjoyable renfo feel in non-match weeks.",
      "Do not turn this into a long accumulation day, but do allow a little more muscular work than a primer."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "low pogo hops",
          "prescription": "1x10"
        },
        {
          "name": "thoracic rotation",
          "prescription": "1x6/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive prep sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep it short and specific.",
        "The player can keep their own full-body prep if it covers ankle, trunk, and upper-body readiness."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Lower Power Pair",
        "format": "`3 rounds`, full rest `3 min`",
        "exercises": [
          {
            "name": "Back Squat",
            "prescription": "3x2-3 @ 75-80%"
          },
          {
            "name": "Countermovement Jump",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "The loaded lower movement stays sharp and technically clean.",
          "Bar speed matters more than load here.",
          "The jump stays crisp and explosive.",
          "This block opens the session with force and elastic output, without excessive volume."
        ],
        "fallbackOptions": [
          "A: `Front Squat`",
          "B: `Drop Jump`"
        ]
      },
      {
        "number": 2,
        "name": "Upper Push/Pull Strength",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "DB Incline Bench Press",
            "prescription": "3x6-8"
          },
          {
            "name": "Chest-Supported Row",
            "prescription": "3x6-8"
          }
        ],
        "coachingNotes": [
          "This is your main push/pull renfo block.",
          "Keep it strong and clean, not sloppy.",
          "This block should feel useful and satisfying without turning into an upper-only session."
        ],
        "fallbackOptions": [
          "B: `Single-Arm DB Row`"
        ]
      },
      {
        "number": 3,
        "name": "Posterior Chain / Rotation Support",
        "format": "`3 rounds`, `75-90s` rest",
        "exercises": [
          {
            "name": "Hex Bar RDL",
            "prescription": "3x6-8"
          },
          {
            "name": "Landmine Rotation",
            "prescription": "2-3x6-8/side"
          }
        ],
        "coachingNotes": [
          "The main lift should support speed and robustness, not create two days of soreness.",
          "The rotation work should stay crisp and athletic."
        ],
        "fallbackOptions": [
          "A: `Barbell Hip Thrust`"
        ]
      },
      {
        "number": 4,
        "name": "Lower Leg / Groin Support",
        "format": "`2-3 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Weighted Calf Raise",
            "prescription": "10-12 reps"
          },
          {
            "name": "Tibialis Raise",
            "prescription": "10-12 reps"
          },
          {
            "name": "Copenhagen Hold",
            "prescription": "20-30s"
          }
        ],
        "coachingNotes": [
          "This block supports ankle stiffness, lower-leg resilience, and groin robustness.",
          "Keep it clean and simple.",
          "If the player is already tired, reduce this block first."
        ]
      },
      {
        "number": 5,
        "name": "Arm Pump / Reward Block",
        "format": "`2-3 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Alternating DB Curl",
            "prescription": "10-12 reps"
          },
          {
            "name": "Skull Crusher",
            "prescription": "10-12 reps"
          }
        ],
        "coachingNotes": [
          "Optional only.",
          "This block gives the player a little reward without changing the identity of the session.",
          "Stop short of failure and avoid next-day soreness."
        ],
        "isOptional": true,
        "fallbackOptions": [
          "A: `Hammer Curl`",
          "B: `Rope Pressdown`"
        ]
      }
    ],
    "progressionRules": [
      "Progress load only if speed and execution stay high.",
      "Keep total volume stable before adding work.",
      "If fatigue rises, remove optional Block 5 first, then reduce Block 4, then reduce one round from Block 3."
    ],
    "positionAccent": [
      "Common full-body skeleton can be shared across positions.",
      "Back-three accent comes from:",
      "lower-body power first",
      "upper push/pull strength without huge CNS cost",
      "posterior-chain and ankle support",
      "lower total collision emphasis than front row"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "incline press if painful",
          "optional arm work if it aggravates symptoms"
        ],
        "replaceWith": [
          "landmine if tolerated",
          "row/scap/trunk-focused alternative"
        ],
        "rehabFinisher": [
          "`serratus reach`",
          "`band external rotation`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "jump if painful",
          "back squat if painful"
        ],
        "replaceWith": [
          "hip-dominant alternative",
          "reduced-range unilateral pattern if tolerated"
        ],
        "rehabFinisher": [
          "light knee-control work if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "unsupported row if posture breaks",
          "RDL if posture breaks",
          "landmine rotation if it aggravates symptoms"
        ],
        "replaceWith": [
          "supported upper pull",
          "lighter trunk alternative"
        ],
        "rehabFinisher": [
          "breathing + trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "This is not an off-season volume session.",
      "Do not let the opening power block become slow or noisy.",
      "Do not stack lower fatigue mindlessly if the week already has field speed exposure.",
      "The optional arm block should stay enjoyable, not costly.",
      "The athlete should still feel athletic at the end."
    ],
    "sourceReferences": [
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[positionPreferences.v1.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/positionPreferences.v1.ts)",
      "[fullbody.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/fullbody.jpg)",
      "[fullbody-power-renfo.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/fullbody-power-renfo.jpg)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_BODY_IN_SEASON_FRONT_ROW_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "in_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row",
      "equipment": "full_gym",
      "targetDuration": "55-70 min"
    },
    "title": "FULL_BODY_IN_SEASON_FRONT_ROW_V1",
    "goal": [
      "Maintain whole-body force and useful muscle support in weeks without a match.",
      "Keep a clear athletic identity with slightly more muscular support than the primer session.",
      "Expose the player to one lower power pairing, one upper push/pull strength block, one posterior-chain support block, and one front-row support block.",
      "Keep the session readable, useful, and still compatible with in-season recovery."
    ],
    "sessionIdentity": [
      "Rugby-specific through lower power, strong push/pull work, hinge support, and front-row contact robustness.",
      "Front-row specific through stronger bracing, heavier horizontal/upper-body bias, adductor/neck/contact support, and a small optional reward block.",
      "Do not turn this into an off-season accumulation day."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "thoracic rotation",
          "prescription": "1x6/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive prep sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep it short and specific.",
        "The player can keep their own full-body prep if it covers hips, trunk, and upper-body readiness."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Lower Power Pair",
        "format": "`3 rounds`, full rest `3 min`",
        "exercises": [
          {
            "name": "Front Squat",
            "prescription": "3x4-5"
          },
          {
            "name": "Countermovement Jump",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "The front squat should stay sharp, upright, and braced.",
          "The jump stays crisp and explosive.",
          "This block opens the session with force support and athletic output, without duplicating the lower-day opening."
        ],
        "fallbackOptions": [
          "A: `Box Squat`",
          "B: `Broad Jump`"
        ]
      },
      {
        "number": 2,
        "name": "Upper Push/Pull Strength",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Football Bar Bench Press",
            "prescription": "3x5-6"
          },
          {
            "name": "Chest-Supported Row",
            "prescription": "3x6-8"
          }
        ],
        "coachingNotes": [
          "This is the main upper renfo block.",
          "Keep the push strong and the pull equally solid.",
          "This block should feel robust and useful, not sloppy.",
          "`Football Bar Bench Press` = neutral-grip football bar / Swiss bar bench press.",
          "Automatic alternative if the bar is not available: `Neutral-Grip DB Bench Press`."
        ],
        "fallbackOptions": [
          "A1: `Neutral-Grip DB Bench Press`",
          "A2: `Bench Press`",
          "B: `Landmine Row`"
        ]
      },
      {
        "number": 3,
        "name": "Posterior Chain / Trunk Support",
        "format": "`3 rounds`, `75-90s` rest",
        "exercises": [
          {
            "name": "Hex Bar RDL",
            "prescription": "3x6-8"
          },
          {
            "name": "Landmine Rotation",
            "prescription": "2-3x6-8/side"
          }
        ],
        "coachingNotes": [
          "The hinge lift should support contact robustness and sprint support without excessive soreness.",
          "The rotation work should stay controlled and athletic."
        ],
        "fallbackOptions": [
          "A: `Barbell Hip Thrust`",
          "B: `Ab Wheel`"
        ]
      },
      {
        "number": 4,
        "name": "Front Row Support",
        "format": "`2-3 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Sled Push",
            "prescription": "15-20m"
          },
          {
            "name": "Copenhagen Hold",
            "prescription": "20-30s"
          },
          {
            "name": "Neck Isometric",
            "prescription": "15-20s"
          }
        ],
        "coachingNotes": [
          "This block supports horizontal force, groin robustness, and cervical readiness.",
          "Keep it useful and controlled.",
          "If the player is already tired, reduce this block first."
        ],
        "fallbackOptions": [
          "A: `Farmer Carry` or `Zercher Carry`",
          "C: `Banded Neck Extension`"
        ]
      },
      {
        "number": 5,
        "name": "Arm Pump / Reward Block",
        "format": "`2-3 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Hammer Curl",
            "prescription": "10-12 reps"
          },
          {
            "name": "French Press",
            "prescription": "10-12 reps"
          }
        ],
        "coachingNotes": [
          "Optional only.",
          "This block gives the player a small reward without changing the identity of the session.",
          "Stop short of failure and avoid next-day soreness."
        ],
        "isOptional": true,
        "fallbackOptions": [
          "B: `Rope Pressdown` or `Skull Crusher`"
        ]
      }
    ],
    "progressionRules": [
      "Progress load only if speed and execution stay high.",
      "Keep total volume stable before adding work.",
      "If fatigue rises, remove optional Block 5 first, then reduce Block 4, then reduce one round from Block 3.",
      "On dense rugby weeks, keep the session near the low end of the duration target:",
      "skip Block 5 by default",
      "keep Block 4 at `2 rounds`"
    ],
    "positionAccent": [
      "Common full-body skeleton can be shared across positions.",
      "Front-row accent comes from:",
      "lower-body projection with more force bias",
      "stronger upper push/pull support",
      "hinge and trunk robustness",
      "adductor, neck, and contact support"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "bench if painful",
          "optional arm work if it aggravates symptoms",
          "sled if hand/arm position is irritating"
        ],
        "replaceWith": [
          "landmine if tolerated",
          "row/scap/trunk-focused alternative"
        ],
        "rehabFinisher": [
          "`serratus reach`",
          "`band external rotation`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "jump if painful",
          "box squat if painful",
          "sled if aggravating"
        ],
        "replaceWith": [
          "hip-dominant alternative",
          "reduced-range lower option if tolerated"
        ],
        "rehabFinisher": [
          "light knee-control work if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "unsupported row if posture breaks",
          "RDL if posture breaks",
          "landmine rotation if it aggravates symptoms"
        ],
        "replaceWith": [
          "supported upper pull",
          "lighter trunk alternative"
        ],
        "rehabFinisher": [
          "breathing + trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "This is not an off-season volume session.",
      "Do not let the opening power block become slow or noisy.",
      "Do not let the support block become a random conditioning circuit.",
      "The optional reward block should stay enjoyable, not costly.",
      "The athlete should still feel robust and athletic at the end."
    ],
    "sourceReferences": [
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[positionPreferences.v1.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/positionPreferences.v1.ts)",
      "[fullbody.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/fullbody.jpg)",
      "[upper-4.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/upper-4.jpg)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_BW_OFFSEASON_FORCE_BRIDGE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "full",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (common base with position accents)",
      "equipment": "bodyweight",
      "targetDuration": "50-60 min"
    },
    "title": "FULL_BW_OFFSEASON_FORCE_BRIDGE_V1",
    "goal": [
      "Full-body force-bridge for 3x/week off-season frequency at bodyweight.",
      "One lower contrast + one upper contrast + structural support in a single session.",
      "Leave the athlete feeling powerful, not depleted."
    ],
    "sessionIdentity": [
      "Force-bridge full-body — intensity and speed over hypertrophy volume.",
      "**Calibration** : rugbyman club — nordiques stricts, push lourd + plyo, sauts max intention.",
      "Third weekly session — complements Lower and Upper force-bridge days."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Préparer hanches, chevilles et épaules avant le bloc 1."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Hinge Force + Jump Contrast",
        "format": "`3 rounds`, `3 min` rest between rounds",
        "exercises": [
          {
            "name": "Nordic Eccentric",
            "prescription": "3x4-5"
          },
          {
            "name": "Broad Jump",
            "prescription": "3x3, max distance",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Nordiques stricts (3-4 s en descente) — viser la force, pas la chasse au volume.",
          "Broad jump dans les 15-20 s après la série de nordiques.",
          "Variante A : `Romanian Deadlift` lourd si haltères ou KB disponibles."
        ]
      },
      {
        "number": 2,
        "name": "Push Force + Explosive Contrast",
        "format": "`3 rounds`, `3 min` rest between rounds",
        "exercises": [
          {
            "name": "Decline Push-Up",
            "prescription": "3x4"
          },
          {
            "name": "Plyo Push-Up",
            "prescription": "3x4, max height",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Push lent lourd puis plyo explosive dans la fenêtre PAP.",
          "Variante A : développé haltères si banc + haltères disponibles.",
          "Réduire la charge sur A avant de couper les reps de plyo."
        ]
      },
      {
        "number": 3,
        "name": "Pull + Unilateral Support",
        "format": "`3 rounds`, `90s` rest after the pair",
        "exercises": [
          {
            "name": "Inverted Row Feet Elevated",
            "prescription": "3x5"
          },
          {
            "name": "Bulgarian Split Squat",
            "prescription": "3x5/side"
          }
        ],
        "coachingNotes": [
          "Tirage et squat unilatéral de qualité force — stable, sans grind.",
          "Variante A : tractions strictes si barre disponible.",
          "Variante B : fente bulgare chargée si haltères disponibles."
        ]
      },
      {
        "number": 4,
        "name": "Rugby Finisher",
        "format": "`2 rounds`, `45-60s` rest after the round",
        "exercises": [
          {
            "name": "Bear Crawl",
            "prescription": "2x20m"
          },
          {
            "name": "Side Plank",
            "prescription": "2x15-30s/side"
          }
        ],
        "coachingNotes": [
          "Finisher court — locomotion rapide + anti-flexion latérale du tronc.",
          "Variante A : `Farmer Carry` rapide si haltères ou KB disponibles.",
          "Couper ce bloc en premier si la fatigue hebdomadaire est élevée."
        ]
      }
    ],
    "progressionRules": [
      "`FB1`: establish both contrast pairs; confirm jump and plyo quality.",
      "`FB2`: add external load on A exercises if ballistic quality holds.",
      "Reduce Block 4 first, then Block 3 to 2 rounds.",
      "NEVER reduce Blocks 1-2."
    ],
    "positionAccent": [
      "`Front_row`: patient nordic setup; optional neck isometric after finisher if tolerated.",
      "`Back_three`: prioritize broad jump distance and plyo push speed."
    ],
    "injurySubstitutions": [],
    "coachingWarnings": [
      "Powerful session — respect full rest on contrast blocks.",
      "Not a fourth leg day disguised as full-body work."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[FULL_OFFSEASON_FORCE_BRIDGE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/FULL_OFFSEASON_FORCE_BRIDGE_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_BW_OFFSEASON_HYPERTROPHY_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "full",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (common base with position accents)",
      "equipment": "bodyweight",
      "targetDuration": "55-65 min"
    },
    "title": "FULL_BW_OFFSEASON_HYPERTROPHY_V1",
    "goal": [
      "Complete the hypertrophy week with a full-body bodyweight session.",
      "Hinge anchor, upper support, unilateral lower, and rugby finisher without duplicating Lower/Upper days exactly.",
      "Aligned with gym `FULL_OFFSEASON_HYPERTROPHY_V1` intent at tier-0 equipment."
    ],
    "sessionIdentity": [
      "Hypertrophy full-body — not a fourth heavy lower day.",
      "Rugby finisher: carry/locomotion, adductors, optional neck.",
      "**Calibration** : juste milieu rugbyman — exigeant mais faisable sans salle (`RPE 6-8`, `1-2 RIR` semaine 3).",
      "Régressions (incline, fente arrière) = **fallbacks coaching** uniquement."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Dense but controlled readiness."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Hinge Hypertrophy",
        "format": "`4 work sets`, `2 min` rest between sets",
        "exercises": [
          {
            "name": "Nordic Eccentric",
            "prescription": "4x6-8"
          }
        ],
        "coachingNotes": [
          "Around `RPE 6-8` — hypertrophy hinge, not max strength.",
          "Excentrique 3-4 s ; mains au sol uniquement pour finir si nécessaire.",
          "Fallback: `Kickstand RDL` heavy tempo if nordics not tolerated."
        ]
      },
      {
        "number": 2,
        "name": "Upper Push / Pull Support",
        "format": "`4 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Decline Push-Up",
            "prescription": "4x8-10"
          },
          {
            "name": "Inverted Row Feet Elevated",
            "prescription": "4x8-10"
          }
        ],
        "coachingNotes": [
          "Main upper volume — backpack on push-up before any angle regression.",
          "Upgrade row: strict pull-ups if bar available.",
          "Fallback A: `Push-Up` with backpack load.",
          "Fallback B: `Inverted Row Standard`."
        ]
      },
      {
        "number": 3,
        "name": "Lower Support / Trunk Pair",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Bulgarian Split Squat",
            "prescription": "3x8-10/side"
          },
          {
            "name": "Bird Dog",
            "prescription": "3x8-10/side"
          }
        ],
        "coachingNotes": [
          "Unilateral lower + trunk anti-extension/rotation without another leg day.",
          "Bird dog : pause 2s en extension, pas de balancement.",
          "Fallback A: `Reverse Lunge Bodyweight` if balance limits split work.",
          "Upgrade B: `Pallof Press Hold` if band available."
        ]
      },
      {
        "number": 4,
        "name": "Rugby Finisher",
        "format": "`2 rounds`, `45-60s` rest after the round",
        "exercises": [
          {
            "name": "Bear Crawl",
            "prescription": "2x30s"
          },
          {
            "name": "Copenhagen Plank",
            "prescription": "2x20-30s/side"
          },
          {
            "name": "Neck Extension Isometric",
            "prescription": "2x10s/direction"
          }
        ],
        "coachingNotes": [
          "Short rugby-oriented finisher — quality over exhaustion.",
          "Copenhagen : pied surélevé (chaise/banc) — pas de genou au sol.",
          "Neck : extension + flexion + latéral (main) — 10s par direction.",
          "Upgrade neck: `Banded Neck Isometric` if band available.",
          "`Front_row`: keep neck C in the finisher."
        ]
      }
    ],
    "progressionRules": [
      "Week 4 deload: reduce Block 2–3 to 2 rounds; keep Block 1 load moderate.",
      "Cut Block 4 first if weekly lower volume is already high.",
      "Add backpack/tempo before swapping to easier exercise variants."
    ],
    "positionAccent": [],
    "injurySubstitutions": [],
    "coachingWarnings": [
      "Not a marathon checklist session.",
      "If lower days were hard, keep Block 3 unilateral work submaximal.",
      "Too easy = augmenter charge ou tempo, pas régresser vers incliné."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[FULL_OFFSEASON_HYPERTROPHY_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/FULL_OFFSEASON_HYPERTROPHY_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_BW_OFFSEASON_RECOVERY_A_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "full",
      "targetLevel": "starter",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "bodyweight",
      "targetDuration": "30-40 min"
    },
    "title": "FULL_BW_OFFSEASON_RECOVERY_A_V1",
    "goal": [
      "Reintroduce full-body training after the season without performance pressure.",
      "Rehearse squat, hinge, push, pull, and trunk at bodyweight with optional band/DB upgrades.",
      "Leave the player feeling better, looser, and more confident than when they walked in."
    ],
    "sessionIdentity": [
      "Recovery re-entry session — not hypertrophy, not force work.",
      "Rugby-specific through pattern restoration, trunk, adductors, and movement quality.",
      "Keep all work around `RPE 4-5`."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "1 very light ramp-up round",
          "prescription": ""
        },
        {
          "name": "Bodyweight Squat",
          "prescription": ""
        },
        {
          "name": "Glute Bridge",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this to `3-5 min` maximum.",
        "The first reps of Block 1 should still feel like part of the re-entry process."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Squat / Hinge Re-Entry",
        "format": "`3 rounds`, `60-90s` rest after the pair",
        "exercises": [
          {
            "name": "Bodyweight Squat",
            "prescription": "3x8"
          },
          {
            "name": "Glute Bridge",
            "prescription": "3x8"
          }
        ],
        "coachingNotes": [
          "Keep both movements at around `RPE 4-5`.",
          "Squat upright and controlled — no grinding.",
          "Hinge should feel clean; glute bridge is the default BW hinge here."
        ],
        "fallbackOptions": [
          "A: `Box-Assisted Goblet Squat` if bands/DB available",
          "B: `Good Morning` with band if available"
        ]
      },
      {
        "number": 2,
        "name": "Push / Pull Re-Entry",
        "format": "`3 rounds`, `60-90s` rest after the pair",
        "exercises": [
          {
            "name": "Incline Push-Up",
            "prescription": "3x8-10"
          },
          {
            "name": "Inverted Row Standard",
            "prescription": "3x8-10"
          }
        ],
        "coachingNotes": [
          "Push on an incline first; progress to standard push-up when easy.",
          "Row from a sturdy table or low bar; feet on floor."
        ],
        "fallbackOptions": [
          "A: `Push-Up` on a higher surface",
          "B: `Inverted Row` with knees bent if table height is limited",
          "With band: seated band row; with pull-up bar: band-assisted pull-up"
        ]
      },
      {
        "number": 3,
        "name": "Trunk / Mobility / Tissue Reset",
        "format": "`2 rounds`, move continuously with minimal rest",
        "exercises": [
          {
            "name": "Dead Bug",
            "prescription": "2x8/side"
          },
          {
            "name": "Adductor Rock-Back",
            "prescription": "2x8/side"
          },
          {
            "name": "World's Greatest Stretch",
            "prescription": "2x4/side"
          }
        ],
        "coachingNotes": [
          "Trunk reset and groin reintroduction — nothing intense.",
          "Move smoothly and breathe normally."
        ]
      }
    ],
    "progressionRules": [
      "`S1`: conservative effort; stop well before meaningful fatigue.",
      "`S2`: slightly more range or one harder push/row variant only if everything felt clean.",
      "If beat up on the day, drop one round from Block 1 or Block 2 first."
    ],
    "positionAccent": [
      "Common base session.",
      "`Front_row`: optional 1 round neck isometric (hand) in finisher if no pain.",
      "`Back_three`: prioritize fluid movement quality on hinge and row."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "Replace push with `Push-Up` on an elevated surface.",
          "Replace row with `Inverted Row` knees bent or band row."
        ],
        "replaceWith": [],
        "rehabFinisher": []
      },
      {
        "area": "knee_pain",
        "remove": [
          "Replace squat with partial-range bodyweight squat or wall sit short holds."
        ],
        "replaceWith": [],
        "rehabFinisher": []
      },
      {
        "area": "low_back_pain",
        "remove": [
          "Replace hinge work with `Glute Bridge` only; avoid deep flexion."
        ],
        "replaceWith": [],
        "rehabFinisher": []
      }
    ],
    "coachingWarnings": [
      "Do not chase soreness, pump, or load.",
      "If the athlete leaves feeling cooked, the session was too aggressive."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[bodyweight-program-review.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-program-review.md)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_BW_OFFSEASON_RECOVERY_B_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "full",
      "targetLevel": "starter",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "bodyweight",
      "targetDuration": "30-40 min"
    },
    "title": "FULL_BW_OFFSEASON_RECOVERY_B_V1",
    "goal": [
      "Second recovery session: lighter, freer, slightly more athletic than Recovery A.",
      "Restore unilateral tolerance, locomotion, push/pull, and lower-leg/groin support at bodyweight.",
      "Keep momentum without creating fatigue."
    ],
    "sessionIdentity": [
      "Recovery reset — not conditioning, not reduced hypertrophy.",
      "Rugby-specific through unilateral work, locomotion, trunk, groin, and lower-leg support."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "90/90 hip switch",
          "prescription": "1x6/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "1 easy prep round",
          "prescription": ""
        },
        {
          "name": "Reverse Lunge Bodyweight",
          "prescription": ""
        },
        {
          "name": "Incline Push-Up",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this to `3-5 min` maximum.",
        "Session should begin like movement practice, not heavy prep."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Unilateral / Locomotion Reset",
        "format": "`2-3 rounds`, `60-75s` rest after the pair",
        "exercises": [
          {
            "name": "Reverse Lunge Bodyweight",
            "prescription": "2-3x6/side"
          },
          {
            "name": "Bear Crawl",
            "prescription": "2-3x10-15m"
          }
        ],
        "coachingNotes": [
          "Lunge restores rhythm and balance, not strength.",
          "Crawl coordinated and athletic — never rushed."
        ],
        "fallbackOptions": [
          "A: `Bodyweight Split Squat`",
          "B: `Bird Dog`"
        ]
      },
      {
        "number": 2,
        "name": "Push / Pull Reset",
        "format": "`2-3 rounds`, `60-90s` rest after the pair",
        "exercises": [
          {
            "name": "Incline Push-Up",
            "prescription": "2-3x8-10"
          },
          {
            "name": "Inverted Row Standard",
            "prescription": "2-3x8/side"
          }
        ],
        "coachingNotes": [
          "Every push-up rep should look the same.",
          "Row restores scapular rhythm without fatigue."
        ],
        "fallbackOptions": [
          "A: `Push-Up` on a higher surface",
          "B: `Inverted Row` with knees bent"
        ]
      },
      {
        "number": 3,
        "name": "Lower-Leg / Groin / Trunk Support",
        "format": "",
        "exercises": [
          {
            "name": "Single-Leg Calf Raise",
            "prescription": "2x10/side"
          },
          {
            "name": "Wall Tibialis Raise",
            "prescription": "2x12"
          },
          {
            "name": "Side Plank",
            "prescription": "2x20s/side"
          },
          {
            "name": "Supine Adductor Squeeze",
            "prescription": "2x20s"
          }
        ],
        "coachingNotes": [
          "Ankle stiffness, trunk control, gentle groin tolerance.",
          "Run calf + tibialis first, then plank + adductor squeeze."
        ]
      }
    ],
    "progressionRules": [
      "`S1`: low end of volume if still heavy from the season.",
      "`S2`: move from `2` to `3` rounds only if the whole session felt easy and clean."
    ],
    "positionAccent": [
      "Common base; front_row may add 1 round Copenhagen knee if tolerated."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "Elevated push-up only; reduce row angle."
        ],
        "replaceWith": [],
        "rehabFinisher": []
      },
      {
        "area": "knee_pain",
        "remove": [
          "Replace lunge with `Bodyweight Split Squat` shallow range or `Wall Sit` short holds."
        ],
        "replaceWith": [],
        "rehabFinisher": []
      }
    ],
    "coachingWarnings": [
      "Do not overload with circuits or extra sets.",
      "Player should leave feeling put back together."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_BW_OFFSEASON_TRANSITION_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "full",
      "targetLevel": "starter",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "bodyweight",
      "targetDuration": "45-55 min"
    },
    "title": "FULL_BW_OFFSEASON_TRANSITION_V1",
    "goal": [
      "Bridge Recovery and off-season build with a controlled full-body bodyweight session.",
      "Complement Lower/Upper Transition without repeating their main patterns exactly.",
      "Reintroduce hinge, push/pull, locomotion, and trunk support."
    ],
    "sessionIdentity": [
      "Transition full-body — not recovery circuit, not hypertrophy day.",
      "Rugby-specific hinge, upper support, trunk, and light contact-prep accents."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Short — ready to train moderately."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Hinge / Squat Light Pair",
        "format": "`3 rounds`, `90s` rest after the pair",
        "exercises": [
          {
            "name": "Good Morning",
            "prescription": "3x8"
          },
          {
            "name": "Bodyweight Squat",
            "prescription": "3x10"
          }
        ],
        "coachingNotes": [
          "Hinge pattern with bodyweight good morning; squat controlled `RPE 5-6`.",
          "Fallback: `Glute Bridge` if low back sensitive."
        ]
      },
      {
        "number": 2,
        "name": "Push / Pull Pair",
        "format": "`3 rounds`, `90s` rest after the pair",
        "exercises": [
          {
            "name": "Push-Up",
            "prescription": "3x8-10"
          },
          {
            "name": "Inverted Row Standard",
            "prescription": "3x8-10"
          }
        ],
        "coachingNotes": [
          "Quality reps; elevate hands on push-up if needed.",
          "Upgrade to decline push-up or feet-elevated row when easy."
        ]
      },
      {
        "number": 3,
        "name": "Rugby Light Finisher",
        "format": "`2 rounds`, `45s` rest after the pair",
        "exercises": [
          {
            "name": "Bear Crawl",
            "prescription": "2x15m"
          },
          {
            "name": "Side Plank",
            "prescription": "2x15s/side"
          }
        ],
        "coachingNotes": [
          "Athletic but submaximal — not a conditioning test.",
          "Front_row: optional 1 round neck isometric (hand) after planks if no pain."
        ]
      }
    ],
    "progressionRules": [
      "`S3`–`S4`: progress movement quality and slightly harder BW variants before adding rounds.",
      "Do not add extra blocks — stay transition volume."
    ],
    "positionAccent": [],
    "injurySubstitutions": [],
    "coachingWarnings": [
      "Not an everything day or sneaky volume monster.",
      "If beat up, reduce to 2 rounds on Blocks 1–2."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_BW_PRESEASON_FORCE_POWER_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "full",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (phase 2 common base)",
      "equipment": "bodyweight",
      "targetDuration": "50-60 min"
    },
    "title": "FULL_BW_PRESEASON_FORCE_POWER_V1",
    "goal": [
      "Whole-body force-power contrasts for 3x/week pre-season phase 2.",
      "Hinge + jump and push + plyo pairs with pull/rotation support."
    ],
    "sessionIdentity": [
      "Full-body force-power — contrast quality over finisher volume."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight squat",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": []
    },
    "blocks": [
      {
        "number": 1,
        "name": "Contrast Hinge + Jump",
        "format": "`4 rounds`, `3 min` rest between rounds",
        "exercises": [
          {
            "name": "Romanian Deadlift",
            "prescription": "4x3-4"
          },
          {
            "name": "Broad Jump",
            "prescription": "4x3",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Heavy hinge — DB/KB or strict nordic fallback.",
          "Broad jump: full hip extension, stick landing."
        ]
      },
      {
        "number": 2,
        "name": "Contrast Push",
        "format": "`3 rounds`, `3 min` rest between rounds",
        "exercises": [
          {
            "name": "Decline Push-Up",
            "prescription": "3x4"
          },
          {
            "name": "Plyo Push-Up",
            "prescription": "3x4",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Upgrade A: dumbbell bench if DB + bench."
        ]
      },
      {
        "number": 3,
        "name": "Pull + Rotation",
        "format": "`3 rounds`, `90s` rest after the pair",
        "exercises": [
          {
            "name": "Inverted Row Feet Elevated",
            "prescription": "3x5"
          },
          {
            "name": "Band Rotation Explosive",
            "prescription": "3x5/side"
          }
        ],
        "coachingNotes": [
          "Upgrade A: pull-up if bar available."
        ]
      },
      {
        "number": 4,
        "name": "Carry",
        "format": "`2 rounds`, `60s` rest",
        "exercises": [
          {
            "name": "Suitcase Carry",
            "prescription": "2x20m/side"
          }
        ],
        "coachingNotes": [
          "Heavy but clean — anti-lateral flexion under load."
        ]
      }
    ],
    "progressionRules": [
      "Reduce Block 4 first; protect contrast blocks."
    ],
    "positionAccent": [],
    "injurySubstitutions": [],
    "coachingWarnings": [],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[FULL_PRESEASON_FORCE_POWER_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/FULL_PRESEASON_FORCE_POWER_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_BW_PRESEASON_FORCE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "full",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (phase 1 common base)",
      "equipment": "bodyweight",
      "targetDuration": "50-60 min"
    },
    "title": "FULL_BW_PRESEASON_FORCE_V1",
    "goal": [
      "Whole-body force support for 3x/week pre-season phase 1 without gym.",
      "Pair hinge force with push/pull fundamentals and rugby finisher."
    ],
    "sessionIdentity": [
      "Full-body force construction — complements lower/upper split days.",
      "**Calibration** : nordiques stricts, pompes lestées, tractions propres si barre dispo."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight squat",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": []
    },
    "blocks": [
      {
        "number": 1,
        "name": "Hinge Force",
        "format": "`3 work sets`, `2-3 min` rest between sets",
        "exercises": [
          {
            "name": "Romanian Deadlift",
            "prescription": "3x5"
          }
        ],
        "coachingNotes": [
          "Strict nordic or RDL — heaviest hinge pattern available.",
          "Fallback: `Nordic Eccentric` strict if no DB/KB."
        ]
      },
      {
        "number": 2,
        "name": "Push / Pull Pair",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Decline Push-Up",
            "prescription": "3x6-8"
          },
          {
            "name": "Inverted Row Feet Elevated",
            "prescription": "3x6-8/side"
          }
        ],
        "coachingNotes": [
          "Upgrade A: dumbbell bench if DB + bench.",
          "Upgrade B: `Neutral-Grip Pull-Up` if bar available."
        ]
      },
      {
        "number": 3,
        "name": "Hip / Rotation",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Single-Leg Glute Bridge",
            "prescription": "3x6-8/side"
          },
          {
            "name": "Band Rotation Explosive",
            "prescription": "2-3x6-8/side"
          }
        ],
        "coachingNotes": [
          "Upgrade A: hip thrust on bench if DB + bench available."
        ]
      },
      {
        "number": 4,
        "name": "Finisher",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Bear Crawl",
            "prescription": "15-20m"
          },
          {
            "name": "Copenhagen Plank",
            "prescription": "20-30s/side"
          }
        ],
        "coachingNotes": [
          "Bear crawl: fast posture, scrum-like projection.",
          "Upgrade A: `Farmer Carry` if DB/KB available."
        ]
      }
    ],
    "progressionRules": [
      "`W4` deload: cut Block 4, then one round from Block 3.",
      "Never sacrifice hinge or push quality for finisher volume."
    ],
    "positionAccent": [],
    "injurySubstitutions": [],
    "coachingWarnings": [],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[FULL_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/FULL_PRESEASON_FORCE_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_BW_PRESEASON_POWER_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "full",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (phase 3 common base)",
      "equipment": "bodyweight",
      "targetDuration": "40-50 min"
    },
    "title": "FULL_BW_PRESEASON_POWER_V1",
    "goal": [
      "Phase 3 full-body power — swing/hinge speed, plyo push, explosive pull.",
      "Short activation finisher before in-season transition."
    ],
    "sessionIdentity": [
      "Power phase full — low volume, high intent, rugby activation finish."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "pogo hops",
          "prescription": "1x8"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": []
    },
    "blocks": [
      {
        "number": 1,
        "name": "Full Body Contrast",
        "format": "`3 rounds`, `2 min 30` rest between rounds",
        "exercises": [
          {
            "name": "Banded KB Swing",
            "prescription": "3x3"
          },
          {
            "name": "Broad Jump",
            "prescription": "3 reps",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Upgrade A: KB swing if kettlebell available; banded swing if band only.",
          "Fallback A: fast `Romanian Deadlift` if no KB/band."
        ]
      },
      {
        "number": 2,
        "name": "Explosive Push / Pull",
        "format": "`3 rounds`, `2 min` rest after the pair",
        "exercises": [
          {
            "name": "Plyo Push-Up",
            "prescription": "3x3-4"
          },
          {
            "name": "Inverted Row Feet Elevated",
            "prescription": "3x4"
          }
        ],
        "coachingNotes": [
          "Upgrade B: fast pull-up if bar available."
        ]
      },
      {
        "number": 3,
        "name": "Activation",
        "format": "`2 rounds`, `45s` rest",
        "exercises": [
          {
            "name": "A-Skip",
            "prescription": "2x10m"
          },
          {
            "name": "Side Plank",
            "prescription": "2x15s/side"
          }
        ],
        "coachingNotes": [
          "A-skip: stiff ankle, rhythmic acceleration posture.",
          "Upgrade B: `Pallof Press Hold` if band available."
        ]
      }
    ],
    "progressionRules": [
      "Keep total session crisp — cut Block 3 before reducing contrast intent."
    ],
    "positionAccent": [],
    "injurySubstitutions": [],
    "coachingWarnings": [],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "in_season",
      "sessionType": "full_light_primer",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "25-40 min"
    },
    "title": "FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1",
    "goal": [
      "Prime the nervous system without creating fatigue.",
      "Keep short lower- and upper-body explosive exposures with maximal intent.",
      "Reinforce stiffness, projection, and rotational readiness for open-field actions.",
      "Leave the player feeling sharp, not trained down."
    ],
    "sessionIdentity": [
      "Rugby-specific through low-volume explosive pairings, long enough rest, and zero junk fatigue.",
      "Back-three specific through speed bias, stiffness, projection, and ballistic upper-body output.",
      "Do not turn this into a strength session, conditioning circuit, or mini full-body day."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "low pogo hops",
          "prescription": "1x10"
        },
        {
          "name": "thoracic rotation",
          "prescription": "1x6/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive prep sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this brief.",
        "The player can keep their own primer routine if it covers ankle stiffness, trunk position, and upper-body readiness."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Lower Neural Pair",
        "format": "`3 rounds`, full rest `2-3 min`",
        "exercises": [
          {
            "name": "Trap Bar Deadlift",
            "prescription": "3x2-3 @ ~70-75%"
          },
          {
            "name": "Countermovement Jump",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "This block is about intent and fast force production, not fatigue.",
          "Rest must be long enough to keep each rep sharp.",
          "The trap bar should move fast and clean, with no grinding reps.",
          "The jump should stay crisp and elastic without creating excessive eccentric stress before match day."
        ],
        "fallbackOptions": [
          "A: `Back Squat` `3x3 @ ~70-75%`",
          "B: `Drop to Stick`"
        ]
      },
      {
        "number": 2,
        "name": "Upper Push Primer",
        "format": "`3 rounds`, full rest `2-3 min`",
        "exercises": [
          {
            "name": "Explosive Landmine Press",
            "prescription": "3x5/side"
          },
          {
            "name": "Plyo Push-Up",
            "prescription": "3x3-5"
          }
        ],
        "coachingNotes": [
          "This block should feel aggressive and clean.",
          "The loaded movement stays fast and crisp.",
          "The push-up variation stops the moment reactivity drops."
        ],
        "fallbackOptions": [
          "A: `Landmine Jammer`",
          "B: `Depth Push-Up`"
        ]
      },
      {
        "number": 3,
        "name": "Pull / Rotation Primer",
        "format": "`3 rounds`, full rest `90-120s`",
        "exercises": [
          {
            "name": "Landmine Row",
            "prescription": "3x5-6"
          },
          {
            "name": "Med Ball Throw",
            "prescription": "2-3 reps/side"
          }
        ],
        "coachingNotes": [
          "This block should stay ballistic and coordinated.",
          "Keep the throw/rotation low in volume and high in intent.",
          "No fatigue chasing here."
        ],
        "fallbackOptions": [
          "A: `Power Pendlay Row`",
          "B: `Med Ball Scoop Throw` or `Landmine Rotation`"
        ]
      },
      {
        "number": 4,
        "name": "Arm Pump / Confidence Block",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Hammer Curl",
            "prescription": "2x10"
          },
          {
            "name": "French Press",
            "prescription": "2x10"
          }
        ],
        "coachingNotes": [
          "Optional only.",
          "Use this when the player enjoys the feeling of a small arm pump before match exposure and is recovering well.",
          "Stop well before failure.",
          "This block should boost confidence, not create soreness."
        ],
        "isOptional": true,
        "fallbackOptions": [
          "B: `Rope Pressdown` or `Band Pressdown`"
        ]
      }
    ],
    "progressionRules": [
      "Progress only if the player stays explosive from start to finish.",
      "Do not increase volume first; keep the same small dose and progress only when quality is consistently high.",
      "On a real match week, it is acceptable to keep only two pairings if needed.",
      "The optional arm block is never mandatory and should be removed before any neural work is reduced."
    ],
    "positionAccent": [
      "Common full-light primer skeleton can be shared across positions.",
      "Back-three accent comes from:",
      "lower-limb projection and stiffness",
      "speed of movement",
      "low total fatigue",
      "ballistic upper work over brute-force contact emphasis"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "explosive press if painful",
          "reactive push-up if painful"
        ],
        "replaceWith": [
          "lighter landmine speed press if tolerated",
          "scap/trunk alternative"
        ],
        "rehabFinisher": [
          "`serratus reach`",
          "`band external rotation`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "jump variation if painful",
          "trap-bar setup only if it clearly aggravates symptoms"
        ],
        "replaceWith": [
          "hip-dominant explosive option",
          "reduced-range projection work"
        ],
        "rehabFinisher": [
          "light knee-control work if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "unsupported row if posture cannot stay clean",
          "rotational throw if it aggravates symptoms"
        ],
        "replaceWith": [
          "chest-supported row",
          "Pallof-style anti-rotation alternative"
        ],
        "rehabFinisher": [
          "breathing + trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Primer quality drops fast if the player is already fatigued.",
      "Do not let any loaded movement become a grind.",
      "Do not turn the session into a conditioning challenge.",
      "Do not use high-drop reactive plyometrics here just to make the session feel more \"advanced\".",
      "The optional pump block must stay psychologically useful and physiologically cheap.",
      "The athlete should leave the session feeling more switched on than tired."
    ],
    "sourceReferences": [
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[positionPreferences.v1.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/positionPreferences.v1.ts)",
      "[Screenshot_2026-03-16-14-18-19-865_com.instagram.android-edit.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/Screenshot_2026-03-16-14-18-19-865_com.instagram.android-edit.jpg)",
      "[speed-session-warmup.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/speed-session-warmup.png)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "in_season",
      "sessionType": "full_light_primer",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row",
      "equipment": "full_gym",
      "targetDuration": "25-40 min"
    },
    "title": "FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1",
    "goal": [
      "Prime the nervous system without creating fatigue.",
      "Keep short lower- and upper-body explosive exposures with a front-row force/bracing bias.",
      "Reinforce contact posture, projection, and upper-body stiffness.",
      "Leave the player feeling switched on and physically ready for contact."
    ],
    "sessionIdentity": [
      "Rugby-specific through low-volume explosive pairings, enough rest, and zero junk fatigue.",
      "Front-row specific through box-squat force intent, horizontal push power, strong upper pulling, and optional neck/contact confidence work.",
      "Do not turn this into a strength session, a long warm-up, or a conditioning block."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "thoracic rotation",
          "prescription": "1x6/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive prep sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this short.",
        "The player can keep their own primer routine if it prepares lower-body position, trunk stiffness, and upper-body readiness."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Lower Neural Pair",
        "format": "`3 rounds`, full rest `2-3 min`",
        "exercises": [
          {
            "name": "Banded Anderson Box Squat",
            "prescription": "3x3 @ ~75-80% + band tension"
          },
          {
            "name": "Banded KB Swing",
            "prescription": "3x5"
          }
        ],
        "coachingNotes": [
          "This block is about intent and fast force production, not fatigue.",
          "Each rep should feel aggressive and crisp from a stable position.",
          "Load should allow maximal concentric speed on every rep."
        ],
        "fallbackOptions": [
          "A: `Box Squat`",
          "B: `Broad Jump`"
        ]
      },
      {
        "number": 2,
        "name": "Upper Push Primer",
        "format": "`3 rounds`, full rest `2-3 min`",
        "exercises": [
          {
            "name": "Football Bar Bench Press",
            "prescription": "3x5 @ ~70-75%"
          },
          {
            "name": "Supine Med Ball Throw",
            "prescription": "3x3"
          }
        ],
        "coachingNotes": [
          "The press stays sharp and technically clean.",
          "The throw stays ballistic and low-volume.",
          "This is a true game-week push primer, not a heavy bench block.",
          "Use a load that allows maximal bar speed on every rep.",
          "`Football Bar Bench Press` = neutral-grip football bar / Swiss bar bench press.",
          "Automatic alternative if the bar is not available: `Neutral-Grip DB Bench Press`."
        ],
        "fallbackOptions": [
          "A1: `Neutral-Grip DB Bench Press`",
          "A2: `Bench Press`",
          "B: `Med Ball Chest Pass`"
        ]
      },
      {
        "number": 3,
        "name": "Pull / Trunk Primer",
        "format": "`3 rounds`, full rest `90-120s`",
        "exercises": [
          {
            "name": "Landmine Row",
            "prescription": "3x6"
          },
          {
            "name": "Landmine Rotation",
            "prescription": "3x5/side"
          }
        ],
        "coachingNotes": [
          "This block should feel strong, coordinated, and posture-driven.",
          "Keep the row clean and the trunk work athletic.",
          "No fatigue chasing."
        ],
        "fallbackOptions": [
          "A: `Power Pendlay Row`",
          "B: `Med Ball Scoop Throw`"
        ]
      },
      {
        "number": 4,
        "name": "Contact Confidence / Pump",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Hammer Curl",
            "prescription": "2x10"
          },
          {
            "name": "Rope Pressdown",
            "prescription": "2x10"
          },
          {
            "name": "Banded Neck Extension",
            "prescription": "2x10"
          }
        ],
        "coachingNotes": [
          "Optional only.",
          "Use this when the player likes a small arm pump and a little neck/contact confidence before match exposure.",
          "Stop well before failure.",
          "This block should create confidence, not fatigue or soreness."
        ],
        "isOptional": true,
        "fallbackOptions": [
          "B: `French Press` or `Band Pressdown`",
          "C: `Neck Isometric`"
        ]
      }
    ],
    "progressionRules": [
      "Progress only if the player stays explosive from start to finish.",
      "Do not increase volume first; keep the same small dose and progress only when quality is consistently high.",
      "On a real match week, it is acceptable to keep only two pairings if needed.",
      "The optional confidence block is never mandatory and should be removed before any neural work is reduced."
    ],
    "positionAccent": [
      "Common full-light primer skeleton can be shared across positions.",
      "Front-row accent comes from:",
      "stronger lower-body force intent",
      "horizontal push power",
      "stronger pull/bracing feel",
      "optional neck/contact confidence work"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "bench if painful",
          "med ball throw if painful",
          "landmine press/row if arm path aggravates symptoms"
        ],
        "replaceWith": [
          "safer row variation",
          "scap/trunk alternative"
        ],
        "rehabFinisher": [
          "`serratus reach`",
          "`band external rotation`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "box squat if painful",
          "swing if knee angle/setup aggravates symptoms"
        ],
        "replaceWith": [
          "hip-dominant explosive option",
          "reduced-range squat if tolerated"
        ],
        "rehabFinisher": [
          "light knee-control work if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "banded Anderson box squat if bracing cannot stay clean",
          "swing if hinge aggravates symptoms",
          "unsupported row if posture cannot stay clean"
        ],
        "replaceWith": [
          "supported lower-body power option",
          "chest-supported row",
          "Pallof-style anti-rotation alternative"
        ],
        "rehabFinisher": [
          "breathing + trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Primer quality drops fast if the player is already fatigued.",
      "Do not let any loaded movement become a grind.",
      "Do not let the confidence block turn into a bodybuilding finisher.",
      "The athlete should leave the session feeling more ready than tired."
    ],
    "sourceReferences": [
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[positionPreferences.v1.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/positionPreferences.v1.ts)",
      "[Screenshot_2026-03-16-14-18-19-865_com.instagram.android-edit.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/Screenshot_2026-03-16-14-18-19-865_com.instagram.android-edit.jpg)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "55-65 min"
    },
    "title": "FULL_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1",
    "goal": [
      "Full-body force-bridge with back-three bias: horizontal projection, rotational power, reactive patterns.",
      "Maintain bilateral anchors (trap bar + bench) while shifting contrasts toward sprint and open-field demands.",
      "Third weekly session for 3x frequency in Force-Bridge phase."
    ],
    "sessionIdentity": [
      "This is a back-three full-body force-bridge session.",
      "One lower contrast pair (horizontal projection) + one upper contrast pair (rotation) + reactive support.",
      "Bilateral anchors stay. Contrast and support are position-specific."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "push-up",
          "prescription": "1x8"
        },
        {
          "name": "2-3 progressive ramp-up sets on main lift",
          "prescription": ""
        }
      ],
      "notes": [
        "Full-body activation. Ramp-up on trap bar before B1."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Lower Force + Horizontal Projection",
        "format": "`4 rounds`, `3-4 min` rest",
        "exercises": [
          {
            "name": "trap bar deadlift",
            "prescription": "4x3-4 @ 85%",
            "role": "prime"
          },
          {
            "name": "broad jump",
            "prescription": "4x3, max distance",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Bilateral anchor + horizontal projection — sprint power transfer.",
          "This replaces the box jump contrast of the front-row version."
        ],
        "fallbackOptions": [
          "A: `Back Squat` + `Vertical Jump`"
        ]
      },
      {
        "number": 2,
        "name": "Upper Force + Rotational Power",
        "format": "`4 rounds`, `90-120s` rest",
        "exercises": [
          {
            "name": "bench press",
            "prescription": "4x4-5"
          },
          {
            "name": "med ball rotational throw",
            "prescription": "4x3/side",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Heavy bench into rotational throw — trunk transfer power.",
          "This replaces the plyo push-up contrast of the front-row version."
        ]
      },
      {
        "number": 3,
        "name": "Reactive Support / Anti-Rotation",
        "format": "`3 rounds`, `75-90s` rest",
        "exercises": [
          {
            "name": "band-assisted split jump",
            "prescription": "3x4/side"
          },
          {
            "name": "pallof press hold",
            "prescription": "3x15-20s/side"
          }
        ],
        "coachingNotes": [
          "Reactive split jump for single-leg power.",
          "Pallof for anti-rotation endurance.",
          "This replaces the reverse lunge + pallof of the front-row version."
        ],
        "fallbackOptions": [
          "A: `Reverse Lunge` + `Pallof`"
        ]
      },
      {
        "number": 4,
        "name": "Finisher Rugby",
        "format": "`2 rounds`, `45-60s` rest after the round",
        "exercises": [
          {
            "name": "Farmer Carry",
            "prescription": "2x30s"
          },
          {
            "name": "Copenhagen Plank",
            "prescription": "2x20-30s/side"
          },
          {
            "name": "Banded Neck Isometric",
            "prescription": "2x10s/direction"
          }
        ],
        "coachingNotes": [
          "Finisher court orienté rugby : porter (grip + posture), protéger les adducteurs (Copenhagen), renforcer le cou.",
          "Volume modéré, qualité prioritaire — pas un test physique.",
          "Constance prioritaire sur tout le bloc force."
        ]
      }
    ],
    "progressionRules": [
      "`FB1`: establish both contrast pairs at 85%.",
      "`FB2`: increase to 88-90% if broad jump and throw quality hold.",
      "Reduce B4 first, B3 second. NEVER reduce B1-B2."
    ],
    "positionAccent": [
      "Back-three: horizontal projection in B1, rotational power in B2, reactive split jump in B3, stiffness prep in B4."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bench Press`"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`"
        ],
        "rehabFinisher": [
          "`band external rotation`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Broad Jump`",
          "`Band-Assisted Split Jump`"
        ],
        "replaceWith": [
          "`Box Jump` reduced",
          "`Reverse Lunge`"
        ],
        "rehabFinisher": [
          "controlled pattern"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Trap Bar Deadlift`"
        ],
        "replaceWith": [
          "`Hip Thrust` heavy"
        ],
        "rehabFinisher": [
          "breathing work"
        ]
      }
    ],
    "coachingWarnings": [
      "Two contrast pairs + reactive block = high CNS load. Keep under 65 min.",
      "Bilateral anchors stay. Do not add accessory work.",
      "Stop reactive movements if quality drops."
    ],
    "sourceReferences": [
      "[off-season-periodization.md] — Phase 4",
      "[strength-methods.md] — Complex Training, PAP",
      "[periodization.md] — Position demands §3.2"
    ]
  },
  {
    "metadata": {
      "id": "FULL_OFFSEASON_FORCE_BRIDGE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "full_gym",
      "targetDuration": "55-65 min"
    },
    "title": "FULL_OFFSEASON_FORCE_BRIDGE_V1",
    "goal": [
      "Full-body force-bridge session combining one lower and one upper contrast pair.",
      "Develop total-body power output through complex training.",
      "Third weekly session for 3x frequency in Force-Bridge phase."
    ],
    "sessionIdentity": [
      "This is a full-body force-bridge session for the 3x/week template.",
      "One lower contrast pair + one upper contrast pair + structural support.",
      "NOT a hypertrophy full-body — intensity and speed over volume.",
      "This session should leave the athlete feeling powerful, not depleted."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "push-up",
          "prescription": "1x8"
        },
        {
          "name": "2-3 progressive ramp-up sets on main lift",
          "prescription": ""
        }
      ],
      "notes": [
        "Full-body warm-up: cover hip, ankle, and shoulder mobility.",
        "Ramp-up on first heavy lift before starting Block 1."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Lower Force + Explosive Contrast",
        "format": "`4 rounds`, `3-4 min` rest between rounds",
        "exercises": [
          {
            "name": "trap bar deadlift",
            "prescription": "4x4-5 @ 85-90%",
            "role": "prime"
          },
          {
            "name": "box jump",
            "prescription": "4x3-4, max intention",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Trap bar deadlift: powerful hip extension, controlled descent.",
          "Box jump within 15-20s: stick the landing, full extension.",
          "This is the lower-body power developer of the session."
        ],
        "fallbackOptions": [
          "A: `Back Squat` heavy (4x4-5)",
          "B: `Vertical Jump` if no box"
        ]
      },
      {
        "number": 2,
        "name": "Upper Force + Explosive Contrast",
        "format": "`4 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "bench press",
            "prescription": "4x4-5 @ 85-90%"
          },
          {
            "name": "plyo push-up",
            "prescription": "4x4-5, max height",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Heavy bench into explosive plyo push-up — classic upper-body PAP pair.",
          "Plyo push-up: hands should leave the ground. Focus on speed of push.",
          "If plyo quality drops, reduce bench load before cutting push-ups."
        ],
        "fallbackOptions": [
          "A: `Med Ball Chest Pass` if plyo push-ups too demanding"
        ]
      },
      {
        "number": 3,
        "name": "Unilateral / Trunk Support",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "reverse lunge",
            "prescription": "3x5-6/side"
          },
          {
            "name": "pallof press hold",
            "prescription": "3x15-20s/side"
          }
        ],
        "coachingNotes": [
          "Lunge: force-grade reps (5-6), stable and controlled.",
          "Pallof: anti-rotation endurance to support trunk stability for contrast work.",
          "This block maintains single-leg balance and trunk integrity."
        ],
        "fallbackOptions": [
          "A: `Split Squat` DB",
          "B: `Dead Bug` if no band"
        ]
      },
      {
        "number": 4,
        "name": "Finisher Rugby",
        "format": "`2 rounds`, `45-60s` rest after the round",
        "exercises": [
          {
            "name": "Farmer Carry",
            "prescription": "2x30s"
          },
          {
            "name": "Copenhagen Plank",
            "prescription": "2x20-30s/side"
          },
          {
            "name": "Banded Neck Isometric",
            "prescription": "2x10s/direction"
          }
        ],
        "coachingNotes": [
          "Finisher court orienté rugby : porter (grip + posture), adducteurs (Copenhagen), cou (iso).",
          "Travail de prévention efficace — ne pas étendre en volume supplémentaire.",
          "Constance prioritaire à travers toutes les phases du bloc force."
        ]
      }
    ],
    "progressionRules": [
      "`FB1`: establish both contrast pairs at 85%; confirm jump and push-up quality.",
      "`FB2`: increase intensity to 88-90% on both main lifts if explosive quality holds.",
      "Reduce Block 4 first if fatigue rises.",
      "Reduce Block 3 to 2 rounds second.",
      "NEVER reduce Blocks 1-2 — the contrast pairs are the session priority."
    ],
    "positionAccent": [
      "Session is common for both groups.",
      "`Front_row`: slightly more patience on trap bar setup; heavier bench tolerated.",
      "`Back_three`: slightly more emphasis on jump height and push-up speed."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bench Press`",
          "`Plyo Push-Up`"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Med Ball Chest Pass`"
        ],
        "rehabFinisher": [
          "`band external rotation`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Box Jump` if landing painful",
          "`Reverse Lunge`"
        ],
        "replaceWith": [
          "`Countermovement Jump` reduced range",
          "`Hip Thrust` 3x5"
        ],
        "rehabFinisher": [
          "controlled knee-friendly pattern"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Trap Bar Deadlift` if bracing fails"
        ],
        "replaceWith": [
          "`Hip Thrust` heavy (4x5)"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Full-body force-bridge is demanding on the CNS. Respect rest periods.",
      "Two contrast pairs in one session = high neural load. Keep total session under 65 min.",
      "If either contrast pair loses explosive quality, end the block early.",
      "Do not add accessory work — the 4-block structure is the complete session."
    ],
    "sourceReferences": [
      "[off-season-periodization.md] — Phase 4 Force-Power conversion",
      "[strength-methods.md] — Complex Training, PAP (Tillin & Bishop 2009)",
      "[periodization.md] — Effect residual exploitation (Issurin 2008)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_OFFSEASON_HYPERTROPHY_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "60-75 min"
    },
    "title": "FULL_OFFSEASON_HYPERTROPHY_BACK_THREE_V1",
    "goal": [
      "Full-body hypertrophy with back-three bias: rotational patterns, unilateral support, and lower-leg tissue quality.",
      "Maintain trap bar as the bilateral hinge anchor.",
      "Prepare trunk transfer and multi-directional capacity for pre-season."
    ],
    "sessionIdentity": [
      "This is a back-three full-body hypertrophy session.",
      "Trap bar anchor stays. Accent shifts to rotational pressing, unilateral support, and lower-leg quality."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "push-up",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets on trap bar",
          "prescription": ""
        }
      ],
      "notes": [
        "Full-body warm-up covering hip, ankle, shoulder."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Full-Body Hinge",
        "format": "`4 work sets`, `2 min` rest",
        "exercises": [
          {
            "name": "trap bar deadlift",
            "prescription": "4x6-8"
          }
        ],
        "coachingNotes": [
          "Bilateral anchor. RPE 6-8, powerful but controlled."
        ],
        "fallbackOptions": [
          "A: `Barbell Romanian Deadlift`"
        ]
      },
      {
        "number": 2,
        "name": "Rotational Press / Unilateral Pull",
        "format": "`4 rounds`, `90-120s` rest after pair",
        "exercises": [
          {
            "name": "half-kneeling landmine press",
            "prescription": "4x8-10/side"
          },
          {
            "name": "single-arm db row",
            "prescription": "4x8-10/side"
          }
        ],
        "coachingNotes": [
          "Rotational pressing + unilateral pulling: trunk transfer emphasis.",
          "Both exercises challenge anti-rotation through the trunk."
        ]
      },
      {
        "number": 3,
        "name": "Unilateral Lower / Rotation",
        "format": "`3 rounds`, `75-90s` rest after pair",
        "exercises": [
          {
            "name": "reverse lunge",
            "prescription": "3x8-10/side"
          },
          {
            "name": "med ball rotational throw",
            "prescription": "3x4/side"
          }
        ],
        "coachingNotes": [
          "Lunge for single-leg structural work.",
          "Rotational throw at moderate volume — building pattern, not peak power."
        ],
        "fallbackOptions": [
          "A: `Split Squat`",
          "B: `Pallof Press Hold`"
        ]
      },
      {
        "number": 4,
        "name": "Finisher Rugby",
        "format": "`2 rounds`, `45-60s` rest after the round",
        "exercises": [
          {
            "name": "Farmer Carry",
            "prescription": "2x30s"
          },
          {
            "name": "Copenhagen Plank",
            "prescription": "2x20-30s/side"
          },
          {
            "name": "Banded Neck Isometric",
            "prescription": "2x10s/direction"
          }
        ],
        "coachingNotes": [
          "Finisher court orienté rugby : porter (grip + posture), protéger les adducteurs (Copenhagen), renforcer le cou.",
          "Volume modéré, qualité prioritaire — pas un test physique.",
          "Termine la séance soutenu, pas vidé."
        ]
      }
    ],
    "progressionRules": [
      "`Semaine 1`: establish form on landmine and rotational throws.",
      "`Semaine 2`: increase loads; keep throws at 4/side.",
      "`Semaine 3`: peak volume. RPE 7-8.",
      "`Semaine 4 (décharge)`: reduce -25-30%. Reduce one round of Block 4 first, reduce B3 throws second."
    ],
    "positionAccent": [
      "Back-three session: rotational pressing in B2, rotational throwing in B3, lower-leg in B4."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Half-Kneeling Landmine Press`"
        ],
        "replaceWith": [
          "`Seated DB Overhead Press`"
        ],
        "rehabFinisher": [
          "`band external rotation`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Reverse Lunge`"
        ],
        "replaceWith": [
          "`Hip Thrust` 3x8"
        ],
        "rehabFinisher": [
          "controlled pattern"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Trap Bar Deadlift`"
        ],
        "replaceWith": [
          "`Hip Thrust` heavy"
        ],
        "rehabFinisher": [
          "breathing work"
        ]
      }
    ],
    "coachingWarnings": [
      "Keep rotational throws controlled in hypertrophy phase.",
      "Do not add sets beyond the prescription.",
      "Bilateral anchor (trap bar) stays non-negotiable."
    ],
    "sourceReferences": [
      "[off-season-periodization.md]",
      "[periodization.md] — Position demands §3.2"
    ]
  },
  {
    "metadata": {
      "id": "FULL_OFFSEASON_HYPERTROPHY_V1",
      "status": "draft",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (common base with light accents)",
      "equipment": "full_gym",
      "targetDuration": "60-75 min"
    },
    "title": "FULL_OFFSEASON_HYPERTROPHY_V1",
    "goal": [
      "Complete the main off-season hypertrophy week with a full-body session that adds useful muscle without simply repeating the Lower and Upper hypertrophy days.",
      "Provide one hinge-led full-body anchor, one upper push/pull support block, one lower support / trunk block, and a short rugby finisher (carry + adductors + neck).",
      "Keep the player feeling like the week is complete, not overbuilt."
    ],
    "sessionIdentity": [
      "This is an off-season hypertrophy full-body session, not a recovery day and not a fourth heavy lower session.",
      "Rugby-specific through useful hinge, push/pull support, unilateral lower work, trunk support, and a short rugby finisher (carry, Copenhagen, neck).",
      "Do not turn this into a marathon gym day or a random “hit every muscle” checklist."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "thoracic rotation",
          "prescription": "1x6/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this practical and short.",
        "The player should feel ready for a dense but controlled session.",
        "If they already have a good full-body warm-up, they can keep it."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Full-Body Hinge Hypertrophy",
        "format": "`4 work sets`, `2 min` rest between sets",
        "exercises": [
          {
            "name": "Trap Bar Deadlift",
            "prescription": "4x6-8"
          }
        ],
        "coachingNotes": [
          "Keep the trap bar around `RPE 6-8`.",
          "This is the anchor lift of the session, but it should stay clearly hypertrophy-oriented rather than max-strength oriented.",
          "The lift should feel powerful and productive, not like testing."
        ],
        "fallbackOptions": [
          "A: `Barbell Romanian Deadlift`"
        ]
      },
      {
        "number": 2,
        "name": "Upper Push / Pull Support",
        "format": "`4 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "DB Incline Bench Press",
            "prescription": "4x8-10"
          },
          {
            "name": "Single-Arm DB Row",
            "prescription": "4x8-10/side"
          }
        ],
        "coachingNotes": [
          "This block builds upper volume without copying the exact Upper Hypertrophy structure.",
          "Keep both exercises smooth, controlled, and full-range.",
          "This should feel dense and useful, not sloppy."
        ],
        "fallbackOptions": [
          "A: `Neutral-Grip DB Bench Press`",
          "B: `Chest-Supported Row`"
        ]
      },
      {
        "number": 3,
        "name": "Lower Support / Trunk Pair",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Reverse Lunge",
            "prescription": "3x8-10/side"
          },
          {
            "name": "Pallof Press Hold",
            "prescription": "3x15-20s/side"
          }
        ],
        "coachingNotes": [
          "This block gives the week one more unilateral lower exposure without turning it into another lower day.",
          "Keep the lunge controlled and stable.",
          "Pallof should stay crisp and posture-driven."
        ],
        "fallbackOptions": [
          "A: `Split Squat`",
          "B: `Side Plank`"
        ]
      },
      {
        "number": 4,
        "name": "Finisher Rugby",
        "format": "`2 rounds`, `45-60s` rest after the round",
        "exercises": [
          {
            "name": "Farmer Carry",
            "prescription": "2x30s"
          },
          {
            "name": "Copenhagen Plank",
            "prescription": "2x20-30s/side"
          },
          {
            "name": "Banded Neck Isometric",
            "prescription": "2x10s/direction"
          }
        ],
        "coachingNotes": [
          "Finisher court orienté rugby : porter (grip + posture), protéger les adducteurs (Copenhagen), renforcer le cou.",
          "Volume modéré, qualité prioritaire — pas un test physique.",
          "Termine la séance soutenu, pas vidé."
        ]
      }
    ],
    "progressionRules": [
      "`Semaine 1`: start at the lower end of the load range and establish weekly tolerance.",
      "`Semaine 2`: increase load only if the main hinge and upper support work are recovering well.",
      "`Semaine 3`: this is the densest week; allow hard but clean sets with `1-2 RIR`.",
      "`Semaine 4 (décharge)`: reduce total volume around `-25 to -30%` while keeping useful load.",
      "Reduce one round of Block 4 first if fatigue rises (carry + Copenhagen still pertinent).",
      "Reduce one round from Block 4 second.",
      "Keep Blocks 1 and 2 as the structural priorities of the session."
    ],
    "positionAccent": [
      "This session is still mostly common.",
      "`Front_row` accent:",
      "slightly more bracing and posture through trap bar and lunge",
      "slightly more interest in the support/trunk work",
      "`Back_three` accent:",
      "slightly more fluidity and range in lunge and lower-leg work",
      "slightly more attention to movement quality than brute loading",
      "The skeleton remains identical for both groups."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`DB Incline Bench Press`",
          "unsupported row only if stance or support position is aggravating"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Chest-Supported Row`"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Reverse Lunge`",
          "`Copenhagen Hold` only if clearly aggravating"
        ],
        "replaceWith": [
          "`Split Squat` reduced range",
          "`Supine Adductor Squeeze`"
        ],
        "rehabFinisher": [
          "controlled knee-friendly squat pattern",
          "light terminal knee extension if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Trap Bar Deadlift`",
          "unsupported row if bracing breaks down",
          "`Pallof Press Hold` if trunk demand is aggravating"
        ],
        "replaceWith": [
          "`Barbell Romanian Deadlift` lighter",
          "`Chest-Supported Row`",
          "`Side Plank`"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "This session should complete the hypertrophy week, not bury the player.",
      "Do not let the trap bar become a heavy test after the Lower Hypertrophy session.",
      "Do not let the support blocks drift into a conditioning circuit.",
      "The Finisher Rugby block is short on purpose: carry + Copenhagen + neck, not a test session."
    ],
    "sourceReferences": [
      "[tech-spec-off-season-rugbyprep-2026-03-20.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-off-season-rugbyprep-2026-03-20.md)",
      "[WEEKLY_TEMPLATES_OFF_SEASON.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/WEEKLY_TEMPLATES_OFF_SEASON.md)",
      "[LOWER_OFFSEASON_HYPERTROPHY_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/LOWER_OFFSEASON_HYPERTROPHY_V1.md)",
      "[UPPER_OFFSEASON_HYPERTROPHY_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/UPPER_OFFSEASON_HYPERTROPHY_V1.md)",
      "[FULL_OFFSEASON_TRANSITION_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/FULL_OFFSEASON_TRANSITION_V1.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_OFFSEASON_RECOVERY_A_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "full_gym",
      "targetDuration": "30-45 min"
    },
    "title": "FULL_OFFSEASON_RECOVERY_A_V1",
    "goal": [
      "Reintroduce full-body training after the season without performance pressure.",
      "Rehearse the five base patterns at low cost: squat, hinge, push, pull, trunk.",
      "Leave the player feeling better, looser, and more confident than when they walked in."
    ],
    "sessionIdentity": [
      "This is a recovery re-entry session, not a strength session and not an off-season hypertrophy day.",
      "Rugby-specific through simple full-body pattern restoration and attention to trunk, adductors, and general movement quality.",
      "Do not turn this into a conditioning circuit, a pump workout, or a disguised performance session."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "1 very light ramp-up round",
          "prescription": ""
        },
        {
          "name": "Goblet Squat",
          "prescription": ""
        },
        {
          "name": "DB Romanian Deadlift",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this to `3-5 min` maximum.",
        "The first reps of Block 1 should still feel like part of the re-entry process.",
        "The player can keep their own short warm-up if it covers ankles, groin, trunk, and shoulder readiness."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Squat / Hinge Re-Entry",
        "format": "`3 rounds`, `60-90s` rest after the pair",
        "exercises": [
          {
            "name": "Goblet Squat",
            "prescription": "3x8"
          },
          {
            "name": "DB Romanian Deadlift",
            "prescription": "3x8"
          }
        ],
        "coachingNotes": [
          "Keep both movements at around `RPE 4-5`.",
          "The goal is to restore rhythm, position, and confidence under light load.",
          "Goblet squat should stay upright and controlled, with no grinding.",
          "The hinge should feel clean and simple, not like a posterior-chain test."
        ],
        "fallbackOptions": [
          "A: `Box-Assisted Goblet Squat`",
          "B: `Glute Bridge`"
        ]
      },
      {
        "number": 2,
        "name": "Push / Pull Re-Entry",
        "format": "`3 rounds`, `60-90s` rest after the pair",
        "exercises": [
          {
            "name": "DB Bench Press",
            "prescription": "3x8-10"
          },
          {
            "name": "Inverted Row",
            "prescription": "3x8-10"
          }
        ],
        "coachingNotes": [
          "Keep both movements at around `RPE 4-5`.",
          "Let the shoulder find a comfortable path on the DB press.",
          "The row should reawaken scapular control and pulling rhythm, not create fatigue.",
          "If the player is deconditioned or shoulder-sensitive, use the easier fallback immediately."
        ],
        "fallbackOptions": [
          "A: `Push-Up`",
          "B: `Cable Row`"
        ]
      },
      {
        "number": 3,
        "name": "Trunk / Mobility / Tissue Reset",
        "format": "`2 rounds`, move continuously with minimal rest",
        "exercises": [
          {
            "name": "Dead Bug",
            "prescription": "2x8/side"
          },
          {
            "name": "Adductor Rock-Back",
            "prescription": "2x8/side"
          },
          {
            "name": "World's Greatest Stretch",
            "prescription": "2x4/side"
          }
        ],
        "coachingNotes": [
          "This block is part trunk reset, part groin reintroduction, part global mobility.",
          "Move smoothly and breathe normally.",
          "Nothing here should feel intense.",
          "The player should finish this block feeling more open, not more worked."
        ]
      }
    ],
    "progressionRules": [
      "`S1`: use conservative loads and stop well before effort becomes meaningful.",
      "`S2`: increase load slightly only if all reps feel clean, comfortable, and symptom-free.",
      "Progress comfort and range of motion before progressing load.",
      "If the player feels beat up on the day, reduce load first, then reduce one round from Block 1 or Block 2, whichever feels heavier that day.",
      "Do not add extra blocks to this session in Recovery phase."
    ],
    "positionAccent": [
      "This session is intentionally common.",
      "`Front_row` accent:",
      "slightly more bracing awareness on squat and bench",
      "no neck work yet in Recovery phase",
      "`Back_three` accent:",
      "slightly more fluid movement quality and range on hinge and row",
      "no extra speed or plyometric work yet",
      "The skeleton stays identical for both groups."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`DB Bench Press`",
          "`Inverted Row` only if body angle or grip is aggravating"
        ],
        "replaceWith": [
          "`Push-Up` on an elevated surface",
          "`Cable Row` with neutral grip"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`",
          "`scap push-up`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Goblet Squat` if pain appears during depth"
        ],
        "replaceWith": [
          "`Box-Assisted Goblet Squat`",
          "or `Leg Press` light and controlled if needed"
        ],
        "rehabFinisher": [
          "controlled knee-friendly squat pattern",
          "light terminal knee extension if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`DB Romanian Deadlift`",
          "`Inverted Row` only if trunk position is not tolerated"
        ],
        "replaceWith": [
          "`Glute Bridge`",
          "`Cable Row`"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "This session should never feel like “getting back in shape in one day”.",
      "Do not chase soreness, pump, or load.",
      "Keep all movements simple enough that the player can relax into them.",
      "If the athlete leaves feeling heavy or cooked, the session was too aggressive."
    ],
    "sourceReferences": [
      "[tech-spec-off-season-rugbyprep-2026-03-20.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-off-season-rugbyprep-2026-03-20.md)",
      "[WEEKLY_TEMPLATES_OFF_SEASON.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/WEEKLY_TEMPLATES_OFF_SEASON.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[FULL_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/FULL_PRESEASON_FORCE_V1.md)",
      "[FULL_BODY_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/FULL_BODY_IN_SEASON_FRONT_ROW_V1.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_OFFSEASON_RECOVERY_B_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "full_gym",
      "targetDuration": "30-45 min"
    },
    "title": "FULL_OFFSEASON_RECOVERY_B_V1",
    "goal": [
      "Give the player a second off-season recovery session that feels lighter, freer, and slightly more athletic than Recovery A.",
      "Restore tolerance to unilateral movement, light locomotion, basic pushing/pulling, and lower-leg/groin support.",
      "Keep training momentum without creating fatigue or making the player feel like the season has restarted already."
    ],
    "sessionIdentity": [
      "This is a recovery reset session, not a hidden conditioning day and not a reduced hypertrophy workout.",
      "Rugby-specific through simple unilateral movement, light locomotion, trunk control, groin care, and lower-leg support.",
      "Do not overload this session with strength ambitions, long circuits, or “functional” complexity."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "90/90 hip switch",
          "prescription": "1x6/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "1 easy prep round",
          "prescription": ""
        },
        {
          "name": "Reverse Lunge",
          "prescription": ""
        },
        {
          "name": "Incline Push-Up",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this to `3-5 min` maximum.",
        "The session should begin feeling like movement practice, not preparation for heavy work.",
        "The player can keep their own short warm-up if it covers hips, shoulders, and ankle readiness."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Unilateral / Locomotion Reset",
        "format": "`2-3 rounds`, `60-75s` rest after the pair",
        "exercises": [
          {
            "name": "Reverse Lunge",
            "prescription": "2-3x6/side"
          },
          {
            "name": "Bear Crawl",
            "prescription": "2-3x10-15m"
          }
        ],
        "coachingNotes": [
          "Keep both exercises smooth and controlled.",
          "The lunge should restore rhythm, balance, and hip tolerance, not challenge strength.",
          "The crawl should feel coordinated and athletic, never rushed.",
          "Stop the round before it starts to feel like conditioning."
        ],
        "fallbackOptions": [
          "A: `Split Squat` bodyweight",
          "B: `Bird Dog`"
        ]
      },
      {
        "number": 2,
        "name": "Push / Pull Reset",
        "format": "`2-3 rounds`, `60-90s` rest after the pair",
        "exercises": [
          {
            "name": "Incline Push-Up",
            "prescription": "2-3x8-10"
          },
          {
            "name": "Half-Kneeling Cable Row",
            "prescription": "2-3x8/side"
          }
        ],
        "coachingNotes": [
          "Keep the push-up easy enough that every rep looks the same.",
          "The row should restore scapular rhythm and trunk position, not create fatigue.",
          "Half-kneeling is used here to keep the block grounded and coordinated."
        ],
        "fallbackOptions": [
          "A: `Push-Up` on a higher surface",
          "B: `Seated Cable Row`"
        ]
      },
      {
        "number": 3,
        "name": "Lower-Leg / Groin / Trunk Support",
        "format": "",
        "exercises": [
          {
            "name": "Single-Leg Calf Raise",
            "prescription": "2x10/side"
          },
          {
            "name": "Wall Tibialis Raise",
            "prescription": "2x12"
          },
          {
            "name": "Side Plank",
            "prescription": "2x20s/side"
          },
          {
            "name": "Supine Adductor Squeeze",
            "prescription": "2x20s"
          }
        ],
        "coachingNotes": [
          "This block restores ankle stiffness support, trunk control, and gentle groin tolerance.",
          "Keep everything clean and submaximal.",
          "The adductor work should feel like reintroduction, not strain.",
          "Run `Calf Raise + Tibialis Raise` first, then `Side Plank + Adductor Squeeze`.",
          "The player should leave this block feeling put back together, not challenged."
        ]
      }
    ],
    "progressionRules": [
      "`S1`: keep volume at the low end if the player still feels heavy from the season.",
      "`S2`: move from `2` rounds to `3` only if the whole session felt easy and clean.",
      "Reduce exercise difficulty before adding load.",
      "If the player feels beat up on the day, keep all blocks at `2 rounds`.",
      "Do not add extra finishers or conditioning to this session during Recovery phase."
    ],
    "positionAccent": [
      "This session is intentionally common.",
      "`Front_row` accent:",
      "slightly more control and bracing on lunges and crawls",
      "no neck work yet in Recovery phase",
      "`Back_three` accent:",
      "slightly more fluidity and range on lunges, calves, and crawl rhythm",
      "no speed or plyometric progression yet",
      "The skeleton stays identical for both groups."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bear Crawl`",
          "`Incline Push-Up` if provocative"
        ],
        "replaceWith": [
          "`Bird Dog`",
          "higher `Incline Push-Up` or `Cable Press` light if needed"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`",
          "`scap push-up`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Reverse Lunge` if depth or loading angle is aggravating"
        ],
        "replaceWith": [
          "`Split Squat` reduced range",
          "or `Step-Up` low box if better tolerated"
        ],
        "rehabFinisher": [
          "controlled knee-friendly squat or split stance pattern",
          "light terminal knee extension if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Bear Crawl` if trunk position is not tolerated",
          "`Half-Kneeling Cable Row` if anti-extension demand is irritating"
        ],
        "replaceWith": [
          "`Bird Dog`",
          "`Seated Cable Row`"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "This session should feel restorative and lightly athletic, not demanding.",
      "Do not let the crawl turn into a conditioning challenge.",
      "Do not force groin or calf work if tissues still feel irritable after the season.",
      "If the athlete leaves feeling more tired than mobile, the session was too ambitious."
    ],
    "sourceReferences": [
      "[tech-spec-off-season-rugbyprep-2026-03-20.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-off-season-rugbyprep-2026-03-20.md)",
      "[WEEKLY_TEMPLATES_OFF_SEASON.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/WEEKLY_TEMPLATES_OFF_SEASON.md)",
      "[FULL_OFFSEASON_RECOVERY_A_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/FULL_OFFSEASON_RECOVERY_A_V1.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_OFFSEASON_TRANSITION_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "full_gym",
      "targetDuration": "45-55 min"
    },
    "title": "FULL_OFFSEASON_TRANSITION_V1",
    "goal": [
      "Bridge the gap between Recovery and true off-season build with a full-body session that feels like training, but still controlled.",
      "Complement the Lower and Upper Transition sessions without simply repeating their main patterns.",
      "Reintroduce one hinge-led full-body anchor, one upper push/pull support pair, and one simple lower-body/trunk tissue block."
    ],
    "sessionIdentity": [
      "This is a transition full-body session, not a recovery circuit and not yet a hypertrophy day.",
      "Rugby-specific through useful hinge, upper support, trunk control, groin tolerance, and general athletic posture.",
      "Do not turn this into an “everything day” or a sneaky volume monster."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "thoracic rotation",
          "prescription": "1x6/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this short and practical.",
        "The player should feel ready to train moderately, not fully activated for maximal output.",
        "If they already have a good full-body warm-up, they can keep it."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Full-Body Hinge",
        "format": "`3 work sets`, `2 min` rest between sets",
        "exercises": [
          {
            "name": "Trap Bar Deadlift",
            "prescription": "3x5"
          }
        ],
        "coachingNotes": [
          "Keep the trap bar around `RPE 5-6`.",
          "This is the anchor lift of the session, but it should still feel clearly submaximal.",
          "The goal is to restore confident full-body force production, not to test strength."
        ],
        "fallbackOptions": [
          "A: `DB Romanian Deadlift`"
        ]
      },
      {
        "number": 2,
        "name": "Upper Push / Pull Support",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "DB Incline Bench Press",
            "prescription": "3x8-10"
          },
          {
            "name": "Single-Arm DB Row",
            "prescription": "3x8-10/side"
          }
        ],
        "coachingNotes": [
          "This block supports upper volume without repeating the exact structure of the Upper Transition session.",
          "Keep both movements smooth, controlled, and technically clean.",
          "This should feel like useful training, not like chasing a pump."
        ],
        "fallbackOptions": [
          "A: `Neutral-Grip DB Bench Press`",
          "B: `Chest-Supported Row`"
        ]
      },
      {
        "number": 3,
        "name": "Lower Support / Trunk Pair",
        "format": "`3 rounds`, `60-75s` rest after the pair",
        "exercises": [
          {
            "name": "Reverse Lunge",
            "prescription": "3x6-8/side"
          },
          {
            "name": "Pallof Press Hold",
            "prescription": "3x15-20s/side"
          }
        ],
        "coachingNotes": [
          "The lunge restores unilateral support without loading it as hard as the Lower Transition session.",
          "Pallof holds should stay crisp and posture-driven.",
          "This block should finish the session with control and support, not fatigue."
        ],
        "fallbackOptions": [
          "A: `Split Squat`",
          "B: `Side Plank`"
        ]
      },
      {
        "number": 4,
        "name": "Finisher Rugby",
        "format": "`2 rounds`, `45-60s` rest after the round",
        "exercises": [
          {
            "name": "Farmer Carry",
            "prescription": "2x20s"
          },
          {
            "name": "Copenhagen Plank",
            "prescription": "2x15-20s/side"
          },
          {
            "name": "Banded Neck Isometric",
            "prescription": "2x8s/direction"
          }
        ],
        "coachingNotes": [
          "Finisher court orienté rugby : porter, protéger les adducteurs, renforcer le cou.",
          "Volume bas (transition) — qualité avant tout, pas de fatigue résiduelle.",
          "Le joueur doit finir soutenu, jamais \"achevé\"."
        ]
      }
    ],
    "progressionRules": [
      "`S3`: establish moderate, comfortable reference loads.",
      "`S4`: increase load slightly only if the whole session feels smooth and symptom-free.",
      "Progress movement confidence first, then loading.",
      "If fatigue is high, reduce Block 4 first, then reduce one round from Block 3.",
      "Keep Block 1 protected unless the player is clearly under-recovered."
    ],
    "positionAccent": [
      "This session is still largely common in Transition.",
      "`Front_row` accent:",
      "slightly more bracing intent on the trap bar and lunge",
      "slightly more posture focus through Pallof holds",
      "`Back_three` accent:",
      "slightly more fluid intent on the trap bar and lunge",
      "slightly more ankle stiffness emphasis in Block 4",
      "The skeleton remains identical for both groups."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`DB Incline Bench Press`",
          "`Single-Arm DB Row` only if unsupported position is aggravating"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Chest-Supported Row`"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Reverse Lunge`",
          "calf work only if clearly provocative"
        ],
        "replaceWith": [
          "`Split Squat` reduced range",
          "or `Step-Up` low box if better tolerated"
        ],
        "rehabFinisher": [
          "controlled knee-friendly squat pattern",
          "light terminal knee extension if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Trap Bar Deadlift`",
          "`Single-Arm DB Row` if unsupported stance is irritating",
          "`Pallof Press Hold` if trunk demand is aggravating"
        ],
        "replaceWith": [
          "`DB Romanian Deadlift`",
          "`Chest-Supported Row`",
          "`Side Plank`"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "This session should feel like a bridge toward real off-season training, not like a challenge session.",
      "Do not let the trap bar become a heavy day just because it feels good.",
      "Do not turn the support blocks into a conditioning circuit.",
      "The player should leave with a sense of rebuild, not accumulated fatigue."
    ],
    "sourceReferences": [
      "[tech-spec-off-season-rugbyprep-2026-03-20.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-off-season-rugbyprep-2026-03-20.md)",
      "[WEEKLY_TEMPLATES_OFF_SEASON.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/WEEKLY_TEMPLATES_OFF_SEASON.md)",
      "[LOWER_OFFSEASON_TRANSITION_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/LOWER_OFFSEASON_TRANSITION_V1.md)",
      "[UPPER_OFFSEASON_TRANSITION_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/UPPER_OFFSEASON_TRANSITION_V1.md)",
      "[FULL_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/FULL_PRESEASON_FORCE_V1.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_PRESEASON_FORCE_POWER_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (phase 2 common base with marked accents)",
      "equipment": "full_gym",
      "targetDuration": "55-65 min"
    },
    "title": "FULL_PRESEASON_FORCE_POWER_V1",
    "goal": [
      "Begin converting full-body force into rugby-usable power during weeks 5 to 8 of pre-season.",
      "Use one clear compound-to-explosive pairing to drive the session.",
      "Maintain useful push/pull support, posterior-chain work, and position-specific transfer without turning the session into a chaotic power circuit."
    ],
    "sessionIdentity": [
      "This is a full-body force-power session, not yet a pure power session.",
      "Rugby-specific through one readable power pair, useful upper support, posterior-chain strength, and a simple finish that still feels athletic.",
      "Do not overload this session with multiple jump clusters or too many separate explosive blocks."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "thoracic rotation",
          "prescription": "1x6/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "2-3 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own full-body warm-up if it covers hips, trunk, and upper-body readiness.",
        "Keep this short and useful.",
        "The goal is readiness and projection, not fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Full-Body Force-Projection Pair",
        "format": "`3 rounds`, full rest `3 min` after each round",
        "exercises": [
          {
            "name": "Trap Bar Deadlift",
            "prescription": "3x3 @ 82-85%"
          },
          {
            "name": "Countermovement Jump",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "Trap bar reps must stay strong, clean, and fast enough to preserve intent.",
          "Jumps must stay crisp and athletic; stop if take-off quality drops.",
          "This block is the major change from Phase 1: the hinge-led force exposure now converts directly into output.",
          "Keep it readable: one loaded pattern, one explosive pattern, no clutter."
        ]
      },
      {
        "number": 2,
        "name": "Upper Push/Pull Support Pair",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "DB Incline Bench Press",
            "prescription": "3x6"
          },
          {
            "name": "Single-Arm DB Row",
            "prescription": "3x6-8/side"
          }
        ],
        "coachingNotes": [
          "This block should stay strong and useful, not flashy.",
          "Keep the incline press controlled and the row strict.",
          "This supports upper force retention without competing with the main upper session."
        ]
      },
      {
        "number": 3,
        "name": "Posterior Chain / Rotation Support",
        "format": "`3 rounds`, `75-90s` rest",
        "exercises": [
          {
            "name": "Barbell Hip Thrust",
            "prescription": "3x5-6"
          },
          {
            "name": "Med Ball Rotational Throw",
            "prescription": "3-4/side"
          }
        ],
        "coachingNotes": [
          "Hip thrust should stay powerful and clean.",
          "The throw should stay sharp, athletic, and technically clean.",
          "Automatic alternative if no med ball is available: `Cable Rotation` or `Cable Chop explosif` `3x5-6/side`.",
          "This block should support force-to-power transfer without becoming a second contrast block."
        ]
      },
      {
        "number": 4,
        "name": "Position Support Finisher",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Sled Push",
            "prescription": "15-20m"
          },
          {
            "name": "Copenhagen Hold",
            "prescription": "15-20s/side"
          }
        ],
        "coachingNotes": [
          "Front row can go slightly heavier and more braced on the sled.",
          "Back three should keep the sled lighter, faster, and cleaner.",
          "Copenhagen stays controlled and useful.",
          "This block should support transfer, not bury the player."
        ]
      }
    ],
    "progressionRules": [
      "`W5`: establish clean force-power rhythm and reference loads.",
      "`W6`: add `+2.5 to +5 kg` on trap bar only if jump quality and bar speed stay high.",
      "`W7`: keep load progression if earned, or add one round to Block 4 if recovery is good.",
      "`W8`: deload by reducing total volume around `-30%` while keeping movement quality high.",
      "Reduce Block 4 first if fatigue rises.",
      "Reduce one round from Block 3 second.",
      "Keep Block 1 as the protected priority if the athlete is still moving explosively."
    ],
    "positionAccent": [
      "This session is still shared in Phase 2, but the accents are now more visible.",
      "Front row accent:",
      "slightly more force/bracing intent on the trap bar pull",
      "slightly heavier sled",
      "slightly more collision-robust posture throughout the session",
      "Back three accent:",
      "slightly cleaner, faster jump expression",
      "slightly more fluid hip extension and rotation intent",
      "slightly less brute-force feel overall",
      "The skeleton stays shared, but the feeling of the session should no longer be identical by position."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`DB Incline Bench Press`",
          "sled only if arm position is aggravating"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Carry` alternative or tolerated lower-body finish if sled setup is not tolerated"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`",
          "`scapular control drill`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Countermovement Jump`",
          "`Sled Push` if aggravating",
          "`Copenhagen Hold` only if clearly provocative"
        ],
        "replaceWith": [
          "reduced-range jump alternative or med-ball lower-power substitute",
          "reduced-range sled or `Farmer Carry`",
          "tolerated groin/trunk alternative"
        ],
        "rehabFinisher": [
          "light knee-control work if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Trap Bar Deadlift`",
          "`Barbell Hip Thrust` if lumbar position is poor",
          "`Med Ball Rotational Throw` if rotation aggravates symptoms"
        ],
        "replaceWith": [
          "supported squat or `Leg Press`",
          "supported hip thrust variation",
          "`Pallof Press Hold`"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the trap bar deadlift become a slow grind.",
      "Do not let the jump become noisy or sloppy.",
      "Do not turn the upper support block into junk fatigue.",
      "Do not overcook hip thrust or sled volume.",
      "Do not let the rotational throw become a fatigue drill.",
      "This session should feel more explosive than Phase 1, but still organised and absorbable."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[FULL_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/FULL_PRESEASON_FORCE_V1.md)",
      "[FULL_BODY_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/FULL_BODY_IN_SEASON_FRONT_ROW_V1.md)",
      "[FULL_BODY_IN_SEASON_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/FULL_BODY_IN_SEASON_BACK_THREE_V1.md)",
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[fullbody.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/fullbody.jpg)",
      "[fullbody-power-renfo.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/fullbody-power-renfo.jpg)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_PRESEASON_FORCE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (phase 1 common base)",
      "equipment": "full_gym",
      "targetDuration": "55-65 min"
    },
    "title": "FULL_PRESEASON_FORCE_V1",
    "goal": [
      "Build whole-body force support during the first 4 weeks of pre-season.",
      "Complement the main lower and upper force sessions without simply repeating them.",
      "Reinforce hinge strength, upper push/pull support, posterior-chain contribution, and rugby-useful trunk/groin work."
    ],
    "sessionIdentity": [
      "This is a full-body construction session, not a power session and not a lighter in-season full-body day.",
      "Rugby-specific through a heavy hinge, useful upper renfo, posterior-chain support, and a simple finish that still feels athletic.",
      "Do not turn this into a giant accumulation circuit or a random “everything day”."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "thoracic rotation",
          "prescription": "1x6/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "2-3 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own full-body warm-up if it covers hips, trunk, and upper-body readiness.",
        "Keep it short and useful.",
        "The goal is to arrive ready to lift, not already tired."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Full-Body Force",
        "format": "`3 work sets`, `2-3 min` rest between sets",
        "exercises": [
          {
            "name": "Trap Bar Deadlift",
            "prescription": "3x5"
          }
        ],
        "coachingNotes": [
          "This is the anchor lift of the session.",
          "Reps must stay strong, clean, and braced with `RIR 1-2`.",
          "Do not turn this into a max day.",
          "The purpose is to complement the squat-led lower day with a full-body hinge-dominant force exposure."
        ]
      },
      {
        "number": 2,
        "name": "Upper Push/Pull Strength Pair",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "DB Incline Bench Press",
            "prescription": "3x6-8"
          },
          {
            "name": "Single-Arm DB Row",
            "prescription": "3x6-8/side"
          }
        ],
        "coachingNotes": [
          "This block should feel strong and useful, not flashy.",
          "Keep the incline press controlled and the row strict.",
          "This pair supports upper force development without repeating the exact structure of the main upper session."
        ]
      },
      {
        "number": 3,
        "name": "Posterior Chain / Trunk Support",
        "format": "`3 rounds`, `75-90s` rest",
        "exercises": [
          {
            "name": "Barbell Hip Thrust",
            "prescription": "3x6-8"
          },
          {
            "name": "Landmine Rotation",
            "prescription": "2-3x6-8/side"
          }
        ],
        "coachingNotes": [
          "Hip thrust should be powerful and clean, without exaggerated lumbar extension.",
          "Rotation work should stay controlled and athletic.",
          "This block should support future force-to-power transfer without becoming a contrast block already."
        ]
      },
      {
        "number": 4,
        "name": "Position Support Finisher",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Sled Push",
            "prescription": "15-20m"
          },
          {
            "name": "Copenhagen Hold",
            "prescription": "20-30s/side"
          }
        ],
        "coachingNotes": [
          "Sled stays strong and crisp, not conditioning-heavy.",
          "Copenhagen work supports adductors, trunk control, and change-of-direction tolerance.",
          "Front row can go slightly heavier and more braced on the sled.",
          "Back three can go slightly lighter, faster, and cleaner."
        ]
      }
    ],
    "progressionRules": [
      "`W1`: establish clean reference loads.",
      "`W2`: add `+2.5 to +5 kg` on trap bar and hip thrust only if reps stay sharp.",
      "`W3`: keep load progression if earned, or add one round to Block 4 if recovery is good.",
      "`W4`: deload by reducing total volume around `-30%` while keeping movement quality high.",
      "Reduce Block 4 first if fatigue rises.",
      "Reduce one round from Block 3 second.",
      "Keep Block 1 as the protected priority unless the athlete is clearly under-recovered."
    ],
    "positionAccent": [
      "This session is intentionally common in Phase 1.",
      "Front row accent:",
      "slightly more force/bracing intent on the trap bar pull",
      "slightly heavier sled",
      "slightly more contact-robust posture on all loaded work",
      "Back three accent:",
      "slightly cleaner, more athletic intent on the hinge and sled",
      "slightly more attention to hip extension quality and rotation quality",
      "less brute-force bias for now",
      "The skeleton stays the same for both groups at this stage."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`DB Incline Bench Press`",
          "sled only if arm position is aggravating"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Leg Press` or `Carry` alternative if sled setup is not tolerated"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`",
          "`scap push-up`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Sled Push` if aggravating",
          "`Copenhagen Hold` only if clearly provocative"
        ],
        "replaceWith": [
          "reduced-range sled or `Farmer Carry`",
          "tolerated groin/trunk alternative"
        ],
        "rehabFinisher": [
          "light terminal knee extension or controlled split-squat isometric if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Trap Bar Deadlift`",
          "`Barbell Hip Thrust` if lumbar position is poor",
          "`Landmine Rotation` if it aggravates symptoms"
        ],
        "replaceWith": [
          "`Leg Press`",
          "supported hip thrust variation",
          "`Pallof Press Hold`"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the trap bar deadlift become a sloppy grind.",
      "Do not turn the incline press/row pair into junk fatigue.",
      "Do not overcook hip thrust volume just because it feels safe.",
      "Keep the sled work powerful and short.",
      "This session should feel constructive and complete, not like surviving an off-season monster day."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[LOWER_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/LOWER_PRESEASON_FORCE_V1.md)",
      "[UPPER_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/UPPER_PRESEASON_FORCE_V1.md)",
      "[FULL_BODY_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/FULL_BODY_IN_SEASON_FRONT_ROW_V1.md)",
      "[FULL_BODY_IN_SEASON_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/FULL_BODY_IN_SEASON_BACK_THREE_V1.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[fullbody.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/fullbody.jpg)",
      "[fullbody-2.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/fullbody-2.jpg)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_PRESEASON_POWER_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "44-56 min"
    },
    "title": "FULL_PRESEASON_POWER_BACK_THREE_V1",
    "goal": [
      "Express full-body power specific to back-three demands during weeks 9 to 12 of pre-season.",
      "Use clear lower- and upper-body power exposures without turning the session into a crowded contrast circuit.",
      "Maintain enough pulling, posterior-chain support, and lower-leg resilience to stay fast and robust."
    ],
    "sessionIdentity": [
      "This is a back-three full-body power session, not just a lighter copy of the main lower and upper days.",
      "Rugby-specific through elastic lower output, fast upper projection, useful pulling, and sprint-supportive lower-leg/groin work.",
      "This session should feel quicker, cleaner, and more open-field oriented than the front-row full-body version.",
      "Do not dilute this session with extra pressing volume, redundant heavy hinges, or conditioning-style fatigue."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "thoracic rotation",
          "prescription": "1x6/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own full-body warm-up if it covers hips, trunk, ankle stiffness, and upper-body readiness.",
        "Keep this short and useful.",
        "The goal is readiness and expression, not fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Lower Power Pair",
        "format": "`3 rounds`, full rest `3 min`",
        "exercises": [
          {
            "name": "Front Squat",
            "prescription": "3x2-3 @ 78-82%"
          },
          {
            "name": "Countermovement Jump",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "The loaded lower movement stays sharp, upright, and technically clean.",
          "Front squat should be driven with maximal bar-speed intent, not loaded into a slow grind.",
          "The jump stays crisp and explosive.",
          "This block opens the session with force and elastic output while keeping a cleaner, more athletic posture than a heavier hinge-led pattern.",
          "If sprint volume is already high that week, reduce this block to `2 rounds` before cutting later support work.",
          "Optional unilateral emphasis:",
          "replace Exercise A with `Reverse Lunge` or `RFESS` `3x4/side` only if the weekly plan needs more unilateral exposure than the default version provides"
        ],
        "fallbackOptions": [
          "A: `Box Squat` `3x2-3 @ 78-82%` with maximal bar-speed intent",
          "A: `Back Squat` `3x2-3 @ 75-80%` with maximal bar-speed intent",
          "B: `Drop Jump`"
        ]
      },
      {
        "number": 2,
        "name": "Upper Power Pair",
        "format": "`3 rounds`, full rest `2-3 min`",
        "exercises": [
          {
            "name": "Push Press",
            "prescription": "3x3-4"
          },
          {
            "name": "Med Ball Chest Pass",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "Push press should stay explosive and vertically organised, not grindy.",
          "Load should allow maximal bar speed on every rep; if the bar slows visibly, the load is too heavy.",
          "As a practical guide, start around `70-75%` of strict standing overhead press strength if needed.",
          "The throw should stay sharp and low-volume.",
          "This block adds upper-body expression without simply copying the main back-three upper cluster.",
          "If no med ball is available, replace with `Cable Press explosif` or `Plyo Push-Up` `3-4 reps`."
        ]
      },
      {
        "number": 3,
        "name": "Pull / Posterior Cluster",
        "format": "`3 rounds`, `90-120s` rest after the triplet",
        "exercises": [
          {
            "name": "Neutral-Grip Pull-Up",
            "prescription": "3x4-5"
          },
          {
            "name": "Chest-Supported Row",
            "prescription": "3x5-6"
          },
          {
            "name": "Barbell Hip Thrust",
            "prescription": "3x4-5"
          }
        ],
        "coachingNotes": [
          "Pull-ups : clean and forceful, not ugly weighted reps.",
          "Chest-supported row : strict, no torso cheating — ajoute le volume pull manquant pour équilibrer le double-push de B2.",
          "Hip thrust : powerful and clean, no exaggerated lumbar extension. Main bilateral hip-extension exposure of the week.",
          "Ce triplet miroir le power pair B2 (Push Press + Chest Pass) pour équilibre push/pull rugby back-three (plaquage, ruck-over)."
        ]
      },
      {
        "number": 4,
        "name": "Lower Leg / Groin Support",
        "format": "`2-3 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Weighted Calf Raise",
            "prescription": "10-12 reps"
          },
          {
            "name": "Tibialis Raise",
            "prescription": "10-12 reps"
          },
          {
            "name": "Copenhagen Hold",
            "prescription": "15-20s/side"
          }
        ],
        "coachingNotes": [
          "This block supports ankle stiffness, lower-leg resilience, and groin robustness.",
          "Keep it clean and simple.",
          "If the player is already tired, reduce this block first."
        ]
      },
      {
        "number": 5,
        "name": "Mandatory Shoulder Prehab Micro-Block",
        "format": "`1-2 rounds`, `20-30s` rest between drills",
        "exercises": [
          {
            "name": "Band External Rotation",
            "prescription": "10-12 reps"
          },
          {
            "name": "Serratus Reach",
            "prescription": "8-10 reps"
          },
          {
            "name": "Scap Push-Up",
            "prescription": "8-10 reps"
          }
        ],
        "coachingNotes": [
          "This block is mandatory in Phase 3 because the session still carries a meaningful upper push-speed demand.",
          "Keep it clean, light, and non-fatiguing.",
          "It should take around `2-3 min`, not become a separate accessory block."
        ]
      }
    ],
    "progressionRules": [
      "`W9`: establish clean power rhythm and reference loads.",
      "`W10`: add small load only if bar speed and jump/throw quality stay high.",
      "`W11`: maintain load and improve output quality rather than forcing more weight.",
      "`W12`: reduce volume around `-30%` while preserving speed and sharpness.",
      "Reduce Block 4 first if fatigue rises.",
      "Reduce one round from Block 3 second.",
      "Keep Block 5 unless shoulder irritability requires a different rehab emphasis.",
      "Keep Blocks 1 and 2 as the protected priorities if the athlete is still moving explosively."
    ],
    "positionAccent": [
      "This session is explicitly back-three specific.",
      "Back-three identity comes from:",
      "lower-body power with more elastic than collision-oriented intent",
      "a fast upright squat pattern that supports athletic posture without turning the session into another hinge-dominant day",
      "fast upper projection with less brute-force feel than the front-row version",
      "posterior-chain support tied to sprint mechanics",
      "ankle, groin, and lower-leg support that directly feed acceleration and open-field work"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Push Press`",
          "`Med Ball Chest Pass`"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Single-Arm Landmine Press`",
          "safer row emphasis if needed"
        ],
        "rehabFinisher": [
          "keep the micro-block, but bias it further toward pain-free scapular control"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Front Squat`",
          "`Countermovement Jump`",
          "`Copenhagen Hold` only if clearly provocative"
        ],
        "replaceWith": [
          "reduced-range squat if tolerated",
          "lower-body power alternative if tolerated",
          "tolerated groin/trunk alternative"
        ],
        "rehabFinisher": [
          "light knee-control work if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Barbell Hip Thrust` only if lumbar position is poor",
          "unsupported pull only if posture cannot stay clean"
        ],
        "replaceWith": [
          "supported hinge pattern",
          "`Chest-Supported Row`",
          "lighter trunk/anti-rotation option"
        ],
        "rehabFinisher": [
          "breathing + trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the front squat or push press become slow survival reps.",
      "Do not let the jump or throw drift into fatigue work.",
      "Do not add load to pull-ups at the expense of range and position.",
      "Do not turn the support block into a second strength session.",
      "Keep the lower-leg/groin block useful, not endless.",
      "Do not skip the shoulder micro-block just because the player feels good.",
      "This session should feel sharp, athletic, and clearly more open-field than the front-row full-body version."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[FULL_PRESEASON_FORCE_POWER_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/FULL_PRESEASON_FORCE_POWER_V1.md)",
      "[FULL_BODY_IN_SEASON_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/FULL_BODY_IN_SEASON_BACK_THREE_V1.md)",
      "[LOWER_PRESEASON_POWER_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/LOWER_PRESEASON_POWER_BACK_THREE_V1.md)",
      "[UPPER_PRESEASON_POWER_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/UPPER_PRESEASON_POWER_BACK_THREE_V1.md)",
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[fullbody-power-renfo.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/fullbody-power-renfo.jpg)",
      "[fullbody.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/fullbody.jpg)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)"
    ]
  },
  {
    "metadata": {
      "id": "FULL_PRESEASON_POWER_FRONT_ROW_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "full",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row",
      "equipment": "full_gym",
      "targetDuration": "46-58 min"
    },
    "title": "FULL_PRESEASON_POWER_FRONT_ROW_V1",
    "goal": [
      "Express full-body power specific to front-row demands during weeks 9 to 12 of pre-season.",
      "Use clear lower- and upper-body power exposures without turning the session into a crowded contrast circuit.",
      "Maintain enough pulling and support work to stay robust while preserving freshness."
    ],
    "sessionIdentity": [
      "This is a front-row full-body power session, not just a lighter copy of the main lower and upper days.",
      "Rugby-specific through forceful lower output, robust upper projection, useful pulling, and a short front-row finisher.",
      "This session should feel expressive and athletic, but still more organised and braced than the back-three full-body version should.",
      "Do not dilute this session with extra accessories, repeated heavy lifts, or conditioning-style fatigue."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "thoracic rotation",
          "prescription": "1x6/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own full-body warm-up if it covers hips, trunk, and upper-body readiness.",
        "Keep this short and useful.",
        "The goal is readiness and expression, not fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Lower Power Pair",
        "format": "`3 rounds`, full rest `3 min`",
        "exercises": [
          {
            "name": "Front Squat",
            "prescription": "3x3 @ 80-85%"
          },
          {
            "name": "Broad Jump",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "Front squat should stay sharp, upright, and strongly braced.",
          "The jump stays crisp and explosive.",
          "This block opens the session with lower-body force support and athletic output without duplicating the main lower-day opening.",
          "Broad jump is used here to give a more horizontal projection feel than the main lower session."
        ],
        "fallbackOptions": [
          "A: `Box Squat`",
          "B: `Countermovement Jump`"
        ]
      },
      {
        "number": 2,
        "name": "Upper Power Pair",
        "format": "`3 rounds`, full rest `2-3 min`",
        "exercises": [
          {
            "name": "Push Press",
            "prescription": "3x3-4"
          },
          {
            "name": "Med Ball Chest Pass",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "Push press should stay explosive and vertically organised, not grindy.",
          "Load should allow maximal bar speed on every rep; if the bar slows visibly, the load is too heavy.",
          "As a practical guide, start around `70-75%` of strict standing overhead press strength if needed.",
          "The throw should stay violent and low-volume.",
          "This block adds upper-body expression without simply copying the main front-row upper cluster.",
          "If no med ball is available, replace with `Cable Press explosif` or `Plyo Push-Up` `3-4 reps`."
        ]
      },
      {
        "number": 3,
        "name": "Pull / Posterior Cluster",
        "format": "`3 rounds`, `90-120s` rest after the triplet",
        "exercises": [
          {
            "name": "Neutral-Grip Pull-Up",
            "prescription": "3x4-5"
          },
          {
            "name": "Chest-Supported Row",
            "prescription": "3x5-6"
          },
          {
            "name": "Hex Bar RDL",
            "prescription": "3x4-5"
          }
        ],
        "coachingNotes": [
          "Pull-ups : clean and forceful, not ugly weighted reps.",
          "Chest-supported row : strict, no torso cheating — ajoute le volume pull manquant pour équilibrer le double-push de B2.",
          "Hex bar RDL : support posterior-chain — upgrade 2→3 sets pour cohérence triplet.",
          "Ce triplet miroir le power pair B2 (Push Press + Chest Pass) pour équilibre push/pull rugby front-row (plaquage, maul)."
        ]
      },
      {
        "number": 4,
        "name": "Front Row Finisher",
        "format": "`EMOM 6'`",
        "exercises": [
          {
            "name": "Zercher Carry",
            "prescription": "20m",
            "slotLabel": "minute 1"
          },
          {
            "name": "Banded Neck Isometric",
            "prescription": "15-20s",
            "slotLabel": "minute 2"
          }
        ],
        "coachingNotes": [
          "Carry intent stays posture, bracing, and contact robustness.",
          "Rotate neck directions across rounds: flexion, extension, left lateral, right lateral.",
          "If weekly neck volume is already well covered, replace the neck slot with `Copenhagen Hold` `15-20s/side`.",
          "If weekly adductor work looks insufficient, extend this block to `EMOM 9'` by adding `Copenhagen Hold` on minute 3."
        ]
      },
      {
        "number": 5,
        "name": "Mandatory Shoulder Prehab Micro-Block",
        "format": "`1-2 rounds`, `20-30s` rest between drills",
        "exercises": [
          {
            "name": "Band External Rotation",
            "prescription": "10-12 reps"
          },
          {
            "name": "Serratus Reach",
            "prescription": "8-10 reps"
          },
          {
            "name": "Scap Push-Up",
            "prescription": "8-10 reps"
          }
        ],
        "coachingNotes": [
          "This block is mandatory in Phase 3 because the session still carries a meaningful upper push-speed demand.",
          "Keep it clean, light, and non-fatiguing.",
          "It should take around `2-3 min`, not become a separate accessory block."
        ]
      }
    ],
    "progressionRules": [
      "`W9`: establish clean power rhythm and reference loads.",
      "`W10`: add small load only if bar speed and jump/throw quality stay high.",
      "`W11`: maintain load and improve output quality rather than forcing more weight.",
      "`W12`: reduce volume around `-30%` while preserving speed and sharpness.",
      "Reduce Block 4 first if fatigue rises.",
      "Reduce one round from Block 3 second.",
      "Keep Block 5 unless shoulder irritability requires a different rehab emphasis.",
      "Keep Blocks 1 and 2 as the protected priorities if the athlete is still moving explosively."
    ],
    "positionAccent": [
      "This session is explicitly front-row specific.",
      "Front-row identity comes from:",
      "stronger bracing and force bias on the lower pair",
      "upper-body projection with a more violent than fluid intent",
      "robust pull and hinge support",
      "explicit carry and cervical work"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Push Press`",
          "`Med Ball Chest Pass`"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Single-Arm Landmine Press`",
          "safer row emphasis if needed"
        ],
        "rehabFinisher": [
          "keep the micro-block, but bias it further toward pain-free scapular control"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Front Squat`",
          "`Countermovement Jump`",
          "carry only if it clearly aggravates the player"
        ],
        "replaceWith": [
          "reduced-range squat if tolerated",
          "lower-body power alternative if tolerated",
          "shorter carry distance"
        ],
        "rehabFinisher": [
          "light knee-control work if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Hex Bar RDL`",
          "heavy carry if bracing cannot stay clean"
        ],
        "replaceWith": [
          "supported hinge pattern",
          "lighter carry or trunk anti-rotation hold"
        ],
        "rehabFinisher": [
          "breathing + trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the front squat or push press become slow survival reps.",
      "Do not let the jump or throw drift into fatigue work.",
      "Do not add load to pull-ups at the expense of range and position.",
      "Do not let the support block turn into a second strength session.",
      "Keep the finisher specific, not crushing.",
      "Do not skip the shoulder micro-block just because the player feels good.",
      "This session should feel sharp, robust, and clearly expressive without feeling chaotic."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[FULL_PRESEASON_FORCE_POWER_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/FULL_PRESEASON_FORCE_POWER_V1.md)",
      "[FULL_BODY_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/FULL_BODY_IN_SEASON_FRONT_ROW_V1.md)",
      "[LOWER_PRESEASON_POWER_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/LOWER_PRESEASON_POWER_FRONT_ROW_V1.md)",
      "[UPPER_PRESEASON_POWER_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/UPPER_PRESEASON_POWER_FRONT_ROW_V1.md)",
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[fullbody-power-renfo.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/fullbody-power-renfo.jpg)",
      "[fullbody.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/fullbody.jpg)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_BW_IN_SEASON_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "in_season",
      "sessionType": "lower",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (common base with position accents)",
      "equipment": "bodyweight",
      "targetDuration": "35-45 min"
    },
    "title": "LOWER_BW_IN_SEASON_V1",
    "goal": [
      "Maintain lower-body force useful for rugby contact, acceleration, and short-force actions at bodyweight.",
      "Keep one clean force -> projection contrast without excessive residual fatigue.",
      "Maintain posterior-chain strength and unilateral control.",
      "Finish with a short rugby finisher (locomotion/carry, adductors, trunk)."
    ],
    "sessionIdentity": [
      "In-season lower maintenance — not pre-season build, not off-season hypertrophy.",
      "**Calibration** : rugbyman club en saison — fente bulgare lourde (sac/tempo), sauts nets, volume contenu.",
      "Mesocycle 3:1 — deload week 4 : `-30%` volume (cut Block 3 first, then one round from Block 2).",
      "Rugby-specific through contrast lower, posterior/unilateral support, and collision-oriented finisher."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight squat",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Short and specific — readiness, not volume.",
        "Player can keep own lower warm-up if ankles, hips, adductors, and trunk are prepared."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Contrast Lower Force-Projection",
        "format": "`4 rounds`, full rest `2 min 30 to 3 min` after each round",
        "exercises": [
          {
            "name": "Bulgarian Split Squat",
            "prescription": "3-4x3/side"
          },
          {
            "name": "Broad Jump",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "Heavy A: backpack load or slow 3-1-1 tempo, `RIR 2-3` (~75-80% effort).",
          "Broad jump within 15-20s of A — powerful and crisp, not chased once quality drops.",
          "Upgrade A: `Goblet Squat` heavy if DB/KB available.",
          "Upgrade B: `Squat Jump` if space limited; `Lateral Squat Jump` for back-three speed bias.",
          "This is force -> projection contrast, not a fatigue block.",
          "`Front_row`: slightly heavier load bias on A.",
          "`Back_three`: prioritize jump distance and take-off quality over extra load."
        ]
      },
      {
        "number": 2,
        "name": "Posterior Chain + Unilateral Support",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Single-Leg Glute Bridge",
            "prescription": "3x5-6/side"
          },
          {
            "name": "Bulgarian Split Squat",
            "prescription": "3x5/side"
          }
        ],
        "coachingNotes": [
          "Athletic support work — clean lockout on bridge, stable unilateral squat.",
          "Upgrade A: `Romanian Deadlift` if DB/KB available.",
          "Upgrade B: loaded Bulgarian if DB available.",
          "Fallback B: `Reverse Lunge Bodyweight` if balance limits split work.",
          "Keep `RIR 2-3` — useful, not draining."
        ]
      },
      {
        "number": 3,
        "name": "Rugby Finisher",
        "format": "`EMOM 8'`",
        "exercises": [
          {
            "name": "Bear Crawl",
            "prescription": "15-20m",
            "slotLabel": "minute 1"
          },
          {
            "name": "Copenhagen Plank",
            "prescription": "15-20s/side",
            "slotLabel": "minute 2"
          }
        ],
        "coachingNotes": [
          "Bear crawl: fast posture, scrum-like projection intent.",
          "Upgrade A: `Farmer Carry` or `Suitcase Carry` if DB/KB available.",
          "Copenhagen : pied surélevé obligatoire.",
          "If adductor load is already high: replace B with `Side Plank` or `Pallof Press Hold` if band available.",
          "Robust and specific — not exhaustive."
        ]
      }
    ],
    "progressionRules": [
      "Prioritize movement quality and jump projection over load jumps.",
      "Progress A via backpack/tempo only if all sets stay sharp.",
      "Deload week 4: reduce Block 3 to 6 min EMOM or skip; drop one round from Block 2.",
      "If weekly fatigue is high: cut Block 3 first, then one round from Block 2; keep Block 1 if player is fresh enough."
    ],
    "positionAccent": [
      "`Front_row`: heavier A bias, farmer/sled-style carry upgrade in finisher, adductor robustness.",
      "`Back_three`: broad jump quality over load, slightly faster contrast profile, suitcase carry option."
    ],
    "injurySubstitutions": [],
    "coachingWarnings": [
      "Do not let heavy split squats become slow survival work.",
      "Stop broad jumps when take-off quality drops.",
      "On match weeks, schedule early enough for weekend recovery."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[LOWER_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/in-season/LOWER_IN_SEASON_FRONT_ROW_V1.md)",
      "[LOWER_IN_SEASON_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/in-season/LOWER_IN_SEASON_BACK_THREE_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "lower",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (common base with position accents)",
      "equipment": "bodyweight",
      "targetDuration": "45-55 min"
    },
    "title": "LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1",
    "goal": [
      "Convert off-season hypertrophy into lower-body force and explosive power at bodyweight.",
      "Use complex training (heavy slow → ballistic contrast) within 15-20s PAP windows.",
      "Bridge toward pre-season power without gym loads."
    ],
    "sessionIdentity": [
      "Force-bridge lower — not hypertrophy, not pre-season max power.",
      "**Calibration** : rugbyman club entraîné — fente bulgare lente lourde (sac/tempo), nordiques stricts, sauts max intention.",
      "Contrast pairs in Blocks 1-2 are non-negotiable session priority."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight squat",
          "prescription": "1x8"
        },
        {
          "name": "2-3 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Ramp Bulgarian split squat before Block 1 — feel sharp, not fatigued."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Squat Force + Explosive Contrast",
        "format": "`4 rounds`, `3-4 min` rest between rounds",
        "exercises": [
          {
            "name": "Bulgarian Split Squat",
            "prescription": "4x4-5/side"
          },
          {
            "name": "Squat Jump",
            "prescription": "4x3-4, max intention",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Heavy A: slow 3-1-1 tempo or backpack load, `RIR 1-2`.",
          "Jump within 15-20s of finishing A — exploit PAP.",
          "If jump height drops, reduce load/tempo on A before cutting jumps.",
          "Upgrade A: `Goblet Squat` heavy if DB/KB available.",
          "Upgrade B: `Banded KB Swing` if band + KB; `Lateral Squat Jump` as horizontal contrast variant."
        ]
      },
      {
        "number": 2,
        "name": "Hinge Force + Dynamic Contrast",
        "format": "`4 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Nordic Eccentric",
            "prescription": "4x4-5"
          },
          {
            "name": "Broad Jump",
            "prescription": "4x3, max distance",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Strict nordic eccentrics (3-4s down) — force-grade, not hypertrophy volume.",
          "Broad jump: full hip extension, stick the landing.",
          "Upgrade A: `Romanian Deadlift` heavy if DB/KB available.",
          "Fallback B: `Lateral Squat Jump` if space limited for broad jump."
        ]
      },
      {
        "number": 3,
        "name": "Unilateral Strength + Posterior Support",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Bulgarian Split Squat",
            "prescription": "3x5-6/side"
          },
          {
            "name": "Nordic Eccentric",
            "prescription": "3x4-5"
          }
        ],
        "coachingNotes": [
          "Force-grade reps (5-6), controlled — structural balance without junk fatigue.",
          "Upgrade A: loaded Bulgarian if DB available.",
          "Upgrade B: `Banded Nordic` if band available."
        ]
      },
      {
        "number": 4,
        "name": "Lower-Leg / Groin Prevention",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Copenhagen Plank",
            "prescription": "2x20-30s/side"
          },
          {
            "name": "Single-Leg Calf Raise",
            "prescription": "2x10-12/side"
          },
          {
            "name": "Wall Tibialis Raise",
            "prescription": "2x12"
          }
        ],
        "coachingNotes": [
          "Prevention only — cut this block first if CNS fatigue is high.",
          "Copenhagen : pied surélevé obligatoire."
        ]
      }
    ],
    "progressionRules": [
      "`FB1` (week 9): establish contrast tolerance; keep A exercises submax but crisp.",
      "`FB2` (week 10): add load (backpack) or tempo on A if jump/throw quality holds.",
      "Reduce Block 4 first, then Block 3 to 2 rounds.",
      "NEVER reduce Blocks 1-2 — contrast pairs ARE the session."
    ],
    "positionAccent": [
      "`Front_row`: patient bracing on nordics and split squat; slightly heavier load tolerated on A.",
      "`Back_three`: prioritize broad jump distance and squat jump height over extra load."
    ],
    "injurySubstitutions": [],
    "coachingWarnings": [
      "Powerful and sharp — not exhausting. Full rest between contrast rounds.",
      "Stop ballistic work if quality degrades visibly."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[LOWER_OFFSEASON_FORCE_BRIDGE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/LOWER_OFFSEASON_FORCE_BRIDGE_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_BW_OFFSEASON_HYPERTROPHY_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "lower",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (common base with position accents)",
      "equipment": "bodyweight",
      "targetDuration": "45-55 min"
    },
    "title": "LOWER_BW_OFFSEASON_HYPERTROPHY_V1",
    "goal": [
      "Build useful lower-body muscle during off-season hypertrophy at bodyweight.",
      "Accumulate squat, hinge, unilateral, and groin volume without junk fatigue.",
      "V1.1 volume cap: ~16–20 hard sets per session."
    ],
    "sessionIdentity": [
      "Off-season hypertrophy lower — not transition, not pre-season force.",
      "Rugby-specific muscle on squat, hinge, unilateral, adductors, and lower-leg tissues.",
      "**Calibration** : prescription par défaut = rugbyman club entraîné (niveau builder). Accessible sans être « débutant fitness » — régresser uniquement si douleur, mobilité limitante ou charge club très élevée.",
      "**Charge sans matériel** : sac à dos, tempo lent (3-1-3), amplitude complète avant toute régression d'exercice."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight split squat",
          "prescription": "1x6/side"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Ready for volume, not pre-fatigued."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Squat Hypertrophy",
        "format": "`4 work sets`, `2 min` rest between sets",
        "exercises": [
          {
            "name": "Bulgarian Split Squat",
            "prescription": "4x8-10/side"
          }
        ],
        "coachingNotes": [
          "Around `RPE 6-8` — main hypertrophy driver for the lower session.",
          "Add backpack load or 3-1-3 tempo before switching to an easier variation.",
          "Fallback: `Reverse Lunge Bodyweight` only if single-leg balance is the limiter.",
          "Upgrade: `Goblet Squat` if DB/KB available."
        ]
      },
      {
        "number": 2,
        "name": "Hinge / Unilateral Pair",
        "format": "`4 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Nordic Eccentric",
            "prescription": "4x6-8"
          },
          {
            "name": "Bulgarian Split Squat",
            "prescription": "4x8-10/side"
          }
        ],
        "coachingNotes": [
          "Main structural block — slow nordic eccentrics, stable unilateral work.",
          "Nordic: 3–4s descent; hands on floor only to finish the rep if needed.",
          "Fallback A: `Kickstand RDL` heavy tempo if nordics not tolerated this week.",
          "Fallback B: `Reverse Lunge Bodyweight` if split squat balance breaks down."
        ]
      },
      {
        "number": 3,
        "name": "Posterior Chain / Groin Support",
        "format": "`2 rounds`, `60-75s` rest after the pair",
        "exercises": [
          {
            "name": "Kickstand RDL",
            "prescription": "2x10-12/side"
          },
          {
            "name": "Copenhagen Plank",
            "prescription": "2x20-30s/side"
          }
        ],
        "coachingNotes": [
          "Hamstring and adductor support — honest reps, no grinding.",
          "Copenhagen : pied surélevé obligatoire — progression vers levier court/long sur banc si disponible.",
          "Fallback A: `Single-Leg Glute Bridge` with 2s pause at top.",
          "Fallback B: `Supine Adductor Squeeze` if Copenhagen irritates groin."
        ]
      },
      {
        "number": 4,
        "name": "Lower-Leg Support (optional)",
        "format": "",
        "exercises": [
          {
            "name": "Single-Leg Calf Raise",
            "prescription": "2x10-12/side"
          },
          {
            "name": "Wall Tibialis Raise",
            "prescription": "2x12-15"
          }
        ],
        "coachingNotes": [
          "Optional — cut this block first if club fatigue is high."
        ]
      }
    ],
    "progressionRules": [
      "Week 1–2: establish volume tolerance at `RPE 6-7`.",
      "Week 3: highest volume week with `1-2 RIR` on Blocks 1–2 if recovery OK.",
      "Week 4 deload: `-25 to -30%` volume while keeping movement quality.",
      "Cut Block 4 first, then one round from Block 2, before touching Block 1.",
      "Progress via load (backpack), tempo, or range — not by swapping to easier exercises."
    ],
    "positionAccent": [
      "`Front_row`: add neck isometric 2x10s/direction after Block 3 if no pain.",
      "`Back_three`: optional +1 round unilateral in Block 2 if recovery is excellent."
    ],
    "injurySubstitutions": [],
    "coachingWarnings": [
      "Not a bodybuilding leg day — stay rugby-relevant.",
      "Do not chase soreness for its own sake.",
      "If the session feels too easy, add backpack load before reducing range or exercise difficulty."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[bodyweight-program-review.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-program-review.md)",
      "[LOWER_OFFSEASON_HYPERTROPHY_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/LOWER_OFFSEASON_HYPERTROPHY_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_BW_OFFSEASON_TRANSITION_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "lower",
      "targetLevel": "starter",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "bodyweight",
      "targetDuration": "40-50 min"
    },
    "title": "LOWER_BW_OFFSEASON_TRANSITION_V1",
    "goal": [
      "Rebuild lower-body structure after Recovery without jumping into hypertrophy intensity.",
      "Restore squat, hinge, unilateral support, and groin/trunk robustness at bodyweight.",
      "Keep the session clearly below true off-season build volume."
    ],
    "sessionIdentity": [
      "Transition lower session — not recovery, not yet hypertrophy.",
      "Rugby-specific through squat/hinge patterns, adductors, trunk, and lower-leg support."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight split squat",
          "prescription": "1x6/side"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Short and practical — prepared for moderate training, not max effort."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Squat / Hinge Base Pair",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Bodyweight Squat",
            "prescription": "3x6-8"
          },
          {
            "name": "Single-Leg Glute Bridge",
            "prescription": "3x6-8/side"
          }
        ],
        "coachingNotes": [
          "Keep around `RPE 5-6`.",
          "Squat with controlled tempo (3-1-3) if easy.",
          "Unilateral glute bridge as default BW hinge progression."
        ],
        "fallbackOptions": [
          "A: `Goblet Squat` if DB/KB available",
          "B: `Good Morning` with band if available"
        ]
      },
      {
        "number": 2,
        "name": "Unilateral Support Pair",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Reverse Lunge Bodyweight",
            "prescription": "3x6-8/side"
          },
          {
            "name": "Kickstand RDL",
            "prescription": "3x6-8/side"
          }
        ],
        "coachingNotes": [
          "Smooth, symmetrical unilateral work — support, not fatigue chasing."
        ],
        "fallbackOptions": [
          "A: `Bodyweight Split Squat`",
          "B: `Glute Bridge`"
        ]
      },
      {
        "number": 3,
        "name": "Groin / Trunk / Lower-Leg Support",
        "format": "",
        "exercises": [
          {
            "name": "Side Plank",
            "prescription": "2x20-30s/side"
          },
          {
            "name": "Supine Adductor Squeeze",
            "prescription": "2x20s"
          },
          {
            "name": "Single-Leg Calf Raise",
            "prescription": "2x10-12/side"
          },
          {
            "name": "Wall Tibialis Raise",
            "prescription": "2x12-15"
          }
        ],
        "coachingNotes": [
          "Submaximal holds and lower-leg support.",
          "Run plank + adductor first, then calf + tibialis."
        ]
      }
    ],
    "progressionRules": [
      "`S3`: moderate effort, all reps clean.",
      "`S4`: small progression (range, tempo, or harder BW variant) only if quality holds.",
      "If fatigue is high, cut one round from Block 2 first."
    ],
    "positionAccent": [
      "Common base; front_row may add Copenhagen plank 1 round if tolerated (pied surélevé)."
    ],
    "injurySubstitutions": [],
    "coachingWarnings": [
      "Rebuild session — not a strength test.",
      "If still very beat up, stay closer to Recovery volume."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_BW_PRESEASON_FORCE_POWER_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "lower",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (phase 2 common base)",
      "equipment": "bodyweight",
      "targetDuration": "45-55 min"
    },
    "title": "LOWER_BW_PRESEASON_FORCE_POWER_V1",
    "goal": [
      "Introduce force-power contrast on lower body in pre-season phase 2 (weeks 5-8).",
      "Heavy slow pattern followed by ballistic expression within PAP window.",
      "Maintain posterior-chain and unilateral support without excessive fatigue."
    ],
    "sessionIdentity": [
      "Force-power lower — contrast pairs are session priority.",
      "**Calibration** : goblet/fente lourde + squat sauté max intention."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight squat",
          "prescription": "1x8"
        },
        {
          "name": "2-3 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": []
    },
    "blocks": [
      {
        "number": 1,
        "name": "Contrast Lower",
        "format": "`4 rounds`, `3 min` rest between rounds",
        "exercises": [
          {
            "name": "Bulgarian Split Squat",
            "prescription": "4x4/side"
          },
          {
            "name": "Squat Jump",
            "prescription": "4x3-4",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Heavy A: backpack or goblet if DB/KB, `RIR 1-2`.",
          "Jump within 15-20s of A — max intention, not volume.",
          "Upgrade B: `Banded KB Swing` if band available."
        ]
      },
      {
        "number": 2,
        "name": "Hinge + Unilateral",
        "format": "`3 rounds`, `90s` rest after the pair",
        "exercises": [
          {
            "name": "Romanian Deadlift",
            "prescription": "3x4-5"
          },
          {
            "name": "Bulgarian Split Squat",
            "prescription": "3x5/side"
          }
        ],
        "coachingNotes": [
          "Explosive concentric on B — athletic, not grinding.",
          "Fallback A: `Nordic Eccentric` strict."
        ]
      },
      {
        "number": 3,
        "name": "Finisher",
        "format": "`EMOM 8'`",
        "exercises": [
          {
            "name": "Bear Crawl",
            "prescription": "15-20m",
            "slotLabel": "minute 1"
          },
          {
            "name": "Copenhagen Plank",
            "prescription": "15-20s/side",
            "slotLabel": "minute 2"
          }
        ],
        "coachingNotes": [
          "Fast bear crawl — scrum projection intent.",
          "Upgrade A: `Farmer Carry` if DB/KB available."
        ]
      }
    ],
    "progressionRules": [
      "Reduce Block 3 first if contrast quality drops.",
      "NEVER cut Block 1 contrast rounds before reducing load on A."
    ],
    "positionAccent": [
      "`Front_row`: heavier A load; patient bracing on nordics.",
      "`Back_three`: prioritize jump height and broad jump distance."
    ],
    "injurySubstitutions": [],
    "coachingWarnings": [],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[LOWER_PRESEASON_FORCE_POWER_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/LOWER_PRESEASON_FORCE_POWER_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_BW_PRESEASON_FORCE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "lower",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (phase 1 common base)",
      "equipment": "bodyweight",
      "targetDuration": "45-55 min"
    },
    "title": "LOWER_BW_PRESEASON_FORCE_V1",
    "goal": [
      "Build lower-body force capacity in pre-season phase 1 without gym loads.",
      "Reinforce squat pattern, hinge, unilateral support, and posterior-chain qualities.",
      "Keep rugby-specific groin, trunk, and contact readiness through simple finishers."
    ],
    "sessionIdentity": [
      "Pre-season force construction — not power contrast yet, not in-season maintenance.",
      "**Calibration** : fente bulgare lente lourde (sac/tempo), nordiques stricts — rugbyman club entraîné.",
      "Deload W4: reduce volume around `-30%` (cut Block 4 first, then one round from Block 3)."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "split squat isometric hold",
          "prescription": "1x15-20s/side"
        },
        {
          "name": "2-3 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Short and useful — readiness for force, not early fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Lower Force",
        "format": "`4 work sets`, `2-3 min` rest between sets",
        "exercises": [
          {
            "name": "Bulgarian Split Squat",
            "prescription": "4x4-5/side"
          }
        ],
        "coachingNotes": [
          "Anchor block — slow 3-1-1 tempo or backpack load, `RIR 1-2`.",
          "No collapse, no grinding — force construction, not testing.",
          "Upgrade: `Goblet Squat` heavy if DB/KB available.",
          "`Front_row`: slightly heavier load bias.",
          "`Back_three`: more explosive concentric intent on split squat."
        ]
      },
      {
        "number": 2,
        "name": "Hinge + Unilateral Strength Pair",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Romanian Deadlift",
            "prescription": "3x5-6"
          },
          {
            "name": "Bulgarian Split Squat",
            "prescription": "3x6/side"
          }
        ],
        "coachingNotes": [
          "RDL strict and posterior-chain dominant — upgrade from BW nordic if DB available.",
          "Unilateral lift supports hip/groin control, not conditioning.",
          "Fallback A: `Nordic Eccentric` if no DB/KB."
        ]
      },
      {
        "number": 3,
        "name": "Posterior Chain / Lower Leg Support",
        "format": "`2-3 rounds`, `60-90s` rest",
        "exercises": [
          {
            "name": "Nordic Eccentric",
            "prescription": "2-3x4-5"
          },
          {
            "name": "Single-Leg Calf Raise",
            "prescription": "3x10-12/side"
          },
          {
            "name": "Wall Tibialis Raise",
            "prescription": "2-3x10-12"
          }
        ],
        "coachingNotes": [
          "Low nordic volume to preserve hamstring quality across the week.",
          "Upgrade B: weighted calf if DB available."
        ]
      },
      {
        "number": 4,
        "name": "Position Support Finisher",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Copenhagen Plank",
            "prescription": "20-30s/side"
          },
          {
            "name": "Bear Crawl",
            "prescription": "20m"
          }
        ],
        "coachingNotes": [
          "Copenhagen: foot elevated mandatory.",
          "Upgrade B: `Farmer Carry` if DB/KB available.",
          "`Front_row`: heavier carry; `Back_three`: cleaner athletic carry."
        ]
      }
    ],
    "progressionRules": [
      "`W1-W3`: add load (backpack) only if all reps stay clean.",
      "`W4`: deload `-30%` volume — Block 4 first, then Block 3.",
      "Keep Block 1 protected unless clearly under-recovered."
    ],
    "positionAccent": [
      "`Front_row`: +1 set Block 1 if tolerated; heavier farmer walk.",
      "`Back_three`: more explosive split squat concentric; sprint-quality bear crawl."
    ],
    "injurySubstitutions": [],
    "coachingWarnings": [],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[LOWER_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/LOWER_PRESEASON_FORCE_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_BW_PRESEASON_POWER_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "lower",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (phase 3 common base)",
      "equipment": "bodyweight",
      "targetDuration": "40-50 min"
    },
    "title": "LOWER_BW_PRESEASON_POWER_V1",
    "goal": [
      "Phase 3 lower power — speed-strength contrasts, explosive unilateral work.",
      "Prepare for in-season maintenance without max force grinding.",
      "Short rugby finisher (sprint + Copenhagen)."
    ],
    "sessionIdentity": [
      "Power phase lower — velocity and projection over max load.",
      "Same skeleton for front_row/back_three; accents via load and sprint distance."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "pogo hops",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": []
    },
    "blocks": [
      {
        "number": 1,
        "name": "Speed Contrast Lower",
        "format": "`4 rounds`, `2 min 30` rest between rounds",
        "exercises": [
          {
            "name": "Bulgarian Split Squat",
            "prescription": "4x3/side"
          },
          {
            "name": "Squat Jump",
            "prescription": "3 reps",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "A: moderate load, max bar speed — goblet if DB/KB.",
          "B: CMJ or squat jump within 15-20s of A.",
          "`Front_row`: slightly heavier A; `Back_three`: longer sprint finisher."
        ]
      },
      {
        "number": 2,
        "name": "Explosive Unilateral",
        "format": "`3 rounds`, `90s` rest after the pair",
        "exercises": [
          {
            "name": "Bulgarian Split Squat",
            "prescription": "3x4/side"
          },
          {
            "name": "Broad Jump",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "Explosive split squat — fast concentric, stable landing on jump.",
          "Upgrade A: light DB if available."
        ]
      },
      {
        "number": 3,
        "name": "Finisher",
        "format": "`2 rounds`, `60s` rest",
        "exercises": [
          {
            "name": "Short Acceleration Sprint",
            "prescription": "2x15m"
          },
          {
            "name": "Copenhagen Plank",
            "prescription": "2x15s/side"
          }
        ],
        "coachingNotes": [
          "Upgrade A: band-resisted short sprint if band available.",
          "Copenhagen: foot elevated mandatory."
        ]
      }
    ],
    "progressionRules": [
      "Prioritize jump and sprint quality over load increases.",
      "Cut Block 3 first if weekly fatigue is high."
    ],
    "positionAccent": [],
    "injurySubstitutions": [],
    "coachingWarnings": [],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_IN_SEASON_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "in_season",
      "sessionType": "lower",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "40-50 min"
    },
    "title": "LOWER_IN_SEASON_BACK_THREE_V1",
    "goal": [
      "Maintain lower-body force useful for acceleration, speed support, and open-field contact.",
      "Keep one clear lower-body force -> projection exposure without creating heavy residual fatigue.",
      "Maintain posterior-chain strength and unilateral control.",
      "Finish with a short athletic block that supports stiffness, trunk control, and acceleration qualities."
    ],
    "sessionIdentity": [
      "Rugby-specific through a readable lower contrast, strong posterior-chain work, unilateral control, and a short field-transfer finisher.",
      "Back-three specific through slightly more speed bias, more unilateral emphasis, and less collision-bracing emphasis than front row.",
      "Do not dilute this session with too much volume, too many jumps, or slow grinding strength work."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "low pogo hops",
          "prescription": "1x10"
        },
        {
          "name": "single-leg glute bridge",
          "prescription": "1x6/side"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own lower-body warm-up if it prepares ankles, hips, and posterior chain.",
        "Keep this short and specific.",
        "The goal is readiness and stiffness, not fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Contrast Lower Speed-Projection",
        "format": "`4 rounds`, full rest `2 min 30 to 3 min` after each round",
        "exercises": [
          {
            "name": "Trap Bar Deadlift",
            "prescription": "4x3 @ 75-80%"
          },
          {
            "name": "Broad Jump",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "Trap bar reps must stay sharp and technically clean.",
          "No grinding reps.",
          "Broad jumps should be powerful and crisp, not chased once quality drops.",
          "This is a force -> projection contrast with a slightly faster profile than the front-row version."
        ]
      },
      {
        "number": 2,
        "name": "Posterior Chain + Unilateral Strength Pair",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Barbell Hip Thrust",
            "prescription": "3x5-6"
          },
          {
            "name": "Rear-Foot Elevated Split Squat or Reverse Lunge",
            "prescription": "3x5/side"
          }
        ],
        "coachingNotes": [
          "Hip thrust stays powerful and clean, with a hard lockout and no lumbar overextension.",
          "The unilateral pattern supports sprint mechanics, force application, and change-of-direction robustness.",
          "In a `2x/week` format, the trap bar contrast remains the primary hinge exposure of the week, so keep Block 1 sharp before chasing more support volume here.",
          "This block should feel athletic and useful, not like a heavy bodybuilding lower day."
        ]
      },
      {
        "number": 3,
        "name": "Back Three Finisher",
        "format": "`EMOM 8'`",
        "exercises": [
          {
            "name": "Light Sled Push",
            "prescription": "15-20m",
            "slotLabel": "minute 1"
          },
          {
            "name": "Copenhagen Hold",
            "prescription": "15-20s/side",
            "slotLabel": "minute 2"
          }
        ],
        "coachingNotes": [
          "Sled load stays light enough to preserve speed and posture.",
          "Copenhagen should reinforce adductors, trunk control, and change-of-direction robustness without becoming a fatigue contest.",
          "If adductor load is already high that week, replace with `Pallof Hold` or `Side Plank`.",
          "If no sled is available, replace with `Suitcase Carry` `20m/side`."
        ]
      }
    ],
    "progressionRules": [
      "Prioritize movement speed and projection quality over load jumps.",
      "Trap bar can progress by `+2.5 to +5 kg` only if all sets stay sharp.",
      "Hip thrust and unilateral work progress gradually while keeping `RIR 2-3`.",
      "If weekly fatigue is high:",
      "reduce Block 3 first",
      "then reduce one round from Block 2",
      "keep Block 1 if the player is still moving explosively"
    ],
    "positionAccent": [
      "Common lower skeleton stays shared with the front-row lower session.",
      "Back-three accent comes from:",
      "slightly faster force profile",
      "more unilateral and posterior-chain emphasis",
      "lighter horizontal projection work",
      "less collision/bracing bias than front row"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "sled only if arm position is aggravating"
        ],
        "replaceWith": [
          "shorter sled distance",
          "`Suitcase Carry` only if tolerated"
        ],
        "rehabFinisher": [
          "none by default in this lower session unless symptoms require it"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "jump",
          "unilateral knee-dominant pattern if painful"
        ],
        "replaceWith": [
          "`Hip Thrust`",
          "reduced-range split squat or box-supported variation if tolerated"
        ],
        "rehabFinisher": [
          "light knee-control work if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Trap Bar Deadlift`",
          "`Hip Thrust`",
          "heavy sled if posture cannot stay clean"
        ],
        "replaceWith": [
          "`Glute Bridge`",
          "supported unilateral pattern",
          "lighter anti-rotation/trunk option"
        ],
        "rehabFinisher": [
          "breathing + trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the trap bar deadlift become slow survival work.",
      "Do not chase broad jump distance once take-off quality drops.",
      "Do not turn the hip thrust into lumbar hyperextension.",
      "Keep the sled fast enough to stay athletic.",
      "On match weeks, place this session early enough to recover fully before the weekend."
    ],
    "sourceReferences": [
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[positionPreferences.v1.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/positionPreferences.v1.ts)",
      "[lower.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/lower.png)",
      "[lower-4.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/lower-4.jpg)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_IN_SEASON_FRONT_ROW_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "in_season",
      "sessionType": "lower",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row",
      "equipment": "full_gym",
      "targetDuration": "42-52 min"
    },
    "title": "LOWER_IN_SEASON_FRONT_ROW_V1",
    "goal": [
      "Maintain lower-body force useful for scrum, contact, and short-force actions.",
      "Keep one clean lower-body force -> power exposure without creating excessive fatigue.",
      "Maintain posterior-chain strength and unilateral control.",
      "Finish with front-row trunk/carry/adductor work that supports collision robustness."
    ],
    "sessionIdentity": [
      "Rugby-specific through a readable lower contrast, strong hinge/bracing work, and a front-row finisher.",
      "Front-row specific through force expression, trunk stiffness, adductor robustness, and carry demand rather than speed bias.",
      "Do not dilute this session with too much plyometric volume or bodybuilding accessory work."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight squat",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own lower-body warm-up if it prepares ankles, hips, adductors, and trunk.",
        "Keep this short and specific.",
        "The goal is readiness, not volume."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Contrast Lower Force-Power",
        "format": "`4 rounds`, full rest `3 min` after each round",
        "exercises": [
          {
            "name": "Box Squat",
            "prescription": "4x3 @ 80-85%"
          },
          {
            "name": "Broad Jump",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "Box squat must stay fast and technically clean.",
          "No grinding reps.",
          "Broad jumps should be powerful and crisp, never sloppy.",
          "Use the box to standardize depth and reinforce force output from a stable position.",
          "This is a force -> projection contrast, not a fatigue block."
        ]
      },
      {
        "number": 2,
        "name": "Lower Strength Triplet",
        "format": "`3 rounds`, `90-120s` rest after the triplet",
        "exercises": [
          {
            "name": "Barbell Romanian Deadlift",
            "prescription": "3x5-6"
          },
          {
            "name": "Rear-Foot Elevated Split Squat or Reverse Lunge",
            "prescription": "3x5/side"
          },
          {
            "name": "Barbell Hip Thrust",
            "prescription": "3x6-8"
          }
        ],
        "coachingNotes": [
          "RDL stays strict, braced, and posterior-chain dominant.",
          "The unilateral pattern keeps hip and groin control without turning the session into a quad-volume day.",
          "Hip Thrust : ajouté pour équilibrer quad:ham (ratio 2.33 → 1.17). Transfer scrum direct pour front row (extension hanche lourde).",
          "This triplet should feel strong and useful, not draining — keep rest tight (90-120s) across the 3 exos."
        ]
      },
      {
        "number": 3,
        "name": "Front Row Finisher",
        "format": "`EMOM 8'`",
        "exercises": [
          {
            "name": "Sled Push",
            "prescription": "15-20m",
            "slotLabel": "minute 1"
          },
          {
            "name": "Copenhagen Plank",
            "prescription": "15-20s/side",
            "slotLabel": "minute 2"
          }
        ],
        "coachingNotes": [
          "Sled push reinforces horizontal force, bracing, and scrum-like projection without adding much eccentric fatigue.",
          "Copenhagen plank gives useful adductor/trunk exposure for scrum and collision demands.",
          "This block should feel robust, not exhaustive.",
          "If no sled is available, replace with `Zercher Carry` or `Farmer Carry` over `20m`."
        ]
      }
    ],
    "progressionRules": [
      "Prioritize bar speed and position quality over load jumps.",
      "Squat can progress by `+2.5 to +5 kg` only if all sets stay sharp.",
      "Box height should remain consistent before load is progressed.",
      "RDL and unilateral work progress gradually while keeping `RIR 2-3`.",
      "If weekly fatigue is high:",
      "reduce Block 3 first",
      "then reduce one round from Block 2",
      "keep Block 1 as the key quality exposure if the player is still fresh enough"
    ],
    "positionAccent": [
      "Common lower skeleton will stay shared with other positions.",
      "Front-row accent comes from:",
      "slightly higher force bias",
      "more trunk/bracing emphasis",
      "adductor/contact robustness",
      "less speed-reactive bias than back three"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "sled only if arm position or grip is aggravating"
        ],
        "replaceWith": [
          "shorter sled distance",
          "`Farmer Carry` only if tolerated"
        ],
        "rehabFinisher": [
          "none by default in this lower session unless symptoms require it"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Box Squat`",
          "unilateral knee-dominant pattern if painful"
        ],
        "replaceWith": [
          "`Hip Thrust`",
          "`RDL`",
          "box squat or reduced-range squat if tolerated"
        ],
        "rehabFinisher": [
          "light knee-control work if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Box Squat`",
          "`RDL`",
          "heavy sled or carry if posture cannot stay clean"
        ],
        "replaceWith": [
          "belt squat or supported squat variation if available",
          "hip thrust",
          "reduced-load unilateral pattern"
        ],
        "rehabFinisher": [
          "breathing + trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the box squat become slow survival work.",
      "Do not chase broad jump distance once take-off quality drops.",
      "Do not let the RDL become a low-back exercise.",
      "Keep the finisher specific and controlled.",
      "Sled push should stay crisp and powerful; if speed collapses, the load is too heavy.",
      "On match weeks, place this session early enough to recover fully before the weekend."
    ],
    "sourceReferences": [
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[positionPreferences.v1.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/positionPreferences.v1.ts)",
      "[lower.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/lower.png)",
      "[lower-4.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/lower-4.jpg)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "lower",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "50-60 min"
    },
    "title": "LOWER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1",
    "goal": [
      "Convert lower-body hypertrophy into explosive power with a back-three bias: horizontal projection, unilateral reactivity.",
      "Maintain a bilateral force anchor (trap bar) while shifting contrast work toward sprint-specific patterns.",
      "Bridge toward pre-season acceleration and change-of-direction demands."
    ],
    "sessionIdentity": [
      "This is a back-three force-bridge lower session.",
      "More pronounced differentiation than hypertrophy phase.",
      "Bilateral anchor stays. Contrast and support shift to unilateral reactive patterns."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight squat",
          "prescription": "1x8"
        },
        {
          "name": "2-3 progressive ramp-up sets on trap bar",
          "prescription": ""
        }
      ],
      "notes": [
        "Activation before heavy loading. Player should feel sharp."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Hinge Force + Horizontal Projection",
        "format": "`4 rounds`, `3-4 min` rest between rounds",
        "exercises": [
          {
            "name": "trap bar deadlift",
            "prescription": "4x3-4 @ 85-90%",
            "role": "prime"
          },
          {
            "name": "broad jump",
            "prescription": "4x3, max distance",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Bilateral anchor maintained. Heavy trap bar into horizontal projection.",
          "Broad jump: full hip extension, stick landing. Horizontal power expression for sprinting.",
          "This replaces the pin squat + squat jump of the front-row version."
        ],
        "fallbackOptions": [
          "A: `Back Squat` heavy + `Box Jump`"
        ]
      },
      {
        "number": 2,
        "name": "Unilateral Force + Reactive Contrast",
        "format": "`4 rounds`, `90-120s` rest after pair",
        "exercises": [
          {
            "name": "single-leg romanian deadlift",
            "prescription": "4x4/side"
          },
          {
            "name": "band-assisted split jump",
            "prescription": "4x3/side",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Unilateral hinge force paired with reactive single-leg jump.",
          "This is the main positional accent: sprint-specific unilateral power.",
          "Band assist allows explosive intent without excessive eccentric stress."
        ],
        "fallbackOptions": [
          "A: `Reverse Lunge` heavy + `Countermovement Jump`"
        ]
      },
      {
        "number": 3,
        "name": "Posterior Chain Support",
        "format": "`3 rounds`, `75-90s` rest",
        "exercises": [
          {
            "name": "nordic curl",
            "prescription": "3x4-5"
          },
          {
            "name": "copenhagen hold",
            "prescription": "2x20-30s/side"
          }
        ],
        "coachingNotes": [
          "Sprint-resilience: eccentric hamstring + groin robustness.",
          "Same structure as front-row version."
        ]
      },
      {
        "number": 4,
        "name": "Lower-Leg / Reactive Stiffness",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "single-leg calf raise",
            "prescription": "2x8/side"
          },
          {
            "name": "wall tibialis raise",
            "prescription": "2x12"
          },
          {
            "name": "low pogo hops",
            "prescription": "2x8"
          }
        ],
        "coachingNotes": [
          "Lower-leg stiffness and reactive quality for acceleration.",
          "Pogo hops: bouncy and quick, not forceful."
        ]
      }
    ],
    "progressionRules": [
      "`FB1`: establish contrast pairs at 85%.",
      "`FB2`: increase to 88-90% if broad jump distance is maintained.",
      "Reduce B4 first, B3 second. NEVER reduce B1-B2."
    ],
    "positionAccent": [
      "Back-three: horizontal projection in B1, unilateral reactive in B2, stiffness prep in B4."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [],
        "replaceWith": [],
        "rehabFinisher": []
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Broad Jump`",
          "`Band-Assisted Split Jump`"
        ],
        "replaceWith": [
          "`Box Jump` reduced height",
          "`Countermovement Jump` reduced range"
        ],
        "rehabFinisher": [
          "controlled pattern"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Trap Bar Deadlift`"
        ],
        "replaceWith": [
          "`Hip Thrust` heavy"
        ],
        "rehabFinisher": [
          "breathing work"
        ]
      }
    ],
    "coachingWarnings": [
      "This session should feel fast and reactive.",
      "Broad jump and split jump degrade quickly with fatigue — stop if quality drops.",
      "Bilateral anchor (trap bar) stays."
    ],
    "sourceReferences": [
      "[off-season-periodization.md] — Phase 4",
      "[strength-methods.md] — Complex Training",
      "[periodization.md] — Position demands §3.2"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_OFFSEASON_FORCE_BRIDGE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "lower",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "full_gym",
      "targetDuration": "50-60 min"
    },
    "title": "LOWER_OFFSEASON_FORCE_BRIDGE_V1",
    "goal": [
      "Convert off-season hypertrophy gains into maximal lower-body force and explosive power.",
      "Introduce complex training (heavy + ballistic contrast) to exploit post-activation potentiation.",
      "Prepare the neuromuscular system for pre-season power development."
    ],
    "sessionIdentity": [
      "This is a force-bridge session: heavy loads paired with explosive movements.",
      "NOT a hypertrophy day — volume is reduced, intensity and speed are the priority.",
      "NOT a pre-season power session — still building toward that threshold.",
      "Complex training structure: every heavy set is followed by an explosive contrast."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight squat",
          "prescription": "1x8"
        },
        {
          "name": "2-3 progressive ramp-up sets on pin squat",
          "prescription": ""
        }
      ],
      "notes": [
        "Ramp-up is critical before heavy loading — take 2-3 sets to reach working weight.",
        "Player should feel activated and sharp, not fatigued."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Squat Force + Explosive Contrast",
        "format": "`4 rounds`, `3-4 min` rest between rounds",
        "exercises": [
          {
            "name": "pin back squat",
            "prescription": "4x4-5 @ 85-90%",
            "role": "prime"
          },
          {
            "name": "squat jump",
            "prescription": "4x3-4, max intention",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Heavy squat first: dead-stop from pins, no bounce. RIR 1-2.",
          "Jump within 15-20s of unracking — exploit the PAP window.",
          "Jump height should feel noticeably better after the heavy set.",
          "If jump quality drops, reduce squat load before cutting jumps."
        ],
        "fallbackOptions": [
          "A: `Front Squat` if pin setup not available",
          "B: `Box Squat` as dead-stop alternative"
        ]
      },
      {
        "number": 2,
        "name": "Hinge Force + Dynamic Contrast",
        "format": "`4 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "trap bar deadlift",
            "prescription": "4x4-5 @ 80-85%"
          },
          {
            "name": "broad jump",
            "prescription": "4x3, max distance",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Trap bar allows a more upright pull with less low-back stress than conventional.",
          "Broad jump: full hip extension, stick the landing.",
          "This block bridges posterior chain strength to horizontal power expression."
        ],
        "fallbackOptions": [
          "A: `Barbell Romanian Deadlift` heavy (4x5) if no trap bar"
        ]
      },
      {
        "number": 3,
        "name": "Unilateral Strength + Posterior Support",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "rear-foot elevated split squat",
            "prescription": "3x5-6/side"
          },
          {
            "name": "nordic curl",
            "prescription": "3x4-5"
          }
        ],
        "coachingNotes": [
          "Unilateral work at force-grade reps (5-6), not hypertrophy (8+).",
          "Nordic curl: controlled eccentric, assist concentric if needed.",
          "These maintain structural balance without adding excessive fatigue."
        ],
        "fallbackOptions": [
          "A: `Reverse Lunge` barbell",
          "B: `Lying Leg Curl` 3x6-8"
        ]
      },
      {
        "number": 4,
        "name": "Lower-Leg / Groin Prevention",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "copenhagen hold",
            "prescription": "2x20-30s/side"
          },
          {
            "name": "seated calf raise",
            "prescription": "2x10-12"
          },
          {
            "name": "wall tibialis raise",
            "prescription": "2x12"
          }
        ],
        "coachingNotes": [
          "Prevention work stays consistent across all off-season phases.",
          "Keep this efficient — don't turn it into extra training volume."
        ]
      }
    ],
    "progressionRules": [
      "`FB1` (week 9): establish tolerance to contrast pairs; keep main lifts at 85%.",
      "`FB2` (week 10): increase intensity to 88-90% if jump explosiveness is maintained.",
      "Reduce Block 4 first if fatigue accumulates.",
      "Reduce Block 3 volume second (drop to 2 rounds).",
      "NEVER reduce Blocks 1-2 — the contrast pairs ARE the session."
    ],
    "positionAccent": [
      "Session is common for both groups.",
      "`Front_row`: slightly more bracing intent on squat and trap bar; patient setup.",
      "`Back_three`: slightly more emphasis on jump height/distance quality."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "bar position only if `Pin Squat` setup aggravates"
        ],
        "replaceWith": [
          "`Front Squat`"
        ],
        "rehabFinisher": [
          "`band external rotation`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Pin Back Squat` if painful",
          "`Squat Jump`"
        ],
        "replaceWith": [
          "`Box Squat` to pain-free depth",
          "`Countermovement Jump` reduced range"
        ],
        "rehabFinisher": [
          "controlled knee-friendly pattern"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Trap Bar Deadlift` if bracing fails"
        ],
        "replaceWith": [
          "`Hip Thrust` heavy (4x5)"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "This session should feel FAST and SHARP, not grinding.",
      "Total volume is intentionally lower than hypertrophy — do not add sets.",
      "Ballistic movements degrade with fatigue. Stop if explosiveness drops >20%.",
      "The contrast pairs are the entire driver. Protect them."
    ],
    "sourceReferences": [
      "[off-season-periodization.md] — Phase 4 Force-Power conversion (§6)",
      "[strength-methods.md] — Complex Training, ME/DE methods",
      "[periodization.md] — Effect residual, Force→Power transition"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "lower",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "55-70 min"
    },
    "title": "LOWER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1",
    "goal": [
      "Rebuild lower-body muscle mass with a back-three bias: unilateral patterns, sprint-resilience, and lower-leg stiffness.",
      "Maintain a bilateral squat anchor for absolute force while shifting accessory work toward single-leg and reactive qualities.",
      "Prepare posterior chain and ankle complex for pre-season acceleration demands."
    ],
    "sessionIdentity": [
      "This is a back-three off-season hypertrophy lower session.",
      "Bilateral squat anchor stays — but the accent shifts to unilateral hinge, single-leg stability, and lower-leg tissue quality.",
      "Do not remove the squat; do not turn this into a rehab session. It is hypertrophy with a positional lens."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight split squat",
          "prescription": "1x6/side"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Same warm-up structure as front-row version.",
        "Player should feel ready for volume, not already fatigued."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Squat Hypertrophy",
        "format": "`4 work sets`, `2 min` rest between sets",
        "exercises": [
          {
            "name": "back squat",
            "prescription": "4x8-10"
          }
        ],
        "coachingNotes": [
          "Bilateral anchor preserved. RPE 6-8.",
          "Depth and control matter more than load."
        ],
        "fallbackOptions": [
          "A: `Front Squat`",
          "B: `Hack Squat`"
        ]
      },
      {
        "number": 2,
        "name": "Unilateral Hinge / Quad Pair",
        "format": "`4 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "single-leg romanian deadlift",
            "prescription": "4x8-10/side"
          },
          {
            "name": "reverse lunge",
            "prescription": "3-4x8-10/side"
          }
        ],
        "coachingNotes": [
          "This is the main positional accent block.",
          "Single-leg RDL builds unilateral posterior chain — key for sprint acceleration.",
          "Reverse lunge develops single-leg quad strength with deceleration control.",
          "Keep both exercises full-range and stable."
        ],
        "fallbackOptions": [
          "A: `DB Romanian Deadlift` bilateral if balance is an issue",
          "B: `Split Squat`"
        ]
      },
      {
        "number": 3,
        "name": "Posterior Chain / Groin Support",
        "format": "`3 rounds`, `60-75s` rest after the pair",
        "exercises": [
          {
            "name": "nordic curl",
            "prescription": "3x4-5"
          },
          {
            "name": "copenhagen hold",
            "prescription": "2-3x20-30s/side"
          }
        ],
        "coachingNotes": [
          "Nordic curl for sprint-resilience: eccentric hamstring strength protects against high-speed running injuries.",
          "Copenhagen for groin robustness.",
          "This block replaces the lying leg curl of the front-row version."
        ],
        "fallbackOptions": [
          "A: `Lying Leg Curl` 3x8 if nordic too demanding"
        ]
      },
      {
        "number": 4,
        "name": "Lower-Leg / Stiffness Prep",
        "format": "`2 rounds`, minimal rest",
        "exercises": [
          {
            "name": "single-leg calf raise",
            "prescription": "2-3x10-12/side"
          },
          {
            "name": "wall tibialis raise",
            "prescription": "2-3x12-15"
          },
          {
            "name": "low pogo hops",
            "prescription": "2x8"
          }
        ],
        "coachingNotes": [
          "Single-leg calf for ankle stiffness and unilateral balance.",
          "Low pogo hops introduce very low-level reactive stiffness — preparation for pre-season plyometrics.",
          "Keep pogo hops light and bouncy, not forceful."
        ]
      }
    ],
    "progressionRules": [
      "`Semaine 1`: establish clean volume tolerance on all exercises.",
      "`Semaine 2`: increase load if recovery is good; keep nordic at 4-5 reps.",
      "`Semaine 3`: highest volume week; allow RPE 7-8 on main lifts.",
      "`Semaine 4 (décharge)`: reduce volume -25-30% while keeping load. Reduce Block 4 first, Block 3 second."
    ],
    "positionAccent": [
      "Back-three session: unilateral emphasis in Block 2, sprint-resilience in Block 3, stiffness prep in Block 4.",
      "The squat anchor remains bilateral and identical to front-row."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "bar position only if `Back Squat` setup aggravates"
        ],
        "replaceWith": [
          "`Front Squat`"
        ],
        "rehabFinisher": [
          "`band external rotation`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Back Squat`",
          "`Reverse Lunge`"
        ],
        "replaceWith": [
          "`Box Squat` light-moderate",
          "`Hip Thrust` 3x8"
        ],
        "rehabFinisher": [
          "controlled knee-friendly pattern"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Single-Leg Romanian Deadlift` if bracing fails"
        ],
        "replaceWith": [
          "`DB Romanian Deadlift` bilateral"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not remove the bilateral squat — it is the force anchor.",
      "Unilateral work should feel stable and full-range, not rushed.",
      "Nordic curl is demanding; assist the concentric if needed."
    ],
    "sourceReferences": [
      "[off-season-periodization.md]",
      "[periodization.md] — Position demands §3.2",
      "[injury-prevention.md]"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_OFFSEASON_HYPERTROPHY_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "lower",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (common base with light accents)",
      "equipment": "full_gym",
      "targetDuration": "55-70 min"
    },
    "title": "LOWER_OFFSEASON_HYPERTROPHY_V1",
    "goal": [
      "Rebuild useful lower-body muscle mass during the main off-season hypertrophy block.",
      "Accumulate meaningful squat, hinge, unilateral, and lower-leg/groin volume without drifting into junk fatigue.",
      "Give the player a clear sense of constructive off-season training while preserving rugby relevance."
    ],
    "sessionIdentity": [
      "This is an off-season hypertrophy lower session, not a transition session and not a pre-season force day.",
      "Rugby-specific through useful muscle-building on squat, hinge, unilateral support, groin, and lower-leg tissues.",
      "Do not turn this into a bodybuilding leg day with random machine fluff or soreness-chasing for its own sake."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight split squat",
          "prescription": "1x6/side"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this practical and short.",
        "The player should feel ready for volume, not already fatigued.",
        "If they already have a good lower warm-up, they can keep it."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Squat Hypertrophy",
        "format": "`4 work sets`, `2 min` rest between sets",
        "exercises": [
          {
            "name": "Back Squat",
            "prescription": "4x8-10"
          }
        ],
        "coachingNotes": [
          "Keep the squat around `RPE 6-8` across the block.",
          "The goal is productive lower-body volume, not grinding or ego loading.",
          "Depth and control matter more than absolute load."
        ],
        "fallbackOptions": [
          "A: `Front Squat`",
          "B: `Hack Squat`"
        ]
      },
      {
        "number": 2,
        "name": "Main Hinge / Unilateral Pair",
        "format": "`4 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Barbell Romanian Deadlift",
            "prescription": "4x8-10"
          },
          {
            "name": "Rear-Foot Elevated Split Squat",
            "prescription": "3-4x8-10/side"
          }
        ],
        "coachingNotes": [
          "This is the main structural block of the session.",
          "The hinge should build posterior chain mass without turning into a max-strength pull.",
          "The unilateral work should feel stable and full-range, not rushed."
        ],
        "fallbackOptions": [
          "A: `DB Romanian Deadlift`",
          "B: `Reverse Lunge`"
        ]
      },
      {
        "number": 3,
        "name": "Posterior Chain / Groin Support",
        "format": "`3 rounds`, `60-75s` rest after the pair",
        "exercises": [
          {
            "name": "Lying Leg Curl",
            "prescription": "3x10-12"
          },
          {
            "name": "Copenhagen Hold",
            "prescription": "2-3x20-30s/side"
          }
        ],
        "coachingNotes": [
          "This block supports hamstring mass and adductor robustness.",
          "Leg curl should stay controlled and honest.",
          "Copenhagen is introduced here as a true progression from the earlier recovery/transition blocks."
        ],
        "fallbackOptions": [
          "A: `Seated Leg Curl`",
          "B: `Supine Adductor Squeeze`"
        ]
      },
      {
        "number": 4,
        "name": "Lower-Leg / Optional Reward",
        "format": "",
        "exercises": [
          {
            "name": "Seated Calf Raise",
            "prescription": "2-3x10-12"
          },
          {
            "name": "Wall Tibialis Raise",
            "prescription": "2-3x12-15"
          },
          {
            "name": "Leg Extension",
            "prescription": "2x12-15"
          },
          {
            "name": "Leg Press Calf Press",
            "prescription": "2x12-15"
          }
        ],
        "coachingNotes": [
          "`Calf + Tibialis` is the default tissue-support pair.",
          "`Leg Extension + Calf Press` is optional and functions as a controlled reward block if recovery is good.",
          "Keep the optional pair short of failure and avoid carrying soreness into the rest of the week."
        ]
      }
    ],
    "progressionRules": [
      "`Semaine 1`: start at the lower end of the load range and establish clean volume tolerance.",
      "`Semaine 2`: increase load only if recovery is good while keeping unilateral work at `3 sets`.",
      "`Semaine 3`: this is the highest volume week; keep quality but allow hard sets with `1-2 RIR`.",
      "`Semaine 3`: progress unilateral work to `4 sets` only if recovery supports it.",
      "`Semaine 4 (décharge)`: reduce total volume around `-25 to -30%` while keeping useful load.",
      "Reduce optional Pair 2 of Block 4 first if fatigue rises.",
      "Reduce one round from Block 3 second.",
      "Keep Blocks 1 and 2 as the structural priorities of the session."
    ],
    "positionAccent": [
      "This session is still mostly common.",
      "`Front_row` accent:",
      "slightly more bracing intent on squat and RDL",
      "slightly more patience and control on unilateral work",
      "`Back_three` accent:",
      "slightly more fluid range and posture on unilateral work",
      "slightly more emphasis on lower-leg quality in Block 4",
      "The skeleton remains identical for both groups."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "bar position only if `Back Squat` setup is aggravating"
        ],
        "replaceWith": [
          "`Front Squat`",
          "`Hack Squat`"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Back Squat`",
          "`Rear-Foot Elevated Split Squat`",
          "`Leg Extension` if aggravating"
        ],
        "replaceWith": [
          "`Box Squat` light-moderate",
          "`Reverse Lunge` reduced range",
          "skip optional Pair 2 if needed"
        ],
        "rehabFinisher": [
          "controlled knee-friendly squat pattern",
          "light terminal knee extension if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Barbell Romanian Deadlift`",
          "`Back Squat` only if bracing cannot stay clean"
        ],
        "replaceWith": [
          "`DB Romanian Deadlift`",
          "`Hack Squat`"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "This session should feel constructive, not brutal.",
      "Do not let squat and RDL both become grindy on the same day.",
      "Do not turn the support blocks into mindless pump volume.",
      "The optional reward pair is there for adherence, not to justify junk fatigue."
    ],
    "sourceReferences": [
      "[tech-spec-off-season-rugbyprep-2026-03-20.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-off-season-rugbyprep-2026-03-20.md)",
      "[WEEKLY_TEMPLATES_OFF_SEASON.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/WEEKLY_TEMPLATES_OFF_SEASON.md)",
      "[LOWER_OFFSEASON_TRANSITION_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/LOWER_OFFSEASON_TRANSITION_V1.md)",
      "[LOWER_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/LOWER_PRESEASON_FORCE_V1.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_OFFSEASON_TRANSITION_V1",
      "status": "draft",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "lower",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "full_gym",
      "targetDuration": "40-50 min"
    },
    "title": "LOWER_OFFSEASON_TRANSITION_V1",
    "goal": [
      "Rebuild lower-body training structure after the recovery block without jumping too fast into true development work.",
      "Restore squat, hinge, unilateral support, and simple groin/trunk robustness under moderate load.",
      "Keep lower-leg tissue continuity from the recovery phase while reintroducing real lower-body training structure.",
      "Give the player a session that feels like training again, but still clearly below hypertrophy and pre-season intensity."
    ],
    "sessionIdentity": [
      "This is a transition lower session, not a recovery session anymore and not yet a heavy off-season build.",
      "Rugby-specific through useful lower-body patterns, adductor support, trunk control, and lower-leg tissue continuity.",
      "Do not turn this into a force day, a power day, or a long accumulation session."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight split squat",
          "prescription": "1x6/side"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this short and practical.",
        "The player should feel prepared for moderate training, not warmed up like a max-effort day.",
        "If they already have a reliable lower warm-up, they can keep it."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Squat / Hinge Base Pair",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Front Squat",
            "prescription": "3x6-8"
          },
          {
            "name": "Barbell Romanian Deadlift",
            "prescription": "3x6-8"
          }
        ],
        "coachingNotes": [
          "Keep both lifts around `RPE 5-6`.",
          "This is the first real reintroduction of bilateral lower loading after Recovery.",
          "Squat stays upright and technically clean.",
          "The hinge should feel solid, not heavy."
        ],
        "fallbackOptions": [
          "A: `Goblet Squat`",
          "B: `DB Romanian Deadlift`"
        ]
      },
      {
        "number": 2,
        "name": "Unilateral Support Pair",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Reverse Lunge",
            "prescription": "3x6-8/side"
          },
          {
            "name": "Single-Leg RDL",
            "prescription": "3x6-8/side"
          }
        ],
        "coachingNotes": [
          "This block restores unilateral rhythm, balance, and hip control.",
          "Keep both exercises smooth and symmetrical.",
          "This is support work, not a fatigue challenge."
        ],
        "fallbackOptions": [
          "A: `Split Squat`",
          "B: `Kickstand RDL`"
        ]
      },
      {
        "number": 3,
        "name": "Groin / Trunk / Lower-Leg Support",
        "format": "",
        "exercises": [
          {
            "name": "Side Plank",
            "prescription": "2x20-30s/side"
          },
          {
            "name": "Supine Adductor Squeeze",
            "prescription": "2x20s"
          },
          {
            "name": "Single-Leg Calf Raise",
            "prescription": "2x10-12/side"
          },
          {
            "name": "Wall Tibialis Raise",
            "prescription": "2x12-15"
          }
        ],
        "coachingNotes": [
          "This block reintroduces trunk stiffness, groin tolerance, and lower-leg support without jumping to a harder Copenhagen yet.",
          "Keep the holds clean and submaximal.",
          "Run `Side Plank + Adductor Squeeze` first, then `Calf Raise + Tibialis Raise`.",
          "The player should finish this block feeling stable and put back together, not smoked."
        ]
      }
    ],
    "progressionRules": [
      "`S3`: use moderate reference loads and keep all reps clean.",
      "`S4`: add a small load increase only if both main lifts still move comfortably and posture stays clean.",
      "Progress load second; progress rhythm and tolerance first.",
      "If fatigue is high, reduce one round from Block 2 before cutting Block 1.",
      "This session should still sit clearly below hypertrophy volume."
    ],
    "positionAccent": [
      "This session is still largely common in Transition.",
      "`Front_row` accent:",
      "slightly more bracing intent on front squat and RDL",
      "slightly more controlled tempo on unilateral work",
      "`Back_three` accent:",
      "slightly more fluid intent on unilateral work",
      "slightly more attention to balance and hip quality",
      "The skeleton remains identical for both groups."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Front Squat` only if front-rack position is provocative"
        ],
        "replaceWith": [
          "`Goblet Squat`",
          "or `Safety Bar Squat` if available"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Front Squat`",
          "`Reverse Lunge` if depth is aggravating"
        ],
        "replaceWith": [
          "`Box Squat` light and controlled",
          "`Split Squat` reduced range"
        ],
        "rehabFinisher": [
          "controlled knee-friendly squat pattern",
          "light terminal knee extension if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Barbell Romanian Deadlift`",
          "`Single-Leg RDL` if trunk position is not tolerated"
        ],
        "replaceWith": [
          "`DB Romanian Deadlift`",
          "`Glute Bridge`"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "This session should feel like a rebuild, not a test.",
      "Do not let the front squat become a strength statement.",
      "Do not let the unilateral block turn into balance fatigue circus.",
      "If the player is still very beat up from the season, stay closer to Recovery than to Hypertrophy."
    ],
    "sourceReferences": [
      "[tech-spec-off-season-rugbyprep-2026-03-20.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-off-season-rugbyprep-2026-03-20.md)",
      "[WEEKLY_TEMPLATES_OFF_SEASON.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/WEEKLY_TEMPLATES_OFF_SEASON.md)",
      "[FULL_OFFSEASON_RECOVERY_A_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/FULL_OFFSEASON_RECOVERY_A_V1.md)",
      "[FULL_OFFSEASON_RECOVERY_B_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/FULL_OFFSEASON_RECOVERY_B_V1.md)",
      "[LOWER_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/LOWER_PRESEASON_FORCE_V1.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_PRESEASON_FORCE_POWER_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "lower",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (phase 2 common base with marked accents)",
      "equipment": "full_gym",
      "targetDuration": "50-55 min"
    },
    "title": "LOWER_PRESEASON_FORCE_POWER_V1",
    "goal": [
      "Begin converting lower-body force into rugby-usable power during weeks 5 to 8 of pre-season.",
      "Keep one clean contrast pair as the main session driver.",
      "Maintain hinge and unilateral strength while slightly reducing total volume compared with Phase 1."
    ],
    "sessionIdentity": [
      "This is a force-power lower session, not yet a pure power session.",
      "Rugby-specific through a readable lower contrast, strong posterior-chain work, and a simple position support block.",
      "Do not overload this session with multiple jump pairings or random explosive extras."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "low pogo hops",
          "prescription": "1x10"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "2-3 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own lower-body warm-up if it prepares ankles, hips, adductors, and trunk.",
        "Keep this short and specific.",
        "The goal is readiness and stiffness, not fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Contrast Lower Force-Projection",
        "format": "`4 rounds`, full rest `3 min` after each round",
        "exercises": [
          {
            "name": "Pin Back Squat",
            "prescription": "4x3 @ 82-85%"
          },
          {
            "name": "Broad Jump",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "Pins keep the squat honest and reinforce concentric force from a stable position.",
          "Broad jumps must stay sharp and crisp; stop chasing distance once quality drops.",
          "This is the major change from Phase 1: the force exposure is now immediately converted into projection.",
          "Keep it readable: one heavy lift, one jump, no extra layer."
        ]
      },
      {
        "number": 2,
        "name": "Lower Strength Triplet",
        "format": "`3 rounds`, `90-120s` rest after the triplet",
        "exercises": [
          {
            "name": "Barbell Romanian Deadlift",
            "prescription": "3x5"
          },
          {
            "name": "Rear-Foot Elevated Split Squat or Reverse Lunge",
            "prescription": "3x5/side"
          },
          {
            "name": "Nordic Curl",
            "prescription": "3x4-5"
          }
        ],
        "coachingNotes": [
          "RDL stays strict, braced, and posterior-chain dominant.",
          "The unilateral lift should still support hip and groin control, not become a quad-burner.",
          "Nordic Curl : ajouté pour équilibrer quad:ham (ratio 2.33 → 1.17). Eccentric gold-standard prévention ischio (Askling 2003/2013, -70% blessures saison rugby).",
          "Pré-saison = moment idéal pour bâtir l'excentrique avant matchs. Partner-assisted ou sliders si no partner."
        ]
      },
      {
        "number": 3,
        "name": "Position Support Finisher",
        "format": "`2-3 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Sled Push",
            "prescription": "15-20m"
          },
          {
            "name": "Copenhagen Hold",
            "prescription": "15-20s/side"
          }
        ],
        "coachingNotes": [
          "Front row can go slightly heavier and more braced on the sled.",
          "Back three should use a slightly lighter, faster, cleaner sled profile.",
          "Copenhagen stays controlled and useful.",
          "This block should support transfer, not bury the player."
        ]
      }
    ],
    "progressionRules": [
      "`W5`: establish clean contrast rhythm and reference loads.",
      "`W6`: add `+2.5 to +5 kg` on the squat only if bar speed and jump quality stay high.",
      "`W7`: keep load progression if earned, or add one round to Block 3 if recovery is good.",
      "`W8`: deload by reducing total volume around `-30%` while keeping movement quality high.",
      "Reduce Block 3 first if fatigue rises.",
      "Reduce one round from Block 2 second.",
      "Keep Block 1 as the protected priority if the player is still moving explosively."
    ],
    "positionAccent": [
      "This session is still shared in Phase 2, but the accents are now more visible.",
      "Front row accent:",
      "slightly more force/bracing intent on the squat",
      "sled slightly heavier",
      "broad jump can later shift toward a more vertical expression if needed",
      "Back three accent:",
      "broad jump stays the default expression",
      "sled stays lighter and more athletic",
      "slightly more emphasis on stiffness and projection quality",
      "The skeleton stays shared, but the feeling of the session should no longer be identical by position."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "sled only if arm position or grip is aggravating"
        ],
        "replaceWith": [
          "shorter sled distance",
          "`Farmer Carry` or `Suitcase Carry` only if tolerated"
        ],
        "rehabFinisher": [
          "none by default in this lower session unless symptoms require it"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Pin Back Squat`",
          "`Broad Jump`",
          "unilateral knee-dominant pattern if painful"
        ],
        "replaceWith": [
          "`Barbell Hip Thrust`",
          "reduced-range squat if tolerated",
          "reduced-range split squat if tolerated"
        ],
        "rehabFinisher": [
          "light knee-control work if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Pin Back Squat`",
          "`Barbell Romanian Deadlift`",
          "heavy sled if posture cannot stay clean"
        ],
        "replaceWith": [
          "supported squat pattern or `Leg Press`",
          "`Barbell Hip Thrust`",
          "lighter trunk/groin support block"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the pin squat become slow survival work.",
      "Do not chase broad jump distance once take-off quality clearly drops.",
      "Do not turn the support block into a conditioning finisher.",
      "This session should feel more explosive than Phase 1, but still structured and absorbable.",
      "It should bridge clearly toward the later power phase without trying to become it already."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[LOWER_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/LOWER_PRESEASON_FORCE_V1.md)",
      "[LOWER_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/LOWER_IN_SEASON_FRONT_ROW_V1.md)",
      "[LOWER_IN_SEASON_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/LOWER_IN_SEASON_BACK_THREE_V1.md)",
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[lower.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/lower.png)",
      "[lower-4.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/lower-4.jpg)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_PRESEASON_FORCE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "lower",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (phase 1 common base)",
      "equipment": "full_gym",
      "targetDuration": "50-60 min"
    },
    "title": "LOWER_PRESEASON_FORCE_V1",
    "goal": [
      "Build lower-body force capacity for the first 4 weeks of pre-season.",
      "Reinforce squat, hinge, unilateral support, and posterior-chain qualities without rushing into power work.",
      "Keep the session rugby-specific through useful support work for groin, trunk, and contact readiness."
    ],
    "sessionIdentity": [
      "This is a construction session, not a primer and not yet a true force-power session.",
      "Rugby-specific through heavy lower fundamentals, unilateral support, hamstring work, and a simple position finisher.",
      "Do not dilute this session with excessive jumps, fancy contrast work, or bodybuilding fluff."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "split squat isometric hold",
          "prescription": "1x15-20s/side"
        },
        {
          "name": "2-3 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own lower-body warm-up if it prepares ankles, hips, adductors, and trunk.",
        "Keep this short and useful.",
        "The goal is readiness for force production, not early fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Lower Force",
        "format": "`4 work sets`, `2-3 min` rest between sets",
        "exercises": [
          {
            "name": "Pin Back Squat",
            "prescription": "4x4-5"
          }
        ],
        "coachingNotes": [
          "This block is the anchor of the session.",
          "Reps must stay technically clean with `RIR 1-2`.",
          "No grinding, no collapse at the bottom, no rushed descent.",
          "Pins should reinforce a strong concentric start and a stable bottom position.",
          "The goal is force construction, not testing."
        ]
      },
      {
        "number": 2,
        "name": "Hinge + Unilateral Strength Pair",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Barbell Romanian Deadlift",
            "prescription": "3x5-6"
          },
          {
            "name": "Rear-Foot Elevated Split Squat or Reverse Lunge",
            "prescription": "3x6/side"
          }
        ],
        "coachingNotes": [
          "RDL stays strict and posterior-chain dominant.",
          "The unilateral lift should support hip and groin control, not become a conditioning block.",
          "This pair should feel strong and constructive, not draining."
        ]
      },
      {
        "number": 3,
        "name": "Posterior Chain / Lower Leg Support",
        "format": "`2-3 rounds`, `60-90s` rest",
        "exercises": [
          {
            "name": "Nordic Curl",
            "prescription": "2-3x4-5"
          },
          {
            "name": "Seated Calf Raise",
            "prescription": "3x10-12"
          },
          {
            "name": "Tibialis Raise",
            "prescription": "2-3x10-12"
          }
        ],
        "coachingNotes": [
          "Nordic volume stays low enough to preserve hamstring quality across the week.",
          "Calf and tibialis work support lower-leg resilience before speed and power volumes rise later in pre-season.",
          "Keep the intent supportive, not maximal."
        ]
      },
      {
        "number": 4,
        "name": "Position Support Finisher",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Copenhagen Hold",
            "prescription": "20-30s/side"
          },
          {
            "name": "Farmer Carry",
            "prescription": "20m"
          }
        ],
        "coachingNotes": [
          "Copenhagen work supports adductors, trunk control, and change-of-direction tolerance.",
          "Farmer carry keeps the finisher simple and rugby-useful without making this a separate conditioning session.",
          "Front row can go slightly heavier and more braced.",
          "Back three can go slightly lighter, cleaner, and more athletic."
        ]
      }
    ],
    "progressionRules": [
      "`W1`: establish clean reference loads.",
      "`W2`: add `+2.5 to +5 kg` on squat and hinge only if all reps stay clean.",
      "`W3`: keep load progression if earned, or add one round to Block 3 if recovery is good.",
      "`W4`: deload by reducing total volume around `-30%` while keeping movement quality high.",
      "Reduce Block 4 first if fatigue rises.",
      "Reduce one round from Block 3 second.",
      "Keep Block 1 as the protected priority unless the athlete is clearly under-recovered."
    ],
    "positionAccent": [
      "This session is intentionally common in Phase 1.",
      "Front row accent:",
      "slightly more force/bracing intent on the squat",
      "slightly heavier carry",
      "less emphasis on speed qualities for now",
      "Back three accent:",
      "slightly more stiffness and lower-leg quality",
      "cleaner, more athletic intent on the carry",
      "more attention to unilateral control and posterior-chain quality",
      "The skeleton stays the same for both groups at this stage."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Pin Back Squat` only if rack position is aggravating",
          "`Farmer Carry` only if grip or shoulder position is aggravating"
        ],
        "replaceWith": [
          "`Front Squat` or `Machine Hack Squat / Leg Press`",
          "`Sled Push` if carry is not tolerated"
        ],
        "rehabFinisher": [
          "none by default in this lower session unless symptoms require a small shoulder-health add-on"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Pin Back Squat`",
          "knee-dominant unilateral pattern if painful",
          "`Copenhagen Hold` only if it clearly aggravates symptoms"
        ],
        "replaceWith": [
          "`Barbell Hip Thrust`",
          "`RDL`",
          "reduced-range split squat if tolerated"
        ],
        "rehabFinisher": [
          "light terminal knee extension or controlled split-squat isometric if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Pin Back Squat`",
          "`Barbell Romanian Deadlift`",
          "heavy `Farmer Carry`"
        ],
        "replaceWith": [
          "`Leg Press` or supported squat pattern",
          "`Barbell Hip Thrust`",
          "reduced-load unilateral pattern"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the pin squat become a max-effort grind in Phase 1.",
      "Do not turn the unilateral work into a balance circus.",
      "Do not overload Nordics just because they are \"useful\".",
      "Keep this session force-focused and absorbable inside a full pre-season week.",
      "This session should feel like quality construction, not like surviving a brutal lower day."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[LOWER_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/LOWER_IN_SEASON_FRONT_ROW_V1.md)",
      "[LOWER_IN_SEASON_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/LOWER_IN_SEASON_BACK_THREE_V1.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[lower-3.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/lower-3.jpg)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)",
      "[lower.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/lower.png)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_PRESEASON_POWER_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "lower",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "46-56 min"
    },
    "title": "LOWER_PRESEASON_POWER_BACK_THREE_V1",
    "goal": [
      "Express lower-body power specific to back-three demands during weeks 9 to 12 of pre-season.",
      "Use a speed-biased power cluster that links force, projection, and unilateral reactivity.",
      "Maintain enough posterior-chain and hamstring strength to support sprint exposure without flattening the player."
    ],
    "sessionIdentity": [
      "This is a back-three power session, not just a generic lower power day.",
      "Rugby-specific through a trap-bar-led power cluster, strong projection bias, unilateral support, and lower-leg/hamstring work that supports sprint output.",
      "This session should feel faster, springier, and more open-field oriented than the front-row version.",
      "Do not dilute this session with random heavy support work, too many jumps, or conditioning volume."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "low pogo hops",
          "prescription": "1x10"
        },
        {
          "name": "single-leg glute bridge",
          "prescription": "1x6/side"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own lower-body warm-up if it prepares ankles, hips, hamstrings, and posterior chain.",
        "Keep it short and specific.",
        "The goal is readiness, stiffness, and projection, not fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Back Three Power Cluster",
        "format": "`4 rounds`, `10-15s` between exercises, full rest `3-4 min` after each round",
        "exercises": [
          {
            "name": "Trap Bar Deadlift",
            "prescription": "4x2-3 @ 80-85%"
          },
          {
            "name": "Broad Jump",
            "prescription": "3 reps"
          },
          {
            "name": "Band-Assisted Split Jump",
            "prescription": "2-3/side"
          }
        ],
        "coachingNotes": [
          "Trap bar reps must stay sharp and technically clean.",
          "No grinding reps.",
          "Broad jumps should stay crisp and projective, not chased once quality drops.",
          "Split jumps must stay fast, elastic, and well organised through the trunk.",
          "The cluster should feel quicker and more reactive than the front-row version.",
          "Optional premium progression:",
          "add `Sprint 10m` after Exercise C only if space, surface, and weekly sprint load make it realistic"
        ],
        "fallbackOptions": [
          "C: `Split Jump`",
          "C: `Single-Leg Bound`"
        ]
      },
      {
        "number": 2,
        "name": "Posterior Chain Force Maintenance",
        "format": "`3 rounds`, `90-120s` rest",
        "exercises": [
          {
            "name": "Single-Leg Romanian Deadlift",
            "prescription": "3x5/side"
          }
        ],
        "coachingNotes": [
          "Keep the load moderate enough that pelvis control and hinge quality stay clean.",
          "Do not turn this into a balance circus or a max-force exercise.",
          "The goal is posterior-chain support, asymmetry control, and unilateral force application, not fatigue."
        ],
        "fallbackOptions": [
          "`Barbell Romanian Deadlift`",
          "`DB Romanian Deadlift`"
        ]
      },
      {
        "number": 3,
        "name": "Hamstring / Lower-Leg Micro-Dose",
        "format": "`2 rounds`, `60-75s` rest",
        "exercises": [
          {
            "name": "Nordic Curl",
            "prescription": "2x3-4"
          },
          {
            "name": "Seated Calf Raise",
            "prescription": "2x8-10"
          },
          {
            "name": "Tibialis Raise",
            "prescription": "2x10-12"
          }
        ],
        "coachingNotes": [
          "This is a low-volume insurance block for sprint resilience and ankle stiffness.",
          "Stop the Nordics before reps become ugly or cramp-prone.",
          "Lower-leg work should feel useful, not like a bodybuilding detour."
        ]
      },
      {
        "number": 4,
        "name": "Athletic Finisher",
        "format": "`EMOM 9'`",
        "exercises": [
          {
            "name": "Light Sled Push",
            "prescription": "15-20m",
            "slotLabel": "minute 1"
          },
          {
            "name": "Copenhagen Hold",
            "prescription": "15-20s/side",
            "slotLabel": "minute 2"
          },
          {
            "name": "Med Ball Rotational Throw",
            "prescription": "3-4/side",
            "slotLabel": "minute 3"
          }
        ],
        "coachingNotes": [
          "Sled load stays light enough to preserve speed and posture.",
          "Copenhagen work supports adductors, trunk control, and change-of-direction tolerance.",
          "The rotational throw should stay sharp and athletic, not become a fatigue drill.",
          "If no sled is available, replace with `Suitcase Carry` `20m/side`.",
          "If no med ball is available, replace with `Cable Rotation` or `Cable Chop explosif` `3x5-6/side`."
        ]
      }
    ],
    "progressionRules": [
      "`W9`: establish clean power rhythm and reference loads.",
      "`W10`: add `+2.5 to +5 kg` on the trap bar only if all sets stay sharp and jump quality remains high.",
      "`W11`: maintain load and improve speed of execution rather than forcing more weight.",
      "`W12`: reduce volume around `-30%` while preserving speed and sharpness.",
      "Reduce Block 4 first if fatigue rises.",
      "Reduce one round from Block 3 second.",
      "Reduce Block 2 last.",
      "Keep Block 1 as the protected priority if the player is still moving explosively."
    ],
    "positionAccent": [
      "This session is explicitly back-three specific.",
      "Back-three identity comes from:",
      "trap-bar-led power rather than squat-led bracing",
      "stronger projection and unilateral-reactive bias",
      "lower-leg and hamstring support that directly feed sprint and acceleration demands",
      "rotational and open-field power expression rather than collision-first bracing",
      "less collision/bracing emphasis than the front-row version"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "sled only if arm position is aggravating"
        ],
        "replaceWith": [
          "shorter sled distance",
          "`Suitcase Carry` only if tolerated"
        ],
        "rehabFinisher": [
          "none by default in this lower session unless symptoms require it"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Broad Jump`",
          "`Band-Assisted Split Jump`",
          "unilateral pattern if painful"
        ],
        "replaceWith": [
          "`Barbell Hip Thrust`",
          "reduced-range jump alternative if tolerated",
          "supported hinge variation"
        ],
        "rehabFinisher": [
          "light knee-control work if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Trap Bar Deadlift`",
          "`Single-Leg Romanian Deadlift`",
          "heavy sled if posture cannot stay clean"
        ],
        "replaceWith": [
          "supported lower-body power option",
          "lighter hip-dominant pattern",
          "lighter trunk stiffness option"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the trap bar deadlift become slow survival work.",
      "Do not chase broad jump distance once take-off quality drops.",
      "Do not let the split jump turn sloppy or collapse through the trunk.",
      "Do not overcook the Nordic block just because it is protective.",
      "Do not let the rotational throw become a fatigue drill.",
      "Keep the sled light enough to stay athletic.",
      "This session should feel sharp, fast, and clearly more speed-biased than the front-row version."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[LOWER_PRESEASON_FORCE_POWER_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/LOWER_PRESEASON_FORCE_POWER_V1.md)",
      "[LOWER_IN_SEASON_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/LOWER_IN_SEASON_BACK_THREE_V1.md)",
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[positionPreferences.v1.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/positionPreferences.v1.ts)",
      "[lower.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/lower.png)",
      "[lower-4.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/lower-4.jpg)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)"
    ]
  },
  {
    "metadata": {
      "id": "LOWER_PRESEASON_POWER_FRONT_ROW_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "lower",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row",
      "equipment": "full_gym",
      "targetDuration": "48-58 min"
    },
    "title": "LOWER_PRESEASON_POWER_FRONT_ROW_V1",
    "goal": [
      "Express lower-body power specific to front-row demands during weeks 9 to 12 of pre-season.",
      "Use a dominant power cluster that links force, ballistic hinge expression, bracing, and projection.",
      "Maintain just enough hinge strength to preserve force qualities while prioritising freshness and output."
    ],
    "sessionIdentity": [
      "This is a front-row power session, not just a generic lower power day.",
      "Rugby-specific through a squat-led power cluster, strong posterior-chain support, and a front-row finisher built around horizontal projection and adductors.",
      "The session should feel more alive and more expressive than the earlier force-based pre-season sessions.",
      "Do not dilute this session with extra jumps, bodybuilding work, or conditioning volume."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "glute bridge",
          "prescription": "1x8"
        },
        {
          "name": "bodyweight squat",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own lower-body warm-up if it prepares ankles, hips, adductors, and trunk.",
        "Keep it short and specific.",
        "The goal is readiness and projection, not fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Front Row Power Cluster",
        "format": "`4 rounds`, `10-15s` between exercises, full rest `3-4 min` after each round",
        "exercises": [
          {
            "name": "Box Squat",
            "prescription": "4x3 @ 85-88%"
          },
          {
            "name": "Banded Kettlebell Swing",
            "prescription": "4-5 reps"
          },
          {
            "name": "Countermovement Jump",
            "prescription": "3 reps"
          }
        ],
        "coachingNotes": [
          "Box squat must stay fast and technically clean.",
          "No grinding reps.",
          "The swing must stay explosive and snappy, never turned into a conditioning set.",
          "Band tension should improve the lockout intent, not pull the athlete out of a clean hinge pattern.",
          "CMJ should stay crisp, powerful, and vertically organised.",
          "The aim is not “speed for speed’s sake”, but front-row power expression from a braced, force-dominant base.",
          "The cluster should feel like a simplified force -> ballistic -> plyometric sequence, not a chaotic circuit.",
          "This block should already feel very close to the later in-season front-row lower session."
        ],
        "fallbackOptions": [
          "B: `Kettlebell Swing`",
          "B: `Jump Shrug`"
        ]
      },
      {
        "number": 2,
        "name": "Posterior Chain Force Maintenance",
        "format": "`3 rounds`, `90-120s` rest",
        "exercises": [
          {
            "name": "Barbell Romanian Deadlift",
            "prescription": "3x4-5"
          }
        ],
        "coachingNotes": [
          "RDL stays strict, braced, and posterior-chain dominant.",
          "This is now a maintenance anchor, not a major builder block.",
          "Keep quality high and volume controlled enough that Block 1 remains the session priority."
        ],
        "fallbackOptions": [
          "`Hex Bar RDL`",
          "`Single-Leg RDL`"
        ]
      },
      {
        "number": 3,
        "name": "Hamstring Micro-Dose",
        "format": "`2 rounds`, `60-75s` rest",
        "exercises": [
          {
            "name": "Nordic Curl",
            "prescription": "2x3-4"
          }
        ],
        "coachingNotes": [
          "This is a low-volume insurance block, not a fatigue block.",
          "Stop before reps become ugly or cramp-prone.",
          "Keep hamstring quality for sprint and power exposure across the week."
        ]
      },
      {
        "number": 4,
        "name": "Front Row Finisher",
        "format": "`EMOM 6'`",
        "exercises": [
          {
            "name": "Sled Push",
            "prescription": "15-20m",
            "slotLabel": "minute 1"
          },
          {
            "name": "Copenhagen Hold",
            "prescription": "15-20s/side",
            "slotLabel": "minute 2"
          }
        ],
        "coachingNotes": [
          "Sled push should reinforce horizontal projection and scrum-like bracing without adding much eccentric fatigue.",
          "Copenhagen work keeps adductor and trunk support present for contact and set-piece demands.",
          "This block should feel robust and specific, not exhaustive.",
          "If no sled is available, replace with `Zercher Carry` or `Farmer Carry` `20m`.",
          "Optional front-row accent:",
          "add `Neck Isometric 2x15-20s` only if weekly neck volume is otherwise low"
        ]
      }
    ],
    "progressionRules": [
      "`W9`: establish clean power rhythm and reference loads.",
      "`W10`: add `+2.5 to +5 kg` on the box squat only if bar speed and jump quality stay high.",
      "`W11`: maintain load and improve output quality rather than forcing more weight.",
      "`W12`: reduce volume around `-30%` while preserving speed and sharpness.",
      "Reduce Block 4 first if fatigue rises.",
      "Reduce one round from Block 3 second.",
      "Reduce Block 2 last.",
      "Keep Block 1 as the protected priority if the athlete is still moving explosively."
    ],
    "positionAccent": [
      "This session is explicitly front-row specific.",
      "Front-row identity comes from:",
      "squat-led power rather than trap-bar/broad-jump bias",
      "more bracing and force orientation",
      "stronger horizontal projection support",
      "adductor robustness that directly support contact and scrum tasks",
      "a power cluster that feels heavier and more organised than the back-three version should"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "sled only if arm position or grip is aggravating"
        ],
        "replaceWith": [
          "shorter sled distance",
          "`Farmer Carry` only if tolerated"
        ],
        "rehabFinisher": [
          "none by default in this lower session unless symptoms require it"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Box Squat`",
          "`Countermovement Jump`",
          "`Banded Kettlebell Swing` only if knee position/loading is aggravating",
          "`Nordic Curl` if hamstrings or knee-front pressure make the setup poorly tolerated"
        ],
        "replaceWith": [
          "`Barbell Hip Thrust`",
          "reduced-range squat if tolerated",
          "reduced-range hinge power option if tolerated"
        ],
        "rehabFinisher": [
          "light knee-control work if needed"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Box Squat`",
          "`Banded Kettlebell Swing`",
          "`Barbell Romanian Deadlift`",
          "heavy sled if posture cannot stay clean"
        ],
        "replaceWith": [
          "supported squat pattern or `Leg Press`",
          "`Barbell Hip Thrust`",
          "lighter trunk/groin support block"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the box squat become slow survival work.",
      "Do not chase jump height once take-off quality clearly drops.",
      "Do not let the swing drift into conditioning or loose spinal extension.",
      "Do not let the support blocks steal from the power cluster.",
      "Do not overcook the Nordic block just because it is protective.",
      "Keep the sled crisp and powerful; if speed collapses, the load is too heavy.",
      "This session should feel sharp, forceful, more expressive than Phase 2, and clearly front-row specific."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[LOWER_PRESEASON_FORCE_POWER_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/LOWER_PRESEASON_FORCE_POWER_V1.md)",
      "[LOWER_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/LOWER_IN_SEASON_FRONT_ROW_V1.md)",
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[positionPreferences.v1.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/positionPreferences.v1.ts)",
      "[lower-4.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/lower-4.jpg)",
      "[lower.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/lower.png)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)"
    ]
  },
  {
    "metadata": {
      "id": "SPEED_BW_POWER_PRESEASON_INTRO_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "speed_power",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (phase 1 terrain base)",
      "equipment": "bodyweight",
      "targetDuration": "35-45 min"
    },
    "title": "SPEED_BW_POWER_PRESEASON_INTRO_V1",
    "goal": [
      "Introduce sprint, jump, and simple COD qualities in pre-season weeks 1-4.",
      "Terrain-first complement to gym/BW force sessions — low residual fatigue.",
      "Rugby-specific through accelerations, clean jump contacts, and trunk ballistics."
    ],
    "sessionIdentity": [
      "Optional 4th session for 4x/week — not a replacement for force days.",
      "**Calibration** : sprints nets 10-15m, sauts propres, pas de circuit fatigue."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "wall drill march",
          "prescription": "1x6/side"
        },
        {
          "name": "A-skip",
          "prescription": "1x10m"
        },
        {
          "name": "2 progressive rehearsal reps",
          "prescription": ""
        }
      ],
      "notes": []
    },
    "blocks": [
      {
        "number": 1,
        "name": "Acceleration",
        "format": "`4 rounds`, `2 min` rest between rounds",
        "exercises": [
          {
            "name": "Resisted Acceleration",
            "prescription": "8-10m"
          },
          {
            "name": "Short Acceleration Sprint",
            "prescription": "10-15m"
          }
        ],
        "coachingNotes": [
          "Upgrade A: band-resisted sprint if band available.",
          "Fallback A: `Falling Start` sprint if no band.",
          "`Front_row`: shorter distances, 3-point start bias.",
          "`Back_three`: extend to 15-20m when quality holds."
        ]
      },
      {
        "number": 2,
        "name": "Plyometrics Intro",
        "format": "`3 rounds`, `90s` rest after the trio",
        "exercises": [
          {
            "name": "Squat Jump",
            "prescription": "2-3 reps"
          },
          {
            "name": "Broad Jump",
            "prescription": "2 reps"
          },
          {
            "name": "Lateral Bound",
            "prescription": "2/side"
          }
        ],
        "coachingNotes": [
          "Stick landings W1-W2; fluid expression W3-W4 if clean.",
          "Low total contacts — compatible with amateur load."
        ]
      },
      {
        "number": 3,
        "name": "Upper Ballistic",
        "format": "`3 rounds`, `90s` rest after the pair",
        "exercises": [
          {
            "name": "Plyo Push-Up",
            "prescription": "4 reps"
          },
          {
            "name": "Band Rotation Explosive",
            "prescription": "3-4/side"
          }
        ],
        "coachingNotes": [
          "Max push speed on plyo — stop if height drops.",
          "Fallback B: controlled `Bird Dog` weighted (backpack) if no band."
        ]
      },
      {
        "number": 4,
        "name": "COD",
        "format": "`3 rounds`, `60s` rest between reps",
        "exercises": [
          {
            "name": "Acceleration to Lateral Shuffle to Sprint",
            "prescription": "3x5m"
          }
        ],
        "coachingNotes": [
          "Sharp repositioning — not sloppy fatigue work.",
          "Reduced space: reactive 5m starts x6."
        ]
      }
    ],
    "progressionRules": [
      "`W4` deload `-30%` contacts — cut Block 4 first.",
      "Never progress sprint volume and jump contacts aggressively same week."
    ],
    "positionAccent": [],
    "injurySubstitutions": [],
    "coachingWarnings": [],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[SPEED_POWER_PRESEASON_INTRO_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/SPEED_POWER_PRESEASON_INTRO_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "SPEED_BW_POWER_PRESEASON_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "speed_power",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (phase 2 terrain base)",
      "equipment": "bodyweight",
      "targetDuration": "40-50 min"
    },
    "title": "SPEED_BW_POWER_PRESEASON_V1",
    "goal": [
      "Phase 2 speed-power: contrasted accelerations, plyometrics, upper ballistics, COD.",
      "Higher intent than intro speed session — still terrain-first and low fatigue."
    ],
    "sessionIdentity": [
      "4th session option weeks 5-8 — complements force-power gym/BW days."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "A-skip",
          "prescription": "1x10m"
        },
        {
          "name": "wall drill march",
          "prescription": "1x6/side"
        },
        {
          "name": "2 progressive rehearsal reps",
          "prescription": ""
        }
      ],
      "notes": []
    },
    "blocks": [
      {
        "number": 1,
        "name": "Contrasted Acceleration",
        "format": "`4-5 rounds`, `2-3 min` rest between rounds",
        "exercises": [
          {
            "name": "Resisted Acceleration",
            "prescription": "8-10m"
          },
          {
            "name": "Short Acceleration Sprint",
            "prescription": "10-20m"
          }
        ],
        "coachingNotes": [
          "Band resisted if available; falling start fallback.",
          "Full rest — quality over density."
        ]
      },
      {
        "number": 2,
        "name": "Plyometrics",
        "format": "`3 rounds`, `90-120s` rest after the trio",
        "exercises": [
          {
            "name": "Countermovement Jump",
            "prescription": "2-3 reps"
          },
          {
            "name": "Broad Jump",
            "prescription": "2 reps"
          },
          {
            "name": "Lateral Bound",
            "prescription": "2/side"
          }
        ],
        "coachingNotes": [
          "CMJ: max height, clean landing.",
          "Control total contacts across the week."
        ]
      },
      {
        "number": 3,
        "name": "Upper Ballistic",
        "format": "`3 rounds`, `90s` rest after the pair",
        "exercises": [
          {
            "name": "Plyo Push-Up",
            "prescription": "4 reps"
          },
          {
            "name": "Band Rotation Explosive",
            "prescription": "3-4/side"
          }
        ],
        "coachingNotes": [
          "Explosive trunk — hips drive rotation."
        ]
      },
      {
        "number": 4,
        "name": "COD",
        "format": "`3 rounds`, `60s` rest between reps",
        "exercises": [
          {
            "name": "Acceleration to Lateral Shuffle to Sprint",
            "prescription": "3x5m"
          }
        ],
        "coachingNotes": [
          "Defensive shuffle into re-sprint — rugby COD pattern."
        ]
      }
    ],
    "progressionRules": [
      "`W4` deload: cut Block 4 reps first.",
      "Do not chase contacts if landings degrade."
    ],
    "positionAccent": [],
    "injurySubstitutions": [],
    "coachingWarnings": [],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[SPEED_POWER_PRESEASON_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/SPEED_POWER_PRESEASON_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "SPEED_POWER_PRESEASON_INTRO_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "speed_power",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (phase 1 common terrain base)",
      "equipment": "field priority + minimal equipment",
      "targetDuration": "45-51 min"
    },
    "title": "SPEED_POWER_PRESEASON_INTRO_V1",
    "goal": [
      "Introduce sprint, jump, throw, and simple change-of-direction qualities during weeks 1 to 4 of pre-season.",
      "Build the qualities the gym sessions do not cover well: acceleration mechanics, explosive coordination, and low-volume COD.",
      "Keep the session clearly terrain-first and low enough in fatigue that it complements the main force sessions."
    ],
    "sessionIdentity": [
      "This is a `4th session / 4x per week` option for Phase 1, not a replacement for Lower, Upper, or Full Force.",
      "This is a terrain speed-power session, not a conditioning circuit and not a disguised lower-body workout.",
      "Rugby-specific through short accelerations, clean jump contacts, med ball intent, and simple COD exposure.",
      "Do not dilute this session with long aerobic work, random heavy loading, or excessive plyometric contacts."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "wall drill march",
          "prescription": "1x6/side"
        },
        {
          "name": "A-skip",
          "prescription": "1x10m"
        },
        {
          "name": "2 progressive rehearsal reps",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this short and useful.",
        "The goal is posture, stiffness, and readiness, not sweat.",
        "If the player already uses a good field warm-up, keep it as long as it covers ankles, hips, acceleration posture, and trunk readiness."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Sprint / Acceleration",
        "format": "`6-8 reps`, walk-back recovery and full rest between reps",
        "exercises": [
          {
            "name": "Short Acceleration Sprint",
            "prescription": "10-20m"
          }
        ],
        "coachingNotes": [
          "`W1-W2`: `6 x 10-15m` using only `standing start` and `falling start`",
          "`W3-W4`: `6-8 x 15-20m` and add `split stance start` or `3-point start`",
          "The focus early is acceleration posture and the quality of the first steps, not max velocity.",
          "Later in the block, the focus shifts slightly toward cleaner acceleration-to-speed transition.",
          "Front row accent:",
          "stay closer to `10-15m`",
          "bias `3-point start` and `split stance start`",
          "Back three accent:",
          "extend more often to `15-20m`",
          "bias `falling start` and `standing start`",
          "Reduced-space fallback:",
          "`Wall Drill March` `3x6/side`",
          "`A-Skip` `3x10m`",
          "explosive `5-8m` start `x6`"
        ]
      },
      {
        "number": 2,
        "name": "Jumps / Plyometrics",
        "format": "`3 rounds`, full rest `90-120s`",
        "exercises": [
          {
            "name": "Countermovement Jump",
            "prescription": "3 reps"
          },
          {
            "name": "Broad Jump",
            "prescription": "2 reps"
          },
          {
            "name": "Lateral Bound",
            "prescription": "2/side"
          }
        ],
        "coachingNotes": [
          "`W1-W2`: stick the landing for `2s` on the CMJ.",
          "`W3-W4`: allow a more fluid, athletic expression if landings stay clean.",
          "Broad jump is about projection quality, not chasing distance.",
          "Lateral bound introduces the frontal-plane exposure that the gym sessions do not cover.",
          "Total contact count stays low enough to remain compatible with amateur field and gym load.",
          "Hard or slippery surface fallback:",
          "replace `Broad Jump` with `Squat Jump`",
          "replace `Lateral Bound` with `Lateral Shuffle` `3-4m`"
        ]
      },
      {
        "number": 3,
        "name": "Upper Ballistic / Explosive Trunk",
        "format": "`3 rounds`, full rest `90-120s`",
        "exercises": [
          {
            "name": "Med Ball Chest Pass",
            "prescription": "4-5 reps"
          },
          {
            "name": "Med Ball Rotational Throw",
            "prescription": "3/side"
          }
        ],
        "coachingNotes": [
          "The throw should come from hips and trunk, not a wild arm swing.",
          "Keep ball load light enough for true speed.",
          "No-med-ball version:",
          "A: `Plyo Push-Up` `4-5 reps`",
          "B: `Explosive Reverse Lunge` `3/side`",
          "Secondary fallback if the lunge pattern is too complex or space is awkward:",
          "`Sprint Sprawl` `3-4 reps`"
        ]
      },
      {
        "number": 4,
        "name": "Athletic COD Work",
        "format": "`2 drills`, `3-4 reps` each, full rest `60-90s` between reps",
        "exercises": [
          {
            "name": "5-10-5 Shuttle",
            "prescription": ""
          },
          {
            "name": "Acceleration to Lateral Shuffle to Sprint",
            "prescription": ""
          }
        ],
        "coachingNotes": [
          "`5-10-5` is the default simple COD drill.",
          "Use ground markers if no cones are available.",
          "For `Acceleration to Lateral Shuffle to Sprint`, use:",
          "sprint `5m`",
          "lateral shuffle `5m`",
          "re-sprint `5m`",
          "Front row accent:",
          "keep distances shorter",
          "bias braking force and sharp repositioning",
          "Back three accent:",
          "allow slightly more fluidity and speed through the transitions",
          "extend the lateral or re-sprint distance if quality stays high",
          "Reduced-space fallback:",
          "replace `5-10-5 Shuttle` with a short `T-Drill`",
          "replace the combo drill with `Reactive Start Drill` over `5m`"
        ]
      },
      {
        "number": 5,
        "name": "Optional Lower-Leg Support",
        "format": "`1-2 rounds`, `30-45s` rest",
        "exercises": [
          {
            "name": "Single-Leg Calf Raise",
            "prescription": "10-12/side"
          },
          {
            "name": "Wall Tibialis Raise",
            "prescription": "12-15 reps"
          },
          {
            "name": "Short Copenhagen Hold",
            "prescription": "15-20s/side"
          }
        ],
        "coachingNotes": [
          "This block is optional.",
          "Skip it if the weekly lower-leg load is already well covered in the lower gym session.",
          "If the ground is poor or the player is already fatigued, keep only calf raises or skip the block entirely."
        ]
      }
    ],
    "progressionRules": [
      "`W1`: establish posture, landing quality, and clean sprint starts.",
      "`W2`: add one rep only if landing quality and sprint mechanics stay sharp.",
      "`W3`: keep total contacts controlled, but allow slightly more fluid and aggressive expression.",
      "`W4`: reduce volume around `-30%` while preserving quality and speed.",
      "Never progress sprint volume and jump contacts aggressively in the same week.",
      "Reduce Block 5 first if fatigue rises.",
      "Reduce one rep per drill from Block 4 second.",
      "Keep Block 1 as the protected priority."
    ],
    "positionAccent": [
      "This session is intentionally common in Phase 1, but the emphasis shifts slightly by profile.",
      "Front row accent:",
      "shorter sprints",
      "more projection and braking emphasis",
      "slightly simpler COD distances",
      "Back three accent:",
      "slightly more elastic jump intent",
      "cleaner rotational and sprint rhythm",
      "slightly longer sprint and COD distances if quality remains high",
      "The structure stays common because this is still an introductory terrain session."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Med Ball Chest Pass`",
          "`Med Ball Rotational Throw`"
        ],
        "replaceWith": [
          "pain-free upper ballistic regression",
          "lighter cable or band rotation if available",
          "keep the sprint and jump sections only if symptoms allow"
        ],
        "rehabFinisher": []
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Countermovement Jump`",
          "`Broad Jump`",
          "`Lateral Bound`",
          "COD drill if clearly provocative"
        ],
        "replaceWith": [
          "lower-impact jump regression if tolerated",
          "straight-line technique sprint",
          "reduced-distance drill"
        ],
        "rehabFinisher": []
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Med Ball Rotational Throw` only if trunk control is poor",
          "aggressive sprint start only if posture cannot stay clean"
        ],
        "replaceWith": [
          "lighter anti-rotation or controlled cable rotation",
          "reduced-distance acceleration drill"
        ],
        "rehabFinisher": []
      }
    ],
    "coachingWarnings": [
      "Do not let this become a hidden conditioning session.",
      "Do not chase jump contacts just because the session is field-based.",
      "Do not turn the COD block into sloppy fatigue work.",
      "Do not use med balls that are too heavy for true ballistic speed.",
      "This session should leave the player feeling switched on, not crushed."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[speed-conditioning-field.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/speed-conditioning-field.jpg)",
      "[speed-session-warmup.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/speed-session-warmup.png)",
      "[speed-skills-part1.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/speed-skills-part1.jpg)",
      "[speed-skills-part2.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/speed-skills-part2.jpg)",
      "[speed-week1.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/speed-week1.png)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)"
    ]
  },
  {
    "metadata": {
      "id": "SPEED_POWER_PRESEASON_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "speed_power",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (phase 2 common terrain base with marked accents)",
      "equipment": "field priority + minimal equipment",
      "targetDuration": "40-50 min"
    },
    "title": "SPEED_POWER_PRESEASON_V1",
    "goal": [
      "Introduce a more structured speed-power exposure during weeks 5 to 8 of pre-season.",
      "Build on the Phase 1 terrain base by adding clearer acceleration contrast, more reactive plyometrics, and sharper COD work.",
      "Keep this session explosive and low-fatigue so it supports the main force-power gym sessions instead of competing with them."
    ],
    "sessionIdentity": [
      "This is the `4th session / 4x per week` option for Phase 2, not a replacement for Lower, Upper, or Full Force-Power.",
      "This is a dedicated terrain speed-power session, not a conditioning workout.",
      "Rugby-specific through short acceleration contrast, structured plyometrics, ballistic upper work, and simple but fast COD patterns.",
      "Do not turn this session into repeated fatigued sprints, oversized plyo volume, or random field fitness."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "ankle rocks",
          "prescription": "1x8/side"
        },
        {
          "name": "adductor rock-back",
          "prescription": "1x8/side"
        },
        {
          "name": "wall drill march",
          "prescription": "1x6/side"
        },
        {
          "name": "A-skip",
          "prescription": "1x10m"
        },
        {
          "name": "pogo hops",
          "prescription": "1x10"
        },
        {
          "name": "2 progressive rehearsal reps",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this short and sharp.",
        "The goal is stiffness, posture, and fast intent.",
        "If the player already uses a good field warm-up, keep it if it covers ankles, hips, trunk posture, and acceleration mechanics."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Acceleration Contrast",
        "format": "`W5-W6 = 4 rounds`, `W7 = 5 rounds`, `W8 = 4 rounds`, full rest `90-120s` between reps and `2-3 min` between rounds",
        "exercises": [
          {
            "name": "Resisted Acceleration",
            "prescription": "8-10m"
          },
          {
            "name": "Free Acceleration Sprint",
            "prescription": "10-20m"
          }
        ],
        "coachingNotes": [
          "This is the main progression from Phase 1: a simple terrain contrast.",
          "Use a sled, band, or partner resistance only if posture and shin angles stay clean.",
          "Resisted work should build projection, not turn into a grind.",
          "Free sprint should feel faster and cleaner immediately after the resisted effort.",
          "Front row accent:",
          "stay shorter",
          "slightly heavier resistance",
          "keep free sprint closer to `10-15m`",
          "Back three accent:",
          "slightly lighter resistance",
          "extend the free sprint more often to `15-20m`",
          "No-resistance fallback:",
          "`Falling Start Sprint`",
          "`Split Stance Start Sprint`",
          "keep the same pair format with two different start styles"
        ]
      },
      {
        "number": 2,
        "name": "Structured Plyometric Cluster",
        "format": "`3 rounds`, full rest `90-120s`",
        "exercises": [
          {
            "name": "Countermovement Jump",
            "prescription": "2-3 reps"
          },
          {
            "name": "Broad Jump",
            "prescription": "2 reps"
          },
          {
            "name": "Lateral Bound",
            "prescription": "2/side"
          }
        ],
        "coachingNotes": [
          "Keep contacts lower than a pure plyometric session.",
          "`W5-W6`: landings stay controlled, quiet, and clearly organised.",
          "`W7-W8`: allow faster ground contact only if elastic quality is clearly improving.",
          "The difference vs Phase 1 is not huge contact volume, but better reactivity and cleaner intent.",
          "If the player is very springy and experienced, allow slightly more reactive execution in `W7-W8`.",
          "If the player arrives with heavy legs or poor jump quality, reduce this block to `2 rounds` before cutting anything else.",
          "Hard or slippery surface fallback:",
          "replace `Broad Jump` with `Squat Jump`",
          "replace `Lateral Bound` with `Lateral Shuffle` `3-4m`"
        ]
      },
      {
        "number": 3,
        "name": "Upper Ballistic Pair",
        "format": "`3 rounds`, full rest `90-120s`",
        "exercises": [
          {
            "name": "Med Ball Chest Pass",
            "prescription": "4 reps"
          },
          {
            "name": "Med Ball Rotational Throw",
            "prescription": "3/side"
          }
        ],
        "coachingNotes": [
          "Keep the med ball light enough for true speed.",
          "The chest pass should be violent and short.",
          "The rotational throw should come from hips and trunk, not an arm swing.",
          "No-med-ball fallback:",
          "A: `Plyo Push-Up` `4 reps`",
          "B: `Explosive Reverse Lunge` `3/side`",
          "Secondary fallback if the lunge pattern is awkward in context:",
          "`Sprint Sprawl` `3-4 reps`"
        ]
      },
      {
        "number": 4,
        "name": "COD / Athletic Change of Direction",
        "format": "`2 drills`, `3-4 reps` each, full rest `60-90s`",
        "exercises": [
          {
            "name": "5-10-5 Shuttle",
            "prescription": ""
          },
          {
            "name": "Reactive Start to 45-Degree Cut",
            "prescription": ""
          }
        ],
        "coachingNotes": [
          "`5-10-5` stays the base COD drill because it is simple and repeatable.",
          "`Reactive Start to 45-Degree Cut` should stay short and sharp:",
          "accelerate `5m`",
          "cut off either foot",
          "re-accelerate `3-5m`",
          "The reactive cue must be real:",
          "use a partner for a visual signal if available",
          "solo option: pre-set a shuffled left/right sequence or use a dropped object as the trigger",
          "If no reactive cue is possible that day, treat it as a pre-planned cut drill rather than pretending it is reactive.",
          "Front row accent:",
          "shorter distances",
          "stronger braking and re-positioning emphasis",
          "Back three accent:",
          "slightly more fluidity and speed through the cut",
          "slightly longer exit if quality stays high",
          "Reduced-space fallback:",
          "replace `5-10-5 Shuttle` with a short `T-Drill`",
          "replace the cut drill with `Reactive Start Drill` over `5m`"
        ]
      },
      {
        "number": 5,
        "name": "Optional Lower-Leg Support",
        "format": "`1-2 rounds`, `30-45s` rest",
        "exercises": [
          {
            "name": "Single-Leg Calf Raise",
            "prescription": "10-12/side"
          },
          {
            "name": "Wall Tibialis Raise",
            "prescription": "12-15 reps"
          }
        ],
        "coachingNotes": [
          "This block is optional and should be skipped by default unless lower-leg volume is otherwise low that week.",
          "Skip it first if the lower gym day already covers calf and tibialis well.",
          "Keep it short and useful only."
        ]
      }
    ],
    "progressionRules": [
      "`W5`: establish clean contrast rhythm and reference drill quality.",
      "`W6`: add one rep only if sprint posture, landing quality, and cut mechanics stay sharp.",
      "`W7`: keep total contacts controlled but allow slightly more reactive execution.",
      "`W8`: reduce volume around `-30%` while preserving speed and sharpness.",
      "Never progress resisted sprint load and plyometric contacts aggressively in the same week.",
      "Reduce Block 5 first if fatigue rises.",
      "Reduce one rep per drill from Block 4 second.",
      "Keep Block 1 as the protected priority."
    ],
    "positionAccent": [
      "This session is still common in Phase 2, but the accents are more marked than in Phase 1.",
      "Front row accent:",
      "shorter acceleration distances",
      "more projection and braking emphasis",
      "slightly more organised than fluid COD",
      "Back three accent:",
      "more elastic sprint and jump feel",
      "slightly longer acceleration",
      "cleaner rhythm through the cut and re-acceleration",
      "The skeleton stays common because the goal here is still broad terrain power development, not fully split position-specific field sessions."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Med Ball Chest Pass`",
          "`Med Ball Rotational Throw`"
        ],
        "replaceWith": [
          "pain-free upper ballistic regression",
          "lighter cable or band rotation if available",
          "keep sprint and jump sections only if symptoms allow"
        ],
        "rehabFinisher": []
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Countermovement Jump`",
          "`Broad Jump`",
          "`Lateral Bound`",
          "COD drill if clearly provocative"
        ],
        "replaceWith": [
          "lower-impact jump regression if tolerated",
          "straight-line technique sprint",
          "reduced-distance drill"
        ],
        "rehabFinisher": []
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Med Ball Rotational Throw` only if trunk control is poor",
          "resisted sprint only if posture cannot stay clean"
        ],
        "replaceWith": [
          "lighter anti-rotation or controlled cable rotation",
          "free short acceleration drill"
        ],
        "rehabFinisher": []
      }
    ],
    "coachingWarnings": [
      "Do not let the resisted sprint become a slow strength march.",
      "Do not chase sprint count at the expense of posture and first-step quality.",
      "Do not turn the plyo block into a contact marathon.",
      "Do not turn the COD block into conditioning.",
      "This session should feel fast, organised, and more reactive than the Phase 1 intro version."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[SPEED_POWER_PRESEASON_INTRO_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/SPEED_POWER_PRESEASON_INTRO_V1.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[speed-conditioning-field.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/speed-conditioning-field.jpg)",
      "[speed-skills-part1.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/speed-skills-part1.jpg)",
      "[speed-skills-part2.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/speed-skills-part2.jpg)",
      "[speed-week2.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/speed-week2.png)",
      "[speed-week3.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/speed-week3.png)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_BW_IN_SEASON_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "in_season",
      "sessionType": "upper",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (common base with position accents)",
      "equipment": "bodyweight",
      "targetDuration": "35-45 min"
    },
    "title": "UPPER_BW_IN_SEASON_V1",
    "goal": [
      "Maintain upper-body force useful for contact, tackling, and pushing at bodyweight.",
      "Keep one clear force -> speed exposure on horizontal push.",
      "Maintain strong horizontal pull and trunk demand.",
      "Finish with carry and neck robustness appropriate to position."
    ],
    "sessionIdentity": [
      "In-season upper maintenance — controlled volume, high movement quality.",
      "**Calibration** : pompes lestées/déclinées lentes, rowing difficile, plyo net — rugbyman club.",
      "Deload week 4 : `-30%` volume — cut Block 3 or optional shoulder work first.",
      "Not arm fluff or multiple explosive blocks."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x6-8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "band pull-apart",
          "prescription": "1x10"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Shoulder and thoracic activation before contrast pushing.",
        "Keep short — prepares the session, not a separate workout."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Contrast Upper Push",
        "format": "`4 rounds`, full rest `2 min 30 to 3 min` after each round",
        "exercises": [
          {
            "name": "Decline Push-Up",
            "prescription": "3-4x3-4"
          },
          {
            "name": "Plyo Push-Up",
            "prescription": "3-4 reps"
          }
        ],
        "coachingNotes": [
          "Heavy A: backpack load or slow eccentric, `RIR 2-3` (~75-80% effort).",
          "Plyo within 15-20s of A — max push speed, hands leave ground.",
          "Upgrade A: `Bench Press` dumbbell if DB + bench available.",
          "Upgrade B: `Med Ball Chest Pass` if med ball available.",
          "Stop plyo when height or stiffness clearly drops."
        ]
      },
      {
        "number": 2,
        "name": "Pull Strength Pair",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Inverted Row Feet Elevated",
            "prescription": "3x5"
          },
          {
            "name": "Inverted Row Standard",
            "prescription": "3x5-6"
          }
        ],
        "coachingNotes": [
          "Force-grade pulling — strict ROM, no kipping.",
          "Upgrade A: strict `Pull-Up` if pull-up bar available (add backpack load if easy).",
          "Upgrade B: `One-Arm Row` dumbbell if DB + bench available.",
          "Front row: pull volume supports tackling and maul work."
        ]
      },
      {
        "number": 3,
        "name": "Rugby Finisher",
        "format": "`EMOM 8'`",
        "exercises": [
          {
            "name": "Suitcase Carry",
            "prescription": "20m/side",
            "slotLabel": "minute 1"
          },
          {
            "name": "Neck Extension Isometric",
            "prescription": "15-20s",
            "slotLabel": "minute 2"
          }
        ],
        "coachingNotes": [
          "Carry: upright posture, controlled steps — upgrade to `Farmer Carry` if DB/KB available.",
          "Neck: rotate flexion, extension, lateral across rounds.",
          "Upgrade neck: `Banded Neck Isometric` if band available.",
          "Fallback A: `Bear Crawl` `15m` if no load available.",
          "Specific and robust — not exhausting."
        ]
      }
    ],
    "progressionRules": [
      "Prioritize bar speed / push quality over load jumps.",
      "Progress via backpack on push-ups and row difficulty before adding reps.",
      "Deload week 4: reduce to 3 rounds on Block 1 or cut Block 3 to 6 min EMOM.",
      "High weekly fatigue: cut Block 3 first, then one round from Block 2."
    ],
    "positionAccent": [
      "`Front_row`: optional extra neck isometric volume; farmer carry upgrade in finisher.",
      "`Back_three`: emphasize plyo push speed; slightly less neck volume if time-constrained."
    ],
    "injurySubstitutions": [],
    "coachingWarnings": [
      "Clean contrast block — not a circuit.",
      "Do not grind heavy push reps.",
      "Place session early enough on match weeks."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[UPPER_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/in-season/UPPER_IN_SEASON_FRONT_ROW_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_BW_OFFSEASON_FORCE_BRIDGE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "upper",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (common base with position accents)",
      "equipment": "bodyweight",
      "targetDuration": "45-55 min"
    },
    "title": "UPPER_BW_OFFSEASON_FORCE_BRIDGE_V1",
    "goal": [
      "Convert upper hypertrophy into pressing/pulling force and explosive power at bodyweight.",
      "Complex training: heavy slow push → ballistic contrast within PAP window.",
      "Prepare shoulders and trunk for pre-season demands without gym loads."
    ],
    "sessionIdentity": [
      "Force-bridge upper — fewer reps, higher intent, explosive follow-ups.",
      "**Calibration** : pompes déclinées lentes lourdes, rowing pieds surélevés force-grade, pike difficile — rugbyman club entraîné.",
      "Plyo and contrast quality > volume."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x6-8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "band pull-apart",
          "prescription": "1x10"
        },
        {
          "name": "2-3 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Shoulder and thoracic activation before heavy pressing contrasts."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Press Force + Explosive Contrast",
        "format": "`4 rounds`, `3-4 min` rest between rounds",
        "exercises": [
          {
            "name": "Decline Push-Up",
            "prescription": "4x4-5"
          },
          {
            "name": "Plyo Push-Up",
            "prescription": "4x3-4, max height",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Heavy A: backpack load or slow tempo, `RIR 1-2`.",
          "Plyo within 15-20s of A — hands leave the ground, max push speed.",
          "If plyo quality drops, reduce load on A first.",
          "Upgrade A: `Bench Press` dumbbell heavy if DB + bench available.",
          "Upgrade B: weighted dips on parallettes if available."
        ]
      },
      {
        "number": 2,
        "name": "Pull Force",
        "format": "`4 work sets`, `2-3 min` rest between sets",
        "exercises": [
          {
            "name": "Inverted Row Feet Elevated",
            "prescription": "4x4-6"
          }
        ],
        "coachingNotes": [
          "Force-grade reps — strict, full ROM, no kipping.",
          "Add backpack on chest or slow tempo before easier row angle.",
          "Upgrade: strict `Pull-Up` if pull-up bar available (add load via backpack)."
        ]
      },
      {
        "number": 3,
        "name": "Vertical Press / Row Strength",
        "format": "`3 rounds`, `90s` rest after the pair",
        "exercises": [
          {
            "name": "Pike Push-Up Feet Elevated",
            "prescription": "3x5"
          },
          {
            "name": "Inverted Row Standard",
            "prescription": "3x6"
          }
        ],
        "coachingNotes": [
          "Force-grade overhead and row support — controlled, no grinding.",
          "Upgrade A: `Dumbbell Press` seated if DB + bench available.",
          "Upgrade B: pull-up or one-arm row if equipment allows."
        ]
      },
      {
        "number": 4,
        "name": "Rotation / Neck Prevention",
        "format": "`2 rounds`, `45s` rest",
        "exercises": [
          {
            "name": "Band Rotation Explosive",
            "prescription": "3-4/side"
          },
          {
            "name": "Neck Extension Isometric",
            "prescription": "15-20s"
          }
        ],
        "coachingNotes": [
          "Rotation: explosive trunk intent — floor rotation if no band (controlled).",
          "Neck: extension + flexion + lateral — 15-20s per direction.",
          "Upgrade neck: `Banded Neck Isometric` if band available."
        ]
      }
    ],
    "progressionRules": [
      "`FB1`: establish contrast pairs; confirm plyo height after heavy push.",
      "`FB2`: add backpack load on A if explosive quality maintained.",
      "Reduce Block 4 first, then Block 3 to 2 rounds.",
      "NEVER reduce Blocks 1-2."
    ],
    "positionAccent": [
      "`Front_row`: optional extra neck isometric volume if tolerated.",
      "`Back_three`: emphasize plyo push speed and rotation explosiveness."
    ],
    "injurySubstitutions": [],
    "coachingWarnings": [
      "Full CNS recovery between Block 1 rounds — do not rush rest.",
      "Stop plyo work if push speed or height degrades."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[UPPER_OFFSEASON_FORCE_BRIDGE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/UPPER_OFFSEASON_FORCE_BRIDGE_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_BW_OFFSEASON_HYPERTROPHY_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "upper",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (common base with position accents)",
      "equipment": "bodyweight",
      "targetDuration": "45-55 min"
    },
    "title": "UPPER_BW_OFFSEASON_HYPERTROPHY_V1",
    "goal": [
      "Build useful upper-body muscle at bodyweight during off-season hypertrophy.",
      "Meaningful push, pull, and shoulder support without bodybuilding fluff.",
      "V1.1 volume cap: ~16–20 hard sets — optional blocks cut first."
    ],
    "sessionIdentity": [
      "Hypertrophy upper — not transition, not pre-season force.",
      "Rugby-relevant pressing, pulling, and shoulder health.",
      "**Calibration** : rugbyman club entraîné — pompes déclinées / pike / rowing pieds surélevés par défaut, pas pompes inclinées ni rowing genoux fléchis sauf blessure.",
      "**Progression sans salle** : sac à dos sur pompes, pieds plus hauts sur pike/row, tractions strictes si barre dispo."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x6-8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "band pull-apart",
          "prescription": "1x10"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Ready for upper volume without pre-fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Push Hypertrophy",
        "format": "`4 work sets`, `2 min` rest between sets",
        "exercises": [
          {
            "name": "Decline Push-Up",
            "prescription": "4x8-10"
          }
        ],
        "coachingNotes": [
          "Anchor press around `RPE 6-8`.",
          "Too easy → backpack load or feet higher; too hard → `Push-Up` standard (not incline) before reducing volume.",
          "Upgrade: dips on parallettes or weighted backpack."
        ]
      },
      {
        "number": 2,
        "name": "Pull / Vertical Push Pair",
        "format": "`4 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Inverted Row Standard",
            "prescription": "4x8-10"
          },
          {
            "name": "Pike Push-Up",
            "prescription": "4x8-10"
          }
        ],
        "coachingNotes": [
          "Main structural volume — strict rows, controlled pike (hips high, not une demi-pompe).",
          "Fallback A: `Inverted Row` knees bent only if row strength is clearly limiting.",
          "Upgrade A: pull-up bar strict reps.",
          "Upgrade B: `Pike Push-Up Feet Elevated`."
        ]
      },
      {
        "number": 3,
        "name": "Vertical Support Pair",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Pike Push-Up Feet Elevated",
            "prescription": "3x8-10"
          },
          {
            "name": "Inverted Row Feet Elevated",
            "prescription": "3x10-12"
          }
        ],
        "coachingNotes": [
          "Support volume harder than Block 2 — not a shoulder max test.",
          "Cut this block before Block 2 if fatigue accumulates."
        ]
      },
      {
        "number": 4,
        "name": "Shoulder Health (optional)",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Face Pull Band",
            "prescription": "2x12-15"
          }
        ],
        "coachingNotes": [
          "Optional — skip if club load is high or no band (use `scap push-up`)."
        ]
      }
    ],
    "progressionRules": [
      "Week 3 peak: hardest sets with `1-2 RIR` on Block 1 only if recovery supports.",
      "Week 4 deload: `-25 to -30%` — cut Block 4 and one round from Block 3 first.",
      "Never add extra arm volume beyond optional Block 4.",
      "Difficulty ↑ via angle, load, or reps — not incline push-up regression."
    ],
    "positionAccent": [
      "`Front_row`: neck isometric 2x10s/direction after main work if tolerated.",
      "`Back_three`: add lateral bound or shuffle finisher 2x5m if space allows."
    ],
    "injurySubstitutions": [],
    "coachingWarnings": [
      "Not a bench ego session or accessory festival.",
      "Quality over pump chasing.",
      "Session should feel demanding for a trained rugby player — if not, add external load."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[bodyweight-program-review.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-program-review.md)",
      "[UPPER_OFFSEASON_HYPERTROPHY_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/UPPER_OFFSEASON_HYPERTROPHY_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_BW_OFFSEASON_TRANSITION_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "upper",
      "targetLevel": "starter",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "bodyweight",
      "targetDuration": "40-50 min"
    },
    "title": "UPPER_BW_OFFSEASON_TRANSITION_V1",
    "goal": [
      "Rebuild upper-body structure after Recovery at bodyweight.",
      "Restore push, pull, and shoulder-friendly vertical support without hypertrophy density.",
      "Support scapular rhythm and trunk control."
    ],
    "sessionIdentity": [
      "Transition upper — not recovery, not yet hypertrophy or force.",
      "Rugby-specific push/pull patterns with shoulder-friendly structure."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x6-8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "band pull-apart",
          "prescription": "1x10"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Ready for moderate upper work — not max effort priming."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Push / Pull Base Pair",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Decline Push-Up",
            "prescription": "3x6-8"
          },
          {
            "name": "Inverted Row Standard",
            "prescription": "3x8-10"
          }
        ],
        "coachingNotes": [
          "Around `RPE 5-6`.",
          "Decline push-up as main horizontal push; row from sturdy table/bar."
        ],
        "fallbackOptions": [
          "A: `Incline Push-Up` if shoulders need easier angle",
          "B: `Inverted Row` with knees bent"
        ]
      },
      {
        "number": 2,
        "name": "Vertical Support Pair",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Pike Push-Up",
            "prescription": "3x6-8"
          },
          {
            "name": "Inverted Row Feet Elevated",
            "prescription": "3x8-10"
          }
        ],
        "coachingNotes": [
          "Pike for vertical-ish push; feet-elevated row for harder pull."
        ],
        "fallbackOptions": [
          "A: `Push-Up` standard if pike is too hard",
          "B: `Inverted Row Standard`"
        ]
      },
      {
        "number": 3,
        "name": "Shoulder / Trunk Support",
        "format": "`2 rounds`, minimal rest",
        "exercises": [
          {
            "name": "Face Pull Band",
            "prescription": "2x10-12"
          },
          {
            "name": "Side Plank",
            "prescription": "2x20s/side"
          }
        ],
        "coachingNotes": [
          "Face pull with band if available; otherwise `scap push-up` and band pull-apart.",
          "Submaximal — finish organized, not smoked."
        ]
      }
    ],
    "progressionRules": [
      "`S3`: clean reps at moderate effort.",
      "`S4`: harder push/row angle before adding sets.",
      "Cut Block 2 volume first if fatigue is high."
    ],
    "positionAccent": [],
    "injurySubstitutions": [],
    "coachingWarnings": [
      "Re-entry into upper training — not a bench test.",
      "Keep final support block calm and useful."
    ],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_BW_PRESEASON_FORCE_POWER_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "upper",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (phase 2 common base)",
      "equipment": "bodyweight",
      "targetDuration": "45-55 min"
    },
    "title": "UPPER_BW_PRESEASON_FORCE_POWER_V1",
    "goal": [
      "Force-power contrast for upper body in pre-season phase 2.",
      "Heavy press followed by plyo push; heavy pull support.",
      "Trunk rotation and neck finisher for rugby contact."
    ],
    "sessionIdentity": [
      "Upper force-power — plyo quality after heavy push is non-negotiable."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "band pull-apart",
          "prescription": "1x10"
        },
        {
          "name": "thoracic rotation",
          "prescription": "1x6-8/side"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": []
    },
    "blocks": [
      {
        "number": 1,
        "name": "Contrast Push",
        "format": "`4 rounds`, `3 min` rest between rounds",
        "exercises": [
          {
            "name": "Decline Push-Up",
            "prescription": "4x4"
          },
          {
            "name": "Plyo Push-Up",
            "prescription": "4x4-5",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Heavy slow A — backpack or tempo, `RIR 1-2`.",
          "Plyo within 15-20s of A — hands leave ground.",
          "Upgrade A: dumbbell bench if DB + bench."
        ]
      },
      {
        "number": 2,
        "name": "Pull Force",
        "format": "`4 work sets`, `2-3 min` rest between sets",
        "exercises": [
          {
            "name": "Inverted Row Feet Elevated",
            "prescription": "4x4-6"
          }
        ],
        "coachingNotes": [
          "Force-grade — strict, full ROM.",
          "Upgrade: `Neutral-Grip Pull-Up` loaded (backpack) if bar available."
        ]
      },
      {
        "number": 3,
        "name": "Support",
        "format": "`3 rounds`, `90s` rest after the pair",
        "exercises": [
          {
            "name": "Pike Push-Up",
            "prescription": "3x5"
          },
          {
            "name": "Inverted Row Standard",
            "prescription": "3x6"
          }
        ],
        "coachingNotes": [
          "Upgrade A: seated dumbbell press if equipment allows."
        ]
      },
      {
        "number": 4,
        "name": "Finisher",
        "format": "`2 rounds`, `45s` rest",
        "exercises": [
          {
            "name": "Band Rotation Explosive",
            "prescription": "3-4/side"
          },
          {
            "name": "Neck Extension Isometric",
            "prescription": "15-20s"
          },
          {
            "name": "Face Pull Band",
            "prescription": "3x12"
          }
        ],
        "coachingNotes": [
          "Upgrade C requires band; fallback scap push-up if no band."
        ]
      }
    ],
    "progressionRules": [
      "Cut Block 4 before Block 1 if fatigue rises.",
      "Stop plyo if push speed degrades."
    ],
    "positionAccent": [],
    "injurySubstitutions": [],
    "coachingWarnings": [],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[UPPER_PRESEASON_FORCE_POWER_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/UPPER_PRESEASON_FORCE_POWER_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_BW_PRESEASON_FORCE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "upper",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (phase 1 common base)",
      "equipment": "bodyweight",
      "targetDuration": "45-55 min"
    },
    "title": "UPPER_BW_PRESEASON_FORCE_V1",
    "goal": [
      "Build upper pressing and pulling force in pre-season phase 1 at bodyweight.",
      "Establish force-grade push/pull patterns before power contrast work.",
      "Maintain trunk rotation and neck resilience for contact."
    ],
    "sessionIdentity": [
      "Pre-season upper force — heavy slow reps, no plyo contrast yet.",
      "**Calibration** : pompes lestées lentes, rowing pieds surélevé force-grade — rugbyman club entraîné."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x6-8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "band pull-apart",
          "prescription": "1x10"
        },
        {
          "name": "2-3 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": []
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Push Force",
        "format": "`4 work sets`, `2-3 min` rest between sets",
        "exercises": [
          {
            "name": "Decline Push-Up",
            "prescription": "4x4-5"
          }
        ],
        "coachingNotes": [
          "Backpack load or slow tempo, `RIR 1-2` — anchor block.",
          "Upgrade: `Bench Press` dumbbell if DB + bench; parallel dips if bar/parc available."
        ]
      },
      {
        "number": 2,
        "name": "Pull + Push Support",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Inverted Row Feet Elevated",
            "prescription": "3x6-8"
          },
          {
            "name": "Pike Push-Up Feet Elevated",
            "prescription": "3x6-8"
          }
        ],
        "coachingNotes": [
          "Upgrade A: `Neutral-Grip Pull-Up` if pull-up bar available.",
          "Upgrade B: `Seated DB Overhead Press` if DB + bench available.",
          "Fallback A: harder inverted row angle without bar."
        ]
      },
      {
        "number": 3,
        "name": "Shoulder / Trunk Support",
        "format": "`3 rounds`, `75s` rest after the pair",
        "exercises": [
          {
            "name": "Pike Push-Up",
            "prescription": "3x6-8"
          },
          {
            "name": "Band Rotation Explosive",
            "prescription": "2-3x6-8/side"
          }
        ],
        "coachingNotes": [
          "Rotation: floor chop regression if no band.",
          "Upgrade A: dumbbell press seated if equipment allows."
        ]
      },
      {
        "number": 4,
        "name": "Finisher",
        "format": "`2 rounds`, `45s` rest",
        "exercises": [
          {
            "name": "Suitcase Carry",
            "prescription": "2x20m/side"
          },
          {
            "name": "Neck Extension Isometric",
            "prescription": "2x10s/dir"
          }
        ],
        "coachingNotes": [
          "Fallback A: lateral `Bear Crawl` if no DB.",
          "Upgrade neck: `Banded Neck Isometric` if band available."
        ]
      }
    ],
    "progressionRules": [
      "`W1-W3`: progress load on Block 1 only if technique holds.",
      "`W4`: deload `-30%` — cut Block 4, then one round from Block 3.",
      "Protect Block 1 priority."
    ],
    "positionAccent": [
      "`Front_row`: heavier push load; extra neck isometric if tolerated.",
      "`Back_three`: stricter pull ROM; faster rotation intent."
    ],
    "injurySubstitutions": [],
    "coachingWarnings": [],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)",
      "[UPPER_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/UPPER_PRESEASON_FORCE_V1.md)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_BW_PRESEASON_POWER_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "upper",
      "targetLevel": "builder",
      "targetPositionGroup": "front_row + back_three (phase 3 common base)",
      "equipment": "bodyweight",
      "targetDuration": "40-48 min"
    },
    "title": "UPPER_BW_PRESEASON_POWER_V1",
    "goal": [
      "Phase 3 upper power — speed push contrast and explosive pull.",
      "Maintain trunk rotation and carry finisher for rugby transfer."
    ],
    "sessionIdentity": [
      "Power phase upper — max bar/hand speed, not force grinding."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "thoracic rotation",
          "prescription": "1x6-8/side"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": []
    },
    "blocks": [
      {
        "number": 1,
        "name": "Speed Push Contrast",
        "format": "`4 rounds`, `2 min 30` rest between rounds",
        "exercises": [
          {
            "name": "Decline Push-Up",
            "prescription": "4x3"
          },
          {
            "name": "Plyo Push-Up",
            "prescription": "3-4 reps",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "A: moderate load, max push speed — weighted push-ups or DB bench.",
          "Plyo immediately after A if quality holds."
        ]
      },
      {
        "number": 2,
        "name": "Explosive Pull",
        "format": "`3 rounds`, `90s` rest after the pair",
        "exercises": [
          {
            "name": "Inverted Row Feet Elevated",
            "prescription": "3x4"
          },
          {
            "name": "Decline Push-Up",
            "prescription": "3x5"
          }
        ],
        "coachingNotes": [
          "Explosive row — fast pull, controlled descent.",
          "Upgrade A: explosive pull-up if bar available."
        ]
      },
      {
        "number": 3,
        "name": "Finisher",
        "format": "`EMOM 6'`",
        "exercises": [
          {
            "name": "Band Rotation Explosive",
            "prescription": "3-4/side",
            "slotLabel": "minute 1"
          },
          {
            "name": "Suitcase Carry",
            "prescription": "20m/side",
            "slotLabel": "minute 2"
          }
        ],
        "coachingNotes": [
          "Fast carry — lateral trunk control under load.",
          "Fallback rotation: floor chop if no band."
        ]
      }
    ],
    "progressionRules": [
      "Stop plyo if push speed drops.",
      "EMOM finisher optional if upper fatigue is high."
    ],
    "positionAccent": [],
    "injurySubstitutions": [],
    "coachingWarnings": [],
    "sourceReferences": [
      "[bodyweight-annual-cycle-program.md](/Users/junca/Projets/RugbyPrepV2/docs/training/bodyweight-annual-cycle-program.md)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_IN_SEASON_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "in_season",
      "sessionType": "upper",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "40-48 min"
    },
    "title": "UPPER_IN_SEASON_BACK_THREE_V1",
    "goal": [
      "Maintain upper-body force without creating unnecessary fatigue.",
      "Keep a clear upper-body force -> speed exposure.",
      "Maintain horizontal pulling strength and scapular control.",
      "Finish with trunk and carry work that supports speed, contact, and open-field robustness."
    ],
    "sessionIdentity": [
      "Rugby-specific through an upper contrast, a clean push/pull strength block, and a short athletic finisher.",
      "Back-three specific through slightly faster force expression, less contact-bracing emphasis than front row, and more trunk/unilateral carry flavor.",
      "Do not turn this into a bodybuilding upper day or a rehab circuit."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8-10"
        },
        {
          "name": "band pull-apart or TYI light",
          "prescription": "1-2x10"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "If the player already has a reliable upper-body warm-up, they can keep it.",
        "Keep this short and specific.",
        "The aim is readiness, not fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Contrast Upper Speed-Power",
        "format": "`4 rounds`, full rest `2 min 30 to 3 min` after each round",
        "exercises": [
          {
            "name": "Bench Press",
            "prescription": "4x3-4 @ 75-80%"
          },
          {
            "name": "Med Ball Chest Pass",
            "prescription": "4-5 reps"
          }
        ],
        "coachingNotes": [
          "Bench stays fast and technically clean.",
          "Concentric intent is maximal.",
          "No grinding reps.",
          "The med ball throw should feel sharp and ballistic, not heavy.",
          "This is a speed-biased contrast, not a max-strength cluster."
        ]
      },
      {
        "number": 2,
        "name": "Pull Strength Pair",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Neutral-Grip Pull-Up",
            "prescription": "3x5"
          },
          {
            "name": "Pendlay Row",
            "prescription": "3x5-6"
          }
        ],
        "coachingNotes": [
          "Pull-up : traction lourde, add load if strong enough (ceinture lest).",
          "Pendlay starts from a dead stop each rep.",
          "Row stays strong without turning into a lower-back fight.",
          "Back three : pull-up neutre = transfer plaquage / ruck-over direct. Landmine press est présent en UPPER_PRESEASON_POWER et UPPER_OFFSEASON_HYPERTROPHY — pas besoin en in-season maintenance."
        ]
      },
      {
        "number": 3,
        "name": "Back Three Finisher",
        "format": "`EMOM 8'`",
        "exercises": [
          {
            "name": "Suitcase Carry",
            "prescription": "20m/side",
            "slotLabel": "minute 1"
          },
          {
            "name": "Pallof Press Hold or Neck Isometric",
            "prescription": "15-20s",
            "slotLabel": "minute 2"
          }
        ],
        "coachingNotes": [
          "Default version favors trunk control and unilateral stiffness.",
          "If more contact robustness is needed that week, replace the Pallof hold with neck isometrics.",
          "This block should reinforce posture and athletic stability, not create heavy residual fatigue."
        ]
      }
    ],
    "progressionRules": [
      "Prioritize speed and quality over loading jumps.",
      "Bench can progress by `+2.5 kg` only if all sets stay sharp.",
      "Landmine and row progress gradually when mechanics remain clean and the player keeps `RIR 2-3`.",
      "If weekly fatigue is high:",
      "reduce Block 3 first",
      "then reduce one round from Block 2",
      "keep Block 1 if the player still looks fresh enough to move explosively"
    ],
    "positionAccent": [
      "Common skeleton stays the same as the front-row upper session.",
      "Back-three accent comes from:",
      "slightly lower pressing load and slightly higher speed intent",
      "more ballistic upper output",
      "more trunk/unilateral carry emphasis",
      "less neck/contact bias than front row by default"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bench Press`",
          "`Med Ball Chest Pass`",
          "`Landmine Press` if painful"
        ],
        "replaceWith": [
          "safe heavy row variation",
          "scap/trap-focused accessory work",
          "arms only if needed after safer rugby-relevant options are covered"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`scap push-up`",
          "`serratus reach`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "carry only if it aggravates the player"
        ],
        "replaceWith": [
          "static hold or reduced distance"
        ],
        "rehabFinisher": [
          "none by default in this upper session unless symptoms require it"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "unsupported row variation",
          "heavy carry if posture cannot stay clean"
        ],
        "replaceWith": [
          "chest-supported row",
          "lighter suitcase carry or anti-rotation hold"
        ],
        "rehabFinisher": [
          "breathing + trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the bench lose speed.",
      "Do not turn the med ball throw into fatigue work.",
      "Do not let the row become a torso-compensation exercise.",
      "Keep the finisher athletic and crisp.",
      "This session should leave the player feeling switched on, not flattened."
    ],
    "sourceReferences": [
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[beginner-intermediate-training.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/beginner-intermediate-training.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[positionPreferences.v1.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/positionPreferences.v1.ts)",
      "[upper-4.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/upper-4.jpg)",
      "[upper-2.jpeg](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/upper-2.jpeg)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_IN_SEASON_FRONT_ROW_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "in_season",
      "sessionType": "upper",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row",
      "equipment": "full_gym",
      "targetDuration": "42-50 min"
    },
    "title": "UPPER_IN_SEASON_FRONT_ROW_V1",
    "goal": [
      "Maintain upper-body force useful for contact.",
      "Keep one clear force -> speed exposure on horizontal push.",
      "Maintain a strong horizontal pull and trunk/bracing demand.",
      "Finish with a front-row signature: carry plus controlled neck work."
    ],
    "sessionIdentity": [
      "Rugby-specific through a readable upper contrast, strong horizontal pulling, and front-row contact robustness.",
      "Front-row specific through bracing, carry, and cervical isometrics rather than speed-biased upper work.",
      "Do not dilute this session with arm fluff, multiple explosive blocks, or extra rehab-style filler for healthy players."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8-10"
        },
        {
          "name": "band pull-apart or TYI light",
          "prescription": "1-2x10"
        },
        {
          "name": "bench press",
          "prescription": "2 progressive sets"
        }
      ],
      "notes": [
        "If the player already has a reliable upper-body routine, they can keep it.",
        "For shoulder-sensitive players, the warm-up becomes strongly recommended.",
        "Keep this short and specific; it should prepare the session, not become a separate workout."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Contrast Upper Push",
        "format": "`4 rounds`, full rest `3 min` after each round",
        "exercises": [
          {
            "name": "Bench Press",
            "prescription": "4x4 @ 80-85%"
          },
          {
            "name": "Plyo Push-Up",
            "prescription": "4-5 reps"
          }
        ],
        "coachingNotes": [
          "Bench eccentric stays controlled for `1-2s`.",
          "Concentric intent is maximal.",
          "No grinding reps.",
          "Plyo push-ups stop as soon as height or stiffness clearly drops.",
          "This is a clean contrast block, not a circuit."
        ]
      },
      {
        "number": 2,
        "name": "Pull Strength Pair",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Neutral-Grip Pull-Up",
            "prescription": "3x5"
          },
          {
            "name": "Pendlay Row",
            "prescription": "3x5-6"
          }
        ],
        "coachingNotes": [
          "Pull-up : weighted if strong (add dip belt). Traction strict, no kipping.",
          "Pendlay starts from a dead stop each rep, explosive but technically strict.",
          "Front row : pull volume critique pour plaquage et maul counter-push. Landmine press reste dans UPPER_PRESEASON_POWER pour l'axe vertical."
        ]
      },
      {
        "number": 3,
        "name": "Front Row Finisher",
        "format": "`EMOM 8'`",
        "exercises": [
          {
            "name": "Farmer Carry or Zercher Carry",
            "prescription": "20m",
            "slotLabel": "minute 1"
          },
          {
            "name": "Neck Isometric",
            "prescription": "15-20s",
            "slotLabel": "minute 2"
          }
        ],
        "coachingNotes": [
          "Carry choice depends on setup and player comfort.",
          "Rotate neck directions across rounds: flexion, extension, left lateral, right lateral.",
          "This block should feel specific and robust, not exhausting."
        ]
      },
      {
        "number": 4,
        "name": "Shoulder Prehab Micro-Block",
        "format": "`1 round`, `20-30s` rest between drills",
        "exercises": [
          {
            "name": "Band External Rotation",
            "prescription": "10-12 reps"
          },
          {
            "name": "Serratus Reach",
            "prescription": "8-10 reps"
          },
          {
            "name": "Scap Push-Up",
            "prescription": "8 reps"
          }
        ],
        "coachingNotes": [
          "Optional, but recommended when pushing volume is high or the player has a shoulder history.",
          "This should take around `2 min`, not become a separate accessory block."
        ],
        "isOptional": true
      }
    ],
    "progressionRules": [
      "Prioritize bar speed and execution quality over loading jumps.",
      "Bench can progress by `+2.5 kg` only if all four sets stay crisp.",
      "Landmine and Pendlay can progress gradually when the player keeps `RIR 2-3` with clean mechanics.",
      "If fatigue is high during the week, reduce volume before reducing intensity:",
      "Block 3 first",
      "then one round from Block 2",
      "keep Block 1 as the key quality exposure if possible"
    ],
    "positionAccent": [
      "Common skeleton stays the same as other upper in-season sessions.",
      "Front-row accent comes from:",
      "stronger bracing demand",
      "less speed bias",
      "more carry/contact robustness",
      "explicit cervical work"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bench Press`",
          "`Plyo Push-Up`",
          "`Landmine Press` if painful"
        ],
        "replaceWith": [
          "a safe heavy row variation",
          "scap/trap-focused accessory work",
          "arms only if needed to preserve session density after safer rugby-relevant options are exhausted"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`scap push-up`",
          "`serratus reach`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "carry only if it aggravates the player"
        ],
        "replaceWith": [
          "static hold or shorter carry distance"
        ],
        "rehabFinisher": [
          "none by default in this upper session unless symptoms require it"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Pendlay Row`",
          "heavy carry if bracing cannot stay clean"
        ],
        "replaceWith": [
          "chest-supported row",
          "lighter carry or trunk anti-rotation hold"
        ],
        "rehabFinisher": [
          "breathing + trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the bench turn into a grind just to protect the prescribed load.",
      "Do not let the plyo push-up become slow fatigue work.",
      "Do not chase Pendlay volume with sloppy torso position.",
      "Keep the finisher specific, not crushing.",
      "Best placed early enough in the week to recover before match demands."
    ],
    "sourceReferences": [
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[beginner-intermediate-training.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/beginner-intermediate-training.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[positionPreferences.v1.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/positionPreferences.v1.ts)",
      "[upper-4.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/upper-4.jpg)",
      "[upper-2.jpeg](/Users/junca/Projets/RugbyPrepV2/docs/training/Pre%CC%81paration%20Physique/upper-2.jpeg)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "upper",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "50-60 min"
    },
    "title": "UPPER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1",
    "goal": [
      "Convert upper-body strength into rotational and projection power for back-three demands.",
      "Maintain bench as bilateral pressing anchor.",
      "Develop trunk transfer speed and multi-directional upper-body power."
    ],
    "sessionIdentity": [
      "This is a back-three force-bridge upper session.",
      "Bench anchor stays. Contrast and support shift toward rotation and projection.",
      "More pronounced differentiation than hypertrophy phase."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "band pull-apart",
          "prescription": "1x12"
        },
        {
          "name": "push-up",
          "prescription": "1x8"
        },
        {
          "name": "2-3 progressive ramp-up sets on bench",
          "prescription": ""
        }
      ],
      "notes": [
        "Shoulder activation before heavy pressing."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Press Force + Speed Contrast",
        "format": "`4 rounds`, `3-4 min` rest",
        "exercises": [
          {
            "name": "bench press",
            "prescription": "4x4-5 @ 85%",
            "role": "prime"
          },
          {
            "name": "plyo push-up",
            "prescription": "4x4-5, max height",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Heavy bench into explosive push-up — speed/projection emphasis.",
          "Plyo push-up: hands must leave ground. Speed of push matters.",
          "This replaces the med ball chest pass of the front-row version."
        ],
        "fallbackOptions": [
          "A: `Med Ball Chest Pass` if plyo push-ups too demanding"
        ]
      },
      {
        "number": 2,
        "name": "Pull Force + Rotational Power",
        "format": "`4 rounds`, `90-120s` rest",
        "exercises": [
          {
            "name": "neutral-grip pull-up",
            "prescription": "4x4-5"
          },
          {
            "name": "med ball rotational throw",
            "prescription": "4x3/side",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Pull-up for vertical pulling force.",
          "Rotational throw for trunk transfer power — key for open-field passing and fending.",
          "This replaces the sagittal med ball slam of the front-row version."
        ],
        "fallbackOptions": [
          "A: `Chest-Supported Row` heavy",
          "B: `Cable Rotation Explosive`"
        ]
      },
      {
        "number": 3,
        "name": "Unilateral Rotational Strength",
        "format": "`3 rounds`, `75-90s` rest",
        "exercises": [
          {
            "name": "half-kneeling landmine press",
            "prescription": "3x4-5/side"
          },
          {
            "name": "half-kneeling cable row",
            "prescription": "3x5-6/side"
          }
        ],
        "coachingNotes": [
          "Both exercises in half-kneeling: trunk stability under unilateral load.",
          "This replaces the push press + t-bar row of the front-row version.",
          "Force-grade reps (4-6), not hypertrophy."
        ],
        "fallbackOptions": [
          "A: `Push Press` + `T-Bar Row`"
        ]
      },
      {
        "number": 4,
        "name": "Trunk / Shoulder Prevention",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "cable chop",
            "prescription": "2x6-8/side"
          },
          {
            "name": "face pull",
            "prescription": "2x10-12"
          }
        ],
        "coachingNotes": [
          "Same structure as front-row. Cable chop at force-grade reps."
        ]
      }
    ],
    "progressionRules": [
      "`FB1`: establish contrast pairs at 85%; confirm plyo push-up and throw quality.",
      "`FB2`: increase bench to 88-90% if push-up height holds.",
      "Reduce B4 first, B3 second. NEVER reduce B1-B2."
    ],
    "positionAccent": [
      "Back-three: speed contrast in B1, rotational power in B2, unilateral rotational strength in B3."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bench Press`",
          "`Plyo Push-Up`",
          "`Half-Kneeling Landmine Press`"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Med Ball Chest Pass`",
          "`Seated DB Overhead Press`"
        ],
        "rehabFinisher": [
          "`band external rotation`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [],
        "replaceWith": [],
        "rehabFinisher": []
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Half-Kneeling Landmine Press`",
          "`Half-Kneeling Cable Row`"
        ],
        "replaceWith": [
          "`Seated DB Overhead Press`",
          "`Chest-Supported Row`"
        ],
        "rehabFinisher": [
          "breathing work"
        ]
      }
    ],
    "coachingWarnings": [
      "Speed and rotation are the priorities, not grinding.",
      "Plyo push-ups and rotational throws degrade quickly — stop if quality drops.",
      "Bench anchor stays non-negotiable."
    ],
    "sourceReferences": [
      "[off-season-periodization.md] — Phase 4",
      "[strength-methods.md] — Complex Training",
      "[periodization.md] — Position demands §3.2"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_OFFSEASON_FORCE_BRIDGE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "upper",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "full_gym",
      "targetDuration": "50-60 min"
    },
    "title": "UPPER_OFFSEASON_FORCE_BRIDGE_V1",
    "goal": [
      "Convert off-season upper-body hypertrophy into maximal pressing/pulling force and explosive power.",
      "Use complex training to bridge heavy strength and ballistic output.",
      "Prepare shoulders, back, and trunk for pre-season demands."
    ],
    "sessionIdentity": [
      "This is a force-bridge upper session: heavy presses and pulls paired with ballistic contrasts.",
      "NOT hypertrophy — fewer reps, heavier loads, explosive follow-ups.",
      "The med ball and plyo work must feel faster after the heavy lift."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "band pull-apart",
          "prescription": "1x12"
        },
        {
          "name": "push-up",
          "prescription": "1x8"
        },
        {
          "name": "band pull-apart",
          "prescription": "1x8/side"
        },
        {
          "name": "2-3 progressive ramp-up sets on bench press",
          "prescription": ""
        }
      ],
      "notes": [
        "Shoulder and thoracic activation before heavy pressing.",
        "Ramp-up sets are essential — reach working weight over 2-3 sets."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Press Force + Explosive Contrast",
        "format": "`4 rounds`, `3-4 min` rest between rounds",
        "exercises": [
          {
            "name": "bench press",
            "prescription": "4x4-5 @ 85-90%",
            "role": "prime"
          },
          {
            "name": "med ball chest pass",
            "prescription": "4x4-5, max intention",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Heavy bench: controlled eccentric, explosive concentric. RIR 1-2.",
          "Med ball pass within 15-20s of bench set — exploit PAP.",
          "Pass should feel noticeably faster/harder after the heavy set.",
          "If pass quality drops, reduce bench load first."
        ],
        "fallbackOptions": [
          "A: `DB Bench Press` heavy",
          "B: `Plyo Push-Up` if no med ball"
        ]
      },
      {
        "number": 2,
        "name": "Pull Force + Power Contrast",
        "format": "`4 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "neutral-grip pull-up",
            "prescription": "4x4-5 (add load if needed)"
          },
          {
            "name": "med ball slam",
            "prescription": "4x4, explosive",
            "role": "contrast"
          }
        ],
        "coachingNotes": [
          "Pull-up: full range, dead hang to chin over bar. Add weight belt if bodyweight is too easy.",
          "Slam: full hip extension into powerful overhead throw. Speed matters.",
          "This block develops pulling power and trunk transfer."
        ],
        "fallbackOptions": [
          "A: `Chest-Supported Row` heavy (4x5)",
          "B: `Cable Slam` if no med ball"
        ]
      },
      {
        "number": 3,
        "name": "Vertical Press/Row Strength",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "push press",
            "prescription": "3x4-5"
          },
          {
            "name": "t-bar row",
            "prescription": "3x5-6"
          }
        ],
        "coachingNotes": [
          "Push press: use leg drive to move heavier loads overhead — this IS a power exercise.",
          "T-bar row: strict form, force-grade reps, no body english.",
          "This block maintains force balance across pressing and pulling patterns."
        ],
        "fallbackOptions": [
          "A: `Strict Overhead Press` 3x5-6",
          "B: `Chest-Supported Row` 3x5-6"
        ]
      },
      {
        "number": 4,
        "name": "Trunk / Shoulder Prevention",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "cable chop",
            "prescription": "2x6-8/side"
          },
          {
            "name": "face pull",
            "prescription": "2x10-12"
          }
        ],
        "coachingNotes": [
          "Cable chop at force-grade reps — controlled, powerful rotation.",
          "Face pull: light, high-rep, shoulder health priority.",
          "Keep this block short and efficient."
        ]
      }
    ],
    "progressionRules": [
      "`FB1`: establish contrast pairs at 85%; confirm med ball/slam quality.",
      "`FB2`: increase main lifts to 88-90% if explosive quality is maintained.",
      "Reduce Block 4 first if fatigue accumulates.",
      "Reduce Block 3 to 2 rounds second.",
      "NEVER reduce Blocks 1-2 — the contrast pairs ARE the session."
    ],
    "positionAccent": [
      "Session is common for both groups.",
      "`Front_row`: slightly heavier bench loads tolerated; more bracing emphasis.",
      "`Back_three`: slightly more emphasis on med ball velocity and trunk transfer speed."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bench Press` if impingement",
          "`Push Press` if overhead painful"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Landmine Press`"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [],
        "replaceWith": [],
        "rehabFinisher": []
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Push Press` if bracing fails",
          "`T-Bar Row` if position breaks"
        ],
        "replaceWith": [
          "`Seated DB Overhead Press`",
          "`Chest-Supported Row`"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "This session should feel powerful and sharp, not exhausting.",
      "Heavy pressing + ballistic contrasts demand full CNS recovery between rounds.",
      "Do not rush the rest periods — quality of explosive movement depends on it.",
      "Med ball work degrades fast with fatigue. Stop if throw distance/speed drops."
    ],
    "sourceReferences": [
      "[off-season-periodization.md] — Phase 4 Force-Power conversion",
      "[strength-methods.md] — Complex Training, PAP exploitation",
      "[periodization.md] — Effect residual, Force→Power transition"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "upper",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "55-70 min"
    },
    "title": "UPPER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1",
    "goal": [
      "Build upper-body mass with a back-three bias: unilateral pulling, rotational pressing, and trunk transfer.",
      "Maintain bilateral bench as the pressing anchor.",
      "Prepare shoulder girdle and trunk for pre-season rotational and open-field demands."
    ],
    "sessionIdentity": [
      "This is a back-three off-season hypertrophy upper session.",
      "Bench anchor stays. Accent shifts to unilateral row, rotational press, anti-rotation trunk, and med ball preparation.",
      "Do not remove the bench; do not add excessive isolation work."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "band pull-apart",
          "prescription": "1x12"
        },
        {
          "name": "push-up",
          "prescription": "1x8"
        },
        {
          "name": "2 progressive ramp-up sets on bench",
          "prescription": ""
        }
      ],
      "notes": [
        "Shoulder and thoracic activation before pressing."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Upper Press",
        "format": "`4 work sets`, `2 min` rest",
        "exercises": [
          {
            "name": "bench press",
            "prescription": "4x8-10"
          }
        ],
        "coachingNotes": [
          "Bilateral anchor. RPE 6-8, controlled and repeatable."
        ],
        "fallbackOptions": [
          "A: `Neutral-Grip DB Bench Press`"
        ]
      },
      {
        "number": 2,
        "name": "Unilateral Pull / Rotational Press",
        "format": "`4 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "single-arm db row",
            "prescription": "4x8-10/side"
          },
          {
            "name": "half-kneeling landmine press",
            "prescription": "3-4x8-10/side"
          }
        ],
        "coachingNotes": [
          "This is the main positional accent block.",
          "Single-arm row develops unilateral pulling strength and anti-rotation demand.",
          "Landmine press introduces rotational pressing pattern — key for open-field ball handling.",
          "Both exercises challenge trunk stability unilaterally."
        ],
        "fallbackOptions": [
          "A: `Chest-Supported Row` bilateral",
          "B: `Seated DB Overhead Press`"
        ]
      },
      {
        "number": 3,
        "name": "Anti-Rotation / Vertical Pull",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "pallof press hold",
            "prescription": "3x15-20s/side"
          },
          {
            "name": "neutral-grip pull-up",
            "prescription": "3x6-8"
          }
        ],
        "coachingNotes": [
          "Pallof builds anti-rotation endurance for direction changes.",
          "Pull-up: full range, dead hang to chin over."
        ],
        "fallbackOptions": [
          "A: `Lat Pulldown`"
        ]
      },
      {
        "number": 4,
        "name": "Arms / Rotational Prep",
        "format": "`2-3 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "hammer curl",
            "prescription": "3x10-12"
          },
          {
            "name": "rope pressdown",
            "prescription": "3x10-12"
          },
          {
            "name": "face pull",
            "prescription": "2x12-15"
          },
          {
            "name": "med ball rotational throw",
            "prescription": "2x4/side"
          }
        ],
        "coachingNotes": [
          "Arms stay common. Face pull for shoulder health.",
          "Med ball rotational throw at low volume introduces rotational power pattern.",
          "Keep throws controlled — this is prep, not peak power."
        ]
      }
    ],
    "progressionRules": [
      "`Semaine 1`: establish form on landmine press and single-arm row.",
      "`Semaine 2`: increase loads if form is clean.",
      "`Semaine 3`: highest volume; RPE 7-8 allowed.",
      "`Semaine 4 (décharge)`: reduce -25-30%. Drop med ball throws and face pull first."
    ],
    "positionAccent": [
      "Back-three session: unilateral row + rotational press in Block 2, anti-rotation in Block 3, med ball prep in Block 4."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bench Press`",
          "`Half-Kneeling Landmine Press`"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Seated DB Overhead Press`"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [],
        "replaceWith": [],
        "rehabFinisher": []
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Half-Kneeling Landmine Press` if bracing fails"
        ],
        "replaceWith": [
          "`Seated DB Overhead Press`"
        ],
        "rehabFinisher": [
          "breathing work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not remove the bench anchor.",
      "Rotational throws are low-volume prep, not a power block.",
      "Unilateral row and landmine press demand trunk control — do not rush."
    ],
    "sourceReferences": [
      "[off-season-periodization.md]",
      "[periodization.md] — Position demands §3.2"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_OFFSEASON_HYPERTROPHY_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "upper",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (common base with light accents)",
      "equipment": "full_gym",
      "targetDuration": "55-70 min"
    },
    "title": "UPPER_OFFSEASON_HYPERTROPHY_V1",
    "goal": [
      "Rebuild useful upper-body muscle mass during the main off-season hypertrophy block.",
      "Accumulate meaningful pressing, rowing, vertical support, and arm/shoulder volume without losing rugby relevance.",
      "Give the player an off-season upper session that feels productive and satisfying without drifting into random bodybuilding fluff."
    ],
    "sessionIdentity": [
      "This is an off-season hypertrophy upper session, not a transition session and not a pre-season force day.",
      "Rugby-specific through useful pressing, pulling, shoulder support, trunk involvement, and controlled arm volume.",
      "Do not turn this into a bench-only ego session or an endless accessory festival."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x6-8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "band pull-apart",
          "prescription": "1x10"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this practical and short.",
        "The player should feel ready for upper volume, not pre-fatigued.",
        "If they already have a reliable upper warm-up, they can keep it."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Upper Push Hypertrophy",
        "format": "`4 work sets`, `2 min` rest between sets",
        "exercises": [
          {
            "name": "Bench Press",
            "prescription": "4x8-10"
          }
        ],
        "coachingNotes": [
          "Keep the press around `RPE 6-8` across the block.",
          "This is the anchor press of the session.",
          "Reps should stay controlled and repeatable, not grindy."
        ],
        "fallbackOptions": [
          "A: `Neutral-Grip DB Bench Press`"
        ]
      },
      {
        "number": 2,
        "name": "Main Upper Pull / Secondary Push Pair",
        "format": "`4 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Chest-Supported Row",
            "prescription": "4x8-10"
          },
          {
            "name": "Incline DB Bench Press",
            "prescription": "3-4x8-10"
          }
        ],
        "coachingNotes": [
          "This is the main structural volume block of the session.",
          "The row should stay strict and full-range.",
          "The incline press should feel like useful upper-chest and shoulder support, not a second ego press."
        ],
        "fallbackOptions": [
          "A: `Single-Arm DB Row`",
          "B: `Machine Chest Press`"
        ]
      },
      {
        "number": 3,
        "name": "Vertical Support Pair",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Seated DB Overhead Press",
            "prescription": "3x8-10"
          },
          {
            "name": "Neutral-Grip Lat Pulldown",
            "prescription": "3x10-12"
          }
        ],
        "coachingNotes": [
          "This block restores vertical push/pull support without making it the main event.",
          "Keep both movements controlled and honest.",
          "This is support volume, not a shoulder test."
        ],
        "fallbackOptions": [
          "A: `Half-Kneeling Landmine Press`",
          "B: `Assisted Neutral-Grip Pull-Up`"
        ]
      },
      {
        "number": 4,
        "name": "Arms (Curl + Pressdown)",
        "format": "`3 rounds`, `60-75s` rest after the pair",
        "exercises": [
          {
            "name": "Hammer Curl",
            "prescription": "3x10-12"
          },
          {
            "name": "Rope Pressdown",
            "prescription": "3x10-12"
          }
        ],
        "coachingNotes": [
          "Paire de base bras — toujours faite.",
          "Charge sous-maximale, technique stricte, pas de triche."
        ]
      },
      {
        "number": 5,
        "name": "Shoulder Health",
        "format": "`3 rounds`, `45-60s` rest after the round",
        "exercises": [
          {
            "name": "Face Pull",
            "prescription": "3x12-15"
          },
          {
            "name": "Lateral Raise",
            "prescription": "2x12-15",
            "isOptional": true
          },
          {
            "name": "T-Y-I Incline Bench",
            "prescription": "2x5 (5s per position: T, Y, I)",
            "isOptional": true
          }
        ],
        "coachingNotes": [
          "Bloc santé épaule rugby — 3 têtes du deltoïde + trapèze inférieur (via le Y du T-Y-I).",
          "Face Pull 3x reste prioritaire (KB injury-prevention) — Lateral Raise et T-Y-I optionnels en cas de fatigue accumulée pour rester sous 13 sets sur la séance.",
          "T-Y-I : 5 reps par position avec 5s de tenue en position haute (T = rear delt pur, Y = trap inf, I = trap sup/cervical). Haltères légers, technique stricte.",
          "Loin de l'échec — c'est de la qualité, pas du volume inutile."
        ]
      }
    ],
    "progressionRules": [
      "`Semaine 1`: start at the lower end of the load range and establish clean volume tolerance.",
      "`Semaine 2`: increase load only if pressing and pulling are recovering well while keeping secondary push work at `3 sets`.",
      "`Semaine 3`: this is the highest volume week; allow hard but clean sets with `1-2 RIR`.",
      "`Semaine 3`: progress `Incline DB Bench Press` to `4 sets` only if recovery supports it.",
      "`Semaine 4 (décharge)`: reduce total volume around `-25 to -30%` while keeping useful load.",
      "Reduce optional exercises of Block 5 first (Lateral Raise + T-Y-I) if fatigue rises.",
      "Reduce one round from Block 3 second.",
      "Keep Blocks 1 and 2 as the structural priorities of the session."
    ],
    "positionAccent": [
      "This session is still mostly common.",
      "`Front_row` accent:",
      "slightly more bracing and control on bench and overhead press",
      "slightly more interest in arm/support thickness",
      "`Back_three` accent:",
      "slightly more fluid pressing and pulling rhythm",
      "slightly more attention to shoulder freedom and posture",
      "The skeleton remains identical for both groups."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bench Press`",
          "`Incline DB Bench Press`",
          "`Seated DB Overhead Press`",
          "`Lateral Raise` if aggravating"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Machine Chest Press`",
          "`Half-Kneeling Landmine Press`",
          "skip Block 5 optional exercises (Lateral Raise + T-Y-I) if needed"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`",
          "`scap push-up`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "none by default in this upper session unless setup is clearly aggravating"
        ],
        "replaceWith": [
          "seated variation if standing setup is uncomfortable"
        ],
        "rehabFinisher": [
          "none by default in this upper session unless symptoms require it"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Seated DB Overhead Press` only if trunk support is poor",
          "unsupported row alternatives if posture breaks"
        ],
        "replaceWith": [
          "`Half-Kneeling Landmine Press`",
          "`Chest-Supported Row`"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "This session should build muscle, not prove strength.",
      "Do not let bench and incline both turn into grinders.",
      "Do not let the accessory block become an excuse for junk volume.",
      "The optional shoulder pair is for quality and adherence, not for destroying the delts."
    ],
    "sourceReferences": [
      "[tech-spec-off-season-rugbyprep-2026-03-20.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-off-season-rugbyprep-2026-03-20.md)",
      "[WEEKLY_TEMPLATES_OFF_SEASON.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/WEEKLY_TEMPLATES_OFF_SEASON.md)",
      "[UPPER_OFFSEASON_TRANSITION_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/UPPER_OFFSEASON_TRANSITION_V1.md)",
      "[UPPER_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/UPPER_PRESEASON_FORCE_V1.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_OFFSEASON_TRANSITION_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "off_season",
      "sessionType": "upper",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (common base)",
      "equipment": "full_gym",
      "targetDuration": "40-50 min"
    },
    "title": "UPPER_OFFSEASON_TRANSITION_V1",
    "goal": [
      "Rebuild upper-body training structure after the recovery block without jumping too fast into true hypertrophy or force work.",
      "Restore bilateral pressing, real rowing, and simple vertical support under moderate load.",
      "Support shoulder health and trunk control while making the player feel like upper training has properly restarted."
    ],
    "sessionIdentity": [
      "This is a transition upper session, not a recovery session anymore and not yet a serious off-season build.",
      "Rugby-specific through useful push/pull patterns, shoulder-friendly structure, and simple trunk support.",
      "Do not turn this into a bench test, a bodybuilding pump day, or a big accessory session."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x6-8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8"
        },
        {
          "name": "band pull-apart",
          "prescription": "1x10"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "Keep this short and practical.",
        "The player should feel ready for moderate upper training, not primed for max effort.",
        "If they already have a reliable upper warm-up, they can keep it."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Press / Pull Base Pair",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Bench Press",
            "prescription": "3x6-8"
          },
          {
            "name": "Chest-Supported Row",
            "prescription": "3x8-10"
          }
        ],
        "coachingNotes": [
          "Keep both lifts around `RPE 5-6`.",
          "This is the first real bilateral upper loading block after Recovery.",
          "Bench should feel stable and comfortable, not competitive.",
          "The row should feel strong and clean without lower-back involvement."
        ],
        "fallbackOptions": [
          "A: `Neutral-Grip DB Bench Press`",
          "B: `Cable Row`"
        ]
      },
      {
        "number": 2,
        "name": "Vertical Support Pair",
        "format": "`3 rounds`, `75-90s` rest after the pair",
        "exercises": [
          {
            "name": "Half-Kneeling Landmine Press",
            "prescription": "3x6-8/side"
          },
          {
            "name": "Neutral-Grip Lat Pulldown",
            "prescription": "3x8-10"
          }
        ],
        "coachingNotes": [
          "This block reintroduces vertical-ish upper work without pushing intensity too fast.",
          "Landmine press should feel stacked, smooth, and shoulder-friendly.",
          "Pulldown should restore vertical pulling rhythm, not become a lat burnout block."
        ],
        "fallbackOptions": [
          "A: `Single-Arm DB Press`",
          "B: `Assisted Neutral-Grip Pull-Up`"
        ]
      },
      {
        "number": 3,
        "name": "Shoulder / Trunk Support",
        "format": "`2 rounds`, minimal rest",
        "exercises": [
          {
            "name": "Face Pull",
            "prescription": "2x10-12"
          },
          {
            "name": "Pallof Press Hold",
            "prescription": "2x15-20s/side"
          }
        ],
        "coachingNotes": [
          "This block supports scapular rhythm, posture, and trunk stiffness.",
          "Keep everything smooth and submaximal.",
          "The player should finish feeling organized and supported, not worked over."
        ]
      }
    ],
    "progressionRules": [
      "`S3`: use moderate reference loads and keep all reps clean and comfortable.",
      "`S4`: add a small load increase only if pressing and pulling still feel shoulder-friendly and controlled.",
      "Progress confidence and tolerance before pushing loading.",
      "If fatigue is high, reduce one round from Block 2 before cutting Block 1.",
      "This session should still sit clearly below hypertrophy density."
    ],
    "positionAccent": [
      "This session is still largely common in Transition.",
      "`Front_row` accent:",
      "slightly more bracing intent on bench and landmine press",
      "slightly more posture and stiffness through Block 3",
      "`Back_three` accent:",
      "slightly more fluid pressing and pulling rhythm",
      "slightly more freedom of movement through the shoulder girdle",
      "The skeleton remains identical for both groups."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bench Press`",
          "`Half-Kneeling Landmine Press` if provocative"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Cable Press` or lighter landmine angle if better tolerated"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`",
          "`scap push-up`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "`Half-Kneeling Landmine Press` only if the half-kneeling position is uncomfortable"
        ],
        "replaceWith": [
          "`Standing Landmine Press`",
          "or `Seated DB Press`"
        ],
        "rehabFinisher": [
          "none by default in this upper session unless symptoms require it"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "`Half-Kneeling Landmine Press` if trunk demand is irritating",
          "`Pallof Press Hold` if it aggravates symptoms"
        ],
        "replaceWith": [
          "`Seated DB Press`",
          "lighter trunk support or breathing-based stiffness work"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "This session should feel like a re-entry into upper training, not a test of pressing strength.",
      "Do not let the bench become a grind just because the player “feels fresh”.",
      "Do not turn the lat pulldown into sloppy fatigue chasing.",
      "Keep the final support block calm and useful."
    ],
    "sourceReferences": [
      "[tech-spec-off-season-rugbyprep-2026-03-20.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-off-season-rugbyprep-2026-03-20.md)",
      "[WEEKLY_TEMPLATES_OFF_SEASON.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/WEEKLY_TEMPLATES_OFF_SEASON.md)",
      "[FULL_OFFSEASON_RECOVERY_A_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/off-season/FULL_OFFSEASON_RECOVERY_A_V1.md)",
      "[UPPER_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/UPPER_PRESEASON_FORCE_V1.md)",
      "[UPPER_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/UPPER_IN_SEASON_FRONT_ROW_V1.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_PRESEASON_FORCE_POWER_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "upper",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (phase 2 common base with marked accents)",
      "equipment": "full_gym",
      "targetDuration": "50-55 min"
    },
    "title": "UPPER_PRESEASON_FORCE_POWER_V1",
    "goal": [
      "Begin converting upper-body force into rugby-usable power during weeks 5 to 8 of pre-season.",
      "Keep one clear upper contrast pair as the main session driver.",
      "Maintain strong pulling and useful upper support work while slightly reducing total volume compared with Phase 1."
    ],
    "sessionIdentity": [
      "This is a force-power upper session, not yet a pure power primer.",
      "Rugby-specific through a readable upper contrast, strong pulling, and a simple support finisher.",
      "Do not overload this session with multiple explosive press variations or accessory clutter."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8-10"
        },
        {
          "name": "band pull-apart or TYI light",
          "prescription": "1-2x10"
        },
        {
          "name": "2-3 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own upper-body warm-up if it covers thoracic mobility, scap control, and pressing readiness.",
        "Keep this short and useful.",
        "The goal is readiness and speed, not fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Contrast Upper Force-Speed",
        "format": "`4 rounds`, full rest `3 min` after each round",
        "exercises": [
          {
            "name": "Bench Press",
            "prescription": "4x4 @ 82-85%"
          },
          {
            "name": "Plyo Push-Up",
            "prescription": "4x4-5"
          }
        ],
        "coachingNotes": [
          "Bench must stay crisp and technically clean.",
          "Concentric intent is maximal.",
          "Plyo push-up stops as soon as height or stiffness clearly drops.",
          "This is the major change from Phase 1: the press is now immediately converted into fast force.",
          "Keep it readable: one heavy press, one explosive push, nothing extra."
        ]
      },
      {
        "number": 2,
        "name": "Main Upper Pull",
        "format": "`4 work sets`, `2-3 min` rest between sets",
        "exercises": [
          {
            "name": "Neutral-Grip Pull-Up",
            "prescription": "4x4-6"
          }
        ],
        "coachingNotes": [
          "Add load only if the player owns full range and clean body position.",
          "This block keeps a real force anchor in the session while the press becomes contrast-led.",
          "Do not let weighted pull-ups turn into ugly survival reps."
        ]
      },
      {
        "number": 3,
        "name": "Upper Support Strength Pair",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Strict Standing Overhead Press",
            "prescription": "3x5"
          },
          {
            "name": "T-Bar Row",
            "prescription": "3x6"
          }
        ],
        "coachingNotes": [
          "Overhead press should stay strict, stacked, and controlled.",
          "T-Bar row should stay strong without torso cheating.",
          "This block supports force retention while the contrast block becomes the session priority."
        ]
      },
      {
        "number": 4,
        "name": "Position Support Finisher",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Med Ball Rotational Throw",
            "prescription": "3-4/side"
          },
          {
            "name": "Banded Neck Isometric",
            "prescription": "15-20s"
          },
          {
            "name": "Face Pull",
            "prescription": "3x12-15"
          }
        ],
        "coachingNotes": [
          "The med ball throw should stay sharp, violent, and technically clean.",
          "Neck work should stay controlled and never become a fatigue contest.",
          "Face pull : volume pull + santé épaule, équilibre la session face aux contrast push B1.",
          "Front row can use a slightly heavier throw intent and place more emphasis on the neck.",
          "Back three should keep the throw slightly cleaner and faster.",
          "This block should support upper-body transfer, not flatten the player."
        ]
      }
    ],
    "progressionRules": [
      "`W5`: establish clean contrast rhythm and reference loads.",
      "`W6`: add `+2.5 kg` on the bench only if bar speed and plyo quality stay high.",
      "`W7`: keep load progression if earned, or add one round to Block 4 if recovery is good.",
      "`W8`: deload by reducing total volume around `-30%` while keeping movement quality high.",
      "Reduce Block 4 first if fatigue rises.",
      "Reduce one round from Block 3 second.",
      "Keep Block 1 as the protected priority if the player is still moving explosively."
    ],
    "positionAccent": [
      "This session is still shared in Phase 2, but the accents are now more visible.",
      "Front row accent:",
      "slightly more bracing and force intent on the bench",
      "slightly heavier rotational throw intent",
      "slightly less “bounce” and more violence in the push pattern",
      "Back three accent:",
      "slightly cleaner, faster push-up expression",
      "slightly more fluid rotational throw profile",
      "slightly more athletic, less contact-heavy feel overall",
      "The skeleton stays shared, but the feeling of the session should no longer be identical by position."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bench Press`",
          "`Plyo Push-Up`",
          "`Strict Standing Overhead Press`",
          "`Med Ball Rotational Throw`"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Single-Arm Landmine Press`",
          "`Pallof Press Hold`"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`",
          "`scapular control drill`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "none by default unless throwing stance clearly aggravates the player"
        ],
        "replaceWith": [
          "controlled throw stance variation",
          "static hold if needed"
        ],
        "rehabFinisher": [
          "none by default in this upper session unless symptoms require it"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "heavy unsupported pulling only if posture cannot stay clean",
          "`Med Ball Rotational Throw` if rotation aggravates symptoms"
        ],
        "replaceWith": [
          "`Chest-Supported Row`",
          "`Pallof Press Hold`"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the bench become a slow grind.",
      "Do not let the plyo push-up become fatigue work.",
      "Do not add load to pull-ups at the expense of range and position.",
      "Do not let the support pair turn into sloppy volume.",
      "Do not let the med ball throw turn into a heavy conditioning drill.",
      "This session should feel more explosive than Phase 1, but still structured and absorbable."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[UPPER_PRESEASON_FORCE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/UPPER_PRESEASON_FORCE_V1.md)",
      "[UPPER_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/UPPER_IN_SEASON_FRONT_ROW_V1.md)",
      "[UPPER_IN_SEASON_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/UPPER_IN_SEASON_BACK_THREE_V1.md)",
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[upper-4.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/upper-4.jpg)",
      "[upper-2.jpeg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/upper-2.jpeg)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_PRESEASON_FORCE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "upper",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row + back_three (phase 1 common base)",
      "equipment": "full_gym",
      "targetDuration": "50-60 min"
    },
    "title": "UPPER_PRESEASON_FORCE_V1",
    "goal": [
      "Build upper-body force capacity for the first 4 weeks of pre-season.",
      "Reinforce horizontal pushing, strong pulling, and useful upper support work without drifting into contrast training too early.",
      "Keep the session rugby-specific through contact-relevant force, trunk involvement, and a simple position finisher."
    ],
    "sessionIdentity": [
      "This is a construction upper session, not a primer and not a speed-power upper day.",
      "Rugby-specific through a heavy press, a real pulling focus, and a simple support finisher that still feels athletic.",
      "Do not dilute this session with too many explosive drills, too much arm fluff, or a rehab-style accessory festival."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8-10"
        },
        {
          "name": "band pull-apart or TYI light",
          "prescription": "1-2x10"
        },
        {
          "name": "2-3 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own upper-body warm-up if it covers thoracic mobility, scap control, and pressing readiness.",
        "Keep this short and useful.",
        "The goal is readiness for force production, not early fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Main Upper Force",
        "format": "`4 work sets`, `2-3 min` rest between sets",
        "exercises": [
          {
            "name": "Bench Press",
            "prescription": "4x5"
          }
        ],
        "coachingNotes": [
          "This is the anchor press of the session.",
          "Reps must stay clean with `RIR 1-2`.",
          "Control the descent, then drive with intent.",
          "This block is about building force, not chasing grinders."
        ]
      },
      {
        "number": 2,
        "name": "Main Upper Pull",
        "format": "`4 work sets`, `2-3 min` rest between sets",
        "exercises": [
          {
            "name": "Neutral-Grip Pull-Up",
            "prescription": "4x5-6"
          }
        ],
        "coachingNotes": [
          "Add load only if the player owns full range and clean body position.",
          "If bodyweight pull-ups are already very hard, keep them clean rather than forcing load.",
          "This should feel like real upper force work, not conditioning."
        ]
      },
      {
        "number": 3,
        "name": "Upper Support Strength Pair",
        "format": "`3 rounds`, `90-120s` rest after the pair",
        "exercises": [
          {
            "name": "Strict Standing Overhead Press",
            "prescription": "3x5-6"
          },
          {
            "name": "T-Bar Row",
            "prescription": "3x6-8"
          }
        ],
        "coachingNotes": [
          "Overhead press should stay strict, stacked, and controlled.",
          "T-Bar row should stay strong and strict, without torso cheating.",
          "This block supports the main press and pull without turning the session into a hypertrophy circuit."
        ]
      },
      {
        "number": 4,
        "name": "Position Support Finisher",
        "format": "`2 rounds`, `45-60s` rest",
        "exercises": [
          {
            "name": "Front Rack Carry",
            "prescription": "20m"
          },
          {
            "name": "Cable Chop",
            "prescription": "2-3x6-8/side"
          }
        ],
        "coachingNotes": [
          "Front rack carry should reinforce posture, trunk stiffness, and upper-body support strength.",
          "Cable chop should stay controlled and athletic, not rushed or sloppy.",
          "This block should reinforce posture, rotation strength, and robustness, not flatten the player."
        ]
      }
    ],
    "progressionRules": [
      "`W1`: establish clean reference loads.",
      "`W2`: add `+2.5 kg` on bench and external load on pull-ups only if all reps stay clean.",
      "`W3`: keep load progression if earned, or add one round to Block 3 if recovery is good.",
      "`W4`: deload by reducing total volume around `-30%` while keeping movement quality high.",
      "Reduce Block 4 first if fatigue rises.",
      "Reduce one round from Block 3 second.",
      "Keep Block 1 and Block 2 as the protected priorities unless the athlete is clearly under-recovered."
    ],
    "positionAccent": [
      "This session is intentionally common in Phase 1.",
      "Front row accent:",
      "slightly more bracing and contact intent on pressing",
      "slightly heavier carry",
      "slightly more braced, force-oriented trunk work",
      "Back three accent:",
      "slightly cleaner, more athletic tempo on pull-ups and carries",
      "slightly cleaner, more dynamic intent on the chop",
      "less contact bias for now",
      "The skeleton stays the same for both groups at this stage."
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bench Press`",
          "`Strict Standing Overhead Press`",
          "`Front Rack Carry` only if it aggravates the shoulder position"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Single-Arm Landmine Press`",
          "shorter carry distance or `Pallof Hold`"
        ],
        "rehabFinisher": [
          "`band external rotation`",
          "`serratus reach`",
          "`scap push-up`"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "carry only if it clearly aggravates the player"
        ],
        "replaceWith": [
          "reduced-distance carry",
          "static hold or controlled chop stance variation"
        ],
        "rehabFinisher": [
          "none by default in this upper session unless symptoms require it"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "heavy unsupported pulling only if posture cannot stay clean",
          "heavy `Front Rack Carry`"
        ],
        "replaceWith": [
          "`Chest-Supported Row`",
          "lighter carry or `Pallof Hold`"
        ],
        "rehabFinisher": [
          "breathing and trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the bench become a sloppy grind in Phase 1.",
      "Do not add load to pull-ups at the expense of range and position.",
      "Do not let the overhead press or T-Bar row turn into sloppy fatigue junk.",
      "Keep the finisher simple and useful.",
      "This session should feel like upper construction, not like a pumped-up bodybuilding day."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[UPPER_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/UPPER_IN_SEASON_FRONT_ROW_V1.md)",
      "[UPPER_IN_SEASON_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/UPPER_IN_SEASON_BACK_THREE_V1.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[off-season-periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/off-season-periodization.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[upper-2.jpeg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/upper-2.jpeg)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)",
      "[upper-4.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/upper-4.jpg)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_PRESEASON_POWER_BACK_THREE_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "upper",
      "targetLevel": "performance",
      "targetPositionGroup": "back_three",
      "equipment": "full_gym",
      "targetDuration": "42-52 min"
    },
    "title": "UPPER_PRESEASON_POWER_BACK_THREE_V1",
    "goal": [
      "Express upper-body power specific to back-three demands during weeks 9 to 12 of pre-season.",
      "Use a speed-biased push-power cluster that links fast force, ballistic projection, and reactive upper-body stiffness.",
      "Maintain useful pulling qualities without letting support volume flatten the player.",
      "Finish with trunk and rotational power that support open-field speed and contact robustness."
    ],
    "sessionIdentity": [
      "This is a back-three power upper session, not just a generic upper power day.",
      "Rugby-specific through a fast upper cluster, useful pulling, rotational trunk expression, and a short athletic finisher.",
      "This session should feel faster, cleaner, and more open-field oriented than the front-row version.",
      "Do not dilute this session with extra pressing volume, bodybuilding fluff, or conditioning-style fatigue."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8-10"
        },
        {
          "name": "band pull-apart or TYI light",
          "prescription": "1-2x10"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own upper-body warm-up if it covers thoracic mobility, scap control, and pressing readiness.",
        "Keep this short and useful.",
        "The goal is readiness and speed of force expression, not fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Back Three Upper Power Cluster",
        "format": "`4 rounds`, `10-15s` between exercises, full rest `3-4 min` after each round",
        "exercises": [
          {
            "name": "Bench Press",
            "prescription": "4x2-3 @ 78-82%"
          },
          {
            "name": "Med Ball Chest Pass",
            "prescription": "3 reps"
          },
          {
            "name": "Plyo Push-Up",
            "prescription": "3-4 reps"
          }
        ],
        "coachingNotes": [
          "Bench must stay fast and technically clean.",
          "Concentric intent is maximal; no grinding reps.",
          "The throw stays sharp and ballistic, not heavy.",
          "Plyo push-ups stop as soon as reactivity clearly drops.",
          "The cluster should feel quicker and less collision-heavy than the front-row version."
        ],
        "fallbackOptions": [
          "B: `Supine Med Ball Throw`",
          "C: `Press-Up Exchange`"
        ]
      },
      {
        "number": 2,
        "name": "Upper Pull Cluster",
        "format": "`3 rounds`, `90-120s` rest after the triplet",
        "exercises": [
          {
            "name": "Neutral-Grip Pull-Up",
            "prescription": "3x4-5"
          },
          {
            "name": "Chest-Supported Row",
            "prescription": "3x5-6"
          },
          {
            "name": "Face Pull",
            "prescription": "3x12-15"
          }
        ],
        "coachingNotes": [
          "Pull-up : add load only if the player owns full range and clean body position.",
          "Row : stay strong, clean, no torso compensation.",
          "Face Pull : rear delt / rotator — double bénéfice volume pull + santé épaule.",
          "Ce triplet miroir le power cluster B1 pour équilibre push/pull rugby (plaquage, ruck-over)."
        ]
      },
      {
        "number": 3,
        "name": "Athletic Finisher",
        "format": "`EMOM 6'`",
        "exercises": [
          {
            "name": "Suitcase Carry",
            "prescription": "20m/side",
            "slotLabel": "minute 1"
          },
          {
            "name": "Med Ball Rotational Throw",
            "prescription": "2-3/side",
            "slotLabel": "minute 2"
          }
        ],
        "coachingNotes": [
          "Suitcase carry should reinforce trunk stiffness and unilateral posture without slowing the player down.",
          "The rotational throw should stay sharp and coordinated, not become a fatigue drill.",
          "If no med ball is available, replace with `Cable Rotation` or `Cable Chop explosif` `3x5-6/side`.",
          "If weekly rotational work is already high, replace the throw slot with `Pallof Press Hold` `15-20s/side`.",
          "If the player also performs `LOWER_PRESEASON_POWER_BACK_THREE_V1` in the same week, keep this throw at the low end of the range or use the Pallof swap."
        ]
      },
      {
        "number": 4,
        "name": "Mandatory Shoulder Prehab Micro-Block",
        "format": "`1-2 rounds`, `20-30s` rest between drills",
        "exercises": [
          {
            "name": "Band External Rotation",
            "prescription": "10-12 reps"
          },
          {
            "name": "Serratus Reach",
            "prescription": "8-10 reps"
          },
          {
            "name": "Scap Push-Up",
            "prescription": "8-10 reps"
          }
        ],
        "coachingNotes": [
          "This block is mandatory in Phase 3 because Block 1 carries a high push-speed demand.",
          "Keep it clean, light, and non-fatiguing.",
          "It should take around `2-3 min`, not become a separate accessory block."
        ]
      }
    ],
    "progressionRules": [
      "`W9`: establish clean power rhythm and reference loads.",
      "`W10`: add `+2.5 kg` on the bench only if bar speed, throw quality, and push-up stiffness all stay high.",
      "`W11`: maintain load and improve execution quality rather than forcing more weight.",
      "`W12`: reduce volume around `-30%` while preserving speed and sharpness.",
      "Reduce Block 3 first if fatigue rises.",
      "Reduce Block 2 second.",
      "Keep Block 4 unless shoulder irritability requires a different rehab emphasis.",
      "Keep Block 1 as the protected priority if the athlete is still moving explosively."
    ],
    "positionAccent": [
      "This session is explicitly back-three specific.",
      "Back-three identity comes from:",
      "slightly lower pressing load and higher speed intent than the front-row version",
      "more ballistic upper output and rotational expression",
      "more trunk/unilateral carry emphasis",
      "less neck/contact bias by default"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Bench Press`",
          "`Med Ball Chest Pass`",
          "`Plyo Push-Up`"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Single-Arm Landmine Press`",
          "safer row emphasis if needed"
        ],
        "rehabFinisher": [
          "keep the micro-block, but bias it further toward pain-free scapular control"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "carry only if it clearly aggravates the player"
        ],
        "replaceWith": [
          "shorter carry distance",
          "static hold if needed"
        ],
        "rehabFinisher": [
          "none by default in this upper session unless symptoms require it"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "unsupported row only if posture cannot stay clean",
          "heavy carry if bracing cannot stay clean",
          "rotational throw if rotation aggravates symptoms"
        ],
        "replaceWith": [
          "`Chest-Supported Row`",
          "lighter suitcase carry or anti-rotation hold",
          "`Pallof Press Hold`"
        ],
        "rehabFinisher": [
          "breathing + trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the bench become a slow grind.",
      "Do not let the med ball throw or plyo push-up drift into fatigue work.",
      "Do not add load to pull-ups at the expense of range and position.",
      "Do not let the pull support pair turn into sloppy volume.",
      "Keep the finisher athletic and crisp.",
      "Do not skip the shoulder micro-block just because the player feels good.",
      "This session should feel sharp, fast, and clearly more speed-biased than the front-row version."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[UPPER_PRESEASON_FORCE_POWER_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/UPPER_PRESEASON_FORCE_POWER_V1.md)",
      "[UPPER_IN_SEASON_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/UPPER_IN_SEASON_BACK_THREE_V1.md)",
      "[FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1.md)",
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[upper-4.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/upper-4.jpg)",
      "[upper-2.jpeg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/upper-2.jpeg)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)"
    ]
  },
  {
    "metadata": {
      "id": "UPPER_PRESEASON_POWER_FRONT_ROW_V1",
      "status": "validated",
      "version": "V1",
      "cycle": "pre_season",
      "sessionType": "upper",
      "targetLevel": "performance",
      "targetPositionGroup": "front_row",
      "equipment": "full_gym",
      "targetDuration": "44-54 min"
    },
    "title": "UPPER_PRESEASON_POWER_FRONT_ROW_V1",
    "goal": [
      "Express upper-body power specific to front-row demands during weeks 9 to 12 of pre-season.",
      "Use a dominant push-power cluster that links heavy contact intent, ballistic projection, and reactive upper-body stiffness.",
      "Maintain useful pulling qualities without letting support volume blur the session message.",
      "Finish with front-row-specific robustness, then close with a mandatory shoulder-health micro-dose."
    ],
    "sessionIdentity": [
      "This is a front-row power upper session, not just a generic upper power day.",
      "Rugby-specific through a heavy-to-fast push cluster, strong pulling, and a short front-row finisher built around carry and neck robustness.",
      "This session should feel more violent, more contact-oriented, and more expressive than the earlier pre-season upper sessions.",
      "Do not dilute this session with arm fluff, too many explosive extras, or conditioning-style fatigue."
    ],
    "warmUp": {
      "exercises": [
        {
          "name": "thoracic rotation",
          "prescription": "1x8/side"
        },
        {
          "name": "scap push-up",
          "prescription": "1x8-10"
        },
        {
          "name": "band pull-apart or TYI light",
          "prescription": "1-2x10"
        },
        {
          "name": "2 progressive ramp-up sets",
          "prescription": ""
        }
      ],
      "notes": [
        "The player can keep their own upper-body warm-up if it covers thoracic mobility, scap control, and pressing readiness.",
        "Keep this short and useful.",
        "The goal is readiness and speed of force expression, not fatigue."
      ]
    },
    "blocks": [
      {
        "number": 1,
        "name": "Front Row Upper Power Cluster",
        "format": "`4 rounds`, `10-15s` between exercises, full rest `3-4 min` after each round",
        "exercises": [
          {
            "name": "Football Bar Bench Press",
            "prescription": "4x3 @ 80-85%"
          },
          {
            "name": "Supine Med Ball Throw",
            "prescription": "3 reps"
          },
          {
            "name": "Plyo Push-Up",
            "prescription": "3-4 reps"
          }
        ],
        "coachingNotes": [
          "The press must stay crisp, braced, and technically clean.",
          "Concentric intent is maximal; no grinding reps.",
          "The throw stays violent and low-volume.",
          "Plyo push-ups stop as soon as stiffness or height clearly drops.",
          "The cluster should feel like heavy contact intent converted into fast upper-body projection.",
          "Automatic alternative if the bar is not available: `Neutral-Grip DB Bench Press`."
        ],
        "fallbackOptions": [
          "A1: `Neutral-Grip DB Bench Press`",
          "A2: `Bench Press`",
          "B: `Med Ball Chest Pass`",
          "C: `Press-Up Exchange`"
        ]
      },
      {
        "number": 2,
        "name": "Upper Pull Cluster",
        "format": "`3 rounds`, `90-120s` rest after the triplet",
        "exercises": [
          {
            "name": "Neutral-Grip Pull-Up",
            "prescription": "3x4-5"
          },
          {
            "name": "T-Bar Row",
            "prescription": "3x5-6"
          },
          {
            "name": "Face Pull",
            "prescription": "3x12-15"
          }
        ],
        "coachingNotes": [
          "Pull-up : add load only if the player owns full range and clean body position.",
          "T-Bar row : strong and strict, no torso cheating.",
          "Face Pull : rear delt / rotator — double bénéfice volume pull + santé épaule pré-saison.",
          "Ce triplet miroir le power cluster B1 pour équilibre push/pull rugby front-row (plaquage, maul counter-push)."
        ]
      },
      {
        "number": 3,
        "name": "Front Row Finisher",
        "format": "`EMOM 6'`",
        "exercises": [
          {
            "name": "Zercher Carry or Farmer Carry",
            "prescription": "20m",
            "slotLabel": "minute 1"
          },
          {
            "name": "Med Ball Rotational Throw",
            "prescription": "3-4/side",
            "slotLabel": "minute 2"
          }
        ],
        "coachingNotes": [
          "Carry choice depends on setup and player comfort, but the intent stays posture, bracing, and contact robustness.",
          "The rotational throw should stay sharp and violent, not become a fatigue drill.",
          "If no med ball is available, replace with `Cable Rotation` or `Cable Chop explosif` `3x5-6/side`.",
          "If weekly neck volume is low or if more contact robustness is needed, replace the throw slot with `Banded Neck Isometric 15-20s` and rotate neck directions across rounds.",
          "This block should feel specific and robust, not exhausting."
        ]
      },
      {
        "number": 4,
        "name": "Mandatory Shoulder Prehab Micro-Block",
        "format": "`1-2 rounds`, `20-30s` rest between drills",
        "exercises": [
          {
            "name": "Band External Rotation",
            "prescription": "10-12 reps"
          },
          {
            "name": "Serratus Reach",
            "prescription": "8-10 reps"
          },
          {
            "name": "Scap Push-Up",
            "prescription": "8-10 reps"
          }
        ],
        "coachingNotes": [
          "This block is mandatory in Phase 3 because Block 1 carries a high push-speed demand.",
          "Keep it clean, light, and non-fatiguing.",
          "It should take around `2-3 min`, not become a separate accessory block."
        ]
      }
    ],
    "progressionRules": [
      "`W9`: establish clean power rhythm and reference loads.",
      "`W10`: add `+2.5 kg` on the main press only if bar speed, throw quality, and push-up stiffness all stay high.",
      "`W11`: maintain load and improve execution quality rather than forcing more weight.",
      "`W12`: reduce volume around `-30%` while preserving speed and sharpness.",
      "Reduce Block 3 (Finisher) first if fatigue rises.",
      "Reduce Block 2 (Pull Cluster) secondarily — drop Face Pull before Row.",
      "Keep Block 4 unless shoulder irritability requires a different rehab emphasis.",
      "Keep Block 1 as the protected priority if the athlete is still moving explosively."
    ],
    "positionAccent": [
      "This session is explicitly front-row specific.",
      "Front-row identity comes from:",
      "heavy braced push intent rather than pure speed bias",
      "stronger contact and collision feel in the main cluster",
      "more robust pulling and posture demands",
      "explicit carry work, with weekly rotation exposure and optional cervical swap if neck volume is needed"
    ],
    "injurySubstitutions": [
      {
        "area": "shoulder_pain",
        "remove": [
          "`Football Bar Bench Press`",
          "`Supine Med Ball Throw`",
          "`Plyo Push-Up`"
        ],
        "replaceWith": [
          "`Neutral-Grip DB Bench Press`",
          "`Single-Arm Landmine Press`",
          "safer row emphasis if needed"
        ],
        "rehabFinisher": [
          "keep the micro-block, but bias it further toward pain-free scapular control"
        ]
      },
      {
        "area": "knee_pain",
        "remove": [
          "carry only if it clearly aggravates the player"
        ],
        "replaceWith": [
          "shorter carry distance",
          "static hold if needed"
        ],
        "rehabFinisher": [
          "none by default in this upper session unless symptoms require it"
        ]
      },
      {
        "area": "low_back_pain",
        "remove": [
          "unsupported row only if posture cannot stay clean",
          "heavy carry if bracing cannot stay clean"
        ],
        "replaceWith": [
          "`Chest-Supported Row`",
          "lighter carry or trunk anti-rotation hold"
        ],
        "rehabFinisher": [
          "breathing + trunk stiffness work"
        ]
      }
    ],
    "coachingWarnings": [
      "Do not let the press become a slow grind just to protect the prescribed load.",
      "Do not let the med ball throw or plyo push-up drift into fatigue work.",
      "Do not add load to pull-ups at the expense of range and position.",
      "Do not let the reduced pull support turn into sloppy volume.",
      "Keep the finisher specific, not crushing.",
      "Do not skip the shoulder micro-block just because the player “feels fine”.",
      "This session should feel violent, sharp, and clearly closer to in-season expression than the earlier pre-season upper sessions."
    ],
    "sourceReferences": [
      "[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](/Users/junca/Projets/RugbyPrepV2/_bmad-output/planning-artifacts/tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md)",
      "[TEMPLATE_MOTHER_SESSION.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/TEMPLATE_MOTHER_SESSION.md)",
      "[UPPER_PRESEASON_FORCE_POWER_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/pre-season/UPPER_PRESEASON_FORCE_POWER_V1.md)",
      "[UPPER_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/UPPER_IN_SEASON_FRONT_ROW_V1.md)",
      "[FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1.md)",
      "[strength-methods.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/strength-methods.md)",
      "[injury-prevention.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/injury-prevention.md)",
      "[periodization.md](/Users/junca/Projets/RugbyPrepV2/src/knowledge/periodization.md)",
      "[upper-4.jpg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/upper-4.jpg)",
      "[upper-2.jpeg](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/upper-2.jpeg)",
      "[pre-season-12week.png](/Users/junca/Projets/RugbyPrepV2/docs/training/Préparation%20Physique/pre-season-12week.png)"
    ]
  }
]

export const MOTHER_SESSIONS_BY_ID: Record<string, MotherSession> = MOTHER_SESSIONS.reduce(
  (acc, s) => {
    acc[s.metadata.id] = s
    return acc
  },
  {} as Record<string, MotherSession>
)

