import { localizeMotherSessionExerciseName, type Lang } from '../../../services/motherSession/localizeMotherSessionExerciseName'
import { IsoChronoButton } from '../../motherSession/IsoChronoButton'

export interface IsoOverlayState {
  /** Nom de l'exo affiché dans l'overlay (ex: "Gainage cou isométrique"). */
  exerciseName: string
  /** Eyebrow contextuel (ex: "Finisher Premières Lignes · Tour 1"). */
  parentLabel?: string
  durationLow: number
  durationHigh: number
  perSide: boolean
  perDirection: boolean
}

interface IsoOverlayProps {
  state: IsoOverlayState | null
  /** Click "J'ai fait" ou auto-fin du chrono → marque l'exo validé + ferme l'overlay. */
  onComplete: () => void
  /** Click bouton fermer (annule sans valider). */
  onClose: () => void
  lang?: Lang
}

/**
 * Overlay mini-chrono iso — délègue à IsoChronoButton (plage 20–30 s, gauche/droite, etc.).
 */
export function IsoOverlay({ state, onComplete, onClose, lang = 'fr' }: IsoOverlayProps) {
  if (!state) return null

  return (
    <div
      className="mx-[14px] mb-3 rounded-[18px] border border-paper-deep bg-app animate-rf-slide-up"
      style={{
        boxShadow: '0 -2px 0 rgba(0, 0, 0, 0.04), 0 16px 40px -10px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div className="px-[18px] pt-3.5 pb-4 text-center">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 text-left">
            {state.parentLabel && (
              <div className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-brand">
                {state.parentLabel}
              </div>
            )}
            <div
              className="mt-0.5 font-serif italic font-extrabold leading-tight text-fg"
              style={{ fontSize: 18, letterSpacing: '-0.4px' }}
            >
              {localizeMotherSessionExerciseName(state.exerciseName, lang)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le chrono"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-paper-deep bg-transparent rf-focus-ring"
          >
            <span aria-hidden className="text-[14px] leading-none text-fg">
              ×
            </span>
          </button>
        </div>

        <div className="mt-4">
          <IsoChronoButton
            key={`${state.exerciseName}-${state.durationLow}-${state.durationHigh}-${state.perSide}-${state.perDirection}`}
            durationLow={state.durationLow}
            durationHigh={state.durationHigh}
            perSide={state.perSide}
            perDirection={state.perDirection}
            label={localizeMotherSessionExerciseName(state.exerciseName, lang)}
            onCompleted={onComplete}
          />
        </div>
      </div>
    </div>
  )
}
