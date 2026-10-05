-- Sync calendrier FFR (+ scores) pour tous les profils club + compétition.
--
-- Créneaux UTC (cible Europe/Paris approximative, pas de DST côté pg_cron) :
--   * dimanche 20:00 UTC  → ~21h CET / 22h CEST (scores du week-end)
--   * lundi    06:00 UTC  → ~7h CET / 8h CEST
--   * lundi    18:00 UTC  → ~19h CET / 20h CEST (lundi soir ~20h)
--
-- Prérequis hors migration (setup opérateur, cf.
-- 20260507000000_schedule_training_reminders_cron.sql) :
--   1. Extensions pg_cron et pg_net activées.
--   2. CRON_SHARED_SECRET sur l'edge + vault `cron_shared_secret`.
--   3. supabase functions deploy ffr-sync-batch
--      (verify_jwt = false via config.toml ; auth x-cron-secret).
--
-- Idempotent : déprogramme les variantes existantes, no-op sans pg_cron.

do $cron_setup$
declare
  existing_jobid bigint;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron not installed; skipping ffr sync schedules.';
    return;
  end if;

  for existing_jobid in
    select jobid from cron.job
    where jobname in (
      'ffr-sync-sunday-evening',
      'ffr-sync-monday-morning',
      'ffr-sync-monday-evening'
    )
  loop
    perform cron.unschedule(existing_jobid);
  end loop;

  perform cron.schedule(
    'ffr-sync-sunday-evening',
    '0 20 * * 0',
    $cmd$
    select net.http_post(
      url := 'https://iplrydnzbevicilulmsy.supabase.co/functions/v1/ffr-sync-batch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret' limit 1)
      ),
      body := jsonb_build_object('trigger', 'sunday_evening')
    );
    $cmd$
  );

  perform cron.schedule(
    'ffr-sync-monday-morning',
    '0 6 * * 1',
    $cmd$
    select net.http_post(
      url := 'https://iplrydnzbevicilulmsy.supabase.co/functions/v1/ffr-sync-batch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret' limit 1)
      ),
      body := jsonb_build_object('trigger', 'monday_morning')
    );
    $cmd$
  );

  perform cron.schedule(
    'ffr-sync-monday-evening',
    '0 18 * * 1',
    $cmd$
    select net.http_post(
      url := 'https://iplrydnzbevicilulmsy.supabase.co/functions/v1/ffr-sync-batch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret' limit 1)
      ),
      body := jsonb_build_object('trigger', 'monday_evening')
    );
    $cmd$
  );
end;
$cron_setup$;
