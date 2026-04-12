/**
 * RugbyForgeLogo — Logo basé sur les assets PNG du nouveau branding.
 * Utilise CSS mask-image pour coloriser via --color-logo-fg :
 *   forge (dark) → crème #F5F2EE
 *   paper (light) → bordeaux #7B0D1E
 */

import fullLogo from '../assets/rugbyforge-full.png'

interface RugbyForgeLogoProps {
  /** 'hero' = grande taille auth/landing | 'md' = header onboarding | 'sm' = header inline compact */
  size?: 'hero' | 'md' | 'sm'
}

const SIZE_STYLES: Record<NonNullable<RugbyForgeLogoProps['size']>, { height: string; ratio: string; src: string }> = {
  hero: { height: 'h-14', ratio: 'aspect-[3.14/1]', src: fullLogo },
  md:   { height: 'h-9',  ratio: 'aspect-[3.14/1]', src: fullLogo },
  sm:   { height: 'h-5',  ratio: 'aspect-[3.14/1]', src: fullLogo },
}

export function RugbyForgeLogo({ size = 'hero' }: RugbyForgeLogoProps) {
  const { height, ratio, src } = SIZE_STYLES[size]

  return (
    <span
      className={`inline-block ${height} ${ratio} bg-logo`}
      role="img"
      aria-label="RugbyForge"
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'left center',
        maskPosition: 'left center',
      }}
    />
  )
}
