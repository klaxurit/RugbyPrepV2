import type { StaffRosterTheme } from './StaffRosterTable'

const sizeMap = {
  sm: 'w-8 h-8 text-[10px] rounded-lg',
  md: 'w-12 h-12 text-sm rounded-xl',
  lg: 'w-16 h-16 text-base rounded-xl',
} as const

export interface StaffAthleteAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: keyof typeof sizeMap
  theme?: StaffRosterTheme
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function StaffAthleteAvatar({
  name,
  avatarUrl,
  size = 'md',
  theme = 'app',
}: StaffAthleteAvatarProps) {
  const sizeClass = sizeMap[size]
  const isDark = theme === 'dark'
  const fallbackClass = isDark
    ? 'bg-[#1c2028] text-white font-black'
    : 'bg-layer-10 text-fg font-black'

  if (avatarUrl?.trim()) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass} shrink-0 object-cover border ${
          isDark ? 'border-white/10' : 'border-brand-border'
        }`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} shrink-0 flex items-center justify-center ${fallbackClass}`}
      aria-hidden
    >
      {initialsFromName(name)}
    </div>
  )
}
