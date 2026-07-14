import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ProgramEvolutionSheet } from '../components/program/ProgramEvolutionSheet'
import { DEFAULT_PROGRAM_EVOLUTION_BULLETS } from '../components/program/programEvolutionSheetConstants'
import { useProfile } from '../hooks/useProfile'
import type { Lang } from '../i18n/appLabels'
import {
  defaultProgramEvolutionBullets,
  programEvolutionDefaults,
  programNoticeMatchSummary,
} from '../i18n/programSurfaces'
import { acknowledgeProgramNoticeById } from '../services/program/programNoticeAck'
import { getToday } from '../services/ui/debugDateOverride'
import { ProgramEvolutionSheetContext } from './programEvolutionSheetCtx'
import type { ProgramEvolutionOpenArgs, ResolvedProgramEvolutionPayload } from './programEvolutionSheetTypes'
import { resolveProgramNoticeId } from './programEvolutionSheetTypes'

function finalizeAck(current: ResolvedProgramEvolutionPayload): void {
  const noticeId = resolveProgramNoticeId(current)
  if (noticeId) acknowledgeProgramNoticeById(noticeId, getToday())
  current.onAcknowledged?.()
}

export function ProgramEvolutionSheetProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile()
  const lang: Lang = profile.preferredLanguage === 'en' ? 'en' : 'fr'
  const [payload, setPayload] = useState<ResolvedProgramEvolutionPayload | null>(null)
  const [primaryBusy, setPrimaryBusy] = useState(false)
  const payloadRef = useRef<ResolvedProgramEvolutionPayload | null>(null)

  useEffect(() => {
    payloadRef.current = payload
  }, [payload])

  const openProgramEvolution = useCallback(
    (args: ProgramEvolutionOpenArgs) => {
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
    },
    [lang],
  )

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

  const handleSecondaryPress = useCallback(() => {
    const current = payloadRef.current
    if (!current?.onSecondaryPress) return
    current.onSecondaryPress()
    setPayload(null)
  }, [])

  const value = useMemo(
    () => ({ openProgramEvolution, isProgramEvolutionOpen: payload != null }),
    [openProgramEvolution, payload],
  )

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
        secondaryCtaLabel={payload?.secondaryCtaLabel}
        onSecondaryPress={payload?.onSecondaryPress ? handleSecondaryPress : undefined}
        secondaryHint={payload?.secondaryHint}
      />
    </ProgramEvolutionSheetContext.Provider>
  )
}
