/** Aligné sur `useProgramChangeNotice` — ack une notice pour éviter la modale globale. */
export const PROGRAM_NOTICE_STORAGE_KEY = 'rf.programNotice.v1'

/** Même onglet : `storage` ne fire pas — les hooks re-read via cet événement. */
export const PROGRAM_NOTICE_UPDATED_EVENT = 'rf:program-notice-updated'

export type ProgramNoticeUpdatedDetail = {
  noticeId?: string
}

interface PersistedState {
  acknowledged: Record<string, string>
  postponed: Record<string, string>
}

export type PersistedProgramNoticeState = PersistedState

export function readProgramNoticePersisted(): PersistedState {
  if (typeof window === 'undefined') return { acknowledged: {}, postponed: {} }
  try {
    const raw = window.localStorage.getItem(PROGRAM_NOTICE_STORAGE_KEY)
    if (!raw) return { acknowledged: {}, postponed: {} }
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return {
      acknowledged: { ...(parsed.acknowledged ?? {}) },
      postponed: { ...(parsed.postponed ?? {}) },
    }
  } catch {
    return { acknowledged: {}, postponed: {} }
  }
}

function writePersisted(state: PersistedState, detail?: ProgramNoticeUpdatedDetail): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PROGRAM_NOTICE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    return
  }
  try {
    window.dispatchEvent(
      new CustomEvent<ProgramNoticeUpdatedDetail>(PROGRAM_NOTICE_UPDATED_EVENT, {
        detail: detail ?? {},
      }),
    )
  } catch {
    /* ignore */
  }
}

/** Écrit l'état persistant (utilisé par le hook + ack ponctuel). */
export function writeProgramNoticePersisted(
  state: PersistedState,
  detail?: ProgramNoticeUpdatedDetail,
): void {
  writePersisted(state, detail)
}

/**
 * Marque une notice programme comme vue (même clé que la modale globale).
 */
export function acknowledgeProgramNoticeById(noticeId: string, today: string): void {
  const prev = readProgramNoticePersisted()
  const next: PersistedState = {
    acknowledged: { ...prev.acknowledged, [noticeId]: today },
    postponed: { ...prev.postponed },
  }
  delete next.postponed[noticeId]
  writePersisted(next, { noticeId })
}
