export type ProgramEvolutionOpenArgs = {
  matchDateISO?: string
  summary?: string
  sectionTitle?: string
  bullets?: string[]
  eyebrow?: string
  /**
   * Id notice programme (`rf.programNotice.v1`).
   * - omis + `matchDateISO` → `match:${date}`
   * - `null` → pas d’ack (ex. résumé générique sans date)
   * - string → forcé
   */
  programNoticeId?: string | null
  onAcknowledged?: () => void
  /** Si défini : CTA obligatoire, pas de dismiss backdrop/swipe/X tant que non terminé. */
  primaryAction?: () => void | Promise<void>
  primaryCtaLabel?: string
  /** CTA secondaire (ex. reporter une notice cycle/phase). */
  secondaryCtaLabel?: string
  onSecondaryPress?: () => void
  /** Texte informatif sous les CTA (ex. report déjà consommé). */
  secondaryHint?: string
}

export type ResolvedProgramEvolutionPayload = ProgramEvolutionOpenArgs & {
  resolvedSummary: string
  resolvedBullets: readonly string[]
}

export function resolveProgramNoticeId(args: ProgramEvolutionOpenArgs): string | null {
  if (args.programNoticeId === null) return null
  if (args.programNoticeId) return args.programNoticeId
  if (args.matchDateISO) return `match:${args.matchDateISO}`
  return null
}
