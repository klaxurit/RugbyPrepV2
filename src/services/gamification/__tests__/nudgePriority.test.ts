import { describe, expect, it } from 'vitest'
import type { NudgeKind, SocialNudge } from '../../../types/gamification'
import { nudgePresentation, selectNudge } from '../nudgePriority'
import { NUDGE_RULES } from '../scoreConstants'

const NOW = '2026-09-16T12:00:00.000Z'

function nudge(
  id: string,
  kind: NudgeKind,
  createdAt = '2026-09-16T11:00:00.000Z',
): SocialNudge {
  return { id, kind, title: id, body: id, createdAt }
}

function select(
  candidates: SocialNudge[],
  overrides: Partial<Parameters<typeof selectNudge>[0]> = {},
) {
  return selectNudge({
    candidates,
    nudgesShownThisWeek: 0,
    isSessionRunning: false,
    hasBlockingOverlay: false,
    nowISO: NOW,
    ...overrides,
  })
}

describe('selectNudge — garde-fous', () => {
  it('ne renvoie rien sans candidat', () => {
    expect(select([])).toBeNull()
  })

  it('n’interrompt jamais une séance en cours', () => {
    expect(select([nudge('a', 'level_up')], { isSessionRunning: true })).toBeNull()
  })

  it('cède la priorité à un overlay bloquant', () => {
    expect(select([nudge('a', 'level_up')], { hasBlockingOverlay: true })).toBeNull()
  })

  it('respecte le quota hebdomadaire d’interruptions', () => {
    expect(
      select([nudge('a', 'level_up')], {
        nudgesShownThisWeek: NUDGE_RULES.MAX_PER_WEEK,
      }),
    ).toBeNull()
  })

  it('affiche encore sous le quota', () => {
    expect(
      select([nudge('a', 'level_up')], {
        nudgesShownThisWeek: NUDGE_RULES.MAX_PER_WEEK - 1,
      }),
    ).not.toBeNull()
  })

  it('écarte les nudges expirés', () => {
    const stale = nudge('old', 'level_up', '2026-09-10T12:00:00.000Z')
    expect(select([stale])).toBeNull()
  })

  it('écarte un nudge à date invalide', () => {
    expect(select([nudge('bad', 'level_up', 'pas-une-date')])).toBeNull()
  })
})

describe('selectNudge — priorité', () => {
  it('privilégie l’événement personnel sur l’ambiance du club', () => {
    const picked = select([nudge('pulse', 'club_pulse'), nudge('level', 'level_up')])
    expect(picked?.id).toBe('level')
  })

  it('privilégie le dépassement au classement sur le kudos', () => {
    const picked = select([
      nudge('kudos', 'kudos_received'),
      nudge('overtaken', 'league_overtaken'),
    ])
    expect(picked?.id).toBe('overtaken')
  })

  it('retient le plus récent à priorité égale', () => {
    const picked = select([
      nudge('vieux', 'club_pulse', '2026-09-15T12:00:00.000Z'),
      nudge('recent', 'club_pulse', '2026-09-16T11:30:00.000Z'),
    ])
    expect(picked?.id).toBe('recent')
  })

  it('ne renvoie qu’un seul nudge', () => {
    const picked = select([
      nudge('a', 'level_up'),
      nudge('b', 'league_promotion'),
      nudge('c', 'club_pulse'),
    ])
    expect(picked).not.toBeNull()
    expect(picked?.id).toBe('a')
  })

  it('est déterministe à entrée égale', () => {
    const candidates = [nudge('a', 'club_pulse'), nudge('b', 'club_pulse')]
    expect(select(candidates)).toEqual(select(candidates))
  })
})

describe('nudgePresentation', () => {
  it('célèbre en sheet les franchissements de palier', () => {
    expect(nudgePresentation('level_up')).toBe('sheet')
    expect(nudgePresentation('league_promotion')).toBe('sheet')
  })

  it('garde un toast discret pour le reste', () => {
    for (const kind of ['club_pulse', 'kudos_received', 'peer_emulation'] as const) {
      expect(nudgePresentation(kind)).toBe('toast')
    }
  })
})
