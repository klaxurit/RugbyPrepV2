/**
 * Carte Stories post-séance v2 — rasterisation DOM de la maquette Claude Design
 * « Carte de fin de séance v2 » (héros par priorité, coupe diagonale, pied club).
 */
import { toBlob } from 'html-to-image'
import logoCreamUrl from '../../assets/rugbyforge-full.png'
import shareCardCss from './sessionShareCard.css?raw'
import {
  buildSessionShareCardHtml,
  buildSessionShareCardModel,
  buildSessionShareIdentity,
} from './buildSessionShareCardHtml'
import type { ShareCardData } from './buildShareCardData'
import { buildFallbackCrestDataUrl } from './shareClubCrest'
import inter500 from '@fontsource/inter/files/inter-latin-500-normal.woff2?url'
import inter700 from '@fontsource/inter/files/inter-latin-700-normal.woff2?url'
import inter800 from '@fontsource/inter/files/inter-latin-800-normal.woff2?url'
import inter800i from '@fontsource/inter/files/inter-latin-800-italic.woff2?url'
import inter900i from '@fontsource/inter/files/inter-latin-900-italic.woff2?url'
import { shareCardDimensions } from './resolveShareCardFormat'
import type { SessionShareImageMeta, SessionSharePayload } from './sessionShareTypes'

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

const CARD_FONTS: ReadonlyArray<[string, number, 'normal' | 'italic']> = [
  [inter500, 500, 'normal'],
  [inter700, 700, 'normal'],
  [inter800, 800, 'normal'],
  [inter800i, 800, 'italic'],
  [inter900i, 900, 'italic'],
]

let fontFaceCssPromise: Promise<string> | null = null

/** @font-face Inter en data URL : la rasterisation embarque la police sans dépendre du réseau. */
function loadCardFontFaceCss(): Promise<string> {
  fontFaceCssPromise ??= Promise.all(
    CARD_FONTS.map(async ([src, weight, style]) => {
      try {
        const data = await toDataUrl(src)
        return `@font-face{font-family:'RF Inter';src:url(${data}) format('woff2');font-weight:${weight};font-style:${style};font-display:block}`
      } catch {
        return ''
      }
    }),
  ).then((rules) => rules.join('\n'))
  return fontFaceCssPromise
}

/** Photo de séance choisie par le joueur ; échec de chargement → fond de marque. */
async function resolvePhotoSrc(payload: SessionSharePayload): Promise<string | null> {
  const photoUrl = payload.photoUrl?.trim()
  if (!photoUrl) return null
  try {
    return await toDataUrl(photoUrl)
  } catch {
    return null
  }
}

/**
 * Logo club : uniquement l’URL déjà stockée (FFR / datasets club), chargée en
 * CORS pour le canvas. Échec ou absence → écusson de secours aux initiales.
 */
export async function resolveShareClubCrest(
  identity: ShareCardData,
  load: (src: string) => Promise<string> = toDataUrl,
): Promise<{ src: string | null; source: SessionShareImageMeta['logoSource'] }> {
  const club = identity.club
  if (!club) return { src: null, source: 'none' }
  if (club.logoUrl) {
    try {
      return { src: await load(club.logoUrl), source: 'ffr' }
    } catch {
      // CORS / 404 → écusson de secours
    }
  }
  if (club.shortCode) {
    return { src: buildFallbackCrestDataUrl(club.shortCode), source: 'fallback' }
  }
  return { src: null, source: 'none' }
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
 * Monte le markup mockup hors écran, capture en PNG (story 1080×1920 ou carré 1080×1080).
 */
export async function generateSessionShareImage(
  payload: SessionSharePayload,
): Promise<Blob> {
  return (await generateSessionShareImageWithMeta(payload)).blob
}

/** Idem + ce qui a réellement été rendu (club affiché, source du logo). */
export async function generateSessionShareImageWithMeta(
  payload: SessionSharePayload,
): Promise<{ blob: Blob; meta: SessionShareImageMeta }> {
  const identity = buildSessionShareIdentity(payload)
  const [photoSrc, logoSrc, crest, fontCss] = await Promise.all([
    resolvePhotoSrc(payload),
    toDataUrl(logoCreamUrl),
    resolveShareClubCrest(identity),
    loadCardFontFaceCss(),
  ])
  const model = buildSessionShareCardModel(
    payload,
    { logoSrc, crestSrc: crest.src, photoSrc },
    identity,
  )
  const { width, height } = shareCardDimensions(model.format)
  const meta: SessionShareImageMeta = {
    clubShown: identity.clubShown,
    logoSource: crest.source,
  }

  const host = document.createElement('div')
  host.setAttribute('data-rf-share-host', '1')
  // opacity:0 + left:0 (pas -10000px) : html-to-image rate souvent les hosts hors viewport.
  host.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    `width:${width}px`,
    `height:${height}px`,
    'overflow:hidden',
    'pointer-events:none',
    'z-index:-1',
    'opacity:0',
  ].join(';')

  const style = document.createElement('style')
  // Police Inter embarquée en data URL + CSS de la carte v2.
  style.textContent = `${fontCss}\n${shareCardCss}`
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
    try {
      await document.fonts?.ready
    } catch {
      // pas d’API FontFaceSet (jsdom) : on continue
    }
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r())),
    )

    const blob = await toBlob(card, {
      width,
      height,
      pixelRatio: 1,
      cacheBust: true,
      preferredFontFormat: 'woff2',
      style: {
        // Force dimensions exactes pour la capture.
        width: `${width}px`,
        height: `${height}px`,
        transform: 'none',
        opacity: '1',
      },
    })

    if (!blob) throw new Error('Failed to encode share image')
    return { blob, meta }
  } finally {
    host.remove()
  }
}
