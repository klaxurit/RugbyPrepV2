import { Icon, SectionLabel } from '../ui'
import type { Milestone, MilestoneTone } from '../../services/home/computeMilestones'
import { useProfile } from '../../hooks/useProfile'
import { tr, type Lang } from '../../i18n/appLabels'

interface BadgesStripProps {
  milestones: Milestone[]
  /** Lien optionnel "Tout voir" à droite du label. */
  showAllHref?: string
}

const TONE_STYLES: Record<MilestoneTone, { bg: string; fg: string }> = {
  gold: { bg: 'bg-pro-soft', fg: 'text-pro' },
  wine: { bg: 'bg-badge-wine', fg: 'text-brand' },
  green: { bg: 'bg-win-soft', fg: 'text-win' },
}

const TONE_ICON_COLOR: Record<MilestoneTone, string> = {
  gold: 'var(--color-gold)',
  wine: 'var(--color-accent)',
  green: 'var(--color-milestone-green)',
}

/**
 * Strip horizontale des jalons utilisateur (max 6, scroll horizontal).
 * Affiche un tag "Nouveau" sur les jalons obtenus dans les 7 derniers jours.
 */
export function BadgesStrip({ milestones, showAllHref }: BadgesStripProps) {
  const { profile } = useProfile()
  const lang: Lang = ((profile?.preferredLanguage as Lang | undefined) ?? 'fr')
  if (milestones.length === 0) return null

  return (
    <section className="pt-6">
      <div className="px-[22px]">
        <SectionLabel
          label={tr('badges_eyebrow', lang)}
          bare
          trailing={
            showAllHref ? (
              <a
                href={showAllHref}
                className="text-[11px] font-bold tracking-wide text-brand hover:text-brand-hover transition-colors"
              >
                {tr('badges_view_all', lang)}
              </a>
            ) : undefined
          }
        />
      </div>

      <div className="scrollbar-none -mx-0 mt-3 flex gap-2.5 overflow-x-auto px-[22px] pb-1">
        {milestones.map((m) => {
          const tone = TONE_STYLES[m.tone]
          const isLocked = m.locked === true
          return (
            <article
              key={m.id}
              aria-label={isLocked ? `${m.title} — à débloquer` : m.title}
              className="relative flex-shrink-0 rounded-2xl border border-paper-deep bg-app w-[132px] px-3.5 pt-3.5 pb-3"
              style={isLocked ? { opacity: 0.4 } : undefined}
            >
              {m.isNew && !isLocked && (
                <span className="absolute -top-1 -right-1 rounded bg-brand px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-app">
                  {tr('badges_new', lang)}
                </span>
              )}
              {isLocked && (
                <span
                  aria-hidden
                  className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-paper-deep"
                >
                  <Icon name="lock" size={10} color="var(--color-text-primary)" strokeWidth={2.2} />
                </span>
              )}
              <div
                className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-[10px] ${tone.bg}`}
              >
                <Icon
                  name={m.icon}
                  size={18}
                  color={TONE_ICON_COLOR[m.tone]}
                  strokeWidth={2.2}
                />
              </div>
              <div
                className="text-[13px] font-extrabold leading-[1.15] text-fg"
                style={{ letterSpacing: '-0.2px' }}
              >
                {m.title}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-fg/55">
                {m.sub}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
