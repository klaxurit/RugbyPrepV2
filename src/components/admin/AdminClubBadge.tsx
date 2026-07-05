import { getClubLogoUrl, getClubMonogram } from '../../services/ui/clubLogos'

export function AdminClubBadge({
  clubCode,
  clubName,
  size = 'md',
}: {
  clubCode?: string | null
  clubName?: string | null
  size?: 'sm' | 'md'
}) {
  const logoUrl = getClubLogoUrl(clubCode ?? undefined)
  const monogram = getClubMonogram(clubName ?? undefined)
  const dim = size === 'sm' ? 'w-7 h-7 text-[9px]' : 'w-9 h-9 text-[10px]'

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className={`${dim} shrink-0 rounded-lg border border-brand-border bg-white object-contain p-0.5`}
      />
    )
  }

  return (
    <div
      className={`${dim} shrink-0 flex items-center justify-center rounded-lg border border-brand-border bg-layer-10 font-bold text-fg-muted`}
      aria-hidden
    >
      {monogram}
    </div>
  )
}
