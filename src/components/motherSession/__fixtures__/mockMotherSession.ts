import type { MotherSession } from '../../../types/motherSession'

/**
 * Mother session réaliste (type `LOWER_PRESEASON_FORCE_V1`) pour développement isolé du lecteur.
 */
export const mockMotherSession: MotherSession = {
  metadata: {
    id: 'LOWER_PRESEASON_FORCE_V1',
    status: 'validated',
    version: 'V1',
    cycle: 'pre_season',
    sessionType: 'lower',
    targetLevel: 'performance',
    targetPositionGroup: 'front_row + back_three (phase 1 common base)',
    equipment: 'full_gym',
    targetDuration: '50-60 min',
  },
  title: 'LOWER_PRESEASON_FORCE_V1',
  goal: [
    'Build lower-body force capacity for the first 4 weeks of pre-season.',
    'Reinforce squat, hinge, unilateral support, and posterior-chain qualities without rushing into power work.',
    'Keep the session rugby-specific through useful support work for groin, trunk, and contact readiness.',
  ],
  sessionIdentity: [
    'This is a construction session, not a primer and not yet a true force-power session.',
    'Rugby-specific through heavy lower fundamentals, unilateral support, hamstring work, and a simple position finisher.',
    'Do not dilute this session with excessive jumps, fancy contrast work, or bodybuilding fluff.',
  ],
  warmUp: {
    exercises: [
      { name: 'ankle rocks', prescription: '1x8/side' },
      { name: 'adductor rock-back', prescription: '1x8/side' },
      { name: 'glute bridge', prescription: '1x8' },
      { name: 'split squat isometric hold', prescription: '1x15-20s/side' },
      { name: '2-3 progressive ramp-up sets on the main squat', prescription: '' },
    ],
    notes: [
      'The player can keep their own lower-body warm-up if it prepares ankles, hips, adductors, and trunk.',
      'Keep this short and useful.',
      'The goal is readiness for force production, not early fatigue.',
    ],
  },
  blocks: [
    {
      number: 1,
      name: 'Main Lower Force',
      format: '`4 work sets`, `2-3 min` rest between sets',
      exercises: [{ name: 'Pin Back Squat', prescription: '4x4-5' }],
      coachingNotes: [
        'This block is the anchor of the session.',
        'Reps must stay technically clean with `RIR 1-2`.',
        'No grinding, no collapse at the bottom, no rushed descent.',
        'Pins should reinforce a strong concentric start and a stable bottom position.',
        'The goal is force construction, not testing.',
      ],
    },
    {
      number: 2,
      name: 'Hinge + Unilateral Strength Pair',
      format: '`3 rounds`, `90-120s` rest after the pair',
      exercises: [
        { name: 'Barbell Romanian Deadlift', prescription: '3x5-6' },
        {
          name: 'Rear-Foot Elevated Split Squat or Reverse Lunge',
          prescription: '3x6/side',
        },
      ],
      coachingNotes: [
        'RDL stays strict and posterior-chain dominant.',
        'The unilateral lift should support hip and groin control, not become a conditioning block.',
        'This pair should feel strong and constructive, not draining.',
      ],
    },
    {
      number: 3,
      name: 'Posterior Chain / Lower Leg Support',
      format: '`2-3 rounds`, `60-90s` rest',
      exercises: [
        { name: 'Nordic Curl', prescription: '2-3x4-5' },
        { name: 'Seated Calf Raise', prescription: '3x10-12' },
        { name: 'Tibialis Raise', prescription: '2-3x10-12' },
      ],
      coachingNotes: [
        'Nordic volume stays low enough to preserve hamstring quality across the week.',
        'Calf and tibialis work support lower-leg resilience before speed and power volumes rise later in pre-season.',
        'Keep the intent supportive, not maximal.',
      ],
    },
    {
      number: 4,
      name: 'Position Support Finisher',
      format: '`2 rounds`, `45-60s` rest',
      exercises: [
        { name: 'Copenhagen Hold', prescription: '20-30s/side' },
        { name: 'Farmer Carry', prescription: '20m' },
      ],
      coachingNotes: [
        'Copenhagen work supports adductors, trunk control, and change-of-direction tolerance.',
        'Farmer carry keeps the finisher simple and rugby-useful without making this a separate conditioning session.',
        'Front row can go slightly heavier and more braced.',
        'Back three can go slightly lighter, cleaner, and more athletic.',
      ],
    },
  ],
  progressionRules: [
    '`W1`: establish clean reference loads.',
    '`W2`: add `+2.5 to +5 kg` on squat and hinge only if all reps stay clean.',
    '`W3`: keep load progression if earned, or add one round to Block 3 if recovery is good.',
    '`W4`: deload by reducing total volume around `-30%` while keeping movement quality high.',
    'Reduce Block 4 first if fatigue rises.',
    'Reduce one round from Block 3 second.',
    'Keep Block 1 as the protected priority unless the athlete is clearly under-recovered.',
  ],
  positionAccent: [
    'This session is intentionally common in Phase 1.',
    'Front row accent:',
    'slightly more force/bracing intent on the squat',
    'slightly heavier carry',
    'less emphasis on speed qualities for now',
    'Back three accent:',
    'slightly more stiffness and lower-leg quality',
    'cleaner, more athletic intent on the carry',
    'more attention to unilateral control and posterior-chain quality',
    'The skeleton stays the same for both groups at this stage.',
  ],
  injurySubstitutions: [
    {
      area: 'shoulder_pain',
      remove: [
        '`Pin Back Squat` only if rack position is aggravating',
        '`Farmer Carry` only if grip or shoulder position is aggravating',
      ],
      replaceWith: [
        '`Front Squat` or `Machine Hack Squat / Leg Press`',
        '`Sled Push` if carry is not tolerated',
      ],
      rehabFinisher: [
        'none by default in this lower session unless symptoms require a small shoulder-health add-on',
      ],
    },
    {
      area: 'knee_pain',
      remove: [
        '`Pin Back Squat`',
        'knee-dominant unilateral pattern if painful',
        '`Copenhagen Hold` only if it clearly aggravates symptoms',
      ],
      replaceWith: ['`Barbell Hip Thrust`', '`RDL`', 'reduced-range split squat if tolerated'],
      rehabFinisher: [
        'light terminal knee extension or controlled split-squat isometric if needed',
      ],
    },
    {
      area: 'low_back_pain',
      remove: ['`Pin Back Squat`', '`Barbell Romanian Deadlift`', 'heavy `Farmer Carry`'],
      replaceWith: [
        '`Leg Press` or supported squat pattern',
        '`Barbell Hip Thrust`',
        'reduced-load unilateral pattern',
      ],
      rehabFinisher: ['breathing and trunk stiffness work'],
    },
  ],
  coachingWarnings: [
    'Do not let the pin squat become a max-effort grind in Phase 1.',
    'Do not turn the unilateral work into a balance circus.',
    'Do not overload Nordics just because they are "useful".',
    'Keep this session force-focused and absorbable inside a full pre-season week.',
    'This session should feel like quality construction, not like surviving a brutal lower day.',
  ],
  sourceReferences: [
    '[tech-spec-pre-season-12-weeks-rugbyprep-2026-03-18.md](...)',
    '[TEMPLATE_MOTHER_SESSION.md](...)',
  ],
}
