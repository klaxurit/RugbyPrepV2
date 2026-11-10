import { describe, expect, it } from 'vitest'
import {
  buildShareCardData,
  buildShareFooterSegments,
  computeClubInitials,
  formatClubDisplayName,
  formatShareFooterText,
  mapCompetition,
  type ShareCardData,
} from '../buildShareCardData'
import { resolveShareClubCrest } from '../generateSessionShareImage'

const noLogo = { resolveClubLogoUrl: () => null }
const withLogo = { resolveClubLogoUrl: () => 'https://example.test/logo.jpg' }

describe('mapCompetition', () => {
  it.each([
    ['Régionale 2', 'Régionale 2', 'R2'],
    ['Regionale 1 - Poule 3', 'Régionale 1', 'R1'],
    ['REGIONALE 3', 'Régionale 3', 'R3'],
    ['Fédérale 3', 'Fédérale 3', 'F3'],
    ['Championnat de France Federale 1 - Poule 2', 'Fédérale 1', 'F1'],
    ['Nationale 2', 'Nationale 2', 'N2'],
    ['Nationale', 'Nationale', 'Nationale'],
  ])('%s → %s / %s', (raw, label, short) => {
    expect(mapCompetition(raw)).toEqual({ label, short })
  })

  it('garde le libellé complet quand la division est inconnue', () => {
    expect(mapCompetition('Excellence B')).toEqual({ label: 'Excellence B', short: 'Excellence B' })
  })

  it('retourne null sans compétition', () => {
    expect(mapCompetition(null)).toBeNull()
    expect(mapCompetition('   ')).toBeNull()
  })
})

describe('computeClubInitials', () => {
  it.each([
    ['DIEPPE UNIVERSITAIRE CLUB', 'DUC'],
    ['Dieppe Universitaire Club', 'DUC'],
    ['STADE ROCHELAIS', 'SR'],
    ['RUGBY CLUB DE PIRAE', 'RCP'],
    ['Union Sportive Athlétique de Saint-Jean', 'USAS'],
    ['JO Pradéenne', 'JP'],
    ['BARRACUDAS', 'BAR'],
  ])('%s → %s', (name, expected) => {
    expect(computeClubInitials(name)).toBe(expected)
  })

  it('retourne null si impossible', () => {
    expect(computeClubInitials(null)).toBeNull()
    expect(computeClubInitials('X')).toBeNull()
    expect(computeClubInitials('—')).toBeNull()
  })
})

describe('formatClubDisplayName', () => {
  it('passe les noms FFR en capitales en casse titre, sigles conservés', () => {
    expect(formatClubDisplayName('DIEPPE UNIVERSITAIRE CLUB')).toBe('Dieppe Universitaire Club')
    expect(formatClubDisplayName('RUGBY CLUB DE PIRAE')).toBe('Rugby Club de Pirae')
    expect(formatClubDisplayName('US SAINT-JEAN-DE-LUZ')).toBe('US Saint-Jean-De-Luz')
  })

  it('ne touche pas un nom déjà en casse mixte', () => {
    expect(formatClubDisplayName('DUC Dieppe')).toBe('DUC Dieppe')
  })
})

describe('buildShareCardData', () => {
  it('ne produit aucune valeur inventée quand le profil est vide', () => {
    expect(buildShareCardData({}, noLogo)).toEqual({
      firstName: null,
      positionLabel: null,
      club: null,
      competition: null,
      clubShown: false,
    })
  })

  it('lit club, logo stocké et compétition du profil', () => {
    const data = buildShareCardData(
      {
        firstName: ' Hugo ',
        positionLabel: '3e ligne',
        clubName: 'DIEPPE UNIVERSITAIRE CLUB',
        clubCode: '1234X',
        competitionName: 'Régionale 2 - Poule 1',
      },
      withLogo,
    )
    expect(data).toEqual({
      firstName: 'Hugo',
      positionLabel: '3e ligne',
      club: {
        name: 'Dieppe Universitaire Club',
        shortCode: 'DUC',
        logoUrl: 'https://example.test/logo.jpg',
      },
      competition: { label: 'Régionale 2', short: 'R2' },
      clubShown: true,
    })
  })

  it('préfère le nom court quand il existe', () => {
    const data = buildShareCardData(
      { clubName: 'DIEPPE UNIVERSITAIRE CLUB', clubShortName: 'DUC Dieppe' },
      noLogo,
    )
    expect(data.club?.name).toBe('DUC Dieppe')
  })

  it('toggle désactivé : ni club, ni logo, ni niveau (poste conservé)', () => {
    const data = buildShareCardData(
      {
        firstName: 'Hugo',
        positionLabel: '3e ligne',
        clubName: 'DUC Dieppe',
        competitionName: 'Régionale 2',
        showClub: false,
      },
      withLogo,
    )
    expect(data.club).toBeNull()
    expect(data.competition).toBeNull()
    expect(data.clubShown).toBe(false)
    expect(data.positionLabel).toBe('3e ligne')
  })

  it('niveau sans club : le niveau est omis', () => {
    const data = buildShareCardData({ competitionName: 'Fédérale 3' }, noLogo)
    expect(data.competition).toBeNull()
  })
})

