import { useState } from 'react'
import { PLAY_STORE_URL } from './playStoreUrl'
import { IosInstallSheet } from './IosInstallSheet'

interface StoreBadgesProps {
  className?: string
  /** Claude Design landing: single segmented strip (#1D1714 cells). */
  variant?: 'default' | 'segmented'
}

/**
 * Official-style FR store badges: Play → listing ; App Store visual → iOS PWA sheet.
 */
export function StoreBadges({ className = '', variant = 'default' }: StoreBadgesProps) {
  const [iosSheetOpen, setIosSheetOpen] = useState(false)

  const iosButton = (
    <button
      type="button"
      onClick={() => setIosSheetOpen(true)}
      className={
        variant === 'segmented'
          ? 'lm-store-cell group flex min-w-[210px] flex-1 items-center gap-3 bg-[#1D1714] px-[9px] py-[9px] pl-[9px] pr-[14px] text-left text-[#F2E8D8] transition-colors hover:bg-[#2A221F]'
          : 'group inline-flex items-center gap-3 rounded-2xl border border-[#2A2A2A] bg-black px-4 py-2.5 text-left transition-[transform,filter] hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40'
      }
      aria-label="Ajouter à l’écran d’accueil sur iPhone"
    >
      {variant === 'segmented' ? (
        <>
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[11px] bg-[#F2E8D8] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <AppleLogoSegment className="h-5 w-5 text-[#14100E]" />
          </span>
          <span className="flex flex-1 flex-col gap-[3px] leading-none">
            <span className="lm-mono whitespace-nowrap text-[10px] uppercase tracking-[0.08em] text-[#A89A8A]">
              Télécharger sur l’
            </span>
            <span className="whitespace-nowrap text-[17px] font-extrabold tracking-[-0.02em] [font-stretch:108%]">
              App Store
            </span>
          </span>
          <span className="text-[15px] text-[#C8303F]">↗</span>
        </>
      ) : (
        <>
          <AppleLogo className="h-7 w-7 shrink-0 text-white" />
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] font-medium text-[#A1A1A1]">
              Télécharger sur l’
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-white">
              App Store
            </span>
          </span>
        </>
      )}
    </button>
  )

  const playLink = (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={
        variant === 'segmented'
          ? 'lm-store-cell group flex min-w-[210px] flex-1 items-center gap-3 bg-[#1D1714] px-[9px] py-[9px] pl-[9px] pr-[14px] text-left text-[#F2E8D8] transition-colors hover:bg-[#2A221F]'
          : 'group inline-flex items-center gap-3 rounded-2xl border border-[#2A2A2A] bg-black px-4 py-2.5 text-left transition-[transform,filter] hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40'
      }
      aria-label="Télécharger sur Google Play"
    >
      {variant === 'segmented' ? (
        <>
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[11px] bg-[#F2E8D8] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <GooglePlayLogoSegment className="ml-0.5 h-[20px] w-[18px]" />
          </span>
          <span className="flex flex-1 flex-col gap-[3px] leading-none">
            <span className="lm-mono whitespace-nowrap text-[10px] uppercase tracking-[0.08em] text-[#A89A8A]">
              Disponible sur
            </span>
            <span className="whitespace-nowrap text-[17px] font-extrabold tracking-[-0.02em] [font-stretch:108%]">
              Google Play
            </span>
          </span>
          <span className="text-[15px] text-[#C8303F]">↗</span>
        </>
      ) : (
        <>
          <GooglePlayLogo className="h-7 w-7 shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] font-medium text-[#A1A1A1]">Disponible sur</span>
            <span className="text-[17px] font-semibold tracking-tight text-white">
              Google Play
            </span>
          </span>
        </>
      )}
    </a>
  )

  return (
    <>
      <div
        className={
          variant === 'segmented'
            ? `flex flex-wrap gap-px overflow-hidden rounded-2xl border border-[rgba(242,232,216,0.14)] bg-[rgba(242,232,216,0.12)] shadow-[0_20px_40px_-24px_rgba(0,0,0,0.8)] ${className}`
            : `flex flex-wrap items-center gap-3 ${className}`
        }
        data-testid="store-badges"
      >
        {iosButton}
        {playLink}
      </div>

      <IosInstallSheet open={iosSheetOpen} onClose={() => setIosSheetOpen(false)} />
    </>
  )
}

function AppleLogoSegment({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.710-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
    </svg>
  )
}

function GooglePlayLogoSegment({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 22 24" aria-hidden>
      <polygon points="1,1 12,12 1,23" fill="#00B4D8" />
      <polygon points="1,1 16,8.6 12,12" fill="#00C46A" />
      <polygon points="1,23 12,12 16,15.4" fill="#E8333F" />
      <polygon points="16,8.6 21,12 16,15.4 12,12" fill="#F2B800" />
    </svg>
  )
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

function GooglePlayLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M3.6 2.2c-.3.2-.5.6-.5 1.1v17.4c0 .5.2.9.5 1.1l.1.1 9.6-9.6v-.2L3.7 2.1l-.1.1z"
      />
      <path
        fill="#FBBC04"
        d="M16.9 11.3 14.2 8.6 3.7 2.1l-.1.1 9.7 9.6 3.6-.5z"
      />
      <path
        fill="#4285F4"
        d="M16.9 12.7c.4-.2.7-.6.7-1.1 0-.5-.3-.9-.7-1.1l-2.1-1.2-2.8 2.8 2.8 2.8 2.1-2.2z"
      />
      <path
        fill="#34A853"
        d="M3.6 21.8c.3.2.7.2 1.1 0l11.1-6.3-3.6-3.6L3.6 21.8z"
      />
    </svg>
  )
}
