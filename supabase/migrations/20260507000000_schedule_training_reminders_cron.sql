-- Schedule hourly trigger of the send-training-reminders Edge Function.
--
-- send-training-reminders does its own per-user filtering (training day +
-- local reminder_hour + quiet_hours + notifications_basic entitlement),
-- so a single hourly UTC schedule fires the right reminder in each user's
-- own timezone without DST gymnastics on our side.
--
-- Out-of-band prerequisites (not idempotent SQL — operator setup):
--   1. Enable extensions pg_cron and pg_net in the Dashboard.
--   2. Set the cron secret on the Edge Function:
--        supabase secrets set CRON_SHARED_SECRET=<value>
--   3. Store the SAME value in vault so pg_cron can read it:
--        select vault.create_secret('<value>', 'cron_shared_secret');
--   4. Deploy the cron-target functions without JWT verification (their
--      auth is the cron secret in the x-cron-secret header):
--        supabase functions deploy send-training-reminders --no-verify-jwt
--        supabase functions deploy dispatch-push-queue --no-verify-jwt
--
-- This migration is idempotent: it drops any pre-existing variant of the
-- job (including legacy names from earlier broken attempts) and recreates
-- the schedule. It bails gracefully on databases where pg_cron is not
-- installed (fresh local DBs) so `supabase db reset` keeps working.

do $cron_setup$
declare
  existing_jobid bigint;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron not installed; skipping training reminder schedule.';
    return;
  end if;

  for existing_jobid in
    select jobid from cron.job
    where jobname in (
      'training-reminders-hourly',
      'notify-training-daily',
      'send-training-reminders-daily'
    )
  loop
    perform cron.unschedule(existing_jobid);
  end loop;

  perform cron.schedule(
    'training-reminders-hourly',
    '0 * * * *',
    $cmd$
    select net.http_post(
      url := 'https://iplrydnzbevicilulmsy.supabase.co/functions/v1/send-training-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret' limit 1)
      ),
      body := jsonb_build_object('dispatchAfterQueue', true)
    );
    $cmd$
  );
end;
$cron_setup$;
