-- Add stale flag to anchors table
-- stale = 1 means the anchor's excerpt no longer exists in the current diff
ALTER TABLE anchors ADD COLUMN stale INTEGER NOT NULL DEFAULT 0;
