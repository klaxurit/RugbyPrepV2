import { useState, type ReactNode } from 'react'
import { ChevronDown, Check, Clock } from 'lucide-react'
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
  // Les cartes terminées sont visuellement plus discrètes (opacité + padding réduit).
  const statusClass = isRunning
    ? runModeCompleted
      ? 'border-ok-bd opacity-60'
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
        className="relative w-full p-4 flex flex-col items-center gap-2 text-center hover:bg-layer-7 transition-colors rf-focus-ring disabled:cursor-default disabled:hover:bg-transparent"
      >
        {/* Indicateur d'état top-right en mode running uniquement (le temps
            ne va plus dans un coin — il descend en métadonnée centrée). */}
        {isRunning && runModeActive && (
          <span
            className="absolute top-3 right-3 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand"
            aria-label="En cours"
            title="En cours"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </span>
        )}
        {isRunning && runModeCompleted && (
          <span
            className="absolute top-3 right-3 inline-flex items-center justify-center w-5 h-5 rounded-full bg-ok-strong"
            aria-label="Terminé"
            title="Terminé"
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </span>
        )}

        {/* Emoji centré, taille discrète (~chip catégorie). */}
        <span
          aria-hidden
          className="text-2xl leading-none"
        >
          {icon}
        </span>

        {/* Titre centré — peut wrapper sur 2 lignes, casse normale. */}
        <h3
          className={`max-w-full text-base font-extrabold italic leading-snug tracking-tight px-2 ${runModeCompleted ? 'text-fg-muted' : 'text-fg'}`}
          title={name}
        >
          {name}
        </h3>

        {/* Métadonnée temps — petit chip neutre, centré, façon Hevy / Caliber.
            Reste visible en running mode (l'info durée est utile pendant la
            séance) car le badge d'état utilise un coin différent. */}
        {minutes > 0 && (
          <div className="inline-flex items-center gap-1 rounded-full bg-layer-10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted tabular-nums">
            <Clock className="w-3 h-3" strokeWidth={2.5} />
            <span>{minutes} min</span>
          </div>
        )}

        {/* Badge optionnel (mode Aperçu seulement, rare). */}
        {block.isOptional && !isRunning && (
          <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
            {msLabel('optional', lang)}
          </span>
        )}

        {/* Summary d'exos (mode collapsed, hors blocs terminés). */}
        {!isOpen && summary && !runModeCompleted && (
          <p className="max-w-full text-xs text-fg-faint line-clamp-1 px-2">{summary}</p>
        )}

        {/* Caret centré, bas de la zone header — rotate 180° quand ouvert. */}
        {canToggle && (
          <ChevronDown
            className={`w-5 h-5 text-fg-faint transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
