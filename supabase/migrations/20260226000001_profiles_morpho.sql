-- Ajout taille et poids sur la table profiles
alter table public.profiles
  add column if not exists height_cm integer,
  add column if not exists weight_kg numeric(5, 1);
