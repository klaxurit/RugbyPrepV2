import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Shield, Search, Crown, Users, Anchor, ChevronLeft, LayoutGrid } from 'lucide-react'
import {
  adminGetUser,
  adminGrantPremium,
  adminRevokePremium,
  adminSearchUser,
  adminUpdateProfile,
  adminUpsertAthleteMembership,
  adminUpsertStaffMembership,
  adminBackfillAthleteMemberships,
  type AdminUserDetail,
} from '../services/admin/adminApi'
import { STAFF_MEMBERSHIP_ROLES, type StaffMembershipRole } from '../services/staffPlanning/staffMembershipAdmin'
import {
  ADMIN_PLANNING_ANCHOR_PRESETS,
  findAdminPlanningPreset,
  mergeAdminPlanningPreset,
} from '../config/adminPlanningAnchors'
import { buildPlanningAnchorsPatch } from '../services/admin/buildPlanningAnchorsPatch'
import { StaffAthleteAvatar } from '../components/staffPlanning/StaffAthleteAvatar'

const SEASON_MODES = ['in_season', 'off_season', 'pre_season', 'playoffs'] as const
const CYCLE_HINTS = ['off_season', 'pre_season', 'in_season', 'playoffs'] as const

type AnchorForm = {
  seasonEndedAt: string
  offSeasonStartAt: string
  returnToTeamTrainingAt: string
  onboardingCycleHint: string
  manualCycleOverride: string
  manualOffSeasonWeekOverride: string
  manualPreSeasonWeekOverride: string
  seasonEndedSource: string
  skipOffSeasonRecoveryIntro: boolean
  manualPlayoffs: boolean
}

function anchorsToForm(anchors: Record<string, unknown> | null | undefined): AnchorForm {
  const a = anchors ?? {}
  return {
    seasonEndedAt: String(a.seasonEndedAt ?? ''),
    offSeasonStartAt: String(a.offSeasonStartAt ?? ''),
    returnToTeamTrainingAt: String(a.returnToTeamTrainingAt ?? ''),
    onboardingCycleHint: String(a.onboardingCycleHint ?? ''),
    manualCycleOverride: String(a.manualCycleOverride ?? ''),
    manualOffSeasonWeekOverride:
      a.manualOffSeasonWeekOverride != null ? String(a.manualOffSeasonWeekOverride) : '',
    manualPreSeasonWeekOverride:
      a.manualPreSeasonWeekOverride != null ? String(a.manualPreSeasonWeekOverride) : '',
    seasonEndedSource: String(a.seasonEndedSource ?? ''),
    skipOffSeasonRecoveryIntro: Boolean(a.skipOffSeasonRecoveryIntro),
    manualPlayoffs: Boolean(a.manualPlayoffs),
  }
}

function syncAnchorsJsonFromForm(form: AnchorForm, currentJson: string): string {
  return JSON.stringify(buildPlanningAnchorsPatch(form, currentJson), null, 2)
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-fg-muted uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}

