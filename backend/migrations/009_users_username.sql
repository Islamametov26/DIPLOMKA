ALTER TABLE users
ADD COLUMN IF NOT EXISTS username text;

UPDATE users
SET username = lower('user_' || substr(id::text, 1, 8))
WHERE username IS NULL OR btrim(username) = '';

WITH ranked AS (
  SELECT id, username, row_number() OVER (PARTITION BY username ORDER BY created_at, id) AS rn
  FROM users
)
UPDATE users u
SET username = lower(u.username || '_' || substr(u.id::text, 1, 6))
FROM ranked r
WHERE u.id = r.id AND r.rn > 1;

ALTER TABLE users
ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users (username);
