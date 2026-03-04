-- Ajouter CONDITIONING aux types de séance (bug introduit par #23)
ALTER TABLE public.session_logs
  DROP CONSTRAINT IF EXISTS session_logs_session_type_check;
ALTER TABLE public.session_logs
  ADD CONSTRAINT session_logs_session_type_check
  CHECK (session_type IN ('UPPER', 'LOWER', 'FULL', 'CONDITIONING'));

ALTER TABLE public.block_logs
  DROP CONSTRAINT IF EXISTS block_logs_session_type_check;
ALTER TABLE public.block_logs
  ADD CONSTRAINT block_logs_session_type_check
  CHECK (session_type IN ('UPPER', 'LOWER', 'FULL', 'CONDITIONING'));
