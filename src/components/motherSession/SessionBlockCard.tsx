import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Block } from '../../types/motherSession'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import { msLabel } from '../../services/motherSession/motherSessionLabels'
import { getExerciseName } from '../../data/exercises'
import {
  iconForBlock,
  estimateBlockMinutes,
  summarizeBlockExercises,
} from '../../services/ui/blockPresentation'
import { useSessionRun } from '../../contexts/SessionRunContext'

interface SessionBlockCardProps {
  block: Block
  lang: AppLang
  /** Contenu déplié — typiquement un <MotherSessionBlock hideHeader />. */
  children: ReactNode
  /** Si true, la carte démarre ouverte. Par défaut : Bloc 1 et échauffement ouverts. */
  defaultOpen?: boolean
  /** Nom du bloc depuis frBlock (FR) — fallback sur block.name. */
  displayName?: string
}

/**
 * Carte résumé cliquable pour un bloc de séance — mode Aperçu.
 * Fermée : icône + nom + durée + résumé 2-3 exos. Tap pour déplier.
 * Ouverte : rend `children` (MotherSessionBlock sans header).
 */
export function SessionBlockCard({
  block,
  lang,
  children,
  defaultOpen = false,
  displayName,
}: SessionBlockCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const sessionRun = useSessionRun()
  const runMode = sessionRun.status === 'running'

  // En mode running, toujours ouvert — on veut voir tout le détail pour exécuter.
  const isOpen = runMode || open

  const icon = iconForBlock(block)
  const minutes = estimateBlockMinutes(block)
  const name = displayName ?? block.name
  const summary = summarizeBlockExercises(block, (id, fallback) =>
    id ? getExerciseName(id, lang) : fallback,
  )

  // Progress : combien d'exos de ce bloc sont cochés (mode running).
  const totalLoggable = block.exercises.filter((ex) => ex.exerciseId || ex.name).length
  const completedInBlock = Array.from(sessionRun.completedExercises).filter((key) =>
    key.startsWith(`${block.number}_`),
  ).length

  return (
    <article className="rounded-2xl border border-border-app bg-layer-5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={isOpen}
        disabled={runMode}
        className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-layer-7 transition-colors rf-focus-ring disabled:cursor-default disabled:hover:bg-transparent"
      >
        <span aria-hidden className="text-xl leading-none flex-shrink-0">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-fg leading-tight">{name}</h3>
            {block.isOptional && (
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                {msLabel('optional', lang)}
              </span>
            )}
            {runMode && totalLoggable > 0 && (
              <span className={`text-[10px] font-black tabular-nums ${completedInBlock === totalLoggable ? 'text-ok-strong' : 'text-fg-muted'}`}>
                {completedInBlock}/{totalLoggable}
              </span>
            )}
          </div>
          {!isOpen && summary && (
            <p className="mt-0.5 text-xs text-fg-muted truncate">{summary}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {minutes > 0 && (
            <span className="text-[11px] font-bold text-fg-muted tabular-nums">
              {minutes} min
            </span>
          )}
          {!runMode && (
            <ChevronDown
              className={`w-4 h-4 text-fg-faint transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-0 border-t border-border-app">
          {children}
        </div>
      )}
    </article>
  )
}
