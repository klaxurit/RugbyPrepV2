import { useState } from 'react'
import { Icon } from '../ui'

interface SessionNotesProps {
  notes: readonly string[]
  /** Ouvre par défaut quand le bloc est actif. */
  defaultOpen?: boolean
  /** Libellé du toggle (par défaut "Notes de coaching"). */
  label?: string
}

/**
 * Accordéon "Notes de coaching" — pattern bordeaux + tirets bordeaux + texte ink2.
 * Réutilisable dans tous les types de blocs (Tours, Emom, Prehab).
 */
export function SessionNotes({
  notes,
  defaultOpen = false,
  label = 'Notes de coaching',
}: SessionNotesProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (notes.length === 0) return null

  return (
    <div className="overflow-hidden rounded-[14px] border border-paper-deep bg-app">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3.5 py-3 text-left rf-focus-ring"
      >
        <span className="inline-flex items-center gap-2">
          <Icon name="sparkle" size={14} color="var(--color-accent)" strokeWidth={1.8} />
          <span className="text-[12px] font-bold tracking-tight text-fg">{label}</span>
        </span>
        <span
          aria-hidden
          className="transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        >
          <Icon name="chevron-down" size={14} color="var(--color-text-primary)" strokeWidth={2} />
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-3.5 pb-3.5">
          {notes.map((note, i) => (
            <div key={i} className="flex gap-2 text-[12px] leading-[1.5] text-fg-secondary">
              <span aria-hidden className="flex-shrink-0 font-bold text-brand">
                —
              </span>
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
