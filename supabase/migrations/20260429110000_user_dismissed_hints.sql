-- user_dismissed_hints : journal des hints/coaching messages dismissés.
-- Une ligne par (utilisateur × hint_id). L'upsert remplace le dismissed_at
-- et le context_hash, ce qui permet de re-déclencher un hint quand son
-- contexte change réellement (ex : nouvelle phase de programme).

create table public.user_dismissed_hints (
  user_id uuid references auth.users(id) on delete cascade not null,
  hint_id text not null,
  dismissed_at timestamptz default now() not null,
  context_hash text,
  primary key (user_id, hint_id)
);

alter table public.user_dismissed_hints enable row level security;

create policy "Users manage own dismissed hints"
  on public.user_dismissed_hints for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.user_dismissed_hints is
  'Journal des coaching hints dismissés. TTL et expiration après N séances gérés côté hook useHintVisibility.';
comment on column public.user_dismissed_hints.context_hash is
  'Hash du contenu du hint au moment du dismiss. Si le contexte change (nouvel id de phase, nouvelles données), le hint réapparaît.';
