-- Migration: health consent lifecycle metadata for U18 compliance

alter table public.profiles
  add column if not exists health_consent_status text check (health_consent_status in ('unknown', 'granted', 'revoked', 'not_required')),
  add column if not exists health_consent_granted_at timestamptz,
  add column if not exists health_consent_revoked_at timestamptz,
  add column if not exists health_consent_source text check (health_consent_source in ('onboarding', 'profile', 'support', 'system')),
  add column if not exists health_consent_audit_trail jsonb,
  add column if not exists health_data_retention_state text check (health_data_retention_state in ('active', 'pending_purge', 'purged'));

