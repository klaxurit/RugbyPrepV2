import type { QualityScorecard, UserProfile } from '../../types/training';
import type { BuiltSession } from './buildSessionFromRecipe';
import type { QualityGateResult } from './qualityGates';

const clampScore = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

export const buildQualityScorecard = (
  profile: UserProfile,
  sessions: BuiltSession[],
  hardConstraintEvents: string[],
  gateResult: QualityGateResult
): QualityScorecard => {
  const totalSessions = Math.max(1, sessions.length);
  const identitySessions = sessions.filter((session) => session.identity).length;
  const knownOffsetSessions = sessions.filter(
    (session) => session.identity?.matchDayOffset && session.identity.matchDayOffset !== 'UNKNOWN'
  );
  const heavyOnMd1 = sessions.filter(
    (session) =>
      session.identity?.matchDayOffset === 'MD-1' &&
      session.identity.sessionIntensity === 'heavy'
  ).length;

  const hardViolations = hardConstraintEvents.length;
  const qualityViolations = gateResult.events.filter((event) =>
    event.startsWith('quality:')
  ).length;

  const safety = clampScore(100 - hardViolations * 25 - qualityViolations * 15);
  const microcycle =
    gateResult.requiredSlotsTotal > 0
      ? clampScore((gateResult.requiredSlotsSatisfied / gateResult.requiredSlotsTotal) * 100)
      : 100;
  const matchProximity =
    knownOffsetSessions.length === 0
      ? 100
      : clampScore(100 - (heavyOnMd1 / knownOffsetSessions.length) * 100);
  const structure = clampScore(100 - (gateResult.degradedSessions / totalSessions) * 100);
  const identity = clampScore((identitySessions / totalSessions) * 100);
  const population =
    profile.ageBand === 'u18' && profile.parentalConsentHealthData === false ? 0 : 100;

  const overall = clampScore(
    safety * 0.3 +
      microcycle * 0.2 +
      matchProximity * 0.15 +
      structure * 0.15 +
      identity * 0.1 +
      population * 0.1
  );

  return {
    safety,
    microcycle,
    matchProximity,
    structure,
    identity,
    population,
    overall,
  };
};

