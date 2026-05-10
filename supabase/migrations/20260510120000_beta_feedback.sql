-- WS10 Décision #53 — beta feedback table
--
-- Capture des retours utilisateurs pendant la phase finale bêta (20-50 testeurs)
-- + après ouverture publique. RLS : un utilisateur ne peut qu'INSERT son propre
-- feedback. La lecture / triage est réservé au service_role (admin).
--
-- Pas de SELECT policy pour les utilisateurs : ils ne voient pas leurs propres
-- feedbacks dans l'app (intentionnel, simplicité). Si besoin d'historique côté
-- user, ajouter une policy plus tard.

create table public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  kind text check (kind in ('bug', 'feature', 'usability', 'other')) not null,
  message text not null check (length(message) between 5 and 4000),
  app_version text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.beta_feedback enable row level security;

create policy "Users insert own feedback"
  on public.beta_feedback for insert
  with check (auth.uid() = user_id);

create index beta_feedback_created_at_idx on public.beta_feedback(created_at desc);
create index beta_feedback_user_id_idx on public.beta_feedback(user_id);

comment on table public.beta_feedback is
  'Feedback bêta + post-launch. Lecture admin via service_role. Un user ne voit pas ses propres feedbacks dans l''app.';
