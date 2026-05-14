import type { Block, Exercise } from '../../../types/motherSession'
import { Icon } from '../../ui'
import { parseExerciseSetSpec } from '../../../services/ui/exerciseSetSpec'
import { BlockHeader } from '../BlockHeader'
import type { BlockState } from '../BlockStateChip'
import { SessionNotes } from '../SessionNotes'
import type { LoadSuggestion } from '../../../services/loadSuggestion'
import { hasExerciseDemo } from '../../../data/exercises'
import { resolveExerciseIdForDemo } from '../../../services/motherSession/motherSessionExerciseMap'
import {
  localizeMotherSessionExerciseName,
  type Lang,
} from '../../../services/motherSession/localizeMotherSessionExerciseName'
import { localizeBlockName } from '../../../services/motherSession/motherSessionBlockLabels'
import { tr } from '../../../i18n/appLabels'

/**
 * Per-exo gate for the eye/demo button. Tour-block exercises sometimes ship
 * with the English session name and no direct exerciseId — fall back to the
 * name→id map (same pattern as MotherSessionBlock.tsx:57). Only ~115/208
 * exos in exercices.v1.json have a videoUrl, so without this gate the eye
 * button would render dead on the rest.
 */
const exerciseHasDemo = (exo: Exercise): boolean => {
  const exoId = exo.exerciseId ?? resolveExerciseIdForDemo(exo.name ?? '')
  return Boolean(exoId && hasExerciseDemo(exoId))
}

export interface ExoTourData {
  kg?: string
  reps?: string
  validated?: boolean
}

/** Mapping tourIdx → exoIdx → ExoTourData. */
export type TourDataMap = Record<number, Record<number, ExoTourData>>

interface ToursBlockProps {
  block: Block
  number: number
  state: BlockState
  expanded: boolean
  onToggle: () => void
  /** Nombre total de tours du bloc (calculé par le caller via parseBlockTourCount). */
  totalTours: number
  /** Repos en minutes entre tours (optionnel). */
  restMin?: number
  /** Tour actif courant (0-based). Pertinent uniquement si state === 'active'. */
  currentTourIdx?: number
  /** Exo actif courant dans le tour. Highlight + animation. */
  currentExoIdx?: number
  /** Premium → affiche les inputs kg/reps inline sur exo actif. */
  premium: boolean
  /** Données de log par tour (Premium). */
  tourData?: TourDataMap
  /** Callback validation d'un exo (toggle bool). */
  onValidateExo: (tourIdx: number, exoIdx: number) => void
  /** Callback patch des inputs kg/reps. */
  onSetExoData?: (tourIdx: number, exoIdx: number, patch: Partial<ExoTourData>) => void
  /** Callback ouverture demo vidéo. */
  onPlayDemo?: (exoIdx: number) => void
  /** Callback démarrage chrono iso pour un exo time (Copenhagen, plank, etc.). */
  onStartIso?: (exoIdx: number, durationSec: number) => void
  /** Notes de coaching à afficher en bas du bloc. */
  notes?: readonly string[]
  /** Suggestion de charge Premium par exerciseId (optionnel). */
  getLoadSuggestion?: (exerciseId: string) => LoadSuggestion | undefined
  /** Langue d'affichage des noms d'exercices. Défaut: 'fr'. */
  lang?: Lang
}

const TOUR_STATE_FROM_BLOCK = (
  blockState: BlockState,
  tourIdx: number,
  currentTourIdx: number,
): BlockState => {
  if (blockState === 'done') return 'done'
  if (blockState === 'pending') return 'pending'
  if (tourIdx < currentTourIdx) return 'done'
  if (tourIdx === currentTourIdx) return 'active'
  return 'pending'
}

/**
 * Bloc Tours — header standard + meta tours + N TourGroup avec exos validables.
 * Le composant est purement visuel : toutes les actions passent par les callbacks.
 *
 * Affichage :
 *  - Méta : "{N} tours · Repos X min" + "Tour M/N" tabulaire
 *  - TourGroup actif : exos rendus dépliés avec inputs Premium si applicable
 *  - TourGroup pending/done : header collapsible (chevron)
 *  - Notes accordéon en bas (open par défaut sur bloc actif)
 */
