import { useState } from 'react'
import { getClubLogoUrl, getClubMonogram } from '../../services/ui/clubLogos'

/** Aligné sur Claude Design Match Load Sheet + cellules mois. */
export const CLUB_CREST_OPACITY = 0.42
/** Sheet : un cran plus lisible que le monogramme Design (0.42). */
export const CLUB_CREST_SHEET_OPACITY = 0.52

type CrestSize = 'cell' | 'sheet'

interface ClubCrestWatermarkProps {
  code?: string
  name?: string
  /** `cell` = grille mois (bas-droite) ; `sheet` = bottom sheet (haut-droite, DA Design). */
  size?: CrestSize
  className?: string
}

/**
 * Crest adversaire en filigrane.
 * Sheet : haut-droite + masque 215° (Claude Design), légèrement descendu pour ne pas être coupé en haut.
 * Cell : bas-droite + masque mois.
 */
export function ClubCrestWatermark({
  code,
  name,
  size = 'sheet',
  className = '',
}: ClubCrestWatermarkProps) {
  const logoUrl = code ? getClubLogoUrl(code) : null
  const monogram = getClubMonogram(name)
  const [failed, setFailed] = useState(false)
  const showLogo = Boolean(logoUrl) && !failed

  if (!showLogo && !monogram) return null

  if (size === 'sheet') {
    return (
      <div
        aria-hidden
        data-testid="club-crest-watermark"
        className={`pointer-events-none absolute -right-[26px] top-6 z-0 flex h-[220px] w-[200px] items-start justify-end overflow-visible ${className}`}
        style={{
          opacity: CLUB_CREST_SHEET_OPACITY,
          maskImage:
            'linear-gradient(215deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.1) 42%, transparent 70%)',
          WebkitMaskImage:
            'linear-gradient(215deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.1) 42%, transparent 70%)',
        }}
      >
        {showLogo ? (
          <img
            src={logoUrl ?? undefined}
            alt=""
            className="h-full w-full object-contain object-right-top"
            onError={() => setFailed(true)}
          />
        ) : (
          <span
            className="pr-1 font-serif italic font-medium leading-none text-fg"
            style={{ fontSize: 180, letterSpacing: '-10px' }}
          >
            {monogram}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      aria-hidden
      data-testid="club-crest-watermark"
      className={`pointer-events-none absolute -bottom-2 -right-1 flex h-[80px] w-[72px] items-end justify-end ${className}`}
      style={{
        maskImage: 'linear-gradient(to left top, transparent 0%, black 38%)',
        WebkitMaskImage: 'linear-gradient(to left top, transparent 0%, black 38%)',
      }}
    >
      {showLogo ? (
        <img
          src={logoUrl ?? undefined}
          alt=""
          className="h-full w-full object-contain object-bottom"
          style={{ opacity: CLUB_CREST_OPACITY }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="pr-0.5 font-serif text-[28px] font-medium leading-none text-fg"
          style={{ opacity: 0.5 }}
        >
          {monogram}
        </span>
      )}
    </div>
  )
}
