-- training_baseline_set_at : timestamp d'activation du baseline.
-- Permet l'auto-bascule du mode 'restart' (rampe de reprise) après 14 jours.
-- Voir src/services/annualPlanning/buildAthletePlanningInputs.ts (resolveFatigueLevel).

alter table public.profiles
  add column if not exists training_baseline_set_at timestamptz;

comment on column public.profiles.training_baseline_set_at is
  'Timestamp d''activation du training_baseline. Sert à expirer auto le mode ''restart'' après 14 jours (rampe -40-50% volume W1-W2 puis retour normal).';
