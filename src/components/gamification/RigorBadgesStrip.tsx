import { Icon, SectionLabel } from '../ui'
import { badgeDetail, badgeLabel } from '../../services/gamification/badgeDefinitions'
import { badgeIconFamily, badgeIconName } from '../../services/gamification/badgeIcon'
import type { Lang } from '../../i18n/appLabels'
import type { UnlockedBadge } from '../../types/gamification'

export interface RigorBadgesStripProps {
  badges: readonly UnlockedBadge[]
  lang: Lang
}

/**
 * Badges de rigueur débloqués.
 *
 * Aucun jalon verrouillé n'est affiché : une liste de badges à obtenir
 * transforme l'écran en catalogue d'objectifs, alors que la pression de
 * progression est déjà portée par la ligue hebdomadaire et la barre de
 * palier. Ici, on ne montre que ce qui a été réellement acquis, avec sa date.
 */
export function RigorBadgesStrip({ badges, lang }: RigorBadgesStripProps) {
  // Un badge dont l'identifiant n'a pas de définition (barème retiré depuis)
  // est ignoré plutôt qu'affiché sans libellé.
  const known = badges.filter((badge) => badgeLabel(badge.badgeId, lang) != null)
  if (known.length === 0) return null

  const formatter = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <section data-testid="rigor-badges-strip">
      <SectionLabel label={lang === 'fr' ? 'Jalons de rigueur' : 'Rigor milestones'} />

      <ul className="mt-3 space-y-1.5">
        {known.map((badge) => {
          const unlockedAt = new Date(badge.unlockedAt)
          return (
            <li
              key={badge.badgeId}
              data-testid="rigor-badge"
              data-badge-family={badgeIconFamily(badge.badgeId)}
              className="flex items-center gap-3 rounded-2xl border border-paper-deep bg-paper-soft px-3.5 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pro-soft text-pro">
                <Icon name={badgeIconName(badge.badgeId)} size={16} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-fg">
                  {badgeLabel(badge.badgeId, lang)}
                </span>
                <span className="block truncate text-[10px] font-semibold text-fg/50">
                  {badgeDetail(badge.badgeId, lang)}
                </span>
              </span>
              {Number.isFinite(unlockedAt.getTime()) && (
                <span className="shrink-0 text-[10px] font-semibold tabular-nums text-fg/45">
                  {formatter.format(unlockedAt)}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
