-- Refill mid-week des ligues : le cron du lundi crée les cohortes ; un passage
-- quotidien ré-applique assign-league-cohorts pour y coller les opt-in tardifs
-- (social_visibility = cohort) et fusionner les ligues solo.
--
-- Idempotent : déprogramme la variante existante avant de recréer. No-op si
-- pg_cron n'est pas installé (db reset local).

do $cron_setup$
declare
  existing_jobid bigint;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron not installed; skipping league refill schedule.';
    return;
  end if;

  for existing_jobid in
    select jobid from cron.job
    where jobname = 'gamification-league-cohorts-refill-daily'
  loop
    perform cron.unschedule(existing_jobid);
  end loop;

  perform cron.schedule(
    'gamification-league-cohorts-refill-daily',
    '20 12 * * *',
    $cmd$
    select net.http_post(
      url := 'https://iplrydnzbevicilulmsy.supabase.co/functions/v1/assign-league-cohorts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret' limit 1)
      ),
      body := '{}'::jsonb
    );
    $cmd$
  );
end;
$cron_setup$;
