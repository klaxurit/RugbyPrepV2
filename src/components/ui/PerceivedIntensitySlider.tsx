import { perceivedIntensityLabel, clampPerceivedIntensity } from '../../services/ui/perceivedIntensity'

export interface PerceivedIntensitySliderProps {
  value: number
  onChange: (next: number) => void
  lang?: 'fr' | 'en'
  /** id pour lier un label externe. */
  id?: string
  testId?: string
}

/**
 * Slider 1–10 « Intensité ressentie » — même échelle que la fin de séance gym.
 * Persistance = champ `rpe` (session-RPE Foster).
 */
export function PerceivedIntensitySlider({
  value,
  onChange,
  lang = 'fr',
  id = 'perceived-intensity',
  testId = 'perceived-intensity-slider',
}: PerceivedIntensitySliderProps) {
  const n = clampPerceivedIntensity(value)
  const word = perceivedIntensityLabel(n, lang)

  return (
    <section className="space-y-3" data-testid={testId}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-black uppercase tracking-wider text-fg-muted">
          {lang === 'fr' ? 'Intensité ressentie' : 'Felt intensity'}
        </label>
        <span className="text-xs font-bold text-fg tabular-nums">
          {n} / 10 — <span className="text-fg-muted font-semibold normal-case">{word}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={1}
        max={10}
        step={1}
        value={n}
        onChange={(e) => onChange(clampPerceivedIntensity(Number(e.target.value)))}
        className="w-full h-2 rounded-full accent-[var(--color-brand)] bg-layer-10 cursor-pointer rf-focus-ring"
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={n}
        aria-valuetext={`${n} / 10 — ${word}`}
        aria-label={lang === 'fr' ? 'Intensité ressentie de 1 à 10' : 'Felt intensity from 1 to 10'}
      />
      <div className="flex justify-between text-[10px] text-fg-faint">
        <span>{lang === 'fr' ? 'Facile' : 'Easy'}</span>
        <span>{lang === 'fr' ? 'Maximal' : 'Max'}</span>
      </div>
    </section>
  )
}
