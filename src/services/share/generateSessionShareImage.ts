import logoCreamUrl from '../../assets/rugbyforge-full.png'
import {
  formatShareFatigue,
  formatShareSets,
  formatShareTonnage,
} from './buildSessionShareCopy'
import { resolveSessionShareDifficulty } from './resolveSessionShareDifficulty'
import {
  SESSION_SHARE_HEIGHT,
  SESSION_SHARE_WIDTH,
  type SessionSharePayload,
} from './sessionShareTypes'

const COLORS = {
  cream: '#F5F2EE',
  creamSoft: '#FAF6EE',
  creamMuted: 'rgba(245, 242, 238, 0.72)',
  creamFaint: 'rgba(245, 242, 238, 0.18)',
  creamBorder: 'rgba(245, 242, 238, 0.28)',
  wine: '#7B0D1E',
  wineDeep: '#5C0A16',
  wineSoft: 'rgba(245, 242, 238, 0.10)',
} as const

const FOOTER_H = 180

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/**
 * Retire le fond noir des assets Rufo sans manger les cheveux.
 *
 * Les cheveux sont le même noir que le fond et y sont connectés : un flood-fill
 * depuis les bords les efface. On protège donc le noir proche des pixels colorés
 * (peau, maillot, traits) avant de rendre transparent le reste.
 */
