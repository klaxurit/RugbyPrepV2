-- Ajout colonne onboarding_complete sur la table profiles
-- Permet de tracker l'onboarding côté serveur (multi-device)
alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false;
