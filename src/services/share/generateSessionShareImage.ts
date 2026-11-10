/**
 * Carte Stories post-séance — rasterisation DOM du mockup
 * `docs/Séance Récap Social - Standalone.html` (HTML/CSS exact, sauf browse image).
 */
import { toBlob } from 'html-to-image'
import logoCreamUrl from '../../assets/rugbyforge-full.png'
import shareCardCss from './sessionShareCard.css?raw'
import {
  buildSessionShareCardHtml,
  buildSessionShareCardModel,
} from './buildSessionShareCardHtml'
import { resolveSessionShareDifficulty } from './resolveSessionShareDifficulty'
import {
  SESSION_SHARE_HEIGHT,
  SESSION_SHARE_WIDTH,
  type SessionSharePayload,
} from './sessionShareTypes'

/** Évite canvas tainted / CORS : on embarque les images en data URL avant capture. */
async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) return src
  const absolute =
    src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')
      ? src
      : new URL(src, window.location.origin).href
  const res = await fetch(absolute, { mode: 'cors', credentials: 'omit' })
  if (!res.ok) throw new Error(`Failed to fetch image: ${src} (${res.status})`)
  const buffer = await res.arrayBuffer()
  const blob = new Blob([buffer], {
    type: res.headers.get('Content-Type') || 'image/png',
  })
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`Failed to read image: ${src}`))
    reader.readAsDataURL(blob)
  })
}

async function resolvePortraitSrc(payload: SessionSharePayload): Promise<string> {
  const difficulty = resolveSessionShareDifficulty(
    payload.rpe,
    payload.lang,
    payload.firstName,
  )
  const avatarUrl = payload.avatarUrl?.trim()
  if (avatarUrl) {
    try {
      return await toDataUrl(avatarUrl)
    } catch {
      // CORS / 404 → Rufo
    }
  }
  return toDataUrl(difficulty.imageSrc)
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          const src = img.currentSrc || img.src || ''
          if (src.startsWith('data:') || (img.complete && img.naturalWidth > 0)) {
            resolve()
            return
          }
          let settled = false
          const done = () => {
            if (settled) return
            settled = true
            resolve()
          }
          img.addEventListener('load', done)
          img.addEventListener('error', done)
          window.setTimeout(done, 2000)
        }),
    ),
  ).then(() => undefined)
}

/**
 * Monte le markup mockup hors écran, capture en PNG 1080×1920.
 */
export async function generateSessionShareImage(
  payload: SessionSharePayload,
): Promise<Blob> {
  const [portraitSrc, logoSrc] = await Promise.all([
    resolvePortraitSrc(payload),
    toDataUrl(logoCreamUrl),
  ])
  const model = buildSessionShareCardModel(payload, {
    logoSrc,
    portraitSrc,
  })

  const host = document.createElement('div')
  host.setAttribute('data-rf-share-host', '1')
  // opacity:0 + left:0 (pas -10000px) : html-to-image rate souvent les hosts hors viewport.
  host.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:1080px',
    'height:1920px',
    'overflow:hidden',
    'pointer-events:none',
    'z-index:-1',
    'opacity:0',
  ].join(';')

  const style = document.createElement('style')
  // blur() casse parfois la rasterisation html-to-image → neutre pour la capture.
  style.textContent = `${shareCardCss}\n.rf-share-card .glow{filter:none !important}`
  host.appendChild(style)

  const mount = document.createElement('div')
  mount.innerHTML = buildSessionShareCardHtml(model)
  host.appendChild(mount)
  document.body.appendChild(host)

  const card = host.querySelector('.rf-share-card') as HTMLElement | null
  if (!card) {
    host.remove()
    throw new Error('Share card mount failed')
  }

  try {
    await waitForImages(card)
    // Laisse le layout/fonts peindre (Inter → system fallback).
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r())),
    )

    const blob = await toBlob(card, {
      width: SESSION_SHARE_WIDTH,
      height: SESSION_SHARE_HEIGHT,
      pixelRatio: 1,
      cacheBust: true,
      preferredFontFormat: 'woff2',
      style: {
        // Force dimensions exactes pour la capture.
        width: `${SESSION_SHARE_WIDTH}px`,
        height: `${SESSION_SHARE_HEIGHT}px`,
        transform: 'none',
        opacity: '1',
      },
    })

    if (!blob) throw new Error('Failed to encode share image')
    return blob
  } finally {
    host.remove()
  }
}
