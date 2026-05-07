-- Decision #47 phase E: drop profiles.rehab_injury column
--
-- The rehab feature was removed in phase D (medical content out of V1
-- scope). All read/write paths in the app are gone:
--   - hooks/useProfile.ts no longer reads/writes rehab_injury
--   - services/staffPlanning/staffPlanningSupabaseMappers.ts idem
--   - services/privacy/healthConsentLifecycle.ts no longer scrubs it
--   - types/training.ts UserProfile.rehabInjury removed
--
-- Inverts: 20260304000000_profiles_rehab_injury.sql
-- Safe: column was JSONB nullable with default null, no FK, no index.

alter table public.profiles
  drop column if exists rehab_injury;
