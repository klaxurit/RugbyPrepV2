-- Planification des crons de gamification.
--
--   * assign-league-cohorts : lundi 03:10 UTC. Clôture la semaine écoulée
--     (rangs, promotions, relégations) puis constitue les cohortes de la
--     semaine qui commence. La remise à zéro hebdomadaire est ce qui
--     entretient la compétition — un classement perpétuel se figerait.
--   * dispatch-social-nudges : chaque jour à 17:10 UTC, avant le créneau où
--     les joueurs amateurs s'entraînent en soirée. La fonction applique
--     elle-même le quota hebdomadaire par athlète.
--
-- Prérequis hors migration (setup opérateur, cf.
-- 20260507000000_schedule_training_reminders_cron.sql) :
--   1. Extensions pg_cron et pg_net activées.
--   2. supabase secrets set CRON_SHARED_SECRET=<valeur>
--   3. select vault.create_secret('<valeur>', 'cron_shared_secret');
--   4. supabase functions deploy assign-league-cohorts --no-verify-jwt
--      supabase functions deploy dispatch-social-nudges --no-verify-jwt
--
-- Idempotent : déprogramme toute variante existante avant de recréer, et
-- sort proprement si pg_cron n'est pas installé (pour que
-- `supabase db reset` continue de fonctionner en local).

do $cron_setup$
declare
  existing_jobid bigint;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron not installed; skipping gamification schedules.';
    return;
  end if;

  for existing_jobid in
    select jobid from cron.job
    where jobname in (
      'gamification-league-cohorts-weekly',
      'gamification-social-nudges-daily'
    )
  loop
    perform cron.unschedule(existing_jobid);
  end loop;

  perform cron.schedule(
    'gamification-league-cohorts-weekly',
    '10 3 * * 1',
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

  perform cron.schedule(
    'gamification-social-nudges-daily',
    '10 17 * * *',
    $cmd$
    select net.http_post(
      url := 'https://iplrydnzbevicilulmsy.supabase.co/functions/v1/dispatch-social-nudges',
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

-- Purge des nudges expirés : la file ne doit pas croître indéfiniment, et un
-- nudge périmé ne doit jamais remonter dans l'app.
do $purge_setup$
declare
  existing_jobid bigint;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    return;
  end if;

  for existing_jobid in
    select jobid from cron.job where jobname = 'gamification-nudges-purge-daily'
  loop
    perform cron.unschedule(existing_jobid);
  end loop;

  perform cron.schedule(
    'gamification-nudges-purge-daily',
    '30 4 * * *',
    $cmd$
    delete from public.social_nudges
    where expires_at < now() - interval '7 days';
    $cmd$
  );
end;
$purge_setup$;
