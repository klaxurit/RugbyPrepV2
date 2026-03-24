-- Convergence legacy / mother-session : colonnes d'identité programme sur session_logs
-- Migration additive et backward-compatible (toutes colonnes nullable, défaut vide).

alter table public.session_logs
  add column if not exists program_source text null,
  add column if not exists legacy_recipe_id text null,
  add column if not exists mother_session_id text null,
  add column if not exists session_label text null,
  add column if not exists program_context jsonb not null default '{}'::jsonb;

-- Contrainte sur program_source : valeurs autorisées
alter table public.session_logs
  add constraint session_logs_program_source_check
  check (program_source is null or program_source in ('legacy', 'mother_session'));
