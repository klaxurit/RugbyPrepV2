-- training_baseline : état de forme déclaré à l'onboarding.
-- restart | active | peak — module la rampe de reprise dans detectAnnualPlanningContext.
-- Source KB : src/knowledge/population-specific.md §3 (Return After Long Break).

alter table public.profiles
  add column if not exists training_baseline text
    check (training_baseline in ('restart', 'active', 'peak'));

comment on column public.profiles.training_baseline is
  'Fitness baseline at onboarding (restart|active|peak). Drives deload/ramp-up override in annual planning engine.';
