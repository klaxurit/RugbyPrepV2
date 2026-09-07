import type { AdminCycleDiagnostic } from '../../services/admin/buildAdminCycleDiagnostic'

function FlagList({ flags }: { flags: AdminCycleDiagnostic['flags'] }) {
  if (flags.length === 0) return null
  return (
    <ul className="space-y-2">
      {flags.map((f) => (
        <li
          key={f.code}
          className={
            f.severity === 'danger'
              ? 'rounded-xl border border-danger-bd bg-danger-bg px-3 py-2 text-sm text-danger'
              : f.severity === 'warn'
                ? 'rounded-xl border border-amber-600/30 bg-amber-50 px-3 py-2 text-sm text-amber-950'
                : 'rounded-xl border border-brand-border bg-layer-10 px-3 py-2 text-sm text-fg-muted'
          }
        >
          {f.message}
        </li>
      ))}
    </ul>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-fg-muted shrink-0">{label}</span>
      <span className="font-semibold text-right text-fg">{value}</span>
    </div>
  )
}

export function AdminCycleDiagnosticCard({
  diagnostic,
  onAlignSeasonMode,
  alignDisabled,
}: {
  diagnostic: AdminCycleDiagnostic
  onAlignSeasonMode?: () => void
  alignDisabled?: boolean
}) {
  return (
    <section className="rounded-2xl border border-brand-border bg-layer-5 p-4 space-y-4">
      <div>
        <h2 className="font-bold text-sm">Où en est le programme ?</h2>
        <p className="text-xs text-fg-muted mt-1">
          Même moteur que /week. Si cette carte dit pré-saison et que /week dit en saison, un vieux match
          fait encore office de J1 — voir les flags.
        </p>
      </div>

      {!diagnostic.ok && (
        <p className="text-sm text-danger">{diagnostic.error ?? 'Diagnostic indisponible'}</p>
      )}

      {diagnostic.ok && (
        <>
          <div className="rounded-xl bg-layer-10 border border-brand-border px-3 py-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-fg-muted font-semibold">Cycle live</p>
            <p className="text-xl font-black text-fg">{diagnostic.liveCycleLabel}</p>
            <p className="text-sm text-fg">{diagnostic.weekLabel}</p>
            {(diagnostic.isDeloadWeek || diagnostic.isMatchWeek) && (
              <p className="text-xs font-semibold text-brand-tint pt-1">
                {[
                  diagnostic.isMatchWeek ? 'Semaine de match' : null,
                  diagnostic.isDeloadWeek ? 'Décharge' : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <MetaRow label="Pourquoi" value={diagnostic.resolutionModeLabel} />
            <p className="text-xs text-fg-muted leading-relaxed">{diagnostic.why}</p>
          </div>

          <div className="space-y-2 border-t border-brand-border pt-3">
            <MetaRow
              label="1er match (moteur)"
              value={
                diagnostic.firstMatchDate
                  ? `${diagnostic.firstMatchDate}${
                      diagnostic.firstMatchOpponent ? ` · ${diagnostic.firstMatchOpponent}` : ''
                    }`
                  : 'aucun'
              }
            />
            <MetaRow
              label="Prochain match"
              value={
                diagnostic.nextMatchDate
                  ? `${diagnostic.nextMatchDate}${
                      diagnostic.daysUntilNextMatch != null
                        ? ` (J-${diagnostic.daysUntilNextMatch})`
                        : ''
                    }`
                  : '—'
              }
            />
            <MetaRow
              label="season_mode stocké"
              value={diagnostic.storedSeasonMode ?? '—'}
            />
          </div>

          <FlagList flags={diagnostic.flags} />

          {diagnostic.engineWarnings.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-fg-muted uppercase">Warnings moteur</p>
              <ul className="text-xs text-fg-muted list-disc pl-4 space-y-1">
                {diagnostic.engineWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {diagnostic.anchorsSummary.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-fg-muted uppercase">Ancres actives</p>
              <ul className="text-xs font-mono text-fg space-y-0.5">
                {diagnostic.anchorsSummary.map((a) => (
                  <li key={a.key}>
                    {a.key} = {a.value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {diagnostic.rulesApplied.length > 0 && (
            <details className="text-xs text-fg-muted">
              <summary className="cursor-pointer font-semibold">Règles appliquées ({diagnostic.rulesApplied.length})</summary>
              <ul className="mt-2 font-mono space-y-0.5 pl-1">
                {diagnostic.rulesApplied.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </details>
          )}

          {diagnostic.storedSeasonModeMismatch && onAlignSeasonMode && (
            <button
              type="button"
              disabled={alignDisabled}
              onClick={onAlignSeasonMode}
              className="w-full rounded-xl border border-brand-border bg-layer-10 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              Aligner season_mode → {diagnostic.liveCycle}
            </button>
          )}
        </>
      )}
    </section>
  )
}
