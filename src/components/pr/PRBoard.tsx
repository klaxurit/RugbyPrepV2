import { Trophy } from 'lucide-react'
import { PRBoardCard, type PRRecord } from './PRBoardCard'
import { PremiumBlurredPreview } from '../PremiumBlurredPreview'

interface PRBoardProps {
  prs: PRRecord[]
  isPremium: boolean
  lang?: 'fr' | 'en'
}

export function PRBoard({ prs, isPremium, lang = 'fr' }: PRBoardProps) {
  if (prs.length === 0) {
    return (
      <div className="bg-layer-5 border border-border-app rounded-[24px] p-8 text-center space-y-3">
        <Trophy className="w-10 h-10 text-fg-ghost mx-auto" />
        <p className="text-sm font-bold text-fg-muted">
          {lang === 'fr' ? 'Aucun record pour le moment' : 'No records yet'}
        </p>
        <p className="text-xs text-fg-faint">
          {lang === 'fr'
            ? 'Logge tes charges sur les gros mouvements (squat, bench, tirage…) pour voir tes records ici.'
            : 'Log loads on main compound lifts (squat, bench, row…) to see your records here.'}
        </p>
      </div>
    )
  }

  const recentPRs = prs.filter((pr) => pr.isRecent)
  const FREE_VISIBLE = 3

  if (isPremium) {
    return (
      <div className="space-y-4">
        {recentPRs.length > 0 && (
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-warn-strong" />
            <span className="text-xs font-black uppercase tracking-wider text-warn-strong">
              {recentPRs.length} record{recentPRs.length > 1 ? 's' : ''} recent{recentPRs.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
        <div className="space-y-2">
          {prs.map((pr) => (
            <PRBoardCard key={pr.exerciseId} pr={pr} lang={lang} />
          ))}
        </div>
      </div>
    )
  }

  // Free: show first N, blur the rest
  const visible = prs.slice(0, FREE_VISIBLE)
  const blurred = prs.slice(FREE_VISIBLE)

  return (
    <div className="space-y-4">
      {recentPRs.length > 0 && (
        <div className="mb-1 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warn-strong" />
          <span className="text-xs font-black uppercase tracking-wider text-warn-strong">
            {recentPRs.length} record{recentPRs.length > 1 ? 's' : ''} recent{recentPRs.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="space-y-2">
        {visible.map((pr) => (
          <PRBoardCard key={pr.exerciseId} pr={pr} lang={lang} />
        ))}
      </div>

      {blurred.length > 0 && (
        <PremiumBlurredPreview label={`${blurred.length} records de plus`}>
          <div className="space-y-2">
            {blurred.slice(0, 5).map((pr) => (
              <PRBoardCard key={pr.exerciseId} pr={pr} lang={lang} />
            ))}
          </div>
        </PremiumBlurredPreview>
      )}
    </div>
  )
}
