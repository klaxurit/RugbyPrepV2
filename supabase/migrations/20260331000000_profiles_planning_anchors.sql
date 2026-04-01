-- Planning anchors for season lifecycle management (seasonEndedAt, offSeasonStartAt, manualPlayoffs)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS planning_anchors JSONB DEFAULT NULL;
