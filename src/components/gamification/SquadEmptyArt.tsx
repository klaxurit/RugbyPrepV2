import type { ReactNode, SVGProps } from 'react'

type ArtProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  size?: number
}

const STROKE = '#7B0D1E'

function Frame({ size = 120, children, ...rest }: ArtProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      className="mx-auto text-brand"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** Empty club board — invite tes coéquipiers (planche V2). */
export function EmptyArtInvite({ size }: ArtProps) {
  return (
    <Frame size={size}>
      <circle cx="44" cy="42" r="14" stroke={STROKE} strokeWidth={2.4} />
      <path d="M22 88 c0-14 10-24 22-24 s22 10 22 24" stroke={STROKE} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx="78" cy="46" r="12" stroke={STROKE} strokeWidth={2.2} strokeDasharray="3 3" />
      <path d="M62 90 c2-12 10-20 16-20 4 0 8 2 11 6" stroke={STROKE} strokeWidth={2.2} strokeDasharray="3 3" strokeLinecap="round" />
      <path d="M78 40 v12 M72 46 h12" stroke={STROKE} strokeWidth={2.4} strokeLinecap="round" />
    </Frame>
  )
}

/** Ligue en préparation — reprise lundi. */
export function EmptyArtPendingMonday({ size }: ArtProps) {
  return (
    <Frame size={size}>
      <rect x="28" y="32" width="64" height="58" rx="8" stroke={STROKE} strokeWidth={2.4} />
      <path d="M28 48 h64" stroke={STROKE} strokeWidth={2.2} />
      <path d="M42 26 v12 M78 26 v12" stroke={STROKE} strokeWidth={2.4} strokeLinecap="round" />
      <rect x="38" y="56" width="12" height="10" rx="2" fill={STROKE} />
      <rect x="54" y="56" width="12" height="10" rx="2" fill={STROKE} />
      <rect x="70" y="56" width="12" height="10" rx="2" stroke={STROKE} strokeWidth={1.8} />
      <rect x="38" y="72" width="12" height="10" rx="2" stroke={STROKE} strokeWidth={1.8} />
      <rect x="54" y="72" width="12" height="10" rx="2" stroke={STROKE} strokeWidth={1.8} />
    </Frame>
  )
}

/** Opt-in private — classement sous clé (variante A retenue). */
export function EmptyArtPrivateLock({ size }: ArtProps) {
  return (
    <Frame size={size}>
      <rect x="32" y="28" width="56" height="64" rx="8" stroke={STROKE} strokeWidth={2.4} />
      <path d="M42 48 h36 M42 60 h28 M42 72 h32" stroke={STROKE} strokeWidth={2.2} strokeLinecap="round" />
      <circle cx="42" cy="48" r="2" fill={STROKE} />
      <circle cx="42" cy="60" r="2" fill={STROKE} />
      <circle cx="42" cy="72" r="2" fill={STROKE} />
      <rect x="68" y="70" width="22" height="18" rx="3" stroke={STROKE} strokeWidth={2.2} fill="#F5F2EE" />
      <path d="M74 70 v-5 a5 5 0 0 1 10 0 v5" stroke={STROKE} strokeWidth={2.2} />
    </Frame>
  )
}
