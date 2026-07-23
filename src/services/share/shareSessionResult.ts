import {
  buildSessionShareFilename,
  buildSessionShareText,
} from './buildSessionShareCopy'
import { generateSessionShareImage } from './generateSessionShareImage'
import {
  SESSION_SHARE_LANDING_URL,
  type SessionShareOutcome,
  type SessionSharePayload,
  type SessionShareTarget,
} from './sessionShareTypes'

function canShareFiles(file: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false
  }
  if (typeof navigator.canShare !== 'function') {
    return true
  }
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000)
}

async function shareViaWebShare(
  file: File,
  text: string,
): Promise<'shared' | 'cancelled' | 'failed'> {
  if (!canShareFiles(file)) return 'failed'
  try {
    await navigator.share({
      files: [file],
      title: 'RugbyForge',
      text,
      url: SESSION_SHARE_LANDING_URL,
    })
    return 'shared'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'cancelled'
    }
    return 'failed'
  }
}

/**
 * Partage carte séance.
 * - system : share sheet OS (Insta / WhatsApp / Messages…)
 * - download : enregistrement image seul
 * Si le sheet OS n’est pas dispo → fallback download.
 */
export async function shareSessionResult(
  payload: SessionSharePayload,
  target: SessionShareTarget = 'system',
): Promise<SessionShareOutcome> {
  try {
    if (target === 'download') {
      return downloadSessionShareImage(payload)
    }

    const blob = await generateSessionShareImage(payload)
    const filename = buildSessionShareFilename(payload)
    const file = new File([blob], filename, { type: 'image/png' })
    const text = buildSessionShareText(payload)

    const web = await shareViaWebShare(file, text)
    if (web === 'shared') {
      return { status: 'shared', method: 'web-share', target: 'system' }
    }
    if (web === 'cancelled') {
      return { status: 'cancelled' }
    }

    // Desktop / Web Share indisponible : même geste familier Qu’« Enregistrer ».
    triggerDownload(blob, filename)
    return { status: 'shared', method: 'download', target: 'system' }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    return { status: 'failed', reason }
  }
}

export async function createSessionSharePreviewUrl(
  payload: SessionSharePayload,
): Promise<string> {
  const blob = await generateSessionShareImage(payload)
  return URL.createObjectURL(blob)
}

export async function downloadSessionShareImage(
  payload: SessionSharePayload,
): Promise<SessionShareOutcome> {
  try {
    const blob = await generateSessionShareImage(payload)
    triggerDownload(blob, buildSessionShareFilename(payload))
    return { status: 'shared', method: 'download', target: 'download' }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    return { status: 'failed', reason }
  }
}
