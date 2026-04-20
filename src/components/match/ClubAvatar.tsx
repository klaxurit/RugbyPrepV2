import { getClubLogoUrl, getClubMonogram } from '../../services/ui/clubLogos'

interface ClubAvatarProps {
  code?: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ClubAvatar({ code, name, size = 'md' }: ClubAvatarProps) {
  const logoUrl = code ? getClubLogoUrl(code) : null
  const monogram = getClubMonogram(name)
  const sizeClass =
    size === 'sm'
      ? 'w-8 h-8 text-[9px]'
      : size === 'lg'
        ? 'w-14 h-14 text-sm'
        : 'w-10 h-10 text-[11px]'

  return (
    <div
      className={`${sizeClass} rounded-xl bg-layer-10 flex items-center justify-center overflow-hidden flex-shrink-0`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name ?? ''}
          className="w-full h-full object-contain"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <span className="font-black text-fg-soft">{monogram}</span>
      )}
    </div>
  )
}
