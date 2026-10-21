-- Task Manager — PostgreSQL schema
--
-- This file is the single source of truth for the database structure.
-- It can be applied in either of two ways:
--
--   1. Directly, with psql or the Neon SQL editor:
--        psql "$DATABASE_URL" -f db/schema.sql
--
--   2. Through the setup script, which applies one statement at a time:
--        npm run db:setup
--
-- Statements are separated by a statement-breakpoint comment marker so that
-- the setup script can execute them individually over the HTTP driver, which
-- only supports a single statement per request. The markers are ordinary SQL
-- comments, so running this file as a whole still works.

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks (created_at DESC);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS tasks_completed_idx ON tasks (completed);

-- statement-breakpoint
CREATE OR REPLACE FUNCTION set_tasks_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- statement-breakpoint
DROP TRIGGER IF EXISTS tasks_set_updated_at ON tasks;

-- statement-breakpoint
CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_tasks_updated_at();
