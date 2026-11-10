/**
 * Carte de partage v2 — handoff Claude Design « share-card-breathing »
 * (ticket haut, tampon SVG, respiration panneau, frise semaine).
 */
import type { SessionSharePayload, ShareCardFormat } from './sessionShareTypes'
import {
  buildShareCardData,
  buildShareFooterSegments,
  SHARE_FOOTER_SEPARATOR,
  type ShareCardData,
  type ShareFooterSegment,
} from './buildShareCardData'
import { buildShareWeekStrip, type ShareWeekDay } from './buildShareWeekStrip'
import { formatShareStampDate, formatShareTicketDate } from './formatShareStampDate'
import { resolveShareCardFormat } from './resolveShareCardFormat'
import {
  buildShareChips,
  formatShareLoad,
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
  /** Poste dans le ticket haut. */
  positionChip: string | null
  /** Date ticket (« DD.MM.YY ») ; fallback dateLabel. */
  ticketDate: string | null
  hero: ShareHero
  chips: ShareChip[]
  /** Frise semaine (héros match uniquement). */
  weekStrip: ShareWeekDay[] | null
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

  const ticketDate =
    formatShareTicketDate(payload.sessionDateISO) || payload.dateLabel?.trim() || null

  const weekStrip =
    hero.kind === 'match'
      ? buildShareWeekStrip(payload.sessionDateISO, hero.daysUntil, payload.lang)
      : null

  return {
    lang: payload.lang,
    format,
    logoSrc: assets.logoSrc,
    photoSrc: assets.photoSrc ?? null,
    crestSrc,
    recordCount: payload.prs.length,
    stampDate: formatShareStampDate(payload.sessionDateISO),
    positionChip: identity.positionLabel,
    ticketDate,
    hero,
    chips: hero.kind === 'match' ? [] : buildShareChips(payload, hero),
    weekStrip,
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

function buildTicketHtml(model: SessionShareCardModel): string {
  if (!model.positionChip && !model.ticketDate) return ''
  const poste = model.positionChip
    ? `<div class="hticket-poste"><span>${escapeHtml(model.positionChip)}</span></div>`
    : ''
  const date = model.ticketDate
    ? `<div class="hticket-date"><span>${escapeHtml(model.ticketDate)}</span></div>`
    : ''
  return `<div class="hticket">${poste}${date}<div class="hticket-tip" aria-hidden="true"></div></div>`
}

function buildStampHtml(model: SessionShareCardModel): string {
  if (model.recordCount <= 0) return ''
  const date = model.stampDate ? escapeHtml(model.stampDate) : ''
  return `<div class="stamp" data-testid="share-record-stamp">
  <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
    <defs>
      <path id="rf-stamp-top" d="M 24 100 A 76 76 0 0 1 176 100"></path>
      <path id="rf-stamp-bot" d="M 12 100 A 88 88 0 0 0 188 100"></path>
    </defs>
    <circle cx="100" cy="100" r="98" fill="#F4EBDD"></circle>
    <circle cx="100" cy="100" r="93" fill="none" stroke="#7B0D1E" stroke-width="3.5"></circle>
    <circle cx="100" cy="100" r="70" fill="none" stroke="#7B0D1E" stroke-width="1.5"></circle>
    <text class="stamp-arc" font-size="14" font-weight="800" letter-spacing="5" fill="#7B0D1E"><textPath href="#rf-stamp-top" startOffset="50%" text-anchor="middle">— PERSO —</textPath></text>
    ${date ? `<text class="stamp-arc" font-size="13" font-weight="700" letter-spacing="3" fill="#7B0D1E"><textPath href="#rf-stamp-bot" startOffset="50%" text-anchor="middle">${date}</textPath></text>` : ''}
    <rect x="14" y="80" width="172" height="40" fill="#7B0D1E"></rect>
    <text x="100" y="111" text-anchor="middle" font-size="31" font-weight="900" font-style="italic" letter-spacing="1" fill="#F4EBDD">RECORD</text>
    <rect x="96" y="40" width="8" height="8" fill="#7B0D1E" transform="rotate(45 100 44)"></rect>
    <rect x="96" y="152" width="8" height="8" fill="#7B0D1E" transform="rotate(45 100 156)"></rect>
  </svg>
</div>`
}

function buildWeekStripHtml(model: SessionShareCardModel): string {
  const days = model.weekStrip
  if (!days?.length) return ''
  const en = model.lang === 'en'
  const markers = days
    .map((d) =>
      d.isToday
        ? `<div class="week-mark"><span>${en ? 'Today' : 'Auj.'}</span></div>`
        : `<div class="week-mark"></div>`,
    )
    .join('')
  const cells = days
    .map((d) => {
      const label =
        d.kind === 'match' ? (en ? 'Match' : 'Match') : d.kind === 'salle' ? (en ? 'Gym' : 'Salle') : en ? 'Rest' : 'Repos'
      return `<div class="week-day is-${d.kind}"><span class="wd">${escapeHtml(d.dayLabel)}</span><span class="wn">${d.dayNumber}</span><span class="wl">${label}</span></div>`
    })
    .join('')
  return `<div class="week-strip"><div class="week-marks">${markers}</div><div class="week-days">${cells}</div></div>`
}

function buildHeroHtml(model: SessionShareCardModel): string {
  const en = model.lang === 'en'
  const hero = model.hero
  const format = model.format
  const square = format === 'square'

  if (hero.kind === 'record') {
    const size = square
      ? pickTitleSize(hero.exerciseName, [[14, 62], [18, 52]], 44)
      : pickTitleSize(hero.exerciseName, [[14, 96], [18, 80]], 72)
    const load = formatShareLoad(hero.kg)
    const bigSize = square ? (load.length > 3 ? 160 : 200) : load.length > 3 ? 240 : 300
    const unitSize = square ? 72 : 104
    const delta = hero.deltaKg != null
      ? `<div class="delta"><b>+${escapeHtml(formatShareLoad(hero.deltaKg))} kg</b>${
          hero.previousKg != null
            ? `<span>${en ? 'Prev' : 'Ancien'} · ${escapeHtml(formatShareLoad(hero.previousKg))} kg</span>`
            : ''
        }</div>`
      : `<div class="delta"><b>${en ? '1st record' : '1er record'}</b><span>${en ? 'Baseline set' : 'Référence posée'}</span></div>`
    return `<div class="hero hero-record">
  <div class="kicker-row"><i></i><span>${en ? 'Personal best' : 'Record perso'}</span></div>
  <h1 class="hero-title" style="font-size:${size}px">${escapeHtml(hero.exerciseName)}</h1>
  <div class="hero-row">
    <div class="hero-num"><span class="big" style="font-size:${bigSize}px">${escapeHtml(load)}</span><span class="unit" style="font-size:${unitSize}px">kg</span></div>
    ${delta}
  </div>
</div>`
  }

  if (hero.kind === 'match') {
    const venue = hero.venue === 'home' ? (en ? 'Home' : 'Domicile') : hero.venue === 'away' ? (en ? 'Away' : 'Extérieur') : null
    const kicker = [en ? 'Next match' : 'Prochain match', venue].filter(Boolean).join(' · ')
    const opponentSize = square
      ? hero.opponent
        ? pickTitleSize(hero.opponent, [[12, 54], [16, 44]], 40)
        : 54
      : hero.opponent
        ? pickTitleSize(hero.opponent, [[12, 76], [16, 64]], 52)
        : 76
    const jxSize = square ? 196 : 280
    return `<div class="hero hero-match">
  <div class="kicker-row"><i></i><span>${escapeHtml(kicker.toUpperCase())}</span></div>
  <div class="hero-row">
    <div class="jx" style="font-size:${jxSize}px">J-${hero.daysUntil}</div>
    <div class="opp">
      <span class="vs">vs</span>
      ${hero.opponent ? `<span class="name" style="font-size:${opponentSize}px">${escapeHtml(hero.opponent)}</span>` : ''}
    </div>
  </div>
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
<div class="veil"></div>
<div class="edge"></div>
<div class="panel"></div>
<div class="panel-shade"></div>`
  }
  const square = model.format === 'square'
  const postsH = square ? 300 : 560
  return `<div class="pitch" aria-hidden="true">
  <i class="rail r1"></i>
  <i class="rail r2"></i>
  <i class="rail rh"></i>
  <svg class="posts-bg" width="216" height="${postsH}" viewBox="0 0 216 560"><path d="M20 10v540M196 10v540M20 340h176" stroke="rgba(123,13,30,0.14)" stroke-width="16" fill="none" stroke-linecap="round"></path></svg>
</div>
<div class="edge"></div>
<div class="panel solid"></div>
<div class="panel-shade"></div>`
}

function buildChipsHtml(chips: ShareChip[]): string {
  if (!chips.length) return ''
  return `<div class="chips">${chips
    .map((chip) => {
      const posts = chip.posts ? POSTS_SVG('#F4EBDD', 18) : ''
      return `<div class="chip${chip.filled ? ' filled' : ''}">${posts}<span class="chip-val">${escapeHtml(chip.text)}</span></div>`
    })
    .join('')}</div>`
}

export function buildSessionShareCardHtml(model: SessionShareCardModel): string {
  const hasPhoto = Boolean(model.photoSrc)
  const formatClass = model.format === 'square' ? 'is-square' : 'is-story'
  const footerIdHtml = buildFooterIdentityHtml(model)
  const mid =
    model.hero.kind === 'match' ? buildWeekStripHtml(model) : buildChipsHtml(model.chips)

  return `<div class="rf-share-card ${formatClass} ${hasPhoto ? 'has-photo' : 'no-photo'}" id="rf-share-card">
${buildBackgroundHtml(model)}
${buildTicketHtml(model)}
<div class="content">
  ${buildHeroHtml(model)}
  ${mid}
  <div class="footer-row${footerIdHtml ? '' : ' solo'}">
    ${footerIdHtml}
    <img class="footer-logo" src="${escapeHtml(model.logoSrc)}" alt="RugbyForge" crossorigin="anonymous" />
  </div>
</div>
${buildStampHtml(model)}
</div>`
}
