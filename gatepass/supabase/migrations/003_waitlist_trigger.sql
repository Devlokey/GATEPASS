-- ============================================================
-- Migration 003: Waitlist auto-promotion trigger
-- When a confirmed registration is cancelled, automatically
-- promote the oldest waitlisted registration for that event.
-- ============================================================

CREATE OR REPLACE FUNCTION promote_from_waitlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_reg_id uuid;
BEGIN
  -- Only fire when a registration is cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Find the oldest waitlisted registration for the same event
    SELECT id INTO next_reg_id
    FROM registrations
    WHERE event_id = NEW.event_id
      AND status = 'waitlisted'
    ORDER BY created_at ASC
    LIMIT 1;

    IF next_reg_id IS NOT NULL THEN
      UPDATE registrations
      SET status = 'confirmed'
      WHERE id = next_reg_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists, then recreate
DROP TRIGGER IF EXISTS on_registration_cancelled ON registrations;

CREATE TRIGGER on_registration_cancelled
  AFTER UPDATE OF status ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION promote_from_waitlist();
