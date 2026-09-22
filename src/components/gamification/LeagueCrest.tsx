import type { ReactNode } from 'react'
import type { SVGProps } from 'react'
import type { LeagueTier } from '../../types/gamification'

type CrestProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  tier: LeagueTier
  size?: number
}

const STROKE = '#7B0D1E'
const FILL = '#F5E8EA'

function ShieldFrame({
  size,
  children,
  ...rest
}: Omit<CrestProps, 'tier'> & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden
      {...rest}
    >
      <path
        d="M48 8 L82 20 V48 C82 70 66 84 48 90 C30 84 14 70 14 48 V20 Z"
        stroke={STROKE}
        strokeWidth={3}
        strokeLinejoin="round"
        fill={FILL}
      />
      {children}
    </svg>
  )
}

/** Écusson de division — planche Design V2 (vie de club). */
export function LeagueCrest({ tier, size = 40, ...rest }: CrestProps) {
  switch (tier) {
    case 'reserve':
      // Buvette — chope + vapeur
      return (
        <ShieldFrame size={size} {...rest}>
          <path
            d="M36 58 V42 h18 c6 0 10 4 10 9 s-4 9-10 9 H36z"
            stroke={STROKE}
            strokeWidth={2.4}
            strokeLinejoin="round"
            fill="none"
          />
          <path d="M54 45 h6 c3 0 5 2.5 5 5.5 S63 56 60 56 h-6" stroke={STROKE} strokeWidth={2.2} />
          <path d="M40 36 c0-3 2-5 4-5 M46 35 c0-4 2-6 4-6" stroke={STROKE} strokeWidth={2} strokeLinecap="round" />
        </ShieldFrame>
      )
    case 'espoirs':
      // Banc de touche
      return (
        <ShieldFrame size={size} {...rest}>
          <path d="M30 52 h36" stroke={STROKE} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M34 52 v10 M62 52 v10" stroke={STROKE} strokeWidth={2.4} strokeLinecap="round" />
          <path d="M28 46 h40" stroke={STROKE} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M32 40 h8 M56 40 h8" stroke={STROKE} strokeWidth={2.2} strokeLinecap="round" />
        </ShieldFrame>
      )
    case 'premiere':
      // Titulaires — XV
      return (
        <ShieldFrame size={size} {...rest}>
          <text
            x="48"
            y="58"
            textAnchor="middle"
            fill={STROKE}
            fontSize="28"
            fontWeight="800"
            fontFamily="system-ui, sans-serif"
          >
            XV
          </text>
        </ShieldFrame>
      )
    case 'federale':
      // Capitaines — brassard C
      return (
        <ShieldFrame size={size} {...rest}>
          <rect
            x="30"
            y="38"
            width="36"
            height="26"
            rx="4"
            stroke={STROKE}
            strokeWidth={2.4}
            fill="none"
          />
          <path d="M30 44 h36 M30 58 h36" stroke={STROKE} strokeWidth={2} />
          <text
            x="48"
            y="57"
            textAnchor="middle"
            fill={STROKE}
            fontSize="16"
            fontWeight="800"
            fontFamily="system-ui, sans-serif"
          >
            C
          </text>
        </ShieldFrame>
      )
    case 'elite':
      // Bouclier — écusson dans l’écusson
      return (
        <ShieldFrame size={size} {...rest}>
          <path
            d="M48 28 L64 34 V48 C64 58 56 66 48 70 C40 66 32 58 32 48 V34 Z"
            stroke={STROKE}
            strokeWidth={2.6}
            strokeLinejoin="round"
            fill="none"
          />
        </ShieldFrame>
      )
  }
}
