alter table public.notification_delivery_logs
  add column if not exists attempt_count integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists provider_status_code integer;

create index if not exists notification_delivery_logs_dispatch_idx
  on public.notification_delivery_logs(status, scheduled_for, created_at);

alter table public.notification_delivery_logs
  drop constraint if exists notification_delivery_logs_status_check;

alter table public.notification_delivery_logs
  add constraint notification_delivery_logs_status_check
  check (status in ('queued', 'processing', 'sent', 'failed', 'skipped', 'expired'));
