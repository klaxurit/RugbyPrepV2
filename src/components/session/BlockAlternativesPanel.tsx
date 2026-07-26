import { useMemo, useState } from 'react'
import { Eye, RefreshCw } from 'lucide-react'
import { Icon } from '../ui'
import { hasExerciseDemo } from '../../data/exercises'
import {
  getExerciseVariantOptions,
  type VariantPhaseContext,
} from '../../services/equipment/exerciseVariantOptions'
import { buildBlockAlternativeGroups } from '../../services/equipment/parseFallbackOptionExercises'
import {
  localizeMotherSessionExerciseName,
  type Lang,
} from '../../services/motherSession/localizeMotherSessionExerciseName'
import { tr } from '../../i18n/appLabels'
import type { Exercise } from '../../types/motherSession'
import type { Equipment } from '../../types/training'
import { ExerciseDemoSheet } from '../motherSession/ExerciseDemoSheet'

type BlockAlternativesPanelProps = {
  /** Exos prescrits (après prepareSessionForRender, avant override). */
  preparedExercises: readonly Exercise[]
  /** Exos affichés (après override user). */
  displayExercises: readonly Exercise[]
  fallbackOptions?: readonly string[]
  lang: Lang
  equipment?: Equipment[]
  phaseContext?: VariantPhaseContext
  onOpenVariants?: (exerciseIndex: number) => void
  onSelectVariant?: (exerciseIndex: number, exerciseId: string) => void
  defaultOpen?: boolean
}

/**
 * Card Alternatives structurée : alternatives MD + registre, groupées par exo,
 * avec swap / œil. Remplace l’accordéon texte opaque.
 */
