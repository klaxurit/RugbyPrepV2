import { useState } from 'react'
import {
  FRICTION_REASON_LABELS_FR,
  FRICTION_REASONS,
  type FrictionReason,
  type FrictionTrigger,
} from '../../services/analytics/productTaxonomy'
import { trackFrictionFeedback } from '../../services/analytics/trackProduct'

export interface FrictionSurveySheetProps {
  open: boolean
  trigger: FrictionTrigger
  sessionIndex?: number
  sessionId?: string
  onClose: () => void
}

/**
 * Micro-survey post-friction (abandon séance, etc.).
 * Une raison obligatoire ; note optionnelle. Skip = fermeture sans event.
 */
export function FrictionSurveySheet({
  open,
  trigger,
  sessionIndex,
  sessionId,
  onClose,
}: FrictionSurveySheetProps) {
  const [reason, setReason] = useState<FrictionReason | null>(null)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  if (!open) return null

  const submit = () => {
    if (!reason) return
    trackFrictionFeedback({
      trigger,
      reason,
      note: note.trim() || undefined,
      sessionIndex,
      sessionId,
    })
    setSent(true)
    window.setTimeout(() => {
      setReason(null)
      setNote('')
      setSent(false)
      onClose()
    }, 700)
  }

  const skip = () => {
    setReason(null)
    setNote('')
    setSent(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="friction-survey-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-layer-5 p-4 shadow-xl">
        {sent ? (
          <p className="py-6 text-center text-sm font-bold text-fg">Merci — ça nous aide.</p>
        ) : (
          <>
            <h2 id="friction-survey-title" className="text-base font-black text-fg">
              Qu’est-ce qui t’a freiné ?
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">
              1 clic suffit. Pas de diagnostic médical — juste la friction produit.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {FRICTION_REASONS.map((r) => (
                <li key={r}>
                  <button
                    type="button"
                    onClick={() => setReason(r)}
                    className={`rounded-xl border px-3 py-1.5 text-[12px] font-semibold ${
                      reason === r
                        ? 'border-brand bg-brand text-on-brand'
                        : 'border-brand-border bg-layer-10 text-fg'
                    }`}
                  >
                    {FRICTION_REASON_LABELS_FR[r]}
                  </button>
                </li>
              ))}
            </ul>
            {reason === 'other' || reason === 'bug' ? (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                rows={2}
                placeholder="Précise en une phrase (optionnel)"
                className="mt-3 w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-[13px] text-fg"
              />
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={skip}
                className="text-[12px] font-semibold text-fg-muted"
              >
                Passer
              </button>
              <button
                type="button"
                disabled={!reason}
                onClick={submit}
                className="rounded-xl bg-brand px-4 py-2 text-[13px] font-bold text-on-brand disabled:opacity-40"
              >
                Envoyer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
