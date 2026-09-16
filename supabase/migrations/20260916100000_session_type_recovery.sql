-- Aligne le CHECK session_type sur le type applicatif SessionType.
--
-- `src/types/training.ts` autorise RECOVERY et ACTIVE_RECOVERY depuis
-- l'introduction de la récup active, mais le CHECK n'a jamais suivi : les
-- quick-logs de récup active de WeekPage échouaient côté Supabase et
-- restaient bloqués dans le cache localStorage offline.
--
-- Prérequis à la gamification : le score se calcule côté serveur, donc une
-- séance qui n'atteint pas la base est une séance non créditée.

ALTER TABLE public.session_logs
  DROP CONSTRAINT IF EXISTS session_logs_session_type_check;
ALTER TABLE public.session_logs
  ADD CONSTRAINT session_logs_session_type_check
  CHECK (session_type IN (
    'UPPER',
    'LOWER',
    'FULL',
    'CONDITIONING',
    'RECOVERY',
    'ACTIVE_RECOVERY'
  ));

ALTER TABLE public.block_logs
  DROP CONSTRAINT IF EXISTS block_logs_session_type_check;
ALTER TABLE public.block_logs
  ADD CONSTRAINT block_logs_session_type_check
  CHECK (session_type IN (
    'UPPER',
    'LOWER',
    'FULL',
    'CONDITIONING',
    'RECOVERY',
    'ACTIVE_RECOVERY'
  ));
