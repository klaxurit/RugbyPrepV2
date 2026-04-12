// src/pages/MobilityPage.tsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, Clock } from 'lucide-react'
import { posthog } from '../services/analytics/posthog'
import { useProfile } from '../hooks/useProfile'
import { buildMobilitySession } from '../services/program/buildMobilitySession'
import { getExerciseName } from '../data/exercises'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { getGlobalProgramHardBlock } from '../services/program/hasGlobalProgramHardBlock'
import { BETA_ELIGIBILITY_MESSAGES } from '../services/betaEligibility'

export function MobilityPage() {
  const { profile } = useProfile()
  const lang = (profile.preferredLanguage as 'fr' | 'en' | undefined) ?? 'fr'
  const mobilityPageTitle = lang === 'fr' ? 'Récupération Active' : 'Active Recovery'

  // ── Guard : seul BETA_PAUSED bloque (cohérent avec WeekPage/SessionDetailPage) ─
  const { hasHardBlock, hardBlockReasons } = getGlobalProgramHardBlock(profile)

  useEffect(() => {
    if (hasHardBlock) {
      posthog.capture('beta_eligibility_blocked', {
        surface: 'mobility_page',
        primaryReason: hardBlockReasons[0] ?? null,
        reasons: hardBlockReasons,
      })
    }
  }, [hasHardBlock, hardBlockReasons])

  if (hasHardBlock) {
    return (
      <div className="min-h-screen bg-app font-sans text-fg pb-24">
        <PageHeader title={mobilityPageTitle} backTo="/week" />
        <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
          <div className="rounded-2xl border border-warn-bd bg-warn-bg-muted p-5 space-y-3">
            <p className="font-bold text-warn-strong">Programme temporairement indisponible</p>
            <ul className="space-y-2">
              {hardBlockReasons.map((r) => (
                <li key={r} className="text-sm text-warn-body">
                  <span className="font-semibold">{BETA_ELIGIBILITY_MESSAGES[r].reason}</span>
                  <br />{BETA_ELIGIBILITY_MESSAGES[r].detail}
                </li>
              ))}
            </ul>
            <a
              href="mailto:bonjour@rugbyforge.fr?subject=Support%20RugbyForge"
              className="inline-block text-xs text-fg-muted hover:text-fg-secondary mt-1"
            >
              Un souci ? Contacte-nous →
            </a>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const session = buildMobilitySession(profile)

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title={mobilityPageTitle} backTo="/week" />

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto relative">

        {/* Intro banner */}
        <div className="flex items-center gap-3 rounded-2xl border border-ok-bd bg-ok-bg-muted px-4 py-3">
          <div className="flex-shrink-0 rounded-xl bg-ok-bg p-2 text-ok">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black text-ok-strong">Mobilité & Flexibilité</p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-ok opacity-70">
              <Clock className="w-3 h-3" />
              ~10-15 min · Corps entier · Aucun matériel
            </p>
          </div>
        </div>

        {/* Blocks */}
        {session.blocks.map(({ block, version }, idx) => (
          <section
            key={block.blockId}
            className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-4"
          >
            {/* Block header */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-ok-bg">
                <span className="text-xs font-black text-ok">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-black text-fg leading-tight">{block.name}</h2>
                <p className="mt-0.5 text-[10px] text-ok">
                  {version.sets} série
                  {' · '}
                  {version.scheme.kind === 'time'
                    ? `${version.scheme.seconds}s par exercice`
                    : version.scheme.kind === 'reps'
                      ? `${version.scheme.reps} reps`
                      : ''}
                  {' · '}
                  {version.restSeconds}s repos
                </p>
              </div>
            </div>

            {/* Exercises */}
            <div className="space-y-2">
              {block.exercises.map((ex) => (
                <div key={ex.exerciseId} className="flex items-start gap-3 rounded-2xl bg-ok-bg-muted p-3">
                  <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ok" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-fg-secondary">{getExerciseName(ex.exerciseId, lang)}</p>
                    {ex.notes && (
                      <p className="text-[10px] text-fg-muted mt-0.5 leading-relaxed">{ex.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Coaching notes */}
            {block.coachingNotes && (
              <p className="border-t border-border-app pt-3 text-[10px] italic leading-relaxed text-ok opacity-70">
                {block.coachingNotes}
              </p>
            )}
          </section>
        ))}

        {session.blocks.length === 0 && (
          <div className="p-4 bg-layer-5 border border-border-app rounded-2xl">
            <p className="text-xs text-fg-muted text-center">Aucun bloc de mobilité disponible.</p>
          </div>
        )}

        {/* Done CTA */}
        <Link
          to="/week"
          className="flex items-center justify-center gap-2 rounded-[2rem] bg-brand py-4 text-sm font-black text-on-brand shadow-brand-float transition-colors hover:bg-brand-hover"
        >
          <Leaf className="w-4 h-4" />
          Séance terminée — Retour au plan
        </Link>

      </main>

      <BottomNav />
    </div>
  )
}
