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
    return (
      <header className="rounded-2xl border border-border-app bg-layer-5 px-4 py-2.5 flex items-center justify-between gap-2">
        <h1 className="text-sm font-black leading-none truncate text-fg" title={title}>
          {title}
        </h1>
        <span className="flex-shrink-0 text-[11px] font-bold text-fg-muted tabular-nums">
          {metadata.targetDuration ?? msTargetLevelLabel(metadata.targetLevel, lang)}
        </span>
      </header>
    )
  }

  return (
    <header className="rounded-[2rem] border border-border-app bg-layer-5 p-4 sm:p-5 text-center">
      <h1 className="text-xl font-bold leading-tight text-fg sm:text-2xl">{title}</h1>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Badge>{msCycleLabel(metadata.cycle, lang)}</Badge>
        {metadata.targetDuration ? <Badge>{metadata.targetDuration}</Badge> : null}
        <Badge>{msTargetLevelLabel(metadata.targetLevel, lang)}</Badge>
      </div>
    </header>
  )
}
