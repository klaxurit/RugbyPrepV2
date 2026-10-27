import { tr } from '../../i18n/appLabels'

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}

export function AuthOrDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border-app" />
      <span className="text-[11px] font-bold uppercase tracking-wider text-fg-faint">
        {tr('auth_or_divider', 'fr')}
      </span>
      <div className="h-px flex-1 bg-border-app" />
    </div>
  )
}

interface GoogleAuthButtonProps {
  onClick: () => void
  disabled?: boolean
  isLoading?: boolean
}

export function GoogleAuthButton({
  onClick,
  disabled = false,
  isLoading = false,
}: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      data-testid="google-auth-button"
      disabled={disabled || isLoading}
      onClick={onClick}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-border-app bg-white text-sm font-bold tracking-wide text-[#1f1f1f] transition-all hover:bg-neutral-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 rf-focus-ring"
    >
      <GoogleMark />
      {isLoading ? tr('google_redirecting', 'fr') : tr('google_continue', 'fr')}
    </button>
  )
}