describe('pied de carte (séparateurs)', () => {
  const base = (patch: Partial<ShareCardData>): ShareCardData => ({
    firstName: null,
    positionLabel: '3e ligne',
    club: null,
    competition: null,
    clubShown: false,
    ...patch,
  })
  const club = { name: 'DUC Dieppe', shortCode: 'DD', logoUrl: null }
  const competition = { label: 'Régionale 2', short: 'R2' }

  it.each<[string, Partial<ShareCardData>, string]>([
    ['rien', {}, ''],
    ['prénom seul', { firstName: 'Hugo' }, 'Hugo'],
    ['club seul', { club, clubShown: true }, 'DUC Dieppe'],
    ['club + niveau', { club, clubShown: true, competition }, 'DUC Dieppe · Régionale 2'],
    ['prénom + club', { firstName: 'Hugo', club, clubShown: true }, 'Hugo · DUC Dieppe'],
    [
      'prénom + club + logo + niveau',
      { firstName: 'Hugo', club: { ...club, logoUrl: 'x' }, clubShown: true, competition },
      'Hugo · DUC Dieppe · Régionale 2',
    ],
  ])('%s', (_label, patch, expected) => {
    const text = formatShareFooterText(buildShareFooterSegments(base(patch)))
    expect(text).toBe(expected)
    expect(text).not.toMatch(/·\s*·/)
    expect(text).not.toMatch(/^\s*·|·\s*$/)
  })

  it('le poste n’est jamais dans le pied', () => {
    const text = formatShareFooterText(
      buildShareFooterSegments(base({ firstName: 'Hugo', club, clubShown: true })),
    )
    expect(text).not.toContain('3e ligne')
  })

  it('bascule sur le niveau abrégé quand la place manque', () => {
    const segments = buildShareFooterSegments(
      base({
        firstName: 'Maxime-Alexandre',
        club: { ...club, name: 'Union Sportive Athlétique de Saint-Jean' },
        clubShown: true,
        competition: { label: 'Fédérale 3', short: 'F3' },
      }),
    )
    expect(segments.at(-1)).toEqual({ kind: 'level', text: 'F3' })
  })

  it('écusson seulement si logo ou initiales disponibles', () => {
    const [seg] = buildShareFooterSegments(base({ club: { name: '—', shortCode: null, logoUrl: null }, clubShown: true }))
    expect(seg).toEqual({ kind: 'club', text: '—', withCrest: false })
  })
})

describe('resolveShareClubCrest', () => {
  const data = (club: ShareCardData['club']): ShareCardData => ({
    firstName: null,
    positionLabel: null,
    club,
    competition: null,
    clubShown: club !== null,
  })

  it('logo stocké chargé → source ffr', async () => {
    const res = await resolveShareClubCrest(
      data({ name: 'DUC Dieppe', shortCode: 'DD', logoUrl: 'https://x/logo.jpg' }),
      async () => 'data:image/jpeg;base64,AAA',
    )
    expect(res).toEqual({ src: 'data:image/jpeg;base64,AAA', source: 'ffr' })
  })

  it('échec CORS → écusson de secours aux initiales', async () => {
    const res = await resolveShareClubCrest(
      data({ name: 'DUC Dieppe', shortCode: 'DD', logoUrl: 'https://x/logo.jpg' }),
      async () => {
        throw new Error('cors')
      },
    )
    expect(res.source).toBe('fallback')
    expect(decodeURIComponent(res.src ?? '')).toContain('>DD</text>')
  })

  it('pas de club → none', async () => {
    expect(await resolveShareClubCrest(data(null))).toEqual({ src: null, source: 'none' })
  })

  it('ni logo ni initiales → none', async () => {
    const res = await resolveShareClubCrest(data({ name: '—', shortCode: null, logoUrl: null }))
    expect(res).toEqual({ src: null, source: 'none' })
  })
})
