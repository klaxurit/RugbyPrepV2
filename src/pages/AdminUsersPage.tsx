import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LayoutGrid, Search, Shield } from 'lucide-react'
import { adminListUsers, type AdminUserListPage } from '../services/admin/adminApi'
import { AdminUserCard } from '../components/admin/AdminUserCard'

const PAGE_SIZE = 20

export function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AdminUserListPage | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminListUsers({ page, pageSize: PAGE_SIZE, search: search || undefined })
      setData(result)
    } catch (e) {
      setData(null)
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1
  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const rangeEnd = data ? Math.min(data.page * data.pageSize, data.total) : 0

  const runSearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <div className="min-h-screen bg-app text-fg pb-28">
      <header className="sticky top-0 z-40 border-b border-brand-border bg-app/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link to="/admin" className="-ml-2 p-2 text-fg-muted hover:text-fg" aria-label="Retour admin">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <LayoutGrid className="h-5 w-5 text-brand-tint" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold">Utilisateurs</h1>
            {data?.weekStart && data.weekEnd && (
              <p className="text-xs text-fg-muted">
                Séances sem. {data.weekStart} → {data.weekEnd}
              </p>
            )}
          </div>
          <Shield className="h-4 w-4 text-fg-muted" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <section className="rounded-2xl border border-brand-border bg-layer-5 p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="Nom, email, club…"
                className="w-full rounded-xl border border-brand-border bg-layer-10 py-2.5 pl-9 pr-3 text-sm text-fg"
              />
            </div>
            <button
              type="button"
              onClick={runSearch}
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white"
            >
              Filtrer
            </button>
          </div>
          {data && (
            <p className="mb-0 mt-3 text-xs text-fg-muted">
              {data.total} compte{data.total > 1 ? 's' : ''} · triés Pro → actifs cette semaine → autres
            </p>
          )}
        </section>

        {error && (
          <div className="rounded-xl border border-danger-bd bg-danger-bg px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        )}

        {!loading && data && data.users.length === 0 && (
          <div className="rounded-2xl border border-brand-border bg-layer-5 p-10 text-center text-sm text-fg-muted">
            Aucun utilisateur trouvé.
          </div>
        )}

        {!loading && data && data.users.length > 0 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.users.map((user) => (
                <AdminUserCard key={user.userId} user={user} />
              ))}
            </div>

            <nav
              className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-brand-border bg-layer-5 px-4 py-3 sm:flex-row"
              aria-label="Pagination"
            >
              <p className="m-0 text-sm text-fg-muted">
                {rangeStart}–{rangeEnd} sur {data.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-brand-border px-3 py-2 text-sm font-medium disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </button>
                <span className="min-w-[5rem] text-center text-sm font-semibold text-fg">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-brand-border px-3 py-2 text-sm font-medium disabled:opacity-40"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </nav>
          </>
        )}
      </main>
    </div>
  )
}
