import type { ReactNode } from 'react'
import { MotherSessionCollapsible } from './MotherSessionCollapsible'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import { msLabel } from '../../services/motherSession/motherSessionLabels'

interface GlossaryEntry {
  term: string
  fr: string
  en: string
}

const ENTRIES: GlossaryEntry[] = [
  {
    term: 'RPE',
    fr: 'Rate of Perceived Exertion — effort ressenti sur 10. **RPE 6-8** = tu pourrais faire 2 à 4 reps de plus avant d\'atteindre l\'échec. RPE 10 = échec total.',
    en: 'Rate of Perceived Exertion — effort on a 1-10 scale. **RPE 6-8** = you could do 2-4 more reps before failure. RPE 10 = total failure.',
  },
  {
    term: 'RER',
    fr: 'Reps En Réserve — nombre de reps que tu pourrais encore faire avant l\'échec. **RER 2** = « il te reste 2 reps en réserve ». Plus précis et plus sûr que d\'aller à l\'échec.',
    en: 'Reps In Reserve (RIR) — how many reps you could still do before failure. **RER 2** = "2 reps left in the tank". More precise and safer than training to failure.',
  },
  {
    term: 'Mésocycle',
    fr: 'Bloc d\'entraînement de 4 semaines : 3 semaines progressives (volume/intensité montent) + 1 semaine de **décharge** pour récupérer et capitaliser sur les adaptations.',
    en: '4-week training block: 3 progressive weeks (volume/intensity ramp up) + 1 **deload** week to recover and consolidate adaptations.',
  },
  {
    term: 'Décharge',
    fr: 'Semaine plus légère (volume −30 à −40%, charge maintenue ou légèrement réduite). Le corps "absorbe" le travail des 3 semaines précédentes — c\'est là que les progrès se cristallisent.',
    en: 'Lighter week (volume −30 to −40%, load maintained or slightly reduced). The body "absorbs" the prior 3 weeks of work — this is where adaptations consolidate.',
  },
  {
    term: 'ACWR',
    fr: 'Acute:Chronic Workload Ratio — rapport entre ta charge des 7 derniers jours et la charge moyenne des 4 dernières semaines. **<0.8 = sous-charge, 0.8-1.3 = optimal, >1.5 = risque blessure × 2.**',
    en: 'Acute:Chronic Workload Ratio — ratio of your 7-day load vs. your 4-week average load. **<0.8 = underload, 0.8-1.3 = sweet spot, >1.5 = injury risk × 2.**',
  },
]

function renderWithBold(text: string): ReactNode {
  // Split on **bold** segments and render <strong>.
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-fg">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

interface SessionGlossaryProps {
  lang: AppLang
}

/**
 * Compact, collapsible glossary for the technical terms used in mother-session
 * coaching notes (RPE, RER, mésocycle, décharge, ACWR). Sits below "Comprendre
 * cette séance" so users can build up vocabulary without breaking the flow.
 */
export function SessionGlossary({ lang }: SessionGlossaryProps) {
  return (
    <MotherSessionCollapsible title={msLabel('glossary_title', lang)} defaultOpen={false}>
      <dl className="space-y-3">
        {ENTRIES.map((entry) => (
          <div key={entry.term}>
            <dt className="text-xs font-black uppercase tracking-wider text-fg">{entry.term}</dt>
            <dd className="text-sm text-fg-secondary leading-snug mt-0.5">
              {renderWithBold(lang === 'fr' ? entry.fr : entry.en)}
            </dd>
          </div>
        ))}
      </dl>
    </MotherSessionCollapsible>
  )
}
