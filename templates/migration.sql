-- Migration: {{NAME}}
-- Project: {{PROJECT}}
-- Created: {{DATE}}
--
-- Ordered and commented. Reversible where practical: the down section below must undo this file,
-- or state plainly why it cannot (e.g. a destructive data change) so nobody assumes it can.
-- Constraints and indexes belong here, not in application code.

-- ============================================================ up

-- <!-- fill: CREATE TABLE / ALTER TABLE statements, each with a comment saying why -->
-- Example shape:
-- CREATE TABLE example (
--   id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   created_at    timestamptz NOT NULL DEFAULT now(),
--   -- every foreign key states its on-delete behaviour deliberately
--   owner_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
--   name          text NOT NULL CHECK (length(name) > 0)
-- );
-- CREATE INDEX example_owner_id_idx ON example (owner_id);

-- ========================================================== down

-- <!-- fill: the exact reversal, or: "Not reversible: <reason>" -->
-- DROP INDEX IF EXISTS example_owner_id_idx;
-- DROP TABLE IF EXISTS example;