function punchBlackBackground(
  source: HTMLImageElement,
  drawW: number,
  drawH: number,
  threshold = 22,
): HTMLCanvasElement {
  const off = document.createElement('canvas')
  off.width = Math.max(1, Math.round(drawW))
  off.height = Math.max(1, Math.round(drawH))
  const octx = off.getContext('2d', { willReadFrequently: true })
  if (!octx) return off

  octx.drawImage(source, 0, 0, off.width, off.height)
  if (typeof octx.getImageData !== 'function' || typeof octx.putImageData !== 'function') {
    return off
  }

  const imageData = octx.getImageData(0, 0, off.width, off.height)
  const { data, width, height } = imageData
  const n = width * height
  const isNearBlack = (i: number) => {
    const o = i * 4
    return data[o]! < threshold && data[o + 1]! < threshold && data[o + 2]! < threshold
  }

  // Distance au pixel coloré le plus proche (BFS multi-source). 255 = hors portée.
  const dist = new Uint8Array(n)
  dist.fill(255)
  const queue = new Int32Array(n)
  let qh = 0
  let qt = 0

  for (let i = 0; i < n; i++) {
    if (isNearBlack(i)) continue
    dist[i] = 0
    queue[qt++] = i
  }

  // Assez large pour les mèches manga ; borne pour éviter un halo noir trop gros.
  const maxKeep = Math.max(56, Math.min(140, Math.round(Math.min(width, height) * 0.16)))

  while (qh < qt) {
    const i = queue[qh++]!
    const d = dist[i]!
    if (d >= maxKeep) continue
    const x = i % width
    const y = (i / width) | 0
    const nd = d + 1
    const tryPush = (ni: number) => {
      if (dist[ni]! <= nd) return
      if (!isNearBlack(ni)) return
      dist[ni] = nd
      queue[qt++] = ni
    }
    if (x > 0) tryPush(i - 1)
    if (x < width - 1) tryPush(i + 1)
    if (y > 0) tryPush(i - width)
    if (y < height - 1) tryPush(i + width)
  }

  const visited = new Uint8Array(n)
  const stack: number[] = []
  for (let x = 0; x < width; x++) {
    stack.push(x, (height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    stack.push(y * width, y * width + (width - 1))
  }

  while (stack.length > 0) {
    const i = stack.pop()!
    if (visited[i]) continue
    visited[i] = 1
    if (!isNearBlack(i)) continue
    // Noir proche du perso (cheveux, traits, ombres) → on garde.
    if (dist[i]! <= maxKeep) continue
    data[i * 4 + 3] = 0
    const x = i % width
    const y = (i / width) | 0
    if (x > 0) stack.push(i - 1)
    if (x < width - 1) stack.push(i + 1)
    if (y > 0) stack.push(i - width)
    if (y < height - 1) stack.push(i + width)
  }

  octx.putImageData(imageData, 0, 0)
  return off
}

function drawStatTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string,
): void {
  ctx.fillStyle = COLORS.creamFaint
  roundRect(ctx, x, y, w, h, 24)
  ctx.fill()
  ctx.strokeStyle = COLORS.creamBorder
  ctx.lineWidth = 2
  roundRect(ctx, x, y, w, h, 24)
  ctx.stroke()

  ctx.fillStyle = COLORS.cream
  ctx.font = '800 56px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(value, x + w / 2, y + h * 0.42, w - 40)

  ctx.fillStyle = COLORS.creamMuted
  ctx.font = '700 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText(label.toUpperCase(), x + w / 2, y + h * 0.72, w - 40)
}

/**
 * Carte Stories bordeaux + écriture crème + Rufo effort (RPE) + forme + records.
 */
export async function generateSessionShareImage(
  payload: SessionSharePayload,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = SESSION_SHARE_WIDTH
  canvas.height = SESSION_SHARE_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')

  const difficulty = resolveSessionShareDifficulty(payload.rpe, payload.lang)
  const [logo, rufo] = await Promise.all([
    loadImage(logoCreamUrl),
    loadImage(difficulty.imageSrc),
  ])

  ctx.fillStyle = COLORS.wine
  ctx.fillRect(0, 0, SESSION_SHARE_WIDTH, SESSION_SHARE_HEIGHT)

  const wash = ctx.createLinearGradient(0, 0, 0, SESSION_SHARE_HEIGHT)
  wash.addColorStop(0, COLORS.wine)
  wash.addColorStop(1, COLORS.wineDeep)
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, SESSION_SHARE_WIDTH, SESSION_SHARE_HEIGHT)

  const logoW = 400
  const logoH = (logo.height / logo.width) * logoW
  ctx.drawImage(logo, (SESSION_SHARE_WIDTH - logoW) / 2, 64, logoW, logoH)

  ctx.fillStyle = COLORS.creamMuted
  ctx.font = '800 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(
    payload.lang === 'en' ? 'SESSION COMPLETE' : 'SÉANCE TERMINÉE',
    SESSION_SHARE_WIDTH / 2,
    64 + logoH + 48,
  )

  ctx.fillStyle = COLORS.cream
  ctx.font = '900 54px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  const titleLines = wrapText(ctx, payload.sessionLabel, SESSION_SHARE_WIDTH - 140, 2)
  let titleY = 64 + logoH + 108
  for (const line of titleLines) {
    ctx.fillText(line, SESSION_SHARE_WIDTH / 2, titleY)
    titleY += 64
  }

  const pad = 64
  const gap = 20
  const tileW = (SESSION_SHARE_WIDTH - pad * 2 - gap) / 2
  const tileH = 152
  const gridTop = titleY + 28
  const isPremium = payload.isPremium

  drawStatTile(
    ctx,
    pad,
    gridTop,
    tileW,
    tileH,
    String(Math.max(0, Math.round(payload.durationMin))),
    'Minutes',
  )
  drawStatTile(
    ctx,
    pad + tileW + gap,
    gridTop,
    tileW,
    tileH,
    formatShareSets(payload.completedSets, payload.totalSets),
    'Sets',
  )
  drawStatTile(
    ctx,
    pad,
    gridTop + tileH + gap,
    tileW,
    tileH,
    isPremium
      ? (formatShareTonnage(payload.tonnageKg) ?? '—')
      : String(Math.max(1, Math.round(payload.rpe))),
    isPremium ? 'Volume' : 'RPE',
  )
  drawStatTile(
    ctx,
    pad + tileW + gap,
    gridTop + tileH + gap,
    tileW,
    tileH,
    formatShareFatigue(payload.fatigue, payload.lang),
    payload.lang === 'en' ? 'Form' : 'Forme',
  )

  let cursorY = gridTop + tileH * 2 + gap + 28

  if (isPremium && payload.exerciseMaxLoads.length > 0) {
    const rows = payload.exerciseMaxLoads.slice(0, 5)
    const prNames = new Set(payload.prs.map((p) => p.exerciseName))
    const boxH = 64 + rows.length * 48
    ctx.fillStyle = COLORS.wineSoft
    roundRect(ctx, pad, cursorY, SESSION_SHARE_WIDTH - pad * 2, boxH, 24)
    ctx.fill()

    ctx.fillStyle = COLORS.creamMuted
    ctx.font = '800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(
      payload.lang === 'en' ? 'SESSION MAX' : 'MAX SÉANCE',
      pad + 32,
      cursorY + 38,
    )

    let rowY = cursorY + 72
    for (const row of rows) {
      const isPr = prNames.has(row.exerciseName)
      ctx.fillStyle = COLORS.cream
      ctx.font = '700 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText(truncateToWidth(ctx, row.exerciseName, isPr ? 520 : 620), pad + 32, rowY)
      ctx.fillStyle = COLORS.creamSoft
      ctx.font = '800 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(
        isPr ? `${row.maxKg} kg · PR` : `${row.maxKg} kg`,
        SESSION_SHARE_WIDTH - pad - 32,
        rowY,
      )
      ctx.textAlign = 'left'
      rowY += 46
    }
    cursorY += boxH + 20
  } else if (isPremium && payload.prs.length > 0) {
    const prs = payload.prs.slice(0, 3)
    const prBoxH = 64 + prs.length * 52
    ctx.fillStyle = COLORS.wineSoft
    roundRect(ctx, pad, cursorY, SESSION_SHARE_WIDTH - pad * 2, prBoxH, 24)
    ctx.fill()

    ctx.fillStyle = COLORS.creamMuted
    ctx.font = '800 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(
      payload.lang === 'en'
        ? prs.length === 1
          ? 'PERSONAL RECORD'
          : 'PERSONAL RECORDS'
        : prs.length === 1
          ? 'RECORD PERSONNEL'
          : 'RECORDS PERSONNELS',
      pad + 32,
      cursorY + 38,
    )

    let prY = cursorY + 72
    for (const pr of prs) {
      ctx.fillStyle = COLORS.cream
      ctx.font = '700 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText(truncateToWidth(ctx, pr.exerciseName, 620), pad + 32, prY)
      ctx.fillStyle = COLORS.creamSoft
      ctx.font = '800 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${pr.newBestKg} kg`, SESSION_SHARE_WIDTH - pad - 32, prY)
      ctx.textAlign = 'left'
      prY += 48
    }
    cursorY += prBoxH + 20
  } else if (!isPremium && payload.purposeLine) {
    const purposeLines = wrapText(ctx, payload.purposeLine, SESSION_SHARE_WIDTH - pad * 2 - 64, 3)
    const boxH = 56 + purposeLines.length * 40
    ctx.fillStyle = COLORS.wineSoft
    roundRect(ctx, pad, cursorY, SESSION_SHARE_WIDTH - pad * 2, boxH, 24)
    ctx.fill()

    ctx.fillStyle = COLORS.creamMuted
    ctx.font = '800 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(
      payload.lang === 'en' ? 'SESSION FOCUS' : 'OBJECTIF SÉANCE',
      pad + 32,
      cursorY + 34,
    )

    ctx.fillStyle = COLORS.cream
    ctx.font = '700 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    let purposeY = cursorY + 74
    for (const line of purposeLines) {
      ctx.fillText(line, pad + 32, purposeY)
      purposeY += 38
    }
    cursorY += boxH + 20
  }

  // Zone Rufo — fond transparent sur bordeaux (plus de halo blanc)
  const labelBlockH = 88
  const rufoAreaBottom = SESSION_SHARE_HEIGHT - FOOTER_H
  const rufoAvailH = Math.max(280, rufoAreaBottom - cursorY - labelBlockH)
  const rufoMaxW = SESSION_SHARE_WIDTH - pad * 2
  const rufoScale = Math.min(rufoMaxW / rufo.width, rufoAvailH / rufo.height)
  const rufoW = rufo.width * rufoScale
  const rufoH = rufo.height * rufoScale
  const rufoX = (SESSION_SHARE_WIDTH - rufoW) / 2
  const rufoY = rufoAreaBottom - labelBlockH - rufoH

  const punched = punchBlackBackground(rufo, rufoW, rufoH)
  ctx.drawImage(punched, rufoX, rufoY)

  ctx.fillStyle = COLORS.cream
  ctx.font = '900 34px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(difficulty.label, SESSION_SHARE_WIDTH / 2, rufoAreaBottom - 44)

  ctx.fillStyle = COLORS.creamMuted
  ctx.font = '700 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText(difficulty.detail, SESSION_SHARE_WIDTH / 2, rufoAreaBottom - 12)

  ctx.fillStyle = COLORS.cream
  ctx.fillRect(0, SESSION_SHARE_HEIGHT - FOOTER_H, SESSION_SHARE_WIDTH, FOOTER_H)

  ctx.fillStyle = COLORS.wine
  ctx.font = '900 34px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText(
    payload.lang === 'en' ? 'Forge your prep' : 'Forge ta prépa',
    SESSION_SHARE_WIDTH / 2,
    SESSION_SHARE_HEIGHT - 100,
  )
  ctx.fillStyle = 'rgba(123, 13, 30, 0.72)'
  ctx.font = '700 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('rugbyforge.fr', SESSION_SHARE_WIDTH / 2, SESSION_SHARE_HEIGHT - 52)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode share image'))
          return
        }
        resolve(blob)
      },
      'image/png',
      1,
    )
  })
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let clipped = text
  while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
    clipped = clipped.slice(0, -1)
  }
  return `${clipped}…`
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['—']

  const lines: string[] = []
  let current = ''

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth) {
      current = next
      continue
    }

    if (current) lines.push(current)

    if (lines.length >= maxLines - 1) {
      const rest = [word, ...words.slice(i + 1)].join(' ')
      lines.push(truncateToWidth(ctx, rest, maxWidth))
      return lines.slice(0, maxLines)
    }

    current = truncateToWidth(ctx, word, maxWidth)
  }

  if (current) lines.push(current)
  return lines.slice(0, maxLines)
}
