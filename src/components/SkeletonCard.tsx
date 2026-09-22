/**
 * Skeleton placeholder cards matching the shape of premium components.
 * Shown while entitlements are loading to prevent layout shift.
 */

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-layer-5 ${className}`} />
}

/** Matches ReadinessScoreCard layout */
export function ReadinessScoreSkeleton() {
  return (
    <div className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Pulse className="w-8 h-8 rounded-2xl" />
        <Pulse className="h-4 w-28" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Pulse className="w-[160px] h-[55px] rounded-2xl" />
        <Pulse className="h-3 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Pulse className="h-8" />
        <Pulse className="h-8" />
        <Pulse className="h-8" />
        <Pulse className="h-8" />
      </div>
    </div>
  )
}

/** Matches WeeklySummaryCard layout */
export function WeeklySummarySkeleton() {
  return (
    <div className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Pulse className="w-8 h-8 rounded-2xl" />
        <Pulse className="h-4 w-32" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-8" />
        </div>
        <Pulse className="h-2 w-full rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Pulse className="h-2.5 w-12" />
          <Pulse className="h-5 w-16" />
        </div>
        <div className="space-y-1.5">
          <Pulse className="h-2.5 w-12" />
          <Pulse className="h-5 w-10" />
        </div>
        <div className="space-y-1.5">
          <Pulse className="h-2.5 w-12" />
          <Pulse className="h-5 w-20" />
        </div>
      </div>
    </div>
  )
}

/** Matches RigorScoreCard (score + cadence fusionnés). */
export function RigorScoreSkeleton() {
  return (
    <section className="px-[22px] pt-6" data-testid="rigor-score-skeleton" aria-hidden>
      <Pulse className="h-3 w-24" />
      <div className="mt-3 space-y-4 rounded-[20px] border-2 border-paper-deep bg-paper-soft px-[22px] py-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Pulse className="h-3 w-20" />
            <Pulse className="h-9 w-24" />
          </div>
          <Pulse className="h-6 w-16 rounded-full" />
        </div>
        <Pulse className="h-2 w-full rounded-full" />
        <div className="flex items-center gap-3 border-t border-paper-deep pt-4">
          <Pulse className="h-9 w-9 rounded-full" />
          <Pulse className="h-4 w-40" />
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 14 }, (_, i) => (
            <Pulse key={i} className="h-2 flex-1 rounded-sm" />
          ))}
        </div>
      </div>
    </section>
  )
}

/** Matches LeagueBoard rows while squad RPCs load. */
export function LeagueBoardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <section className="space-y-3" data-testid="league-board-skeleton" aria-hidden>
      <Pulse className="h-3 w-36" />
      <ul className="space-y-1.5">
        {Array.from({ length: rows }, (_, i) => (
          <li
            key={i}
            className="flex items-center gap-2.5 rounded-2xl border border-paper-deep bg-paper-soft px-3 py-2.5"
          >
            <Pulse className="h-4 w-4" />
            <Pulse className="h-8 w-8 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Pulse className="h-3.5 w-28" />
              <Pulse className="h-2.5 w-20" />
            </div>
            <Pulse className="h-4 w-8" />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Generic small card skeleton for ProgressPage sections */
export function ProgressCurveSkeleton() {
  return (
    <div className="space-y-4">
      <Pulse className="h-4 w-36" />
      {[1, 2].map((i) => (
        <div key={i} className="bg-layer-5 border border-border-app rounded-[24px] p-4 space-y-3">
          <Pulse className="h-4 w-28" />
          <Pulse className="h-[80px] w-full rounded-xl" />
          <Pulse className="h-2.5 w-32" />
        </div>
      ))}
    </div>
  )
}