export function ToursBlock(props: ToursBlockProps) {
  const {
    block,
    number,
    state,
    expanded,
    onToggle,
    totalTours,
    restMin,
    currentTourIdx = 0,
    currentExoIdx = 0,
    premium,
    tourData,
    onValidateExo,
    onSetExoData,
    onPlayDemo,
    onStartIso,
    notes,
    getLoadSuggestion,
    lang = 'fr',
  } = props

  const displayTour = state === 'done' ? totalTours : Math.min(currentTourIdx + 1, totalTours)

  return (
    <div className="flex flex-col gap-2.5">
      <BlockHeader
        number={number}
        icon="bolt"
        title={localizeBlockName(block.name, lang)}
        state={state}
        expanded={expanded}
        onToggle={onToggle}
        lang={lang}
      />

      {expanded && (
        <div className="flex flex-col gap-3 px-1">
          <div className="flex items-center justify-between px-1.5">
            <span className="text-[11px] font-medium text-fg/60">
              {totalTours} {totalTours > 1 ? tr('tours_meta_round_plural', lang) : tr('tours_meta_round_single', lang)}
              {restMin != null && ` · ${tr('tours_meta_rest_prefix', lang)} ${restMin} min`}
            </span>
            <span className="text-[10px] font-extrabold uppercase tabular-nums tracking-[0.12em] text-brand">
              {tr('tours_tour_label', lang)} {displayTour}/{totalTours}
            </span>
          </div>

          {state === 'pending' ? (
            // Mode aperçu : liste plate des exos (sans validation per-tour).
            <div className="flex flex-col gap-1.5">
              {block.exercises.map((exo, i) => (
                <PreviewExerciseRow
                  key={i}
                  exo={exo}
                  onPlayDemo={onPlayDemo && exerciseHasDemo(exo) ? () => onPlayDemo(i) : undefined}
                  lang={lang}
                />
              ))}
            </div>
          ) : (
            <div>
              {Array.from({ length: totalTours }).map((_, i) => {
                const tourState = TOUR_STATE_FROM_BLOCK(state, i, currentTourIdx)
                const tourExoData = tourData?.[i] ?? {}
                return (
                  <TourGroup
                    key={i}
                    tourNum={i + 1}
                    state={tourState}
                    exercises={block.exercises}
                    exoData={tourExoData}
                    firstTourData={tourData?.[0]}
                    showCarryForward={i > 0}
                    isActiveTour={tourState === 'active'}
                    currentExoIdx={tourState === 'active' ? currentExoIdx : -1}
                    premium={premium}
                    onValidateExo={(exoIdx) => onValidateExo(i, exoIdx)}
                    onSetExoData={
                      onSetExoData ? (exoIdx, patch) => onSetExoData(i, exoIdx, patch) : undefined
                    }
                    onPlayDemo={onPlayDemo}
                    onStartIso={onStartIso}
                    getLoadSuggestion={getLoadSuggestion}
                    lang={lang}
                  />
                )
              })}
            </div>
          )}

          {notes && notes.length > 0 && <SessionNotes notes={notes} defaultOpen={state === 'active'} />}
        </div>
      )}
    </div>
  )
}

// ─── TourGroup ──────────────────────────────────────────────────────────────

interface TourGroupProps {
  tourNum: number
  state: BlockState
  exercises: readonly Exercise[]
  exoData: Record<number, ExoTourData>
  /** Données du tour 1 (tourIdx=0) — utilisées comme placeholder ghost pour les tours suivants. */
  firstTourData?: Record<number, ExoTourData>
  /** True quand ce TourGroup est tourIdx > 0 → propose les valeurs du tour 1 en placeholder. */
  showCarryForward: boolean
  isActiveTour: boolean
  currentExoIdx: number
  premium: boolean
  onValidateExo: (exoIdx: number) => void
  onSetExoData?: (exoIdx: number, patch: Partial<ExoTourData>) => void
  onPlayDemo?: (exoIdx: number) => void
  onStartIso?: (exoIdx: number, durationSec: number) => void
  getLoadSuggestion?: (exerciseId: string) => LoadSuggestion | undefined
  lang: Lang
}

const TOUR_HEADER_CLASS: Record<BlockState, string> = {
  active: 'bg-badge-wine border-brand/40',
  done: 'bg-win-soft border-win/40',
  pending: 'bg-app border-paper-deep',
}

const TOUR_HEADER_FG: Record<BlockState, string> = {
  active: 'text-brand',
  done: 'text-win',
  pending: 'text-fg-muted',
}

