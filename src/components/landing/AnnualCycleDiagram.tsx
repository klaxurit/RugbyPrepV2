import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronRight, Leaf, Flame, Trophy, Sparkles } from 'lucide-react'

type CycleBlock = {
  id: string
  title: string
  subtitle: string
  icon: typeof Leaf
  steps: string[]
  footnote?: string
}

const CYCLES: CycleBlock[] = [
  {
    id: 'off_season',
    title: 'Inter-saison',
    subtitle: 'Sans match — reconstruction',
    icon: Leaf,
    steps: ['Récupération', 'Transition', 'Hypertrophie', 'Force-Pont', 'Entretien (A/B)'],
    footnote: 'Durée calée sur ton calendrier (6–12 sem. typiques)',
  },
  {
    id: 'pre_season',
    title: 'Pré-saison',
    subtitle: 'Vers le premier match',
    icon: Flame,
    steps: [
      'Phase 1 · Préparation générale',
      'Phase 2 · Rugby spécifique (puissance, plyo)',
      'Phase 3 · Affûtage',
      'Semaines de décharge possibles',
    ],
  },
  {
    id: 'in_season',
    title: 'En saison',
    subtitle: 'Autour du calendrier matchs',
    icon: Trophy,
    steps: [
      'Compétition',
      'Trêve longue → charge force',
      'Retour après trêve',
      'Rampe avant match',
      'Semaines allégées & semaines de match',
    ],
  },
  {
    id: 'playoffs',
    title: 'Phase finale',
    subtitle: 'Affûtage ciblé',
    icon: Sparkles,
    steps: ['Maintien (−volume)', 'Affûtage', 'Semaine de match'],
  },
]

const containerMotion = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
}

const itemMotion = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
}

/** Pas de stagger si l'utilisateur préfère moins de mouvement */
const containerReduced = { hidden: { opacity: 1 }, show: { opacity: 1 } }
const itemReduced = { hidden: { opacity: 1 }, show: { opacity: 1 } }

export function AnnualCycleDiagram() {
  const reduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const container = reduceMotion ? containerReduced : containerMotion
  const item = reduceMotion ? itemReduced : itemMotion

  useEffect(() => {
    if (reduceMotion) return
    const t = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % CYCLES.length)
    }, 6500)
    return () => window.clearInterval(t)
  }, [reduceMotion])

  return (
    <section
      id="annual-cycle"
      className="relative py-20 px-4 overflow-hidden border-y border-border-app bg-gradient-to-b from-paper-soft/80 via-app to-app"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden
      />
      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-soft px-4 py-1.5 mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">
              Programme annuel
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-fg mb-3">
            Une saison découpée comme dans l’app
          </h2>
          <p className="text-fg-muted max-w-2xl mx-auto text-sm leading-relaxed">
            Les quatre blocs suivent la même logique que le moteur RugbyForge : inter-saison, pré-saison,
            saison avec trêves, puis phase finale.
          </p>
        </motion.div>

        {/* Desktop / tablet : timeline */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="hidden md:flex flex-row items-stretch justify-center gap-0 mb-10"
        >
          {CYCLES.map((block, i) => {
            const Icon = block.icon
            const isActive = i === activeIndex
            return (
              <div key={block.id} className="flex items-stretch flex-1 min-w-0 max-w-[220px]">
                <motion.div variants={item} className="flex-1 flex flex-col">
                  <motion.button
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={`relative text-left rounded-[20px] border p-4 h-full transition-colors rf-focus-ring ${
                      isActive
                        ? 'border-brand-border-strong bg-white shadow-[var(--color-shadow-brand-float)] ring-1 ring-brand-border'
                        : 'border-border-app bg-layer-5 hover:border-brand-border hover:bg-layer-6'
                    }`}
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                  >
                    {isActive && (
                      <span className="pointer-events-none absolute inset-0 rounded-[20px] bg-gradient-to-br from-brand-soft/90 via-transparent to-pro-soft/40" />
                    )}
                    <div className="relative flex flex-col gap-2">
                      <div
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                          isActive ? 'bg-brand-medium text-brand' : 'bg-layer-10 text-brand-muted'
                        }`}
                      >
                        <Icon className="w-5 h-5" aria-hidden />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-brand">{block.title}</p>
                      <p className="text-xs text-fg-muted leading-snug">{block.subtitle}</p>
                    </div>
                  </motion.button>
                </motion.div>
                {i < CYCLES.length - 1 && (
                  <div className="flex items-center justify-center px-1 flex-shrink-0 self-center">
                    <motion.div
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              opacity: [0.35, 1, 0.35],
                              x: [0, 4, 0],
                            }
                      }
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                    >
                      <ChevronRight className="w-5 h-5 text-brand-muted" aria-hidden />
                    </motion.div>
                  </div>
                )}
              </div>
            )
          })}
        </motion.div>

        {/* Mobile : vertical cards */}
        <div className="md:hidden space-y-3 mb-8">
          {CYCLES.map((block, i) => {
            const Icon = block.icon
            const isActive = i === activeIndex
            return (
              <motion.button
                key={block.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`w-full text-left rounded-[20px] border p-4 transition-colors rf-focus-ring ${
                  isActive
                    ? 'border-brand-border-strong bg-white shadow-elevated'
                    : 'border-border-app bg-layer-5'
                }`}
                initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      isActive ? 'bg-brand-medium text-brand' : 'bg-layer-10 text-brand-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wider text-brand">{block.title}</p>
                    <p className="text-xs text-fg-muted mt-0.5">{block.subtitle}</p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={CYCLES[activeIndex].id}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="rounded-[24px] border border-border-app bg-layer-6 p-6 md:p-8 shadow-elevated max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[3px] w-10 rounded-full bg-brand flex-shrink-0" aria-hidden />
              <p className="text-sm font-black text-fg">{CYCLES[activeIndex].title}</p>
            </div>
            <ul className="space-y-2.5">
              {CYCLES[activeIndex].steps.map((step, j) => (
                <motion.li
                  key={step}
                  initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduceMotion ? 0 : j * 0.05 }}
                  className="flex gap-3 text-sm text-fg-secondary leading-relaxed"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  <span>{step}</span>
                </motion.li>
              ))}
            </ul>
            {CYCLES[activeIndex].footnote && (
              <p className="mt-5 text-[11px] text-fg-muted leading-relaxed border-t border-border-app pt-4">
                {CYCLES[activeIndex].footnote}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-[11px] text-fg-ghost mt-8 max-w-xl mx-auto">
          Affichage pédagogique — les transitions réelles dépendent de tes matchs et des réglages dans ton profil.
        </p>
      </div>
    </section>
  )
}
