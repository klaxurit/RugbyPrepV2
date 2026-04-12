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
