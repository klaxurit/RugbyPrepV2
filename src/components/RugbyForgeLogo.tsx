/**
 * RugbyForgeLogo — Typographic logo component
 * "RUGBY" in brand green + "FORGE" in orange with custom rugby-ball "O" glyph
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
      <span className="text-[#1a5f3f]">RUGBY</span>
      <span className="text-[#ff6b35] flex items-center">
        F
        {/* Custom rugby-ball "O" glyph */}
        <span className="relative inline-block mx-[0.05em]" style={{ width: '0.65em', height: '0.85em' }}>
          <span
            className="absolute inset-0 bg-[#ff6b35] rounded-[100%]"
            style={{ transform: 'rotate(15deg) scaleY(1.1)' }}
          />
          <span
            className="absolute inset-0 rounded-[100%]"
            style={{
              border: '2px solid rgba(255,255,255,0.2)',
              transform: 'rotate(15deg) scale(0.6)',
            }}
          />
        </span>
        RGE
      </span>
    </span>
  )
}
