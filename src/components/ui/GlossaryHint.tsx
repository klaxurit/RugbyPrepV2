import { useId, useState } from 'react'
import type { Lang } from '../../i18n/appLabels'
import {
  findGlossaryMatches,
  glossaryDefinition,
  glossaryEntryById,
  glossaryLabel,
  type GlossaryEntry,
  type GlossaryTermId,
} from '../../i18n/trainingGlossary'

type GlossaryHintProps = {
  /** Texte scanné pour détecter les termes (prescription, note…). */
  text?: string
  /**
   * Termes imposés par le formatteur d’affichage (prioritaire sur `text`).
   * Évite le décalage Fondations % → RER.
   */
  termIds?: readonly GlossaryTermId[]
  lang?: Lang
  className?: string
}

/**
 * Petits « ? » en ligne — 0 nouvel écran (popover ancré au bouton).
 */
export function GlossaryHint({ text, termIds, lang = 'fr', className }: GlossaryHintProps) {
  const matches: GlossaryEntry[] =
    termIds && termIds.length > 0
      ? termIds.map((id) => glossaryEntryById(id))
      : text
        ? findGlossaryMatches(text)
        : []
  if (matches.length === 0) return null

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className ?? ''}`}>
      {matches.map((entry) => (
        <GlossaryTermButton key={entry.id} entry={entry} lang={lang} />
      ))}
    </span>
  )
}

function GlossaryTermButton({ entry, lang }: { entry: GlossaryEntry; lang: Lang }) {
  const [open, setOpen] = useState(false)
  const tipId = useId()
  const label = glossaryLabel(entry, lang)
  const definition = glossaryDefinition(entry, lang)

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-5 items-center gap-0.5 rounded-full border border-paper-deep bg-paper-soft px-1.5 text-[10px] font-extrabold uppercase tracking-wide text-fg-muted rf-focus-ring"
        aria-expanded={open}
        aria-controls={tipId}
        onClick={() => setOpen((v) => !v)}
        data-testid={`glossary-hint-${entry.id}`}
      >
        {label}
        <span aria-hidden className="text-brand">
          ?
        </span>
      </button>
      {open && (
        <span
          id={tipId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-border-app bg-app px-3 py-2 text-sm font-medium leading-snug text-fg shadow-lg"
        >
          {definition}
          <button
            type="button"
            className="mt-1.5 block text-[10px] font-bold uppercase tracking-wide text-brand"
            onClick={() => setOpen(false)}
          >
            {lang === 'en' ? 'Got it' : 'OK'}
          </button>
        </span>
      )}
    </span>
  )
}
