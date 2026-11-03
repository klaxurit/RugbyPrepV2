import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ChevronLeft, ExternalLink, RefreshCw, Shield } from 'lucide-react'
import { adminFetchProductInsights } from '../services/admin/adminApi'
import {
  funnelRateCards,
  interpretProductInsights,
  type ProductInsightFinding,
  type ProductInsightsPayload,
} from '../services/admin/interpretProductInsights'

const POSTHOG_PROJECT_URL = 'https://eu.posthog.com/project/325661'

function severityClass(severity: ProductInsightFinding['severity']): string {
  if (severity === 'critical') return 'border-warn/40 bg-warn/10 text-warn'
  if (severity === 'watch') return 'border-brand-border bg-brand-soft/40 text-fg'
  return 'border-ok/30 bg-ok/10 text-ok'
}

function BreakdownTable({
  title,
  rows,
}: {
  title: string
  rows: Array<{ key: string; value: number }>
}) {
  if (rows.length === 0) return null
  return (
    <section className="rounded-2xl border border-brand-border bg-layer-5 p-4">
      <h3 className="text-sm font-bold text-fg">{title}</h3>
      <ul className="mt-3 space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between text-[13px] tabular-nums"
          >
            <span className="truncate text-fg/80">{row.key}</span>
            <span className="font-bold text-fg">{row.value}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function toRows(map: Record<string, number>): Array<{ key: string; value: number }> {
  return Object.entries(map)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value)
}

export function AdminInsightsPage() {
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ProductInsightsPayload | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await adminFetchProductInsights(days)
      setData(payload)
    } catch (e) {
      setData(null)
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    void load()
  }, [load])

  const findings = useMemo(
    () => (data ? interpretProductInsights(data) : []),
    [data],
  )
  const cards = useMemo(
    () => (data ? funnelRateCards(data.funnel) : []),
    [data],
  )

  return (
    <div className="min-h-screen bg-app text-fg pb-28">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-brand-border bg-app/95 px-4 py-3 backdrop-blur">
        <Link to="/admin" className="-ml-2 p-2 text-fg-muted hover:text-fg" aria-label="Retour admin">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <Activity className="h-5 w-5 text-brand-tint" />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold">Insights produit</h1>
          <p className="text-[11px] text-fg-muted">
            Funnel first-party · friction onboarding / séances
          </p>
        </div>
        <Shield className="h-4 w-4 text-fg-muted" />
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand-border bg-layer-5 p-3">
          {[14, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                days === d
                  ? 'bg-brand text-on-brand'
                  : 'border border-brand-border bg-layer-10 text-fg'
              }`}
            >
              {d} j
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-brand-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
          <a
            href={POSTHOG_PROJECT_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-brand-border px-3 py-1.5 text-xs font-semibold text-fg"
          >
            PostHog
            <ExternalLink className="h-3 w-3" />
          </a>
        </section>

        {error && (
          <p className="rounded-2xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
            {error}
          </p>
        )}

        {loading && !data ? (
          <p className="text-sm text-fg-muted">Chargement des agrégats…</p>
        ) : data ? (
          <>
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-brand-border bg-layer-5 px-3 py-3"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-fg/45">
                    {card.label}
                  </p>
                  <p className="mt-1 text-[18px] font-black tabular-nums text-fg">
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-fg/55">{card.hint}</p>
                </div>
              ))}
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black text-fg">Lectures friction</h2>
              <p className="text-[12px] leading-relaxed text-fg-muted">
                Hypothèses produit à partir des logs / profils — pas un diagnostic
                individuel. Croiser avec replays PostHog si le signal est critique.
              </p>
              {findings.map((finding) => (
                <article
                  key={finding.id}
                  data-testid="insight-finding"
                  data-severity={finding.severity}
                  className={`rounded-2xl border px-4 py-3 ${severityClass(finding.severity)}`}
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] opacity-70">
                    {finding.area} · {finding.severity}
                  </p>
                  <h3 className="mt-1 text-[14px] font-black">{finding.title}</h3>
                  <p className="mt-1 text-[12px] leading-relaxed opacity-90">
                    {finding.detail}
                  </p>
                </article>
              ))}
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <BreakdownTable
                title="Matos (onboardés)"
                rows={toRows(data.breakdowns.equipmentOnboarded)}
              />
              <BreakdownTable
                title="Matos (activés ≥1 séance)"
                rows={toRows(data.breakdowns.equipmentActivated)}
              />
              <BreakdownTable
                title="Niveau (onboardés)"
                rows={toRows(data.breakdowns.trainingLevelOnboarded)}
              />
              <BreakdownTable
                title="Niveau (activés)"
                rows={toRows(data.breakdowns.trainingLevelActivated)}
              />
              <BreakdownTable
                title="Cible séances / sem."
                rows={toRows(data.breakdowns.weeklySessionsTarget)}
              />
              <BreakdownTable
                title="Types de séances (fenêtre)"
                rows={toRows(data.breakdowns.sessionTypesWindow)}
              />
            </div>

            <p className="text-[11px] text-fg-muted">
              Généré {new Date(data.generatedAt).toLocaleString('fr-FR')} · fenêtre{' '}
              {data.windowDays} j
            </p>
          </>
        ) : null}
      </main>
    </div>
  )
}
