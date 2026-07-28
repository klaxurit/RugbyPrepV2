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

function loadImage(src: string, crossOrigin?: 'anonymous'): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = crossOrigin
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
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
      await loadImage(avatarUrl, 'anonymous')
      return avatarUrl
    } catch {
      // CORS / 404 → Rufo
    }
  }
  return difficulty.imageSrc
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
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
          // jsdom / CORS : ne jamais bloquer la capture
          window.setTimeout(done, 120)
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
  const portraitSrc = await resolvePortraitSrc(payload)
  const model = buildSessionShareCardModel(payload, {
    logoSrc: logoCreamUrl,
    portraitSrc,
  })

  const host = document.createElement('div')
  host.setAttribute('data-rf-share-host', '1')
  host.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    'width:1080px',
    'height:1920px',
    'overflow:hidden',
    'pointer-events:none',
    'z-index:-1',
    'opacity:1',
  ].join(';')

  const style = document.createElement('style')
  style.textContent = shareCardCss
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
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))

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
      },
    })

    if (!blob) throw new Error('Failed to encode share image')
    return blob
  } finally {
    host.remove()
  }
}
