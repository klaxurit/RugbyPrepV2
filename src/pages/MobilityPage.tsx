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
      <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24">
        <PageHeader title={mobilityPageTitle} backTo="/week" />
        <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-5 space-y-3">
            <p className="font-bold text-amber-400">Programme temporairement indisponible</p>
            <ul className="space-y-2">
              {hardBlockReasons.map((r) => (
                <li key={r} className="text-sm text-amber-300/80">
                  <span className="font-semibold">{BETA_ELIGIBILITY_MESSAGES[r].reason}</span>
                  <br />{BETA_ELIGIBILITY_MESSAGES[r].detail}
                </li>
              ))}
            </ul>
            <a
              href="mailto:bonjour@rugbyforge.fr?subject=Support%20RugbyForge"
              className="inline-block text-xs text-white/40 hover:text-white/60 mt-1"
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
    <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title={mobilityPageTitle} backTo="/week" />

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto relative">

        {/* Intro banner */}
        <div className="flex items-center gap-3 px-4 py-3 bg-teal-900/20 border border-teal-500/20 rounded-2xl">
          <div className="p-2 rounded-xl bg-teal-900/30 text-teal-400 flex-shrink-0">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black text-teal-300">Mobilité & Flexibilité</p>
            <p className="text-[10px] text-teal-400/70 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              ~10-15 min · Corps entier · Aucun matériel
            </p>
          </div>
        </div>

        {/* Blocks */}
        {session.blocks.map(({ block, version }, idx) => (
          <section
            key={block.blockId}
            className="bg-white/5 border border-white/10 rounded-[24px] p-5 space-y-4"
          >
            {/* Block header */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-black text-teal-400">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-black text-white leading-tight">{block.name}</h2>
                <p className="text-[10px] text-teal-400 mt-0.5">
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
                <div key={ex.exerciseId} className="flex items-start gap-3 p-3 bg-teal-900/10 rounded-2xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white/80">{getExerciseName(ex.exerciseId, lang)}</p>
                    {ex.notes && (
                      <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{ex.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Coaching notes */}
            {block.coachingNotes && (
              <p className="text-[10px] text-teal-400/70 italic leading-relaxed border-t border-white/10 pt-3">
                {block.coachingNotes}
              </p>
            )}
          </section>
        ))}

        {session.blocks.length === 0 && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-xs text-white/40 text-center">Aucun bloc de mobilité disponible.</p>
          </div>
        )}

        {/* Done CTA */}
        <Link
          to="/week"
          className="flex items-center justify-center gap-2 py-4 bg-teal-600/80 text-white rounded-[2rem] text-sm font-black shadow-lg shadow-teal-900/20 hover:bg-teal-600 transition-colors"
        >
          <Leaf className="w-4 h-4" />
          Séance terminée — Retour au plan
        </Link>

      </main>

      <BottomNav />
    </div>
  )
}
