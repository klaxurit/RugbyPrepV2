/**
 * Carte de partage v2 (Stories 1080×1920) — maquette Claude Design « Carte de
 * fin de séance v2 » : un seul héros choisi par priorité, bloc texte compact
 * ancré en bas au-dessus de la safe zone Instagram (250 px), coupe diagonale,
 * pied « Prénom · [écusson] Club · R2 » + wordmark.
 */
import type { SessionSharePayload, ShareCardFormat } from './sessionShareTypes'
import {
  buildShareCardData,
  buildShareFooterSegments,
  SHARE_FOOTER_SEPARATOR,
  type ShareCardData,
  type ShareFooterSegment,
} from './buildShareCardData'
import { formatShareStampDate } from './formatShareStampDate'
import { resolveShareCardFormat } from './resolveShareCardFormat'
import {
  buildShareChips,
  formatShareLoad,
  normalizeOpponentName,
  pickTitleSize,
  selectShareHero,
  type ShareChip,
  type ShareHero,
} from './selectShareHero'

function scaleType(px: number, format: ShareCardFormat): number {
  return format === 'square' ? Math.max(28, Math.round(px * 0.64)) : px
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const POSTS_SVG = (color: string, size = 22) =>
  `<svg width="${size}" height="${Math.round(size * 1.18)}" viewBox="0 0 24 28" aria-hidden="true"><path d="M5 2v24M19 2v24M5 17h14" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"></path></svg>`

export interface SessionShareCardModel {
  lang: SessionSharePayload['lang']
  format: ShareCardFormat
  logoSrc: string
  /** Photo de séance (data URL). null → fond de marque crème / bordeaux. */
  photoSrc: string | null
  /** Logo club ou écusson de secours ; null → pas d’écusson. */
  crestSrc: string | null
  /** Nombre de records de la séance (tampon Claude Design si > 0). */
  recordCount: number
  /** Date courte du tampon (« DD · MM · YY »), absente → ligne date omise. */
  stampDate: string | null
  /** Poste en chip haut gauche. */
  positionChip: string | null
  /** Chip haut droite : date, ou « J-5 · ADVERSAIRE » si le match n’est pas le héros. */
  headerRight: string | null
  hero: ShareHero
  chips: ShareChip[]
  /** Pied « Prénom · [écusson] Club · R2 » — segments absents omis. */
  footerSegments: ShareFooterSegment[]
}

/** Identité club / niveau dérivée du payload (respecte le toggle showClub). */
export function buildSessionShareIdentity(payload: SessionSharePayload): ShareCardData {
  return buildShareCardData({
    firstName: payload.firstName,
    positionLabel: payload.positionLabel,
    clubName: payload.clubName,
    clubCode: payload.clubCode,
    competitionName: payload.competitionName,
    showClub: payload.showClub,
  })
}

export function buildSessionShareCardModel(
  payload: SessionSharePayload,
  assets: { logoSrc: string; crestSrc?: string | null; photoSrc?: string | null },
  identity: ShareCardData = buildSessionShareIdentity(payload),
): SessionShareCardModel {
  const hero = selectShareHero(payload)
  const format = resolveShareCardFormat(hero.kind, payload.cardFormat)
  const crestSrc = assets.crestSrc ?? null
  const footerSegments = buildShareFooterSegments(identity).map((segment) =>
    segment.kind === 'club' ? { ...segment, withCrest: Boolean(crestSrc) } : segment,
  )

  let headerRight = payload.dateLabel?.trim() || null
  const match = payload.nextMatch
  if (hero.kind !== 'match' && match && match.daysUntil >= 1 && match.daysUntil <= 7) {
    headerRight = [`J-${match.daysUntil}`, normalizeOpponentName(match.opponent)]
      .filter(Boolean)
      .join(' · ')
  }

  return {
    lang: payload.lang,
    format,
    logoSrc: assets.logoSrc,
    photoSrc: assets.photoSrc ?? null,
    crestSrc,
    recordCount: payload.prs.length,
    stampDate: formatShareStampDate(payload.sessionDateISO),
    positionChip: identity.positionLabel,
    headerRight,
    hero,
    chips: buildShareChips(payload, hero),
    footerSegments,
  }
}

function buildFooterIdentityHtml(model: SessionShareCardModel): string {
  if (model.footerSegments.length === 0) return ''
  const sep = `<span class="sep" aria-hidden="true">${SHARE_FOOTER_SEPARATOR.trim()}</span>`
  const parts = model.footerSegments.map((segment) => {
    if (segment.kind === 'name') {
      return `<span class="seg-name">${escapeHtml(segment.text)}</span>`
    }
    if (segment.kind === 'club') {
      const crest =
        segment.withCrest && model.crestSrc
          ? `<span class="footer-crest-wrap"><img class="footer-crest" src="${escapeHtml(model.crestSrc)}" alt="" crossorigin="anonymous" /></span>`
          : ''
      return `<span class="seg-club">${crest}<span class="seg-club-name">${escapeHtml(segment.text)}</span></span>`
    }
    return `<span class="seg-level">${escapeHtml(segment.text)}</span>`
  })
  return `<div class="footer-id">${parts.join(sep)}</div>`
}

function buildHeroHtml(model: SessionShareCardModel): string {
  const en = model.lang === 'en'
  const hero = model.hero
  const format = model.format

  if (hero.kind === 'record') {
    const size = scaleType(pickTitleSize(hero.exerciseName, [[14, 96], [18, 80]], 72), format)
    const load = formatShareLoad(hero.kg)
    const bigSize = scaleType(load.length > 3 ? 150 : 176, format)
    const delta = hero.deltaKg != null
      ? `<div class="delta"><b>+${escapeHtml(formatShareLoad(hero.deltaKg))} kg</b>${
          hero.previousKg != null ? `<span>vs ${escapeHtml(formatShareLoad(hero.previousKg))} kg</span>` : ''
        }</div>`
      : `<div class="delta"><b>${en ? '1st record' : '1er record'}</b></div>`
    return `<div class="hero hero-record">
  <h1 class="hero-title" style="font-size:${size}px">${escapeHtml(hero.exerciseName)}</h1>
  <div class="hero-row">
    <div class="hero-num"><span class="big" style="font-size:${bigSize}px">${escapeHtml(load)}</span><span class="unit">kg</span></div>
    ${delta}
  </div>
</div>`
  }

  if (hero.kind === 'match') {
    const venue = hero.venue === 'home' ? (en ? 'HOME' : 'DOM.') : hero.venue === 'away' ? (en ? 'AWAY' : 'EXT.') : null
    const kicker = [en ? 'NEXT MATCH' : 'PROCHAIN MATCH', venue].filter(Boolean).join(' · ')
    const opponentSize = hero.opponent ? pickTitleSize(hero.opponent, [[12, 64], [16, 52]], 52) : 64
    const days = Array.from({ length: 7 }, (_, i) => 7 - i)
      .map((k) => {
        const state = k === hero.daysUntil ? 'today' : k > hero.daysUntil ? 'past' : 'next'
        const label = state === 'today' ? (en ? 'TODAY' : 'AUJ.') : `J-${k}`
        return `<div class="day ${state}"><i></i><span>${label}</span></div>`
      })
      .join('')
    return `<div class="hero hero-match">
  <div class="hero-row">
    <div class="jx">J-${hero.daysUntil}</div>
    <div class="opp">
      <div class="kicker">${escapeHtml(kicker)}</div>
      ${hero.opponent ? `<div class="opp-name"><span class="vs">vs</span><span class="name" style="font-size:${opponentSize}px">${escapeHtml(hero.opponent)}</span></div>` : ''}
    </div>
  </div>
  <div class="frise">${days}<div class="goal">${POSTS_SVG('#FFFFFF', 30)}<span>MATCH</span></div></div>
</div>`
  }

  if (hero.kind === 'progression') {
    const p = hero.progression
    if (p.kind === 'load') {
      const bars = [62, 74, 86, 104]
        .map((h, i) => `<div class="bar${i === 3 ? ' on' : ''}" style="height:${h}px"></div>`)
        .join('')
      const kicker = p.exerciseName
        ? `${en ? 'PROGRESS' : 'PROGRESSION'} — ${p.exerciseName.toUpperCase()}`
        : en ? 'PROGRESS' : 'PROGRESSION'
      return `<div class="hero hero-progress">
  <div class="kicker">${escapeHtml(kicker)}</div>
  <div class="hero-row"><div class="hero-num"><span class="big">+${Math.round(p.percent)}</span><span class="unit">%</span></div><div class="bars">${bars}</div></div>
  <div class="hero-sub">${en ? `load in ${p.weeks} weeks` : `de charge en ${p.weeks} semaines`}</div>
</div>`
    }
    const shown = Math.min(8, p.weeks)
    const posts = Array.from({ length: 8 }, (_, i) =>
      POSTS_SVG(i >= 8 - shown ? '#F5EFE6' : 'rgba(245,239,230,0.25)', 28),
    ).join('')
    return `<div class="hero hero-progress">
  <div class="kicker">${en ? 'CONSISTENCY — LAST 8 WEEKS' : 'RÉGULARITÉ — 8 DERNIÈRES SEMAINES'}</div>
  <div class="hero-row"><div class="hero-num"><span class="big">${p.weeks}</span><span class="unit">${en ? 'th' : 'e'}</span></div><div class="posts">${posts}</div></div>
  <div class="hero-sub">${en ? 'full week in a row' : 'semaine complète d’affilée'}</div>
</div>`
  }

  const size = scaleType(pickTitleSize(hero.title, [[12, 132], [15, 112]], 96), format)
  const sub = [`<span class="w">${hero.durationMin} min</span>`]
  if (hero.focus) sub.push(`<span class="dot">·</span><span class="c">${escapeHtml(hero.focus)}</span>`)
  return `<div class="hero hero-session">
  <div class="kicker">${en ? 'SESSION COMPLETE' : 'SÉANCE TERMINÉE'}</div>
  <h1 class="hero-title" style="font-size:${size}px">${escapeHtml(hero.title)}</h1>
  <div class="hero-sub">${sub.join('')}</div>
</div>`
}

function buildBackgroundHtml(model: SessionShareCardModel): string {
  if (model.photoSrc) {
    return `<img class="photo" src="${escapeHtml(model.photoSrc)}" alt="" crossorigin="anonymous" />
<div class="veil-top"></div>
<div class="veil-grad"></div>
<div class="panel"></div>
<div class="edge"></div>`
  }
  const square = model.format === 'square'
  const lines = square
    ? `<i class="l solid" style="top:560px;height:4px"></i>
  <i class="l dash" style="top:460px"></i>
  <i class="l solid" style="top:320px"></i>
  <i class="l dash" style="top:200px"></i>`
    : `<i class="l solid" style="top:1040px;height:4px"></i>
  <i class="l dash" style="top:880px"></i>
  <i class="l solid" style="top:600px"></i>
  <i class="l dash" style="top:400px"></i>`
  const postsH = square ? 420 : 720
  return `<div class="pitch" aria-hidden="true">
  ${lines}
  <i class="v" style="left:120px"></i>
  <i class="v" style="left:957px"></i>
  <svg class="posts-bg" width="440" height="${postsH}" viewBox="0 0 440 720"><path d="M40 10v700M400 10v700M40 470h360" stroke="rgba(123,13,30,0.20)" stroke-width="22" fill="none" stroke-linecap="round"></path><rect x="22" y="600" width="36" height="110" rx="6" fill="rgba(123,13,30,0.20)"></rect><rect x="382" y="600" width="36" height="110" rx="6" fill="rgba(123,13,30,0.20)"></rect></svg>
</div>
<div class="panel solid"></div>`
}

export function buildSessionShareCardHtml(model: SessionShareCardModel): string {
  const hasPhoto = Boolean(model.photoSrc)
  const formatClass = model.format === 'square' ? 'is-square' : 'is-story'
  const chipsHtml = model.chips.length
    ? `<div class="chips">${model.chips
        .map(
          (chip) =>
            `<div class="chip${chip.filled ? ' filled' : ''}">${chip.posts ? POSTS_SVG('#7B0D1E') : ''}${escapeHtml(chip.text)}</div>`,
        )
        .join('')}</div>`
    : ''
  const footerIdHtml = buildFooterIdentityHtml(model)
  const stamp =
    model.recordCount > 0
      ? `<div class="stamp" data-testid="share-record-stamp"><span class="s1">— PERSO —</span><span class="s2">RECORD</span>${
          model.stampDate ? `<span class="s3">${escapeHtml(model.stampDate)}</span>` : ''
        }</div>`
      : ''

  return `<div class="rf-share-card ${formatClass} ${hasPhoto ? 'has-photo' : 'no-photo'}" id="rf-share-card">
${buildBackgroundHtml(model)}
${model.positionChip ? `<div class="hchip left">${escapeHtml(model.positionChip)}</div>` : ''}
${model.headerRight ? `<div class="hchip right">${escapeHtml(model.headerRight)}</div>` : ''}
<div class="content">
  ${buildHeroHtml(model)}
  ${chipsHtml}
  <div class="footer-row${footerIdHtml ? '' : ' solo'}">
    ${footerIdHtml}
    <img class="footer-logo" src="${escapeHtml(model.logoSrc)}" alt="RugbyForge" crossorigin="anonymous" />
  </div>
</div>
${stamp}
</div>`
}