export function AdminPage() {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<AdminUserDetail | null>(null)

  const [seasonMode, setSeasonMode] = useState('')
  const [weeklySessions, setWeeklySessions] = useState('3')
  const [anchorForm, setAnchorForm] = useState<AnchorForm>(anchorsToForm(null))
  const [anchorsJson, setAnchorsJson] = useState('{}')
  const [anchorPresetId, setAnchorPresetId] = useState('')

  const [staffClubId, setStaffClubId] = useState('')
  const [staffSquadId, setStaffSquadId] = useState('')
  const [staffRole, setStaffRole] = useState<StaffMembershipRole>('head_coach')

  const [athleteClubId, setAthleteClubId] = useState('')

  const hydrateForms = useCallback((detail: AdminUserDetail) => {
    setSeasonMode(detail.profile?.season_mode ?? '')
    setWeeklySessions(String(detail.profile?.weekly_sessions ?? 3))
    const anchors = detail.profile?.planning_anchors ?? null
    setAnchorForm(anchorsToForm(anchors))
    setAnchorsJson(JSON.stringify(anchors ?? {}, null, 2))
    setStaffClubId(detail.profile?.club_code ?? '')
    setAthleteClubId(detail.profile?.club_code ?? '')
    setAnchorPresetId('')
  }, [])

  useEffect(() => {
    const q = searchParams.get('q')?.trim()
    if (!q) return
    setSearchQuery(q)
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const found = await adminSearchUser(q)
        const detail = await adminGetUser(found.userId)
        setUser(detail)
        hydrateForms(detail)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur')
      } finally {
        setLoading(false)
      }
    })()
  }, [searchParams, hydrateForms])

  const applyAnchorPreset = useCallback(
    (presetId: string) => {
      setAnchorPresetId(presetId)
      const preset = findAdminPlanningPreset(presetId)
      if (!preset) return
      const existing = (user?.profile?.planning_anchors ?? {}) as Record<string, unknown>
      const merged = mergeAdminPlanningPreset(existing, preset)
      setAnchorForm(anchorsToForm(merged))
      setAnchorsJson(JSON.stringify(merged, null, 2))
      if (preset.seasonMode) setSeasonMode(preset.seasonMode)
    },
    [user?.profile?.planning_anchors]
  )

  const updateAnchorForm = useCallback((patch: Partial<AnchorForm>) => {
    setAnchorForm((prev) => {
      const next = { ...prev, ...patch }
      setAnchorsJson((json) => syncAnchorsJsonFromForm(next, json))
      return next
    })
  }, [])

  const runAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      await fn()
      setMessage(successMsg)
      if (user) {
        const refreshed = await adminGetUser(user.userId)
        setUser(refreshed)
        hydrateForms(refreshed)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    const q = searchQuery.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const found = await adminSearchUser(q)
      const detail = await adminGetUser(found.userId)
      setUser(detail)
      hydrateForms(detail)
      setMessage(`Utilisateur trouvé : ${detail.email ?? detail.userId}`)
    } catch (e) {
      setUser(null)
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const hasPremium = (user?.premiumEntitlements.length ?? 0) > 0
  const activeStaff = user?.staffMemberships.filter((m) => m.status === 'active') ?? []

  return (
    <div className="min-h-screen bg-app text-fg pb-28">
      <header className="sticky top-0 z-40 bg-app/95 backdrop-blur border-b border-brand-border px-4 py-3 flex items-center gap-3">
        <Link to="/profile" className="p-2 -ml-2 text-fg-muted hover:text-fg">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <Shield className="w-5 h-5 text-brand-tint" />
        <h1 className="text-lg font-bold">Admin</h1>
        <Link
          to="/admin/users"
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-brand-border bg-layer-5 px-3 py-1.5 text-xs font-semibold text-fg hover:bg-layer-10"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Tous les joueurs
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <section className="rounded-2xl border border-brand-border bg-layer-5 p-4 space-y-3">
          <h2 className="font-bold text-sm">Maintenance</h2>
          <p className="text-xs text-fg-muted">
            Crée les adhésions joueur pour tous les profils avec un code club FFR (requis pour l&apos;onglet Coach).
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              void (async () => {
                setLoading(true)
                setError(null)
                try {
                  const r = await adminBackfillAthleteMemberships()
                  setMessage(`Backfill : ${r.synced} profil(s) synchronisé(s)`)
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Erreur')
                } finally {
                  setLoading(false)
                }
              })()
            }}
            className="w-full rounded-xl border border-brand-border py-3 font-bold disabled:opacity-50"
          >
            Backfill clubs
          </button>
        </section>

        <section className="rounded-2xl border border-brand-border bg-layer-5 p-4 space-y-3">
          <h2 className="font-bold flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-tint" />
            Rechercher un utilisateur
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
              placeholder="Email ou UUID"
              className="flex-1 rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleSearch()}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              OK
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-danger-bd bg-danger-bg px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-green-600/30 bg-green-50 px-4 py-3 text-sm text-green-900">
            {message}
          </div>
        )}

        {user && (
          <>
            <section className="rounded-2xl border border-brand-border bg-layer-5 p-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <StaffAthleteAvatar
                  name={user.profile?.display_name?.trim() || user.email || user.userId}
                  avatarUrl={user.profile?.avatar_url}
                  size="lg"
                  theme="app"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-base truncate">
                    {user.profile?.display_name?.trim() || user.email || '—'}
                  </p>
                  <p className="font-mono text-xs text-fg-muted break-all">{user.userId}</p>
                  {user.email && user.profile?.display_name?.trim() && (
                    <p className="text-xs text-fg-muted truncate">{user.email}</p>
                  )}
                </div>
              </div>
              <p>
                Club : {user.profile?.club_name ?? '—'} ({user.profile?.club_code ?? '—'})
              </p>
              <p>
                Mode : {user.profile?.season_mode ?? '—'} · {user.profile?.weekly_sessions ?? '—'} séances/sem.
              </p>
              <p>Premium : {hasPremium ? 'Oui' : 'Non'}</p>
              {activeStaff.length > 0 && (
                <p>Coach : {activeStaff.map((m) => `${m.role} @ ${m.club_id}`).join(', ')}</p>
              )}
            </section>

            <section className="rounded-2xl border border-brand-border bg-layer-5 p-4 space-y-4">
              <h2 className="font-bold flex items-center gap-2">
                <Anchor className="w-4 h-4 text-brand-tint" />
                Profil & ancres
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Field label="season_mode">
                  <select
                    value={seasonMode}
                    onChange={(e) => setSeasonMode(e.target.value)}
                    className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
                  >
                    <option value="">—</option>
                    {SEASON_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="weekly_sessions">
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={weeklySessions}
                    onChange={(e) => setWeeklySessions(e.target.value)}
                    className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
                  />
                </Field>
              </div>

              <Field label="Ancre programme (preset)">
                <select
                  value={anchorPresetId}
                  onChange={(e) => applyAnchorPreset(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
                >
                  <option value="">— Choisir une ancre —</option>
                  {ADMIN_PLANNING_ANCHOR_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="manualCycleOverride">
                  <select
                    value={anchorForm.manualCycleOverride}
                    onChange={(e) => updateAnchorForm({ manualCycleOverride: e.target.value })}
                    className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
                  >
                    <option value="">—</option>
                    {SEASON_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="offSeason week (S1–S10)">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={anchorForm.manualOffSeasonWeekOverride}
                    onChange={(e) => updateAnchorForm({ manualOffSeasonWeekOverride: e.target.value })}
                    placeholder="ex. 3 = Transition"
                    className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
                  />
                </Field>
                <Field label="preSeason week (S1–S12)">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={anchorForm.manualPreSeasonWeekOverride}
                    onChange={(e) => updateAnchorForm({ manualPreSeasonWeekOverride: e.target.value })}
                    className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
                  />
                </Field>
              </div>

              <div className="grid gap-3">
                <Field label="seasonEndedAt (ISO date)">
                  <input
                    type="date"
                    value={anchorForm.seasonEndedAt.slice(0, 10)}
                    onChange={(e) =>
                      updateAnchorForm({
                        seasonEndedAt: e.target.value ? `${e.target.value}T12:00:00.000Z` : '',
                      })
                    }
                    className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
                  />
                </Field>
                <Field label="onboardingCycleHint">
                  <select
                    value={anchorForm.onboardingCycleHint}
                    onChange={(e) => updateAnchorForm({ onboardingCycleHint: e.target.value })}
                    className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
                  >
                    <option value="">—</option>
                    {CYCLE_HINTS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={anchorForm.skipOffSeasonRecoveryIntro}
                    onChange={(e) => updateAnchorForm({ skipOffSeasonRecoveryIntro: e.target.checked })}
                  />
                  skipOffSeasonRecoveryIntro
                </label>
                <Field label="JSON brut (lecture seule — sync auto depuis le formulaire)">
                  <textarea
                    value={anchorsJson}
                    readOnly
                    rows={4}
                    className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-xs font-mono text-fg opacity-90"
                  />
                </Field>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void runAction(async () => {
                    const planningAnchors = buildPlanningAnchorsPatch(anchorForm, anchorsJson)
                    await adminUpdateProfile({
                      userId: user.userId,
                      seasonMode: seasonMode || undefined,
                      weeklySessions: Number(weeklySessions),
                      planningAnchors,
                      mergePlanningAnchors: true,
                    })
                    setAnchorsJson(JSON.stringify(planningAnchors, null, 2))
                  }, 'Profil mis à jour')
                }
                className="w-full rounded-xl bg-brand py-3 font-bold text-white disabled:opacity-50"
              >
                Enregistrer profil & ancres
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void runAction(async () => {
                    await adminUpdateProfile({
                      userId: user.userId,
                      planningAnchors: null,
                      mergePlanningAnchors: false,
                    })
                  }, 'Ancres effacées')
                }
                className="w-full rounded-xl border border-danger-bd py-2 text-sm text-danger disabled:opacity-50"
              >
                Réinitialiser planning_anchors
              </button>
            </section>

            <section className="rounded-2xl border border-brand-border bg-layer-5 p-4 space-y-3">
              <h2 className="font-bold flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                Premium
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading || hasPremium}
                  onClick={() =>
                    void runAction(
                      () => adminGrantPremium(user.userId),
                      'Premium accordé'
                    )
                  }
                  className="flex-1 rounded-xl bg-amber-600 py-3 font-bold text-white disabled:opacity-50"
                >
                  Accorder premium
                </button>
                <button
                  type="button"
                  disabled={loading || !hasPremium}
                  onClick={() =>
                    void runAction(
                      () => adminRevokePremium(user.userId),
                      'Premium révoqué'
                    )
                  }
                  className="flex-1 rounded-xl border border-brand-border py-3 font-bold disabled:opacity-50"
                >
                  Révoquer
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-brand-border bg-layer-5 p-4 space-y-3">
              <h2 className="font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-tint" />
                Rôle Coach (staff club)
              </h2>
              <p className="text-xs text-fg-muted">
                Le coach voit les joueurs liés au même <span className="font-mono">club_id</span> (code FFR exact du profil, ex. pas « DUC » mais le code numérique).
              </p>
              <Field label="club_id">
                <input
                  value={staffClubId}
                  onChange={(e) => setStaffClubId(e.target.value)}
                  placeholder="ex. code FFR / identifiant club"
                  className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
                />
              </Field>
              <Field label="squad_id (optionnel)">
                <input
                  value={staffSquadId}
                  onChange={(e) => setStaffSquadId(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
                />
              </Field>
              <Field label="role">
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as StaffMembershipRole)}
                  className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
                >
                  {STAFF_MEMBERSHIP_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <button
                type="button"
                disabled={loading || !staffClubId.trim()}
                onClick={() =>
                  void runAction(
                    () =>
                      adminUpsertStaffMembership({
                        staffUserId: user.userId,
                        clubId: staffClubId.trim(),
                        squadId: staffSquadId.trim() || undefined,
                        role: staffRole,
                        status: 'active',
                      }),
                    'Membership coach enregistrée'
                  )
                }
                className="w-full rounded-xl bg-brand py-3 font-bold text-white disabled:opacity-50"
              >
                Activer mode Coach
              </button>
              <button
                type="button"
                disabled={loading || !staffClubId.trim()}
                onClick={() =>
                  void runAction(
                    () =>
                      adminUpsertStaffMembership({
                        staffUserId: user.userId,
                        clubId: staffClubId.trim(),
                        squadId: staffSquadId.trim() || undefined,
                        role: staffRole,
                        status: 'inactive',
                      }),
                    'Membership coach désactivée'
                  )
                }
                className="w-full rounded-xl border border-brand-border py-2 text-sm disabled:opacity-50"
              >
                Désactiver Coach
              </button>
            </section>

            <section className="rounded-2xl border border-brand-border bg-layer-5 p-4 space-y-3">
              <h2 className="font-bold text-sm">Lier joueur au club (athlete membership)</h2>
              <p className="text-xs text-fg-muted">
                Nécessaire pour que le coach voie ce joueur dans son effectif.
              </p>
              <Field label="club_id">
                <input
                  value={athleteClubId}
                  onChange={(e) => setAthleteClubId(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg"
                />
              </Field>
              <button
                type="button"
                disabled={loading || !athleteClubId.trim()}
                onClick={() =>
                  void runAction(
                    () =>
                      adminUpsertAthleteMembership({
                        athleteUserId: user.userId,
                        clubId: athleteClubId.trim(),
                        status: 'active',
                      }),
                    'Joueur lié au club'
                  )
                }
                className="w-full rounded-xl bg-layer-10 border border-brand-border py-3 font-bold disabled:opacity-50"
              >
                Lier au club
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
