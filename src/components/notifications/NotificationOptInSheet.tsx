import { Bell, Timer } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { tr, type Lang } from '../../i18n/appLabels'

export type NotificationOptInVariant = 'onboarding' | 'rest_timer'

interface NotificationOptInSheetProps {
  open: boolean
  variant: NotificationOptInVariant
  lang?: Lang
  isLoading?: boolean
  onEnable: () => void | Promise<void>
  onLater: () => void
}

export function NotificationOptInSheet({
  open,
  variant,
  lang = 'fr',
  isLoading = false,
  onEnable,
  onLater,
}: NotificationOptInSheetProps) {
  const isOnboarding = variant === 'onboarding'
  const Icon = isOnboarding ? Bell : Timer

  return (
    <BottomSheet
      open={open}
      onClose={onLater}
      ariaLabel={tr(isOnboarding ? 'notif_prompt_onboarding_aria' : 'notif_prompt_rest_aria', lang)}
      eyebrow={tr(isOnboarding ? 'notif_prompt_onboarding_eyebrow' : 'notif_prompt_rest_eyebrow', lang)}
      title={tr(isOnboarding ? 'notif_prompt_onboarding_title' : 'notif_prompt_rest_title', lang)}
      disableBackdropDismiss
      disableSwipeDismiss
      showClose={false}
    >
      <div className="space-y-5 pb-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
            <Icon className="h-8 w-8" strokeWidth={2.2} />
          </div>
        </div>

        <p className="text-center text-sm leading-relaxed text-fg-muted [text-wrap:balance]">
          {tr(isOnboarding ? 'notif_prompt_onboarding_body' : 'notif_prompt_rest_body', lang)}
        </p>

        {isOnboarding && (
          <ul className="space-y-2 rounded-2xl border border-border-app bg-layer-5 px-4 py-3 text-xs text-fg-muted">
            <li>{tr('notif_prompt_onboarding_bullet_training', lang)}</li>
            <li>{tr('notif_prompt_onboarding_bullet_rest', lang)}</li>
            <li>{tr('notif_prompt_onboarding_bullet_profile', lang)}</li>
          </ul>
        )}

        <div className="space-y-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void onEnable()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-black text-on-brand shadow-brand-float transition-colors hover:bg-brand-hover disabled:opacity-60 rf-focus-ring"
          >
            {isLoading
              ? tr('notif_prompt_enabling', lang)
              : tr(isOnboarding ? 'notif_prompt_enable' : 'notif_prompt_enable_rest', lang)}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onLater}
            className="flex h-11 w-full items-center justify-center rounded-full border border-border-app text-sm font-bold text-fg-muted transition-colors hover:border-brand/30 hover:text-fg rf-focus-ring"
          >
            {tr('notif_prompt_later', lang)}
          </button>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-fg-muted/80">
          {tr('notif_prompt_privacy_note', lang)}
        </p>
      </div>
    </BottomSheet>
  )
}
