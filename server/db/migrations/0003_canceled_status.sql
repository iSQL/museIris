-- Distinguish client-initiated cancellations from admin rejections.
-- Existing rows are not migrated: past 'rejected' values stay as-is.

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'approved', 'completed', 'rejected', 'canceled'));
