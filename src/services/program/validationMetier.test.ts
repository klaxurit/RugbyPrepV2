// Validation métier — Génération du corpus de test pour revue adversariale Vague C
// Ce fichier génère les sorties réelles du moteur pour 12+ profils × 6+ semaines
import { describe, it, expect } from 'vitest';
import { buildWeekProgram, type WeekProgramResult } from './buildWeekProgram';
import type { CycleWeek, UserProfile } from '../../types/training';

const BASE_EQUIPMENT: UserProfile['equipment'] = ['barbell', 'dumbbell', 'bench', 'band', 'pullup_bar', 'box'];

const profiles: Record<string, UserProfile> = {
  'starter_in_season': {
    equipment: ['band', 'dumbbell'],
    injuries: [],
    weeklySessions: 2,
    level: 'beginner',
    rugbyPosition: 'BACK_ROW',
    trainingLevel: 'starter',
    seasonMode: 'in_season',
  },
  'builder_in_season': {
    equipment: ['barbell', 'dumbbell', 'bench', 'band'],
    injuries: [],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'SECOND_ROW',
    trainingLevel: 'builder',
    seasonMode: 'in_season',
  },
  'perf_in_season_3x': {
    equipment: BASE_EQUIPMENT,
    injuries: [],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'BACK_ROW',
    trainingLevel: 'performance',
    seasonMode: 'in_season',
  },
  'perf_pre_season_speed': {
    equipment: [...BASE_EQUIPMENT, 'sprint_track', 'med_ball'],
    injuries: [],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'BACK_THREE',
    trainingLevel: 'performance',
    seasonMode: 'pre_season',
    performanceFocus: 'speed',
  },
  'perf_off_season': {
    equipment: BASE_EQUIPMENT,
    injuries: [],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'FRONT_ROW',
    trainingLevel: 'performance',
    seasonMode: 'off_season',
  },
  'femme_senior_in': {
    equipment: BASE_EQUIPMENT,
    injuries: [],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'CENTERS',
    trainingLevel: 'performance',
    seasonMode: 'in_season',
    populationSegment: 'female_senior',
  },
  'femme_senior_pre': {
    equipment: BASE_EQUIPMENT,
    injuries: [],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'HALF_BACKS',
    trainingLevel: 'performance',
    seasonMode: 'pre_season',
    populationSegment: 'female_senior',
  },
  'u18_garcon_in': {
    equipment: ['barbell', 'dumbbell', 'bench', 'band'],
    injuries: [],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'BACK_ROW',
    trainingLevel: 'performance',
    seasonMode: 'in_season',
    populationSegment: 'u18_male',
    ageBand: 'u18',
  },
  'u18_fille_in': {
    equipment: ['barbell', 'dumbbell', 'bench', 'band'],
    injuries: [],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'CENTERS',
    trainingLevel: 'performance',
    seasonMode: 'in_season',
    populationSegment: 'u18_female',
    ageBand: 'u18',
  },
  'perf_shoulder_pain': {
    equipment: BASE_EQUIPMENT,
    injuries: ['shoulder_pain'],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'FRONT_ROW',
    trainingLevel: 'performance',
    seasonMode: 'in_season',
  },
  'perf_knee_pain': {
    equipment: BASE_EQUIPMENT,
    injuries: ['knee_pain'],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'SECOND_ROW',
    trainingLevel: 'performance',
    seasonMode: 'in_season',
  },
  'perf_low_back_pain': {
    equipment: BASE_EQUIPMENT,
    injuries: ['low_back_pain'],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'BACK_THREE',
    trainingLevel: 'performance',
    seasonMode: 'in_season',
  },
  // Bonus: FRONT_ROW vs BACK_THREE for position differentiation
  'perf_front_row_in': {
    equipment: BASE_EQUIPMENT,
    injuries: [],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'FRONT_ROW',
    trainingLevel: 'performance',
    seasonMode: 'in_season',
  },
  'perf_back_three_in': {
    equipment: BASE_EQUIPMENT,
    injuries: [],
    weeklySessions: 3,
    level: 'intermediate',
    rugbyPosition: 'BACK_THREE',
    trainingLevel: 'performance',
    seasonMode: 'in_season',
  },
};

const weeks: CycleWeek[] = ['W1', 'W3', 'W4', 'W5', 'W7', 'DELOAD'];

const formatSession = (result: WeekProgramResult, profileName: string): string => {
  const lines: string[] = [];
  lines.push(`\n${'='.repeat(80)}`);
  lines.push(`PROFIL: ${profileName} | SEMAINE: ${result.week}`);
  lines.push(`Archétype: ${result.selectedArchetypeId}`);
  if (result.warnings.length > 0) {
    lines.push(`WARNINGS: ${result.warnings.join(' | ')}`);
  }
  if (result.hardConstraintEvents.length > 0) {
    lines.push(`EVENTS: ${result.hardConstraintEvents.join(' | ')}`);
  }
  lines.push(`${'─'.repeat(80)}`);

  for (let i = 0; i < result.sessions.length; i++) {
    const session = result.sessions[i]!;
    lines.push(`  Session ${i}: ${session.title} (${session.recipeId}) [${session.intensity ?? 'N/A'}] week=${session.week}`);
    if (session.identity) {
      lines.push(`    Identity: ${session.identity.sessionRole} | ${session.identity.matchDayOffset} | ${session.identity.objectiveLabel}`);
    }
    for (const { block, version } of session.blocks) {
      const scheme = version.scheme;
      let schemeStr = '';
      if (scheme.kind === 'reps') schemeStr = `${version.sets}×${scheme.reps}`;
      else if (scheme.kind === 'time') schemeStr = `${version.sets}×${scheme.seconds}s`;
      else if (scheme.kind === 'emom') schemeStr = `EMOM ${scheme.minutes}min`;
      const exercises = block.exercises.map(e => e.exerciseId).join(', ');
      const tags = block.tags.slice(0, 6).join(',');
      lines.push(`    [${block.intent.padEnd(12)}] ${block.blockId.padEnd(30)} ${schemeStr.padEnd(12)} RER=${version.rer ?? '-'} rest=${version.restSeconds}s`);
      lines.push(`                  exos: ${exercises}`);
      lines.push(`                  tags: ${tags}`);
    }
    if (session.warnings.length > 0) {
      lines.push(`    ⚠ ${session.warnings.join(' | ')}`);
    }
  }
  return lines.join('\n');
};

describe('Validation Métier — Corpus Vague C', () => {
  const allOutputs: string[] = [];

  for (const [profileName, profile] of Object.entries(profiles)) {
    for (const week of weeks) {
      it(`${profileName} @ ${week}`, () => {
        const result = buildWeekProgram(profile, week);
        const output = formatSession(result, profileName);
        allOutputs.push(output);
        // Basic sanity: at least 1 session
        expect(result.sessions.length).toBeGreaterThanOrEqual(1);
        // Log to console for capture
        console.log(output);
      });
    }
  }
});
