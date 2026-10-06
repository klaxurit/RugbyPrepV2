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
  programModalLabel,
  programNoticeMatchSummary,
} from '../i18n/programSurfaces'
import {
  fatigueLoadChoiceConfirmation,
  type FatigueLoadChoice,
} from '../services/program/fatigueLoadChoice'
import { acknowledgeProgramNoticeById } from '../services/program/programNoticeAck'
import { getToday } from '../services/ui/debugDateOverride'
import { useOverlayPermission } from '../hooks/useOverlayPermission'
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
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | undefined>(undefined)
  /** Étape 2 : confirmation justifiée avant `onChoice`. */
  const [awaitingChoiceConfirm, setAwaitingChoiceConfirm] = useState(false)
  const payloadRef = useRef<ResolvedProgramEvolutionPayload | null>(null)
  const selectedChoiceRef = useRef<string | undefined>(undefined)
  const awaitingConfirmRef = useRef(false)

  useEffect(() => {
    payloadRef.current = payload
  }, [payload])

  useEffect(() => {
    selectedChoiceRef.current = selectedChoiceId
  }, [selectedChoiceId])

  useEffect(() => {
    awaitingConfirmRef.current = awaitingChoiceConfirm
  }, [awaitingChoiceConfirm])

  const openProgramEvolution = useCallback(
    (args: ProgramEvolutionOpenArgs) => {
      setPayload((prev) => {
        if (prev?.primaryAction && !args.primaryAction && !args.onChoice) {
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
      setSelectedChoiceId(args.defaultChoiceId ?? args.choices?.[0]?.id)
      setAwaitingChoiceConfirm(false)
    },
    [lang],
  )

  const handleBackdropAttemptClose = useCallback(() => {
    const current = payloadRef.current
    if (!current || current.primaryAction || current.onChoice) return
    finalizeAck(current)
    setPayload(null)
    setAwaitingChoiceConfirm(false)
  }, [])

  const handleCtaPress = useCallback(async () => {
    const current = payloadRef.current
    if (!current) return

    if (current.onChoice) {
      const choiceId = selectedChoiceRef.current
      if (!choiceId) return

      // Étape 1 → confirmation justifiée
      if (!awaitingConfirmRef.current) {
        setAwaitingChoiceConfirm(true)
        return
      }

      // Étape 2 → appliquer
      setPrimaryBusy(true)
      try {
        await current.onChoice(choiceId)
      } catch {
        setPrimaryBusy(false)
        return
      }
      setPrimaryBusy(false)
      setAwaitingChoiceConfirm(false)
      finalizeAck(current)
      setPayload(null)
      return
    }

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
    if (!current) return

    // Sur l’étape confirmation : revenir à la liste de choix (ne ferme pas).
    if (current.onChoice && awaitingConfirmRef.current) {
      setAwaitingChoiceConfirm(false)
      return
    }

    if (!current.onSecondaryPress) return
    current.onSecondaryPress()
    setPayload(null)
    setAwaitingChoiceConfirm(false)
  }, [])

  const handleSelectChoice = useCallback((id: string) => {
    setSelectedChoiceId(id)
    setAwaitingChoiceConfirm(false)
  }, [])

  const value = useMemo(
    () => ({ openProgramEvolution, isProgramEvolutionOpen: payload != null }),
    [openProgramEvolution, payload],
  )

  const blockFlexibleDismiss = Boolean(payload?.primaryAction || payload?.onChoice)

  const sheetAllowed = useOverlayPermission('program_evolution', payload != null)

  const choiceConfirm =
    awaitingChoiceConfirm && selectedChoiceId && payload?.onChoice
      ? fatigueLoadChoiceConfirmation(selectedChoiceId as FatigueLoadChoice, lang)
      : null

  const choiceCtaLabel = payload?.onChoice
    ? awaitingChoiceConfirm
      ? programModalLabel('cta_confirm_choice', lang)
      : (payload.primaryCtaLabel ?? programModalLabel('cta_apply_choice', lang))
    : (payload?.primaryCtaLabel ?? programEvolutionDefaults.cta_default[lang])

  const secondaryCtaLabel = payload?.onChoice && awaitingChoiceConfirm
    ? programModalLabel('cta_back_choice', lang)
    : payload?.secondaryCtaLabel

  const secondaryPress =
    payload?.onChoice && awaitingChoiceConfirm
      ? handleSecondaryPress
      : payload?.onSecondaryPress
        ? handleSecondaryPress
        : undefined

  return (
    <ProgramEvolutionSheetContext.Provider value={value}>
      {children}
      <ProgramEvolutionSheet
        open={sheetAllowed}
        onBackdropAttemptClose={handleBackdropAttemptClose}
        onCtaPress={handleCtaPress}
        blockFlexibleDismiss={blockFlexibleDismiss}
        primaryBusy={primaryBusy}
        eyebrow={payload?.eyebrow ?? programEvolutionDefaults.eyebrow[lang]}
        sectionTitle={
          awaitingChoiceConfirm
            ? programModalLabel('confirm_choice_title', lang)
            : (payload?.sectionTitle ?? programEvolutionDefaults.section_match[lang])
        }
        summary={payload?.resolvedSummary ?? ''}
        bullets={payload?.resolvedBullets ?? DEFAULT_PROGRAM_EVOLUTION_BULLETS}
        ctaLabel={choiceCtaLabel}
        secondaryCtaLabel={secondaryCtaLabel}
        onSecondaryPress={secondaryPress}
        secondaryHint={awaitingChoiceConfirm ? undefined : payload?.secondaryHint}
        choices={payload?.choices}
        selectedChoiceId={selectedChoiceId}
        onSelectChoice={handleSelectChoice}
        recommendedBadgeLabel={
          payload?.recommendedBadgeLabel ?? programModalLabel('choice_recommended', lang)
        }
        choiceConfirm={choiceConfirm}
      />
    </ProgramEvolutionSheetContext.Provider>
  )
}
