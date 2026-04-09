import type { ReactNode } from 'react'
import { InlineNotice, type InlineNoticeTone } from '../ui/InlineNotice'

export type PlanningContextBannerTone = 'info' | 'warning'

const TONE_TO_NOTICE: Record<PlanningContextBannerTone, InlineNoticeTone> = {
  info: 'info',
  warning: 'warning',
}

export interface PlanningContextBannerProps {
  tone?: PlanningContextBannerTone
  title?: string
  children?: ReactNode
  learnMoreLabel?: string
  learnMoreHref?: string
  onLearnMore?: () => void
  className?: string
  'data-testid'?: string
  'aria-label'?: string
}

/**
 * Bandeau court — contexte planification / dual-mode, bâti sur `InlineNotice`.
 * Ne remplace pas la carte « Pourquoi » (`PlanningContextCard`) : message différent.
 */
export function PlanningContextBanner({
  tone = 'info',
  title,
  children,
  learnMoreLabel,
  learnMoreHref,
  onLearnMore,
  className,
  'data-testid': dataTestId = 'planning-context-banner',
  'aria-label': ariaLabel,
}: PlanningContextBannerProps) {
  return (
    <InlineNotice
      tone={TONE_TO_NOTICE[tone]}
      title={title}
      learnMoreLabel={learnMoreLabel}
      learnMoreHref={learnMoreHref}
      onLearnMore={onLearnMore}
      className={className}
      data-testid={dataTestId}
      aria-label={ariaLabel}
    >
      {children}
    </InlineNotice>
  )
}