function TourGroup({
  tourNum,
  state,
  exercises,
  exoData,
  firstTourData,
  showCarryForward,
  isActiveTour,
  currentExoIdx,
  premium,
  onValidateExo,
  onSetExoData,
  onPlayDemo,
  onStartIso,
  getLoadSuggestion,
  lang,
}: TourGroupProps) {
  const validatedCount = Object.values(exoData).filter((d) => d.validated).length
  const headerLabel = state === 'active'
    ? tr('block_state_active', lang)
    : state === 'done'
      ? tr('block_state_done', lang)
      : tr('block_state_pending', lang)

  return (
    <div className="mb-2">
      <div
        className={`flex w-full items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-3 ${TOUR_HEADER_CLASS[state]}`}
      >
        <BulletIndicator state={state} />
        <span
          className={`text-[11px] font-extrabold uppercase tracking-[0.12em] ${TOUR_HEADER_FG[state]}`}
        >
          {tr('tours_tour_label', lang)} {tourNum}
        </span>
        <span aria-hidden className={`h-[3px] w-[3px] rounded-full opacity-50 ${TOUR_HEADER_FG[state]} bg-current`} />
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.1em] opacity-85 ${TOUR_HEADER_FG[state]}`}
        >
          {headerLabel}
        </span>
        <span
          className={`ml-auto text-[10px] font-bold tabular-nums opacity-70 ${TOUR_HEADER_FG[state]}`}
        >
          {validatedCount}/{exercises.length}
        </span>
      </div>

      {isActiveTour && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {exercises.map((exo, i) => {
            const data = exoData[i] ?? {}
            const isCurrent = i === currentExoIdx
            const firstData = showCarryForward ? (firstTourData?.[i] ?? {}) : {}
            const exoIdRef = exo.exerciseId
            // Suggestion AI uniquement sur le tour 1 (showCarryForward=false).
            const suggestion =
              !showCarryForward && exoIdRef && premium
                ? getLoadSuggestion?.(exoIdRef)
                : undefined
            const showSuggestionPlaceholder =
              suggestion?.confidence === 'high' &&
              suggestion?.suggestedWeight != null &&
              suggestion.decision !== 'no_suggestion' &&
              suggestion.decision !== 'no_data'

            // Pattern Strong : tours > 0 → kg/reps PRÉ-REMPLIS EN CLAIR avec
            // les valeurs du tour 1 (l'utilisateur voit "80 / 10" et peut
            // valider direct, ou taper par-dessus pour modifier).
            // Tour 1 : suggestion AI en ghost placeholder uniquement.
            const inheritedKg = showCarryForward ? firstData.kg : undefined
            const inheritedReps = showCarryForward ? firstData.reps : undefined
            const effectiveKg = data.kg ? data.kg : (inheritedKg ?? '')
            const effectiveReps = data.reps ? data.reps : (inheritedReps ?? '')

            const kgPlaceholder =
              !showCarryForward && showSuggestionPlaceholder
                ? String(suggestion!.suggestedWeight)
                : undefined
            const repsPlaceholder =
              !showCarryForward && showSuggestionPlaceholder && suggestion?.suggestedReps != null
                ? String(suggestion.suggestedReps)
                : undefined
            return (
              <ExerciseRow
                key={i}
                exo={exo}
                validated={data.validated === true}
                isCurrent={isCurrent}
                premium={premium}
                kg={effectiveKg}
                reps={effectiveReps}
                kgPlaceholder={kgPlaceholder}
                repsPlaceholder={repsPlaceholder}
                suggestion={!showCarryForward ? suggestion : undefined}
                onValidate={() => onValidateExo(i)}
                onSetKg={onSetExoData ? (v) => onSetExoData(i, { kg: v }) : undefined}
                onSetReps={onSetExoData ? (v) => onSetExoData(i, { reps: v }) : undefined}
                onPlayDemo={onPlayDemo && exerciseHasDemo(exo) ? () => onPlayDemo(i) : undefined}
                onStartIso={onStartIso ? (sec) => onStartIso(i, sec) : undefined}
                lang={lang}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function BulletIndicator({ state }: { state: BlockState }) {
  if (state === 'done') {
    return (
      <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-win">
        <Icon name="check" size={14} color="var(--color-bg-app)" strokeWidth={3} />
      </span>
    )
  }
  if (state === 'active') {
    return (
      <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-brand">
        <span aria-hidden className="h-2 w-2 rounded-full bg-app" />
      </span>
    )
  }
  return (
    <span className="h-[22px] w-[22px] flex-shrink-0 rounded-full border-[1.5px] border-fg/40" />
  )
}

// ─── ExerciseRow ────────────────────────────────────────────────────────────

interface ExerciseRowProps {
  exo: Exercise
  validated: boolean
  isCurrent: boolean
  premium: boolean
  kg: string
  reps: string
  /** Placeholder ghost (valeur du tour 1) — affiché en gris quand kg est vide. */
  kgPlaceholder?: string
  /** Placeholder ghost reps — idem. */
  repsPlaceholder?: string
  /** Suggestion de charge Premium (badge à côté du nom). undefined = pas de badge. */
  suggestion?: LoadSuggestion
  onValidate: () => void
  onSetKg?: (next: string) => void
  onSetReps?: (next: string) => void
  onPlayDemo?: () => void
  onStartIso?: (durationSec: number) => void
  lang: Lang
}

function ExerciseRow({
  exo,
  validated,
  isCurrent,
  premium,
  kg,
  reps,
  kgPlaceholder,
  repsPlaceholder,
  suggestion,
  onValidate,
  onSetKg,
  onSetReps,
  onPlayDemo,
  onStartIso,
  lang,
}: ExerciseRowProps) {
  // Inputs Premium n'apparaissent que si l'exo a une CHARGE (sets×reps).
  // Pour les exos en temps (iso, planks), pas d'inputs kg/reps — un bouton iso
  // déclenche l'overlay chrono dédié.
  const spec = parseExerciseSetSpec(exo.prescription)
  const hasLoad = spec.kind === 'reps'
  const isoSeconds = spec.kind === 'time' ? spec.durationLow : null

  const wrapperClass = isCurrent
    ? 'bg-badge-wine border-[1.5px] border-brand/55'
    : validated
      ? 'bg-win-soft/60 border border-paper-deep'
      : 'bg-app border border-paper-deep'

  return (
    <div className={`flex flex-col gap-2.5 rounded-[14px] px-3 py-3 ${wrapperClass}`}>
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={onValidate}
          aria-label={validated ? tr('exercise_aria_unvalidate', lang) : tr('exercise_aria_validate', lang)}
          className={`mt-0.5 flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[7px] rf-focus-ring transition-colors ${
            validated
              ? 'bg-win'
              : `border-[1.5px] bg-transparent ${isCurrent ? 'border-brand' : 'border-fg/40'}`
          }`}
        >
          {validated && <Icon name="check" size={16} color="var(--color-bg-app)" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-1.5 text-[14px] font-bold leading-[1.25] text-fg"
            style={{
              letterSpacing: '-0.2px',
              textDecoration: validated ? 'line-through' : 'none',
              textDecorationColor: 'rgb(63 107 74 / 0.65)',
              opacity: validated ? 0.6 : 1,
            }}
          >
            <span className="truncate">{localizeMotherSessionExerciseName(exo.name, lang)}</span>
            {premium && suggestion && isCurrent && !validated && (
              <SuggestionBadge suggestion={suggestion} />
            )}
          </div>
          <div className="mt-0.5 text-[12px] tabular-nums text-fg/55">{exo.prescription}</div>
        </div>

        {isoSeconds != null && isCurrent && !validated && onStartIso && (
          <button
            type="button"
            onClick={() => onStartIso(isoSeconds)}
            className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded-[10px] bg-brand text-app px-3 text-[11px] font-extrabold uppercase tracking-[0.06em] active:scale-[0.97] transition-transform rf-focus-ring"
          >
            <Icon name="play" size={9} strokeWidth={2.4} />
            {isoSeconds}s
          </button>
        )}

        {onPlayDemo && (
          <button
            type="button"
            onClick={onPlayDemo}
            aria-label={tr('exercise_aria_demo', lang)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-paper-deep bg-app rf-focus-ring"
          >
            <Icon name="eye" size={14} color="var(--color-text-primary)" strokeWidth={1.6} />
          </button>
        )}
      </div>

      {isCurrent && hasLoad && premium && (
        <>
          <div className="flex items-center gap-2 border-t border-dashed border-brand/25 pt-2.5">
            {onSetKg && (
              <NumInput
                label="kg"
                value={kg}
                onChange={onSetKg}
                placeholder={kgPlaceholder}
              />
            )}
            {onSetReps && (
              <NumInput
                label="reps"
                value={reps}
                onChange={onSetReps}
                placeholder={repsPlaceholder}
              />
            )}
            <button
              type="button"
              onClick={onValidate}
              className="ml-auto h-9 rounded-[10px] bg-brand text-app px-3.5 text-[11px] font-extrabold uppercase tracking-[0.06em] active:scale-[0.97] transition-transform rf-focus-ring"
            >
              {tr('exercise_validate_set', lang)}
            </button>
          </div>
        </>
      )}

      {isCurrent && hasLoad && !premium && (
        <div className="flex items-center gap-2 border-t border-dashed border-brand/25 pt-2.5 text-[11px] text-fg-muted italic">
          <Icon name="lock" size={12} color="var(--color-accent)" strokeWidth={1.8} />
          <span>
            {tr('exercise_premium_tracking_pre', lang)} <strong className="not-italic text-brand">Premium</strong>
          </span>
        </div>
      )}
    </div>
  )
}

interface PreviewExerciseRowProps {
  exo: Exercise
  onPlayDemo?: () => void
  lang: Lang
}

/**
 * Variante "preview" d'un exo (mode pending/idle) — pas de checkbox de validation,
 * pas d'inputs Premium ; juste le nom + prescription + bouton démo optionnel.
 */
function PreviewExerciseRow({ exo, onPlayDemo, lang }: PreviewExerciseRowProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-[14px] border border-paper-deep bg-app px-3 py-3">
      <div className="min-w-0 flex-1">
        <div
          className="text-[14px] font-bold leading-[1.25] text-fg"
          style={{ letterSpacing: '-0.2px' }}
        >
          {localizeMotherSessionExerciseName(exo.name, lang)}
        </div>
        <div className="mt-0.5 text-[12px] tabular-nums text-fg/55">{exo.prescription}</div>
      </div>
      {onPlayDemo && (
        <button
          type="button"
          onClick={onPlayDemo}
          aria-label={tr('exercise_aria_demo', lang)}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-paper-deep bg-app rf-focus-ring"
        >
          <Icon name="eye" size={14} color="var(--color-text-primary)" strokeWidth={1.6} />
        </button>
      )}
    </div>
  )
}

interface NumInputProps {
  label: string
  value: string
  onChange: (next: string) => void
  /** Valeur ghost affichée en gris quand `value` est vide (Pattern "carry forward"). */
  placeholder?: string
}

// ─── SuggestionBadge ────────────────────────────────────────────────────────

/**
 * Badge de suggestion de charge Premium. Affiché à côté du nom de l'exercice.
 * Visible uniquement si `confidence === 'high'` (G6).
 *
 * Variantes :
 *  - increase  → ↑ +X kg (vert)
 *  - decrease  → ↓ −X kg (orange)
 *  - maintain  → → kg (neutre)
 *
 * Le tooltip natif (title attr) affiche la justification + le disclaimer (G8).
 */
function SuggestionBadge({ suggestion }: { suggestion: LoadSuggestion }) {
  if (suggestion.confidence !== 'high') return null
  if (suggestion.decision === 'no_data' || suggestion.decision === 'no_suggestion') return null
  if (suggestion.decision === 'bodyweight') return null

  let symbol: string
  let toneClass: string
  let label: string
  if (suggestion.decision === 'increase') {
    symbol = '↑'
    toneClass = 'bg-success/15 text-success border-success/30'
    const delta = suggestion.suggestedWeight ?? 0
    label = `+${delta.toString().replace(/\.0$/, '')}`
  } else if (suggestion.decision === 'decrease') {
    symbol = '↓'
    toneClass = 'bg-warn-bg text-warn border-warn-bd'
    const delta = suggestion.suggestedWeight ?? 0
    label = `${delta.toString().replace(/\.0$/, '')}`
  } else {
    symbol = '→'
    toneClass = 'bg-layer-10 text-fg-secondary border-border-app'
    label = 'maintien'
  }

  const disclaimer = '\n\nSuggestion indicative. Adapte selon ton ressenti.'

  return (
    <span
      data-testid="exo-load-suggestion"
      data-decision={suggestion.decision}
      title={`${suggestion.justification}${disclaimer}`}
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0 text-[10px] font-extrabold leading-tight ${toneClass}`}
    >
      <span aria-hidden>{symbol}</span>
      <span>{label}</span>
    </span>
  )
}

function NumInput({ label, value, onChange, placeholder }: NumInputProps) {
  return (
    <div className="flex h-9 min-w-[88px] items-center gap-1.5 rounded-[10px] border border-paper-deep bg-app pr-2">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
        placeholder={placeholder}
        aria-label={label}
        className="h-full w-11 min-w-0 flex-1 border-0 bg-transparent px-2 text-right text-[14px] font-extrabold text-fg outline-none tabular-nums placeholder:font-extrabold placeholder:text-fg/30"
        style={{ letterSpacing: '-0.2px' }}
      />
      <span className="pr-2 text-[10px] font-bold uppercase tracking-wide text-fg-muted">
        {label}
      </span>
    </div>
  )
}
