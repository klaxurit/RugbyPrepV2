/**
 * Chart SVG partagé par le teaser free (flouté) et la card Premium (en clair).
 * 7 valeurs sur l'échelle 0-10, line chart + area + dot "aujourd'hui".
 */
interface Props {
  values: number[]
  blurred?: boolean
  /** Label a11y du svg. */
  ariaLabel: string
}

const W = 200
const H = 80

export function ScoreDeFormeChart({ values, blurred = false, ariaLabel }: Props) {
  const yFor = (v: number) => H - (Math.max(0, Math.min(10, v)) / 10) * H

  const points = values.map((v, i) => {
    const x = values.length === 1 ? W / 2 : (i * W) / (values.length - 1)
    return { x, y: yFor(v) }
  })

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`
  const lastPoint = points[points.length - 1] ?? { x: W, y: H }

  return (
    <div className="relative flex-1 h-20 rounded-xl bg-layer-5 overflow-hidden">
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <g style={blurred ? { filter: 'blur(6px)' } : undefined}>
          <path d={areaPath} fill="rgba(139, 28, 43, 0.12)" />
          <path
            d={linePath}
            fill="none"
            stroke="#8B1C2B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill="#8B1C2B" />
        </g>
      </svg>
    </div>
  )
}
