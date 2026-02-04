ALTER TABLE events
ADD COLUMN created_by uuid;

ALTER TABLE events
ADD CONSTRAINT events_created_by_fkey
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_events_created_by ON events (created_by);
