import { useState } from 'react'
import type { Lang } from '../../i18n/appLabels'
import type { VolumeLighteningReason } from '../../services/program/volumeConfidenceBypass'
import {
  clearVolumeConfidenceBypass,
  persistVolumeConfidenceBypass,
  volumeConfidenceActiveCopy,
  volumeConfidenceBannerCopy,
} from '../../services/program/volumeConfidenceBypass'

export interface VolumeConfidenceBannerProps {
  reasons: VolumeLighteningReason[]
  bypassApplied: boolean
  lang?: Lang
  className?: string
}

/**
 * Modulation volume — même coquille que Contact club (layer-2, 14px).
 * Bypass actif = ligne status compacte (ne concurrence pas Contact club).
 * Allégé = CTA, une seule décision à prendre.
 */
export function VolumeConfidenceBanner({
  reasons,
  bypassApplied,
  lang = 'fr',
  className = '',
}: VolumeConfidenceBannerProps) {
  const [whyOpen, setWhyOpen] = useState(false)

  if (bypassApplied) {
    const copy = volumeConfidenceActiveCopy(lang)
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-edge-hairline bg-layer-2 px-3.5 py-2.5 ${className}`}
        data-testid="volume-confidence-banner-active"
        role="status"
      >
        <p className="text-[12px] font-bold leading-snug text-fg">
          {copy.title}
          <span className="font-medium text-fg-muted"> · {copy.body}</span>
        </p>
        <button
          type="button"
          onClick={() => clearVolumeConfidenceBypass()}
          className="shrink-0 text-[11px] font-bold text-fg-muted underline underline-offset-2 rf-focus-ring"
        >
          {copy.undo}
        </button>
      </div>
    )
  }

  if (reasons.length === 0) return null

  const copy = volumeConfidenceBannerCopy(reasons, lang)

  return (
    <div
      className={`space-y-2.5 rounded-[14px] border border-edge-hairline bg-layer-2 px-3.5 py-3 ${className}`}
      data-testid="volume-confidence-banner"
      role="region"
      aria-label={copy.title}
    >
      <div className="space-y-1">
        <p className="text-[13px] font-extrabold leading-snug tracking-[-0.02em] text-fg">
          {copy.title}
        </p>
        <p className="text-[11px] leading-snug text-fg-muted">{copy.body}</p>
        {whyOpen ? (
          <p
            className="text-[11px] leading-snug text-fg-muted"
            data-testid="volume-confidence-why"
          >
            {copy.why}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="volume-confidence-cta"
          onClick={() => {
            persistVolumeConfidenceBypass({
              activatedAt: new Date().toISOString(),
              reason: reasons[0],
              reasons,
            })
          }}
          className="inline-flex min-h-[40px] items-center rounded-[8px] bg-brand px-3 text-[12px] font-bold text-app rf-focus-ring"
        >
          {copy.cta}
        </button>
        <button
          type="button"
          onClick={() => setWhyOpen((o) => !o)}
          className="inline-flex min-h-[40px] items-center px-1.5 text-[11px] font-bold text-fg-muted rf-focus-ring"
        >
          {whyOpen
            ? lang === 'en'
              ? 'Hide'
              : 'Masquer'
            : lang === 'en'
              ? 'Why?'
              : 'Pourquoi ?'}
        </button>
      </div>
    </div>
  )
}
