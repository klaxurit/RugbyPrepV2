import { Link } from 'react-router-dom'
import { Scale } from 'lucide-react'
import { tr, type Lang } from '../../i18n/appLabels'

type BodyweightMorphologyBannerProps = {
  lang: Lang
  /** Lien vers la section morpho du profil */
  profileMorphoHref?: string
  compact?: boolean
}

export function BodyweightMorphologyBanner({
  lang,
  profileMorphoHref = '/profile',
  compact = false,
}: BodyweightMorphologyBannerProps) {
  return (
    <div
      className={`rounded-2xl border border-warn-bd bg-warn-bg/80 text-fg ${
        compact ? 'px-3 py-2.5' : 'px-3.5 py-3'
      }`}
      data-testid="bodyweight-morphology-warning"
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <Scale className="mt-0.5 h-4 w-4 flex-shrink-0 text-warn" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className={`font-bold leading-snug ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {tr('bodyweight_morpho_warning_title', lang)}
          </p>
          <p className={`text-fg-muted leading-relaxed ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
            {tr('bodyweight_morpho_warning_body', lang)}
          </p>
          <Link
            to={profileMorphoHref}
            className={`inline-block font-bold text-brand-tint underline-offset-2 hover:underline ${
              compact ? 'text-[10px]' : 'text-[11px]'
            }`}
          >
            {tr('bodyweight_morpho_warning_cta', lang)}
          </Link>
        </div>
      </div>
    </div>
  )
}
