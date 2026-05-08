-- WS9 Décision #50 — Medical disclaimer hard gate at signup
--
-- Adds a timestamp column persisted at signup when the user ticks the
-- separate medical disclaimer checkbox (form-blocking). The column being
-- non-null is the audit trail that consent was given.
--
-- The application sets this value on profile insert/update right after
-- auth.signUp success. RLS policy "Users manage own profile" already covers
-- write access (auth.uid() = id).

alter table public.profiles
  add column if not exists medical_consent_accepted_at timestamptz;

comment on column public.profiles.medical_consent_accepted_at is
  'WS9 — timestamp the user ticked the medical disclaimer checkbox at signup. NULL = never accepted (legacy or pre-WS9 accounts).';
