import { useState, type ReactNode } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import type { Block } from '../../types/motherSession'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import { msLabel } from '../../services/motherSession/motherSessionLabels'
import { getExerciseName } from '../../data/exercises'
import {
  iconForBlock,
  estimateBlockMinutes,
  summarizeBlockExercises,
} from '../../services/ui/blockPresentation'

interface SessionBlockCardProps {
  block: Block
  lang: AppLang
  /** Contenu déplié — typiquement un <MotherSessionBlock hideHeader />. */
  children: ReactNode
  /** Mode Aperçu uniquement : ouvre par défaut le Bloc 1 et les warmups. */
  defaultOpen?: boolean
  /** Nom du bloc depuis frBlock (FR) — fallback sur block.name. */
  displayName?: string
  /** Y a-t-il une séance en cours pour CETTE séance spécifiquement ? */
  isRunning?: boolean
  /** En mode running : ce bloc est-il le bloc actif (déplié, en cours d'exécution) ? */
  runModeActive?: boolean
  /** En mode running : tous les tours sont-ils validés ? Affiche "Terminé ✓". */
  runModeCompleted?: boolean
}

/**
 * Carte résumé cliquable pour un bloc de séance.
 *
 * Modes :
 *  - Aperçu : toggle manuel via le chevron, ouvert si `defaultOpen`.
 *  - En cours (isRunning) : ouverture forcée par l'hôte via `runModeActive`.
 *    L'utilisateur n'agit PAS sur l'accordéon pendant l'exécution — un seul
 *    bloc actif à la fois, les autres affichent un header résumé (ou
 *    "Terminé ✓" s'ils sont bouclés).
 */
export function SessionBlockCard({
  block,
  lang,
  children,
  defaultOpen = false,
  displayName,
  isRunning = false,
  runModeActive = false,
  runModeCompleted = false,
}: SessionBlockCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  // Déterminer l'état d'ouverture :
  //   - Running + actif → forcé ouvert.
  //   - Running + autre (à venir / terminé) → fermé (pas d'interaction).
  //   - Aperçu → open state local piloté par le toggle manuel.
  const isOpen = isRunning ? runModeActive : open
  const canToggle = !isRunning

  const icon = iconForBlock(block)
  const minutes = estimateBlockMinutes(block)
  const name = displayName ?? block.name
  const summary = summarizeBlockExercises(block, (id, fallback) =>
    id ? getExerciseName(id, lang) : fallback,
  )

  // Ribbon visuel : actif / terminé / à venir / aperçu neutre.
  const statusClass = isRunning
    ? runModeCompleted
      ? 'border-ok-bd'
      : runModeActive
        ? 'border-brand-border-strong shadow-sm'
        : 'border-border-app opacity-75'
    : 'border-border-app'

  return (
    <article className={`rounded-2xl border overflow-hidden bg-layer-5 ${statusClass}`}>
      <button
        type="button"
        onClick={() => canToggle && setOpen((v) => !v)}
        aria-expanded={isOpen}
        disabled={!canToggle}
        className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-layer-7 transition-colors rf-focus-ring disabled:cursor-default disabled:hover:bg-transparent text-left"
      >
        <span aria-hidden className="text-xl leading-none flex-shrink-0">
          {icon}
        </span>
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Ligne 1 : titre (truncate) + pill d'état inline si assez de place. */}
          <div className="flex items-center gap-2 min-w-0">
            <h3
              className={`text-sm font-black leading-tight truncate ${runModeCompleted ? 'text-fg-muted' : 'text-fg'}`}
              title={name}
            >
              {name}
            </h3>
            {isRunning && runModeActive && (
              <span className="inline-flex items-center rounded-full bg-brand text-on-brand px-2 py-0.5 text-[10px] font-black uppercase tracking-wide flex-shrink-0">
                En cours
              </span>
            )}
            {isRunning && runModeCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ok-strong text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide flex-shrink-0">
                <Check className="w-3 h-3" strokeWidth={3} />
                Terminé
              </span>
            )}
          </div>
          {/* Ligne 2 dédiée : badge optionnel (dérange peu car peu fréquent). */}
          {block.isOptional && !isRunning && (
            <div className="mt-0.5">
              <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                {msLabel('optional', lang)}
              </span>
            </div>
          )}
          {!isOpen && summary && (
            <p className="mt-0.5 text-xs text-fg-muted truncate">{summary}</p>
          )}
        </div>
        {/* Duration + chevron : toujours sur la ligne 1, jamais relégués en dessous. */}
        {minutes > 0 && (
          <span className="text-[11px] font-bold text-fg-muted tabular-nums flex-shrink-0">
            {minutes} min
          </span>
        )}
        {canToggle && (
          <ChevronDown
            className={`w-4 h-4 text-fg-faint transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-0 border-t border-border-app">
          {children}
        </div>
      )}
    </article>
  )
}
