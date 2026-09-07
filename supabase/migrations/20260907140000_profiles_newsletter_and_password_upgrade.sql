-- Newsletter opt-in + password upgrade flag
--
-- newsletter_opt_in NULL = never asked (existing accounts). true/false = explicit choice
-- at signup, in-app prompt, or profile toggle.
-- password_needs_upgrade: written at password sign-in when the submitted password is
-- below the client policy. New signups write false. Existing rows default false until
-- the next login with a short password.

alter table public.profiles
  add column if not exists newsletter_opt_in boolean,
  add column if not exists newsletter_opted_at timestamptz,
  add column if not exists newsletter_opt_in_source text,
  add column if not exists password_needs_upgrade boolean not null default false;

comment on column public.profiles.newsletter_opt_in is
  'Product/training emails. NULL = never asked (legacy). true/false = explicit choice.';

comment on column public.profiles.newsletter_opted_at is
  'Timestamp of the last newsletter opt-in or opt-out decision.';

comment on column public.profiles.newsletter_opt_in_source is
  'Where the last newsletter choice was made: signup | in_app | profile.';

comment on column public.profiles.password_needs_upgrade is
  'True when the last password sign-in was below the current minimum length.';
