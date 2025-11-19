-- Add super admin flag to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

-- Admin daily aggregated stats (usage + AI)
CREATE TABLE IF NOT EXISTS admin_daily_stats (
  id serial PRIMARY KEY,
  stat_date date NOT NULL UNIQUE,
  total_users integer NOT NULL DEFAULT 0,
  new_users integer NOT NULL DEFAULT 0,
  total_workflows integer NOT NULL DEFAULT 0,
  new_workflows integer NOT NULL DEFAULT 0,
  total_analyses integer NOT NULL DEFAULT 0,
  new_analyses integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE OR REPLACE FUNCTION update_admin_daily_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_daily_stats_updated_at
  BEFORE UPDATE ON admin_daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_daily_stats_updated_at();

-- Simple activity log for admin dashboard (optional, can be extended)
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id serial PRIMARY KEY,
  occurred_at timestamp NOT NULL DEFAULT now(),
  user_id uuid,
  event_type text NOT NULL,
  detail text
);
