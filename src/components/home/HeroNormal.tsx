import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon, type IconName } from '../ui'
import type { HeroMood } from './heroMood'

interface HeroNormalProps {
  /** Eyebrow UPPERCASE bordeaux (ex: "AUJOURD'HUI · REPOS"). */
  eyebrow: string
  /** Titre Playfair italic — peut contenir <br/> + <span opacity:0.55>. */
  title: ReactNode
  /** Sous-titre éditorial sous le titre (peut contenir un span "Prochaine séance" gras). */
  subtitle?: ReactNode
  /** Numéro du jour pour le filigrane Playfair italic en haut-droite (ex: "5"). */
  dayNumber: string
  /** Bouton CTA bordeaux plein. */
  cta: {
    label: string
    to: string
    icon?: IconName
  }
  /**
   * Mood inline (optionnel) — affiché en bas de la card si fourni.
   * Mappé sur le hook useFatigue côté HomePage : 'fit'=OK, 'tired'=FATIGUE, null=non-répondu.
   */
  mood?: HeroMood
  onMoodChange?: (next: HeroMood) => void
  /** Si false, masque le bloc mood même si onMoodChange est fourni (ex: training_day). */
  showMood?: boolean
  /**
   * Note de modulation programme (ex: "Programme allégé · Charge ajustée").
   * Affichée juste sous le subtitle, en pill bordeaux discrète. Sert à rendre
   * VISIBLE l'effet du toggle fatigue / ACWR (sinon le user ne sait pas que
   * son programme a été modulé).
   */
  modulationNote?: string
}

/**
 * Hero "jour normal" : carte crème avec bordure bordeaux 1.5px, filigrane chiffre
 * du jour en italic en haut-droite, titre Playfair italic, sous-titre éditorial,
 * mood inline (optionnel) et CTA bordeaux plein.
 *
 * Rendu pour les états : rest_day, training_day, match_today, match_tomorrow.
 * Pour le post-match (< 48h), c'est `HeroDayAfter` qui est utilisé à la place.
 */
export function HeroNormal({
  eyebrow,
  title,
  subtitle,
  modulationNote,
  dayNumber,
  cta,
  mood = null,
  onMoodChange,
  showMood = true,
}: HeroNormalProps) {
  const moodEnabled = showMood && onMoodChange != null

  return (
    <div className="px-[18px]">
      <div className="relative overflow-hidden rounded-[24px] bg-app border-[1.5px] border-brand px-[22px] pt-[22px] pb-[18px]">
        {/* Filigrane chiffre du jour — Playfair italic 180px, opacity 0.05 */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-2.5 -top-2.5 select-none font-serif italic font-extrabold tabular-nums leading-none"
          style={{
            fontSize: 180,
            letterSpacing: -8,
            color: 'var(--color-accent)',
            opacity: 0.05,
          }}
        >
          {dayNumber}
        </div>

        <div className="relative">
          {/* Eyebrow bordeaux UPPERCASE */}
          <div className="mb-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand">
            {eyebrow}
          </div>

          {/* Titre éditorial Playfair italic 34px */}
          <h1
            className="font-serif italic font-bold text-[34px] leading-[1.05] text-fg [text-wrap:balance] mb-1.5"
            style={{ letterSpacing: '-1.2px' }}
          >
            {title}
          </h1>

          {/* Sous-titre éditorial */}
          {subtitle && (
            <div className="mb-4 text-[13px] font-semibold leading-[1.4] text-fg/65">
              {subtitle}
            </div>
          )}

          {/* Note de modulation programme (rendre visible l'effet fatigue/ACWR).
              `AnimatePresence` gère le mount/unmount avec animation symétrique :
              entrée slide-up + fade-in, sortie slide-down + fade-out. */}
          <AnimatePresence initial={false} mode="wait">
            {modulationNote && (
              <motion.div
                key={modulationNote}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand"
                role="status"
                aria-live="polite"
              >
                <Icon name="bolt" size={10} color="var(--color-accent)" strokeWidth={2.4} />
                {modulationNote}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mood inline (optionnel) */}
          {moodEnabled && (
            <div className="flex items-center gap-2.5 border-t border-paper-deep pt-3.5 mb-3.5">
              <div className="flex-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-fg/55">
                Comment tu te sens ?
              </div>
              <div className="flex gap-1.5">
                <MoodBtn
                  label="En forme"
                  active={mood === 'fit'}
                  activeColor="var(--color-milestone-green)"
                  onClick={() => onMoodChange?.(mood === 'fit' ? null : 'fit')}
                />
                <MoodBtn
                  label="Fatigué"
                  active={mood === 'tired'}
                  activeColor="#A8531B"
                  onClick={() => onMoodChange?.(mood === 'tired' ? null : 'tired')}
                />
              </div>
            </div>
          )}

          {/* CTA bordeaux plein */}
          <Link
            to={cta.to}
            className="flex w-full items-center justify-between rounded-xl bg-brand text-app px-4 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.04em] active:scale-[0.98] transition-transform rf-focus-ring"
          >
            <span className="inline-flex items-center gap-2.5">
              {cta.icon && <Icon name={cta.icon} size={14} strokeWidth={2.4} />}
              {cta.label}
            </span>
            <Icon name="arrow-right" size={14} strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </div>
  )
}

interface MoodBtnProps {
  label: string
  active: boolean
  activeColor: string
  onClick: () => void
}

function MoodBtn({ label, active, activeColor, onClick }: MoodBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[0.02em] transition-all rf-focus-ring"
      style={{
        border: `1.5px solid ${active ? activeColor : 'var(--color-cream-deep)'}`,
        background: active ? activeColor : 'transparent',
        color: active ? 'var(--color-bg-app)' : 'var(--color-text-primary)',
      }}
    >
      {label}
    </button>
  )
}

