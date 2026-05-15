-- Coupons: admin-issued codes that customers can apply at booking time.
-- A coupon is either a percent off OR a fixed RSD discount (CHECK enforces exactly one).
-- Codes are case-insensitive; we normalize to upper-case at write time.

CREATE TABLE coupons (
  id                 SERIAL PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,
  discount_percent   INTEGER CHECK (discount_percent BETWEEN 1 AND 100),
  discount_amount    INTEGER CHECK (discount_amount > 0),
  max_activations    INTEGER CHECK (max_activations > 0),
  activations_used   INTEGER NOT NULL DEFAULT 0 CHECK (activations_used >= 0),
  expires_at         TIMESTAMPTZ,
  active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coupons_discount_exclusive CHECK (
    (discount_percent IS NOT NULL AND discount_amount IS NULL) OR
    (discount_percent IS NULL AND discount_amount IS NOT NULL)
  )
);

CREATE INDEX idx_coupons_active ON coupons(active);

-- Snapshot the applied coupon on the booking so price stays stable even if
-- the coupon is later edited or deactivated. coupon_discount is the resolved
-- RSD value (after applying percent to the service price, or just the fixed
-- amount), not the raw percentage.
ALTER TABLE bookings
  ADD COLUMN coupon_code     TEXT,
  ADD COLUMN coupon_discount INTEGER CHECK (coupon_discount >= 0);
