import { useEffect, useState } from 'react'
import { Eye, RefreshCw, X } from 'lucide-react'
import { hasExerciseDemo } from '../../data/exercises'
import type { ExerciseVariantOption } from '../../services/equipment/exerciseVariantOptions'
import type { Lang } from '../../i18n/appLabels'
import { ExerciseDemoSheet } from '../motherSession/ExerciseDemoSheet'

type ExerciseVariantPickerSheetProps = {
  open: boolean
  lang: Lang
  options: ExerciseVariantOption[]
  currentExerciseId: string
  prescribedExerciseId: string
  onSelect: (exerciseId: string) => void
  onResetToPrescribed: () => void
  onClose: () => void
}

function kindLabel(kind: ExerciseVariantOption['kind'], lang: Lang): string {
  if (kind === 'easier') return lang === 'fr' ? 'Plus facile' : 'Easier'
  if (kind === 'harder') return lang === 'fr' ? 'Plus dur' : 'Harder'
  return lang === 'fr' ? 'Équivalent' : 'Same level'
}

function kindTone(kind: ExerciseVariantOption['kind']): string {
  if (kind === 'easier') return 'bg-win-soft text-win border-win/30'
  if (kind === 'harder') return 'bg-badge-wine text-brand border-brand/30'
  return 'bg-layer-5 text-fg-secondary border-border-app'
}

export function ExerciseVariantPickerSheet({
  open,
  lang,
  options,
  currentExerciseId,
  prescribedExerciseId,
  onSelect,
  onResetToPrescribed,
  onClose,
}: ExerciseVariantPickerSheetProps) {
  const [demoExerciseId, setDemoExerciseId] = useState<string | null>(null)
  // Quand le picker est fermé, on n’affiche pas la démo (évite setState dans un effect).
  const activeDemoId = open ? demoExerciseId : null

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (demoExerciseId) setDemoExerciseId(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, demoExerciseId])

  if (!open) return null

  const labels = {
    title: lang === 'fr' ? 'Variantes' : 'Variants',
    helper:
      lang === 'fr'
        ? 'Remplace l’exercice en un clic. Même pattern, difficulté adaptée.'
        : 'Replace the exercise in one tap. Same pattern, adjusted difficulty.',
    prescribed: lang === 'fr' ? 'Prescrit' : 'Prescribed',
    current: lang === 'fr' ? 'Actuel' : 'Current',
    reset: lang === 'fr' ? 'Revenir à l’exercice prévu' : 'Back to prescribed exercise',
    demo: lang === 'fr' ? 'Voir la démo' : 'View demo',
    close: lang === 'fr' ? 'Fermer' : 'Close',
  }

  const showReset = currentExerciseId !== prescribedExerciseId

  return (
    <>
      <div
        className="fixed inset-0 z-[75] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exercise-variant-picker-title"
          data-testid="exercise-variant-picker-sheet"
          className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border-app bg-app shadow-2xl shadow-black/50"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border-app px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-brand-tint">
                <RefreshCw className="h-3 w-3" aria-hidden />
                {labels.title}
              </p>
              <h3 id="exercise-variant-picker-title" className="mt-1 text-lg font-black text-fg">
                {lang === 'fr' ? 'Choisir une variante' : 'Choose a variant'}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-fg-muted">{labels.helper}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={labels.close}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-app bg-layer-5 text-fg-muted transition-colors hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[65vh] space-y-2 overflow-y-auto px-4 py-4">
            {options.map((option) => {
              const label = lang === 'fr' ? option.labelFr : option.labelEn
              const isCurrent = option.exerciseId === currentExerciseId
              const isPrescribed = option.exerciseId === prescribedExerciseId
              const canDemo = hasExerciseDemo(option.exerciseId)
              return (
                <div
                  key={option.exerciseId}
                  className={`flex items-stretch gap-2 rounded-[16px] border px-2 py-2 ${
                    isCurrent ? 'border-brand/55 bg-badge-wine' : 'border-paper-deep bg-app'
                  }`}
                >
                  <button
                    type="button"
                    data-testid={`variant-option-${option.exerciseId}`}
                    onClick={() => onSelect(option.exerciseId)}
                    className="min-w-0 flex-1 rounded-[12px] px-2 py-2 text-left rf-focus-ring"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[14px] font-bold leading-snug text-fg">{label}</span>
                      {isPrescribed && (
                        <span className="rounded-full border border-brand/25 bg-brand/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-brand">
                          {labels.prescribed}
                        </span>
                      )}
                      {isCurrent && !isPrescribed && (
                        <span className="rounded-full border border-paper-deep bg-layer-5 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-fg-muted">
                          {labels.current}
                        </span>
                      )}
                    </div>
                    <span
                      className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${kindTone(option.kind)}`}
                    >
                      {kindLabel(option.kind, lang)}
                    </span>
                  </button>
                  {canDemo && (
                    <button
                      type="button"
                      aria-label={labels.demo}
                      data-testid={`variant-demo-${option.exerciseId}`}
                      onClick={() => setDemoExerciseId(option.exerciseId)}
                      className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-paper-deep bg-app text-fg rf-focus-ring"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {showReset && (
            <div className="border-t border-border-app px-4 py-3">
              <button
                type="button"
                data-testid="variant-reset-prescribed"
                onClick={onResetToPrescribed}
                className="w-full rounded-[14px] border border-paper-deep bg-layer-5 px-4 py-3 text-[13px] font-bold text-fg rf-focus-ring"
              >
                {labels.reset}
              </button>
            </div>
          )}
        </div>
      </div>

      <ExerciseDemoSheet
        exerciseId={activeDemoId}
        lang={lang}
        onClose={() => setDemoExerciseId(null)}
      />
    </>
  )
}
