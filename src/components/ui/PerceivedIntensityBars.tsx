import { clampPerceivedIntensity, perceivedIntensityLabel } from '../../services/ui/perceivedIntensity'

export interface PerceivedIntensityBarsProps {
  value: number
  onChange: (next: number) => void
  lang?: 'fr' | 'en'
  testId?: string
  disabled?: boolean
}

/**
 * Compteur d’intensité 1–10 en barres verticales wine — DA Match Load Sheet.
 * Persistance = champ `rpe` (session-RPE Foster).
 */
export function PerceivedIntensityBars({
  value,
  onChange,
  lang = 'fr',
  testId = 'perceived-intensity-bars',
  disabled = false,
}: PerceivedIntensityBarsProps) {
  const n = clampPerceivedIntensity(value)
  const word = perceivedIntensityLabel(n, lang)

  const pickFromClientX = (el: HTMLElement, clientX: number) => {
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    onChange(clampPerceivedIntensity(Math.floor(ratio * 10) + 1))
  }

  return (
    <section
      className="rounded-[18px] border border-paper-deep bg-app px-[18px] pt-4 pb-3.5 space-y-3.5"
      data-testid={testId}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted">
          {lang === 'fr' ? 'Intensité ressentie' : 'Felt intensity'}
        </p>
        <p className="flex items-baseline gap-1.5 tabular-nums">
          <span className="text-[22px] font-black tracking-tight text-brand-tint">{n}</span>
          <span className="text-[13px] font-bold text-fg-muted">/ 10 —</span>
          <span className="font-serif italic text-[20px] text-fg leading-none">{word}</span>
        </p>
      </div>

      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={n}
        aria-valuetext={`${n} / 10 — ${word}`}
        aria-label={lang === 'fr' ? 'Intensité ressentie de 1 à 10' : 'Felt intensity from 1 to 10'}
        aria-disabled={disabled || undefined}
        className="flex h-14 items-end gap-1.5 touch-none select-none cursor-pointer rf-focus-ring rounded-lg outline-none"
        onPointerDown={(e) => {
          if (disabled) return
          e.currentTarget.setPointerCapture(e.pointerId)
          pickFromClientX(e.currentTarget, e.clientX)
        }}
        onPointerMove={(e) => {
          if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return
          pickFromClientX(e.currentTarget, e.clientX)
        }}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault()
            onChange(clampPerceivedIntensity(n + 1))
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault()
            onChange(clampPerceivedIntensity(n - 1))
          }
        }}
      >
        {Array.from({ length: 10 }, (_, i) => {
          const k = i + 1
          const filled = k <= n
          const active = k === n
          const heightPx = 16 + i * 4.4
          return (
            <div
              key={k}
              aria-hidden
              className="flex-1 rounded-md origin-bottom transition-[background,transform] duration-150"
              style={{
                height: heightPx,
                background: filled
                  ? active
                    ? 'var(--color-accent)'
                    : `color-mix(in srgb, var(--color-accent) ${35 + i * 6}%, transparent)`
                  : 'var(--color-cream-deep)',
                transform: active ? 'scaleY(1.08)' : undefined,
              }}
            />
          )
        })}
      </div>

      <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-[0.16em] text-fg-muted">
        <span>{lang === 'fr' ? '1 · Facile' : '1 · Easy'}</span>
        <span>{lang === 'fr' ? 'Maximal · 10' : 'Max · 10'}</span>
      </div>
    </section>
  )
}
