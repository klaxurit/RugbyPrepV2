import { LANDING_DESIGN } from '../../landing/designAssets'

interface LandingPhoneFrameProps {
  screenSrc: string
  alt: string
  showNavBar?: boolean
  size?: 'hero' | 'gallery'
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
}

/** Phone chrome from Claude Design `landing.dc.html`. */
export function LandingPhoneFrame({
  screenSrc,
  alt,
  showNavBar = false,
  size = 'gallery',
  loading = 'lazy',
  fetchPriority,
}: LandingPhoneFrameProps) {
  const isHero = size === 'hero'

  const inset = isHero ? '11px' : '7px'
  const outerRadius = isHero ? '56px' : '38px'
  const innerRadius = isHero ? '46px' : '32px'

  return (
    <div
      className={
        isHero
          ? 'relative w-[min(370px,88vw)] min-h-0 overflow-hidden bg-[#0A0807] shadow-[0_0_0_1px_#3A3330,0_0_0_4px_#1E1917,0_50px_100px_-30px_rgba(0,0,0,0.9)] [aspect-ratio:9/18.4] [border-radius:56px] [padding:11px]'
          : 'relative min-h-0 w-[clamp(210px,22vw,260px)] overflow-hidden bg-[#0A0807] shadow-[0_0_0_1px_#3A3330,0_30px_60px_-30px_rgba(0,0,0,0.8)] [aspect-ratio:9/18.4] [border-radius:38px] [padding:7px]'
      }
      style={{ borderRadius: outerRadius, padding: inset }}
    >
      <div
        className="absolute overflow-hidden bg-[#F4F1EE]"
        style={{ inset, borderRadius: innerRadius }}
      >
        <div className="absolute inset-0 overflow-y-auto overscroll-contain scrollbar-hide [-webkit-overflow-scrolling:touch]">
          <img
            src={screenSrc}
            alt={alt}
            width={390}
            height={844}
            loading={loading}
            fetchPriority={fetchPriority}
            decoding="async"
            className="block w-full pb-[var(--landing-navpad,0px)]"
          />
        </div>
        {isHero && (
          <div className="pointer-events-none absolute left-1/2 top-[9px] h-[26px] w-[32%] -translate-x-1/2 rounded-[20px] bg-black" />
        )}
        {showNavBar && (
          <div className="absolute inset-x-0 bottom-0 border-t border-[rgba(20,16,14,0.08)] bg-[#F4F2EF] pb-1">
            <div className="relative aspect-[649/108] overflow-hidden">
              <img
                src={LANDING_DESIGN.navBar}
                alt=""
                className="absolute left-0 top-0 block w-full"
                aria-hidden
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
