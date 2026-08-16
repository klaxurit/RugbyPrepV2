import type { SVGProps } from 'react'

export type IconName =
  | 'home'
  | 'away'
  | 'dumbbell'
  | 'user'
  | 'walk'
  | 'bike'
  | 'yoga'
  | 'swim'
  | 'more'
  | 'check'
  | 'flame'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'play'
  | 'leaf'
  | 'bolt'
  | 'calendar'
  | 'plus'
  | 'sparkle'
  | 'circle'
  | 'trophy'
  | 'medal'
  | 'star'
  | 'lock'
  | 'arrow-right'
  | 'rugby-ball'
  | 'heart'
  | 'eye'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'stroke'> {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
}

export function Icon({
  name,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.8,
  ...rest
}: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  }

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 11l9-7 9 7" />
          <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
        </svg>
      )
    case 'away':
      return (
        <svg {...common}>
          <path d="M3 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      )
    case 'dumbbell':
      return (
        <svg {...common}>
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <rect x="4" y="8" width="3" height="8" rx="1" />
          <rect x="17" y="8" width="3" height="8" rx="1" />
          <path d="M7 12h10" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </svg>
      )
    case 'walk':
      return (
        <svg {...common}>
          <circle cx="13" cy="4" r="1.6" />
          <path d="M9 21l2-6-3-3 1-5 4 1 2 4 3 1" />
          <path d="M11 15l-1 6" />
        </svg>
      )
    case 'bike':
      return (
        <svg {...common}>
          <circle cx="6" cy="17" r="3" />
          <circle cx="18" cy="17" r="3" />
          <path d="M6 17l4-7h5l3 7" />
          <path d="M10 10l-2-4h-2" />
          <circle cx="14" cy="6" r="0.5" fill={color} />
        </svg>
      )
    case 'yoga':
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="1.6" />
          <path d="M12 8v5" />
          <path d="M5 20c2-4 5-5 7-5s5 1 7 5" />
          <path d="M8 13l-3 2" />
          <path d="M16 13l3 2" />
        </svg>
      )
    case 'swim':
      return (
        <svg {...common}>
          <path d="M2 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
          <path d="M2 14c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
          <circle cx="17" cy="7" r="2" />
          <path d="M9 12l4-3 3 1" />
        </svg>
      )
    case 'more':
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="1" fill={color} />
          <circle cx="12" cy="12" r="1" fill={color} />
          <circle cx="12" cy="19" r="1" fill={color} />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="M5 12l4 4L19 6" />
        </svg>
      )
    case 'flame':
      return (
        <svg {...common}>
          <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4-1 3 1 4 2 3-1-3 0-6 1-9z" />
        </svg>
      )
    case 'chevron-left':
      return (
        <svg {...common}>
          <path d="M15 6l-6 6 6 6" />
        </svg>
      )
    case 'chevron-right':
      return (
        <svg {...common}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      )
    case 'chevron-down':
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      )
    case 'play':
      return (
        <svg {...common}>
          <path d="M7 5l12 7-12 7V5z" fill={color} />
        </svg>
      )
    case 'leaf':
      return (
        <svg {...common}>
          <path d="M4 20c0-9 6-15 16-16-1 10-7 16-16 16z" />
          <path d="M4 20l9-9" />
        </svg>
      )
    case 'bolt':
      return (
        <svg {...common}>
          <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg {...common}>
          <path d="M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5L12 4z" />
        </svg>
      )
    case 'circle':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
    case 'trophy':
      return (
        <svg {...common}>
          <path d="M7 4h10v3a5 5 0 0 1-10 0V4z" />
          <path d="M5 4H3v2a3 3 0 0 0 3 3" />
          <path d="M19 4h2v2a3 3 0 0 1-3 3" />
          <path d="M10 13h4l-1 4h-2l-1-4z" />
          <path d="M9 21h6" />
        </svg>
      )
    case 'medal':
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="6" />
          <path d="M8 8L6 3h4l2 4" />
          <path d="M16 8l2-5h-4l-2 4" />
          <path d="M12 11l1 2 2 .3-1.5 1.5.4 2.2-1.9-1-1.9 1 .4-2.2L9 13.3 11 13l1-2z" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <path d="M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5L12 17l-5.5 3.5L8 14 3 9.5l6.5-.5L12 3z" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      )
    case 'arrow-right':
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      )
    case 'rugby-ball':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-30 12 12)" />
          <path d="M8 14l8-4" />
          <path d="M9.5 11l1.2 1.2M11.5 10l1.2 1.2M13.5 9l1.2 1.2" />
        </svg>
      )
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.5-9-10c-1.5-4 1.5-7 5-6 2 1 3 2.5 4 4 1-1.5 2-3 4-4 3.5-1 6.5 2 5 6-2 5.5-9 10-9 10z" />
        </svg>
      )
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
  }
}
