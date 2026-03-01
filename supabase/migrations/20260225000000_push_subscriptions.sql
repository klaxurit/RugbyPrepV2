-- Table pour stocker les abonnements Web Push
-- Identifié par device_id (UUID localStorage, sans auth)

create table if not exists push_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  device_id       text not null,
  endpoint        text not null unique,
  p256dh_key      text not null,
  auth_key        text not null,
  training_days   integer[] not null default '{}',
  -- 0=Dim, 1=Lun, 2=Mar, 3=Mer, 4=Jeu, 5=Ven, 6=Sam
  timezone        text not null default 'Europe/Paris',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index pour les requêtes quotidiennes par jour d'entraînement
create index if not exists push_subscriptions_training_days_idx
  on push_subscriptions using gin (training_days);

-- Mise à jour automatique de updated_at
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger push_subscriptions_updated_at
  before update on push_subscriptions
  for each row execute function update_updated_at_column();

-- RLS : accès libre (pas d'auth), filtrage par endpoint unique
alter table push_subscriptions enable row level security;

create policy "allow_insert_subscription"
  on push_subscriptions for insert with check (true);

create policy "allow_upsert_subscription"
  on push_subscriptions for update using (true) with check (true);

create policy "allow_delete_subscription"
  on push_subscriptions for delete using (true);
