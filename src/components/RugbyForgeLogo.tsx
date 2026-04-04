/**
 * RugbyForgeLogo — Typographic logo component
 * "RUGBY" in brand green + "FORGE" in orange with custom rugby-ball "O" glyph
 *
 * Couleurs : tokens sémantiques (--color-success / --color-accent) pour suivre forge/paper.
 */

interface RugbyForgeLogoProps {
  /** 'hero' = 5xl auth/landing | 'md' = 2xl onboarding header | 'sm' = inline page label */
  size?: 'hero' | 'md' | 'sm'
}

const SIZE_CLASS: Record<NonNullable<RugbyForgeLogoProps['size']>, string> = {
  hero: 'text-5xl',
  md:   'text-3xl',
  sm:   'text-base',
}

export function RugbyForgeLogo({ size = 'hero' }: RugbyForgeLogoProps) {
  const sizeClass = SIZE_CLASS[size]

  return (
    <span className={`font-[800] tracking-tighter flex items-baseline leading-none ${sizeClass}`}>
      <span className="text-success-app">RUGBY</span>
      <span className="text-brand flex items-center">
        F
        {/* Custom rugby-ball "O" glyph */}
        <span className="relative inline-block mx-[0.05em]" style={{ width: '0.65em', height: '0.85em' }}>
          <span
            className="absolute inset-0 bg-brand rounded-[100%]"
            style={{ transform: 'rotate(15deg) scaleY(1.1)' }}
          />
          <span
            className="absolute inset-0 rounded-[100%] border-2 border-fg/20"
            style={{ transform: 'rotate(15deg) scale(0.6)' }}
          />
        </span>
        RGE
      </span>
    </span>
  )
}
