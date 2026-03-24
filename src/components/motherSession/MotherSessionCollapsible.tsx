import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

type MotherSessionCollapsibleProps = {
  title: string
  defaultOpen?: boolean
  children: ReactNode
  className?: string
  /** Style plus discret pour sous-accordéons (ex. Alternatives) */
  variant?: 'section' | 'nested'
}

export function MotherSessionCollapsible({
  title,
  defaultOpen = false,
  children,
  className = '',
  variant = 'section',
}: MotherSessionCollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)

  const shell =
    variant === 'nested'
      ? 'rounded-xl border border-white/10 bg-black/20'
      : 'rounded-2xl border border-white/10 bg-white/5'

  return (
    <div className={`overflow-hidden ${shell} ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span
          className={
            variant === 'nested'
              ? 'text-sm font-medium text-white/80'
              : 'text-sm font-semibold text-white'
          }
        >
          {title}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#ff6b35] transition-transform duration-200 ease-out ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          className={
            variant === 'nested'
              ? 'border-t border-white/10 px-3 pb-3 pt-1 text-sm text-white/70'
              : 'border-t border-white/10 px-4 pb-4 pt-1 text-sm text-white/70'
          }
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
