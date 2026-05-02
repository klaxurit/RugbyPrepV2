import type { ReactNode } from 'react'
import type { MotherSessionMetadata } from '../../types/motherSession'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import {
  msCycleLabel,
  msTargetLevelLabel,
} from '../../services/motherSession/motherSessionLabels'
import { formatTitleFromMotherSessionId } from './formatMotherSessionTitle'

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full border border-brand-border-strong bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-tint">
      <span className="truncate">{children}</span>
    </span>
  )
}

type MotherSessionHeaderProps = {
  metadata: MotherSessionMetadata
  lang?: AppLang
  /** En mode "En cours", on compacte le header sur une ligne pour gagner
   *  du vertical (le reste de la semaine a la priorité visuelle). */
  compact?: boolean
}

export function MotherSessionHeader({ metadata, lang = 'fr', compact = false }: MotherSessionHeaderProps) {
  const title = formatTitleFromMotherSessionId(metadata.id, lang)

  if (compact) {
    // En mode En cours, toutes les infos utiles (cycle, durée, bloc actif…)
    // sont déjà dans le header de progression sticky juste au-dessus. On
    // n'affiche plus cette ligne pour libérer 56px de vertical.
    return null
  }

  return (
    <header className="rounded-[2rem] border border-border-app bg-layer-5 p-4 sm:p-5 text-center">
      <h1 className="text-2xl font-black italic tracking-tight leading-[1.1] text-fg sm:text-3xl">{title}</h1>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Badge>{msCycleLabel(metadata.cycle, lang)}</Badge>
        {metadata.targetDuration ? <Badge>{metadata.targetDuration}</Badge> : null}
        <Badge>{msTargetLevelLabel(metadata.targetLevel, lang)}</Badge>
      </div>
    </header>
  )
}
