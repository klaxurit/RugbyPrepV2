import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'
import type { DetectedPR } from '../../services/pr/detectPRs'
import { getExerciseName } from '../../data/exercises'
import { PRConfetti } from './PRConfetti'

interface PRCelebrationOverlayProps {
  prs: DetectedPR[]
  lang?: 'fr' | 'en'
  onDone: () => void
}

export function PRCelebrationOverlay({ prs, lang = 'fr', onDone }: PRCelebrationOverlayProps) {
  const show = prs.length > 0

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(onDone, 2500)
    return () => clearTimeout(timer)
  }, [show, onDone])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onDone}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Card */}
          <motion.div
            className="relative z-10 w-[min(85vw,320px)] rounded-[2rem] border border-border-app bg-panel p-6 text-center space-y-4"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 300 }}
          >
            <PRConfetti />

            {/* Trophy with glow */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 scale-150 rounded-full bg-brand/20 blur-xl" />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.6, repeat: 2, ease: 'easeInOut' }}
                >
                  <Trophy className="relative h-12 w-12 text-brand-tint" />
                </motion.div>
              </div>
            </div>

            {/* Title */}
            <p className="text-lg font-black text-fg">
              {prs.length === 1
                ? (lang === 'fr' ? 'Nouveau Record !' : 'New PR!')
                : (lang === 'fr' ? `${prs.length} Nouveaux Records !` : `${prs.length} New PRs!`)}
            </p>

            {/* PR details */}
            <div className="space-y-2">
              {prs.slice(0, 3).map((pr) => (
                <div key={pr.exerciseId} className="space-y-0.5">
                  <p className="text-sm font-bold text-brand-tint">
                    {getExerciseName(pr.exerciseId, lang)}
                  </p>
                  <p className="text-xl font-black text-fg">{pr.label}</p>
                  <span className="inline-block rounded-full bg-ok-bg px-3 py-1 text-xs font-bold text-ok-strong">
                    {pr.improvement}
                  </span>
                </div>
              ))}
              {prs.length > 3 && (
                <p className="text-xs text-fg-muted">
                  +{prs.length - 3} {lang === 'fr' ? 'autre(s) record(s)' : 'more record(s)'}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
