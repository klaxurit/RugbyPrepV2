import { useEffect } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { getExerciseDemo } from '../../data/exercises'
import type { Equipment } from '../../types/training'

type ExerciseDemoSheetProps = {
  exerciseId: string | null
  lang: 'fr' | 'en'
  onClose: () => void
}

const EQUIPMENT_LABELS: Record<Equipment, { fr: string; en: string }> = {
  barbell: { fr: 'Barre', en: 'Barbell' },
  dumbbell: { fr: 'Haltères', en: 'Dumbbells' },
  bench: { fr: 'Banc', en: 'Bench' },
  band: { fr: 'Élastique', en: 'Band' },
  landmine: { fr: 'Landmine', en: 'Landmine' },
  tbar_row: { fr: 'T-Bar', en: 'T-Bar' },
  ghd: { fr: 'GHD', en: 'GHD' },
  med_ball: { fr: 'Med ball', en: 'Med ball' },
  box: { fr: 'Box', en: 'Box' },
  pullup_bar: { fr: 'Barre de traction', en: 'Pull-up bar' },
  machine: { fr: 'Machine', en: 'Machine' },
  sprint_track: { fr: 'Piste', en: 'Track' },
  ab_wheel: { fr: 'Roue abdominale', en: 'Ab wheel' },
  cable: { fr: 'Poulie', en: 'Cable' },
  ez_bar: { fr: 'Barre EZ', en: 'EZ bar' },
  kettlebell: { fr: 'Kettlebell', en: 'Kettlebell' },
  trap_bar: { fr: 'Trap bar', en: 'Trap bar' },
  sled: { fr: 'Traîneau', en: 'Sled' },
  none: { fr: 'Sans matériel', en: 'No equipment' },
}

export function ExerciseDemoSheet({
  exerciseId,
  lang,
  onClose,
}: ExerciseDemoSheetProps) {
  const demo = exerciseId ? getExerciseDemo(exerciseId, lang) : null

  useEffect(() => {
    if (!exerciseId) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [exerciseId, onClose])

  if (!exerciseId || !demo) return null

  const labels = {
    title: lang === 'fr' ? 'Exécution du mouvement' : 'Movement guide',
    cues: lang === 'fr' ? 'Repères rapides' : 'Quick cues',
    notes: lang === 'fr' ? 'À retenir' : 'Keep in mind',
    equipment: lang === 'fr' ? 'Matériel' : 'Equipment',
    openVideo: lang === 'fr' ? 'Ouvrir sur YouTube' : 'Open on YouTube',
    video: lang === 'fr' ? 'Vidéo' : 'Video',
    helper: lang === 'fr'
      ? 'Regarde d’abord l’exécution, puis garde les repères rapides en tête pendant ta série.'
      : 'Watch the execution first, then keep the quick cues in mind during your set.',
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-demo-title"
        data-testid="exercise-demo-sheet"
        className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border-app bg-app shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-app px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-tint">
              {labels.title}
            </p>
            <h3 id="exercise-demo-title" className="mt-1 text-lg font-black text-fg">
              {demo.title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-fg-muted">
              {labels.helper}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'fr' ? 'Fermer la fiche exercice' : 'Close exercise guide'}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-app bg-layer-5 text-fg-muted transition-colors hover:border-border-app hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint">
              {labels.video}
            </p>
            <div className="overflow-hidden rounded-[20px] border border-border-app bg-black">
              <div className="aspect-video">
                <iframe
                  src={demo.youtubeEmbedUrl}
                  title={`${demo.title} video`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          </div>

          {demo.equipment.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint">
                {labels.equipment}
              </p>
              <div className="flex flex-wrap gap-2">
                {demo.equipment.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border-app bg-layer-5 px-3 py-1 text-[11px] font-bold text-fg-secondary"
                  >
                    {EQUIPMENT_LABELS[item]?.[lang] ?? item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {demo.cues.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint">
                {labels.cues}
              </p>
              <ul className="space-y-2">
                {demo.cues.map((cue) => (
                  <li
                    key={cue}
                    className="rounded-[20px] border border-border-app bg-layer-5 px-4 py-3 text-sm leading-relaxed text-fg-secondary"
                  >
                    {cue}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {demo.notes ? (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fg-faint">
                {labels.notes}
              </p>
              <div className="rounded-[20px] border border-brand-border bg-brand-soft px-4 py-3 text-sm leading-relaxed text-fg-secondary">
                {demo.notes}
              </div>
            </div>
          ) : null}

          <a
            href={demo.youtubeWatchUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-[1.2rem] bg-brand px-4 py-3 text-sm font-black text-on-brand shadow-lg shadow-brand-glow transition-colors hover:bg-brand-hover"
          >
            {labels.openVideo}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