export function BlockAlternativesPanel({
  preparedExercises,
  displayExercises,
  fallbackOptions,
  lang,
  equipment,
  phaseContext,
  onOpenVariants,
  onSelectVariant,
  defaultOpen = false,
}: BlockAlternativesPanelProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [demoExerciseId, setDemoExerciseId] = useState<string | null>(null)

  const { interactiveGroups, residualLines, textFallback } = useMemo(() => {
    const built = buildBlockAlternativeGroups({
      preparedExercises,
      displayExercises,
      fallbackOptions,
    })

    const interactiveGroups = built.groups
      .map((g) => {
        const options = getExerciseVariantOptions(g.prescribedId, {
          equipment,
          phaseContext,
          mdAlternativeIds: g.mdAlternativeIds,
        })
        if (options.length <= 1) return null
        return { ...g, options }
      })
      .filter((g): g is NonNullable<typeof g> => g != null)

    const textFallback =
      interactiveGroups.length === 0 && (fallbackOptions?.length ?? 0) > 0
        ? (fallbackOptions as readonly string[])
        : null

    return {
      interactiveGroups,
      residualLines: built.residualLines,
      textFallback,
    }
  }, [preparedExercises, displayExercises, fallbackOptions, equipment, phaseContext])

  if (textFallback) {
    return <TextOnlyAlternatives notes={textFallback} lang={lang} defaultOpen={defaultOpen} />
  }

  if (interactiveGroups.length === 0 && residualLines.length === 0) return null

  if (interactiveGroups.length === 0) {
    return (
      <TextOnlyAlternatives notes={residualLines} lang={lang} defaultOpen={defaultOpen} />
    )
  }

  const label = tr('session_alternatives', lang)

  return (
    <>
      <div
        className="overflow-hidden rounded-[14px] border border-paper-deep bg-app"
        data-testid="block-alternatives-panel"
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between px-3.5 py-3 text-left rf-focus-ring"
        >
          <span className="inline-flex items-center gap-2">
            <RefreshCw size={14} color="var(--color-accent)" strokeWidth={1.8} aria-hidden />
            <span className="text-[12px] font-bold tracking-tight text-fg">{label}</span>
          </span>
          <span
            aria-hidden
            className="transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : undefined }}
          >
            <Icon name="chevron-down" size={14} color="var(--color-text-primary)" strokeWidth={2} />
          </span>
        </button>

        {open && (
          <div className="flex flex-col gap-3 px-3.5 pb-3.5">
            {interactiveGroups.map((group) => {
              const alts = group.options.filter((o) => !o.isPrescribed)
              if (alts.length === 0) return null
              return (
                <div key={group.exerciseIndex} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-fg-muted">
                      {localizeMotherSessionExerciseName(group.hostName, lang)}
                    </p>
                    {onOpenVariants && (
                      <button
                        type="button"
                        onClick={() => onOpenVariants(group.exerciseIndex)}
                        className="rounded px-1 text-[11px] font-bold text-brand rf-focus-ring"
                      >
                        {lang === 'fr' ? 'Tout voir' : 'See all'}
                      </button>
                    )}
                  </div>
                  {alts.map((option) => {
                    const optionLabel = lang === 'fr' ? option.labelFr : option.labelEn
                    const isCurrent = option.exerciseId === group.currentId
                    const canDemo = hasExerciseDemo(option.exerciseId)
                    return (
                      <div
                        key={option.exerciseId}
                        className={`flex items-center gap-1.5 rounded-[12px] border px-2 py-1.5 ${
                          isCurrent
                            ? 'border-brand/55 bg-badge-wine'
                            : 'border-paper-deep bg-app'
                        }`}
                      >
                        <button
                          type="button"
                          data-testid={`alt-select-${option.exerciseId}`}
                          onClick={() =>
                            onSelectVariant?.(group.exerciseIndex, option.exerciseId)
                          }
                          className="min-w-0 flex-1 rounded-[10px] px-1.5 py-1 text-left rf-focus-ring"
                        >
                          <span className="text-[13px] font-bold text-fg">{optionLabel}</span>
                          {isCurrent && (
                            <span className="ml-1.5 text-[10px] font-bold uppercase text-brand">
                              {lang === 'fr' ? 'Actuel' : 'Current'}
                            </span>
                          )}
                        </button>
                        {canDemo && (
                          <button
                            type="button"
                            aria-label={tr('exercise_aria_demo', lang)}
                            onClick={() => setDemoExerciseId(option.exerciseId)}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-paper-deep bg-app rf-focus-ring"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onOpenVariants && (
                          <button
                            type="button"
                            aria-label={tr('exercise_aria_variants', lang)}
                            data-testid={`alt-swap-${group.exerciseIndex}`}
                            onClick={() => onOpenVariants(group.exerciseIndex)}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-paper-deep bg-app rf-focus-ring"
                          >
                            <RefreshCw size={13} strokeWidth={1.8} aria-hidden />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {residualLines.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-dashed border-paper-deep pt-2">
                {residualLines.map((line, i) => (
                  <div key={i} className="flex gap-2 text-[12px] leading-[1.5] text-fg-secondary">
                    <span aria-hidden className="flex-shrink-0 font-bold text-brand">
                      —
                    </span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ExerciseDemoSheet
        exerciseId={demoExerciseId}
        lang={lang}
        onClose={() => setDemoExerciseId(null)}
      />
    </>
  )
}

function TextOnlyAlternatives({
  notes,
  lang,
  defaultOpen,
}: {
  notes: readonly string[]
  lang: Lang
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  if (notes.length === 0) return null
  return (
    <div className="overflow-hidden rounded-[14px] border border-paper-deep bg-app">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3.5 py-3 text-left rf-focus-ring"
      >
        <span className="inline-flex items-center gap-2">
          <Icon name="sparkle" size={14} color="var(--color-accent)" strokeWidth={1.8} />
          <span className="text-[12px] font-bold tracking-tight text-fg">
            {tr('session_alternatives', lang)}
          </span>
        </span>
        <span
          aria-hidden
          className="transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        >
          <Icon name="chevron-down" size={14} color="var(--color-text-primary)" strokeWidth={2} />
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-3.5 pb-3.5">
          {notes.map((note, i) => (
            <div key={i} className="flex gap-2 text-[12px] leading-[1.5] text-fg-secondary">
              <span aria-hidden className="flex-shrink-0 font-bold text-brand">
                —
              </span>
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
