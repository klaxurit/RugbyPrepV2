import type { SessionSharePayload } from './sessionShareTypes'
import {
  formatShareFatigue,
  formatShareSets,
  formatShareTonnage,
} from './buildSessionShareCopy'
import { resolveSessionShareDifficulty } from './resolveSessionShareDifficulty'

const TROPHY_SVG = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A1015" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4h10v3a5 5 0 0 1-10 0V4z"></path><path d="M5 4H3v2a3 3 0 0 0 3 3"></path><path d="M19 4h2v2a3 3 0 0 1-3 3"></path><path d="M10 13h4l-1 4h-2l-1-4z"></path><path d="M9 21h6"></path></svg>`

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function ensurePeriod(text: string): string {
  const t = text.trim()
  if (!t) return t
  return /[.!?…]$/.test(t) ? t : `${t}.`
}

/** Titre mockup : « Bas du corps<br>Puissance. » */
export function formatShareTitleHtml(label: string): string {
  const raw = label.trim()
  if (!raw) return '—'
  const parts = raw.split(/\s*[·•|]\s*|\s+-\s+/).map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const head = escapeHtml(parts.slice(0, -1).join(' '))
    const tail = escapeHtml(ensurePeriod(parts[parts.length - 1]!))
    return `${head}<br>${tail}`
  }
  return escapeHtml(ensurePeriod(raw))
}

function splitTonnage(tonnage: string): { main: string; suffix: string } {
  const m = /^(.+?)\s*kg$/i.exec(tonnage.trim())
  if (m) return { main: m[1]!.trim(), suffix: 'kg' }
  return { main: tonnage, suffix: '' }
}

function resolveSessionRecord(payload: SessionSharePayload): {
  exerciseName: string
  kg: number
} | null {
  // Bannière or uniquement pour un vrai PR de séance (pas un simple max).
  if (!payload.isPremium) return null
  const pr = payload.prs[0]
  if (!pr) return null
  return { exerciseName: pr.exerciseName, kg: pr.newBestKg }
}

export interface SessionShareCardModel {
  logoSrc: string
  portraitSrc: string
  eyebrow: string
  titleHtml: string
  dateLine: string | null
  tagDuration: string
  tagSets: string
  tagVolume: string
  durationValue: string
  durationGhost: string
  setsValue: string
  setsGhost: string
  volumeMain: string
  volumeSuffix: string | null
  volumeGhost: string
  volumeLabel: string
  formValue: string
  formColor: string | null
  formGhost: string
  formLabel: string
  /** Vrai PR uniquement — sinon la bannière n’est pas rendue. */
  sessionRecord: { exerciseName: string; kg: number; label: string } | null
  quote: string
  rpeFilled: number
  displayName: string | null
  roleLine: string | null
  footerTag: string
  labels: {
    duration: string
    sets: string
  }
}

export function buildSessionShareCardModel(
  payload: SessionSharePayload,
  assets: { logoSrc: string; portraitSrc: string },
): SessionShareCardModel {
  const fr = payload.lang !== 'en'
  const difficulty = resolveSessionShareDifficulty(
    payload.rpe,
    payload.lang,
    payload.firstName,
  )
  const durationMin = Math.max(0, Math.round(payload.durationMin))
  const setsValue = formatShareSets(payload.completedSets, payload.totalSets)
  const tonnage = formatShareTonnage(payload.tonnageKg)
  const formValue = formatShareFatigue(payload.fatigue, payload.lang)

  let volumeMain: string
  let volumeSuffix: string | null
  let volumeGhost: string
  let volumeLabel: string
  let tagVolume: string
  if (payload.isPremium && tonnage) {
    const split = splitTonnage(tonnage)
    volumeMain = split.main
    volumeSuffix = split.suffix || null
    volumeGhost = split.main.replace(/K$/i, '') || split.main
    volumeLabel = fr ? 'Volume soulevé' : 'Volume lifted'
    tagVolume = `${split.main} kg volume`
  } else {
    volumeMain = String(Math.max(1, Math.round(payload.rpe)))
    volumeSuffix = null
    volumeGhost = volumeMain
    volumeLabel = 'RPE'
    tagVolume = `RPE ${volumeMain}`
  }

  const metaParts = [
    payload.dateLabel,
    payload.weekLabel,
    payload.sessionOrdinalLabel,
  ].filter((p): p is string => Boolean(p?.trim()))

  const sessionRecord = resolveSessionRecord(payload)
  const displayName =
    payload.displayName?.trim() || payload.firstName?.trim() || null
  const roleParts = [payload.positionLabel, payload.clubName]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p))

  return {
    logoSrc: assets.logoSrc,
    portraitSrc: assets.portraitSrc,
    eyebrow: fr ? 'Séance terminée' : 'Session complete',
    titleHtml: formatShareTitleHtml(payload.sessionLabel),
    dateLine: metaParts.length > 0 ? metaParts.join(' · ') : null,
    tagDuration: `${durationMin} min`,
    tagSets: `${setsValue} sets`,
    tagVolume,
    durationValue: `${durationMin}'`,
    durationGhost: String(durationMin),
    setsValue,
    setsGhost: setsValue.split('/')[0] ?? setsValue,
    volumeMain,
    volumeSuffix,
    volumeGhost,
    volumeLabel,
    formValue,
    formColor: payload.fatigue === 'OK' ? '#8FD19E' : null,
    formGhost: payload.fatigue === 'OK' ? '✓' : '!',
    formLabel: fr ? 'État post-séance' : 'Post-session form',
    sessionRecord: sessionRecord
      ? {
          ...sessionRecord,
          label: fr ? 'Record de séance' : 'Session record',
        }
      : null,
    quote: `"${ensurePeriod(difficulty.label)}"`,
    rpeFilled: Math.min(10, Math.max(0, Math.round(payload.rpe))),
    displayName,
    roleLine: roleParts.length > 0 ? roleParts.join(' · ') : null,
    footerTag: fr
      ? 'Forge ta prépa, séance après séance.'
      : 'Forge your prep, session after session.',
    labels: {
      duration: fr ? 'Durée' : 'Duration',
      sets: fr ? 'Sets validés' : 'Sets done',
    },
  }
}

