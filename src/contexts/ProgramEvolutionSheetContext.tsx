import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ProgramEvolutionSheet,
  DEFAULT_PROGRAM_EVOLUTION_BULLETS,
} from '../components/program/ProgramEvolutionSheet'
import { useProfile } from '../hooks/useProfile'
import type { Lang } from '../i18n/appLabels'
import {
  defaultProgramEvolutionBullets,
  programEvolutionDefaults,
  programNoticeMatchSummary,
} from '../i18n/programSurfaces'
import { acknowledgeProgramNoticeById } from '../services/program/programNoticeAck'
import { getToday } from '../services/ui/debugDateOverride'

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
}

type ResolvedPayload = ProgramEvolutionOpenArgs & {
  resolvedSummary: string
  resolvedBullets: readonly string[]
}

function resolveProgramNoticeId(args: ProgramEvolutionOpenArgs): string | null {
  if (args.programNoticeId === null) return null
  if (args.programNoticeId) return args.programNoticeId
  if (args.matchDateISO) return `match:${args.matchDateISO}`
  return null
}

function finalizeAck(current: ResolvedPayload): void {
  const noticeId = resolveProgramNoticeId(current)
  if (noticeId) acknowledgeProgramNoticeById(noticeId, getToday())
  current.onAcknowledged?.()
}

interface ProgramEvolutionSheetContextValue {
  openProgramEvolution: (args: ProgramEvolutionOpenArgs) => void
}

const ProgramEvolutionSheetContext = createContext<ProgramEvolutionSheetContextValue | null>(
  null,
)

export function ProgramEvolutionSheetProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile()
  const lang: Lang = profile.preferredLanguage === 'en' ? 'en' : 'fr'
  const [payload, setPayload] = useState<ResolvedPayload | null>(null)
  const [primaryBusy, setPrimaryBusy] = useState(false)
  const payloadRef = useRef<ResolvedPayload | null>(null)

  useEffect(() => {
    payloadRef.current = payload
  }, [payload])

  const openProgramEvolution = useCallback((args: ProgramEvolutionOpenArgs) => {
    setPayload((prev) => {
      if (prev?.primaryAction && !args.primaryAction) {
        return prev
      }

      const resolvedSummary =
        args.summary ??
        (args.matchDateISO
          ? programNoticeMatchSummary(args.matchDateISO, lang)
          : programEvolutionDefaults.summary_calendar[lang])

      const resolvedBullets = args.bullets ?? defaultProgramEvolutionBullets(lang)

      const chainAck = () => {
        prev?.onAcknowledged?.()
        args.onAcknowledged?.()
      }

      return {
        ...args,
        resolvedSummary,
        resolvedBullets,
        onAcknowledged: prev ? chainAck : args.onAcknowledged,
      }
    })
  }, [])

  const handleBackdropAttemptClose = useCallback(() => {
    const current = payloadRef.current
    if (!current || current.primaryAction) return
    finalizeAck(current)
    setPayload(null)
  }, [])

  const handleCtaPress = useCallback(async () => {
    const current = payloadRef.current
    if (!current) return

    if (current.primaryAction) {
      setPrimaryBusy(true)
      try {
        await current.primaryAction()
      } catch {
        setPrimaryBusy(false)
        return
      }
      setPrimaryBusy(false)
    }

    finalizeAck(current)
    setPayload(null)
  }, [])

  const value = useMemo(() => ({ openProgramEvolution }), [openProgramEvolution])

  const blockFlexibleDismiss = Boolean(payload?.primaryAction)

  return (
    <ProgramEvolutionSheetContext.Provider value={value}>
      {children}
      <ProgramEvolutionSheet
        open={payload != null}
        onBackdropAttemptClose={handleBackdropAttemptClose}
        onCtaPress={handleCtaPress}
        blockFlexibleDismiss={blockFlexibleDismiss}
        primaryBusy={primaryBusy}
        eyebrow={payload?.eyebrow ?? programEvolutionDefaults.eyebrow[lang]}
        sectionTitle={payload?.sectionTitle ?? programEvolutionDefaults.section_match[lang]}
        summary={payload?.resolvedSummary ?? ''}
        bullets={payload?.resolvedBullets ?? DEFAULT_PROGRAM_EVOLUTION_BULLETS}
        ctaLabel={payload?.primaryCtaLabel ?? programEvolutionDefaults.cta_default[lang]}
      />
    </ProgramEvolutionSheetContext.Provider>
  )
}

export function useProgramEvolutionSheet(): ProgramEvolutionSheetContextValue {
  const ctx = useContext(ProgramEvolutionSheetContext)
  return ctx ?? { openProgramEvolution: () => {} }
}
