import { Mail } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { tr, type Lang } from '../../i18n/appLabels'

interface NewsletterOptInSheetProps {
  open: boolean
  lang?: Lang
  isLoading?: boolean
  onAccept: () => void | Promise<void>
  onDecline: () => void | Promise<void>
}

export function NewsletterOptInSheet({
  open,
  lang = 'fr',
  isLoading = false,
  onAccept,
  onDecline,
}: NewsletterOptInSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={() => undefined}
      ariaLabel={tr('newsletter_prompt_aria', lang)}
      eyebrow={tr('newsletter_prompt_eyebrow', lang)}
      title={tr('newsletter_prompt_title', lang)}
      disableBackdropDismiss
      disableSwipeDismiss
      showClose={false}
    >
      <div className="space-y-5 pb-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
            <Mail className="h-8 w-8" strokeWidth={2.2} />
          </div>
        </div>

        <p className="text-center text-sm leading-relaxed text-fg-muted [text-wrap:balance]">
          {tr('newsletter_prompt_body', lang)}
        </p>

        <ul className="space-y-2 rounded-2xl border border-border-app bg-layer-5 px-4 py-3 text-xs text-fg-muted">
          <li>{tr('newsletter_prompt_bullet_updates', lang)}</li>
          <li>{tr('newsletter_prompt_bullet_training', lang)}</li>
          <li>{tr('newsletter_prompt_bullet_ads', lang)}</li>
        </ul>

        <div className="space-y-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void onAccept()}
            className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-black text-on-brand shadow-brand-float transition-colors hover:bg-brand-hover disabled:opacity-60 rf-focus-ring"
          >
            {isLoading ? tr('newsletter_prompt_saving', lang) : tr('newsletter_prompt_accept', lang)}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void onDecline()}
            className="flex h-11 w-full items-center justify-center rounded-full border border-border-app text-sm font-bold text-fg-muted transition-colors hover:border-brand/30 hover:text-fg rf-focus-ring"
          >
            {tr('newsletter_prompt_decline', lang)}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