/** Markup HTML identique au mockup Claude Design. */
export function buildSessionShareCardHtml(model: SessionShareCardModel): string {
  const dots = Array.from({ length: 10 }, (_, i) =>
    i < model.rpeFilled ? '<i class="on"></i>' : '<i></i>',
  ).join('')

  const volumeVal = model.volumeSuffix
    ? `${escapeHtml(model.volumeMain)}<span style="font-size:26px">${escapeHtml(model.volumeSuffix)}</span>`
    : escapeHtml(model.volumeMain)

  const formStyle = model.formColor ? ` style="color:${model.formColor}"` : ''

  const prHtml = model.sessionRecord
    ? `<div class="pr">
    <div class="icon">${TROPHY_SVG}</div>
    <div class="txt">
      <div class="lbl">${escapeHtml(model.sessionRecord.label)}</div>
      <div class="name">${escapeHtml(model.sessionRecord.exerciseName)}</div>
    </div>
    <div class="kg">${model.sessionRecord.kg} kg</div>
  </div>`
    : ''

  const dateHtml = model.dateLine
    ? `<div class="date">${escapeHtml(model.dateLine)}</div>`
    : ''

  const nameHtml = model.displayName
    ? `<div class="avatar-name">${escapeHtml(model.displayName)}</div>`
    : ''
  const roleHtml = model.roleLine
    ? `<div class="avatar-role">${escapeHtml(model.roleLine)}</div>`
    : ''

  return `<div class="rf-share-card" id="rf-share-card">
<div class="texture"></div>
<div class="glow" style="width:640px;height:640px;top:-220px;right:-180px;background:radial-gradient(circle,rgba(217,166,63,.35),transparent 70%)"></div>
<div class="glow" style="width:520px;height:520px;bottom:120px;left:-200px;background:radial-gradient(circle,rgba(217,166,63,.12),transparent 70%)"></div>

<div class="wrap">
  <div class="logo-row">
    <img src="${escapeHtml(model.logoSrc)}" alt="RugbyForge" style="height:64px;width:auto" crossorigin="anonymous" />
  </div>

  <div class="eyebrow" role="presentation">
    <div class="line" aria-hidden="true"></div>
    <div class="txt">${escapeHtml(model.eyebrow)}</div>
    <div class="line" aria-hidden="true"></div>
  </div>
  <h1>${model.titleHtml}</h1>
  ${dateHtml}

  <div class="tags">
    <div class="tag gold">${escapeHtml(model.tagDuration)}</div>
    <div class="tag">${escapeHtml(model.tagSets)}</div>
    <div class="tag">${escapeHtml(model.tagVolume)}</div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="ghost sghost">${escapeHtml(model.durationGhost)}</div>
      <div class="val">${escapeHtml(model.durationValue)}</div>
      <div class="lbl">${escapeHtml(model.labels.duration)}</div>
    </div>
    <div class="stat">
      <div class="ghost sghost">${escapeHtml(model.setsGhost)}</div>
      <div class="val">${escapeHtml(model.setsValue)}</div>
      <div class="lbl">${escapeHtml(model.labels.sets)}</div>
    </div>
    <div class="stat">
      <div class="ghost sghost">${escapeHtml(model.volumeGhost)}</div>
      <div class="val">${volumeVal}</div>
      <div class="lbl">${escapeHtml(model.volumeLabel)}</div>
    </div>
    <div class="stat">
      <div class="ghost sghost">${escapeHtml(model.formGhost)}</div>
      <div class="val"${formStyle}>${escapeHtml(model.formValue)}</div>
      <div class="lbl">${escapeHtml(model.formLabel)}</div>
    </div>
  </div>

  ${prHtml}

  <div class="quote">${escapeHtml(model.quote)}</div>
  <div class="rpe-dots">${dots}</div>

  <div class="avatar-row">
    <div class="avatar-ring">
      <img class="avatar-photo" src="${escapeHtml(model.portraitSrc)}" alt="" width="172" height="172" crossorigin="anonymous" />
    </div>
    ${nameHtml}
    ${roleHtml}
  </div>
</div>

<div class="footer">
  <div class="footer-rule"></div>
  <div class="footer-brand">
    <img class="footer-logo" src="${escapeHtml(model.logoSrc)}" alt="RugbyForge" crossorigin="anonymous" />
  </div>
  <div class="footer-tag">${escapeHtml(model.footerTag)}</div>
  <div class="footer-cta">rugbyforge.fr</div>
</div>
</div>`
}
