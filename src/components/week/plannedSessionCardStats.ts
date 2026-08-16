/**
 * Stats carte jour : respecte maxBlocks / variant light (club dur, décharge).
 * Fichier séparé : WeekDailyPlanner.tsx ne doit exporter que des composants (react-refresh).
 */

export function parseTargetDuration(target: string | undefined): number | null {
  if (!target) return null
  const match = target.match(/(\d+)(?:\s*-\s*(\d+))?/)
  if (!match) return null
  const a = Number.parseInt(match[1], 10)
  const b = match[2] ? Number.parseInt(match[2], 10) : a
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  return Math.round((a + b) / 2)
}

export function plannedSessionCardStats(slot: {
  session: { blocks: readonly unknown[]; metadata: { targetDuration?: string } }
  maxBlocks?: number
  variant?: 'normal' | 'light'
}): { blocs: number; durationMin: number | undefined; isLight: boolean } {
  const rawBlocks = slot.session.blocks.length
  const maxBlocks = slot.maxBlocks
  const blocs = maxBlocks != null ? Math.min(maxBlocks, rawBlocks) : rawBlocks
  const target = parseTargetDuration(slot.session.metadata.targetDuration) ?? undefined
  const durationMin =
    target != null && maxBlocks != null && maxBlocks < rawBlocks && rawBlocks > 0
      ? Math.round(target * (maxBlocks / rawBlocks))
      : target
  return { blocs, durationMin, isLight: slot.variant === 'light' }
}
