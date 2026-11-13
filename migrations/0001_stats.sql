-- Anonymous visit statistics (worker/stats.js, worker/admin.js).
-- No IP address, no user agent, no cookie value is ever written here.

-- One row per page view.
CREATE TABLE IF NOT EXISTS views (
	id INTEGER PRIMARY KEY,
	ts INTEGER NOT NULL,                  -- Unix seconds
	day TEXT NOT NULL,                    -- YYYY-MM-DD, Europe/Paris
	path TEXT NOT NULL,                   -- no query string
	not_found INTEGER NOT NULL DEFAULT 0, -- 1 when the path is a 404
	entry INTEGER NOT NULL DEFAULT 0,     -- 1 for the first page of a visit
	country TEXT,                         -- ISO code given by Cloudflare
	device TEXT NOT NULL,                 -- desktop, mobile or tablet
	referrer TEXT,                        -- host name only, entries only
	visitor TEXT NOT NULL                 -- hash(salt of the day + IP + UA), truncated
);
CREATE INDEX IF NOT EXISTS views_day_visitor ON views (day, visitor);

-- The salt mixed into the visitor hash. It is deleted when its day is over,
-- after which the hashes of that day can no longer be recomputed from an IP.
CREATE TABLE IF NOT EXISTS salts (
	day TEXT PRIMARY KEY,
	salt TEXT NOT NULL
);

-- Views written per day, to cap what a flood of forged hits can cost.
CREATE TABLE IF NOT EXISTS counters (
	day TEXT PRIMARY KEY,
	views INTEGER NOT NULL DEFAULT 0
);

-- Failed logins on the dashboard, to slow down password guessing.
CREATE TABLE IF NOT EXISTS login_failures (
	ts INTEGER NOT NULL,
	visitor TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS login_failures_ts ON login_failures (ts);
