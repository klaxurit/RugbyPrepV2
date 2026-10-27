import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { tr, type Lang } from '../../i18n/appLabels'

interface OauthLegalConsentSheetProps {
  open: boolean
  lang?: Lang
  isLoading?: boolean
  onSubmit: () => void | Promise<void>
}

export function OauthLegalConsentSheet({
  open,
  lang = 'fr',
  isLoading = false,
  onSubmit,
}: OauthLegalConsentSheetProps) {
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [medicalConsent, setMedicalConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!ageConfirmed || !medicalConsent) {
      setError(tr('oauth_consent_error', lang))
      return
    }
    setError(null)
    void onSubmit()
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => undefined}
      ariaLabel={tr('oauth_consent_aria', lang)}
      eyebrow={tr('oauth_consent_eyebrow', lang)}
      title={tr('oauth_consent_title', lang)}
      disableBackdropDismiss
      disableSwipeDismiss
      showClose={false}
    >
      <div className="space-y-5 pb-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
            <ShieldCheck className="h-8 w-8" strokeWidth={2.2} />
          </div>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border-app accent-brand"
          />
          <span className="text-[11px] leading-relaxed text-fg-muted">
            Je confirme avoir au moins 18 ans et j&apos;accepte les{' '}
            <Link to="/legal" className="text-brand underline">conditions d&apos;utilisation</Link>
            {' '}et la{' '}
            <Link to="/privacy" className="text-brand underline">politique de confidentialité</Link>.
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={medicalConsent}
            onChange={(e) => setMedicalConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border-app accent-brand"
          />
          <span className="text-[11px] leading-relaxed text-fg-muted">
            {tr('oauth_consent_medical', lang)}{' '}
            <Link to="/legal#disclaimer" className="text-brand underline">Lire le détail</Link>
          </span>
        </label>

        {error && (
          <p className="text-xs font-medium text-danger">{error}</p>
        )}

        <button
          type="button"
          disabled={isLoading}
          onClick={handleSubmit}
          className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-black text-on-brand shadow-brand-float transition-colors hover:bg-brand-hover disabled:opacity-60 rf-focus-ring"
        >
          {isLoading ? tr('oauth_consent_saving', lang) : tr('oauth_consent_cta', lang)}
        </button>
      </div>
    </BottomSheet>
  )
}
