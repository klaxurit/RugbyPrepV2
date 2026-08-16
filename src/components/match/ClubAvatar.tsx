import { getClubLogoUrl, getClubMonogram } from '../../services/ui/clubLogos'

interface ClubAvatarProps {
  code?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export function ClubAvatar({ code, name, size = 'md' }: ClubAvatarProps) {
  const logoUrl = code ? getClubLogoUrl(code) : null
  const monogram = getClubMonogram(name)
  const sizeClass =
    size === 'xs'
      ? 'w-5 h-5 text-[7px]'
      : size === 'sm'
        ? 'w-8 h-8 text-[9px]'
        : size === 'lg'
          ? 'w-14 h-14 text-sm'
          : 'w-10 h-10 text-[11px]'

  return (
    <div
      className={`${sizeClass} ${size === 'xs' ? 'rounded-lg' : 'rounded-xl'} bg-app ring-1 ring-fg/10 flex items-center justify-center overflow-hidden flex-shrink-0`}
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
