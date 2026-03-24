-- block_logs: add mother-session context columns (staff-ready)
-- session_logs already has these (migration 20260321140000)

ALTER TABLE block_logs ADD COLUMN IF NOT EXISTS mother_session_id TEXT;
ALTER TABLE block_logs ADD COLUMN IF NOT EXISTS program_source TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE block_logs ADD CONSTRAINT block_logs_program_source_check
  CHECK (program_source IN ('legacy', 'mother_session'));

CREATE INDEX IF NOT EXISTS block_logs_ms_id
  ON block_logs(user_id, mother_session_id);
