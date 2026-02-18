import type { BuiltSession } from '../program'

const toDeloadSets = (sets: number, intent: BuiltSession['blocks'][number]['block']['intent']) => {
  const reducedSets = Math.round(sets * 0.7)
  if (intent === 'activation' || intent === 'prehab') {
    return Math.max(2, reducedSets)
  }
  return Math.max(1, reducedSets)
}

const toDeloadRer = (
  rer: number | undefined,
  intent: BuiltSession['blocks'][number]['block']['intent']
) => {
  const baselineRer = rer ?? 3
  if (intent === 'contrast' || intent === 'force') {
    return Math.min(baselineRer + 2, 3)
  }
  return Math.min(baselineRer + 1, 4)
}

const toDeloadMinutes = (minutes: number) => Math.max(3, Math.round(minutes * 0.7))

export const applyDeloadToSession = (session: BuiltSession): BuiltSession => ({
  ...session,
  week: 'DELOAD',
  blocks: session.blocks.map((builtBlock) => ({
    ...builtBlock,
    version: {
      ...builtBlock.version,
      sets: toDeloadSets(builtBlock.version.sets, builtBlock.block.intent),
      rer: toDeloadRer(builtBlock.version.rer, builtBlock.block.intent),
      scheme:
        builtBlock.version.scheme.kind === 'emom'
          ? {
              ...builtBlock.version.scheme,
              minutes: toDeloadMinutes(builtBlock.version.scheme.minutes)
            }
          : builtBlock.version.scheme
    }
  }))
})

export const applyDeloadToSessions = (sessions: BuiltSession[]): BuiltSession[] =>
  sessions.map(applyDeloadToSession)
