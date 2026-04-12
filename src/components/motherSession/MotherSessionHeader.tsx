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
}

export function MotherSessionHeader({ metadata, lang = 'fr' }: MotherSessionHeaderProps) {
  const title = formatTitleFromMotherSessionId(metadata.id, lang)

  return (
    <header className="rounded-[2rem] border border-border-app bg-layer-5 p-4 sm:p-5">
      <h1 className="text-xl font-bold leading-tight text-fg sm:text-2xl">{title}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{msCycleLabel(metadata.cycle, lang)}</Badge>
        {metadata.targetDuration ? <Badge>{metadata.targetDuration}</Badge> : null}
        <Badge>{msTargetLevelLabel(metadata.targetLevel, lang)}</Badge>
      </div>
    </header>
  )
}
