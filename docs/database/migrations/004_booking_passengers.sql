-- Migration: Booking Passengers Table
-- Description: Adds booking_passengers table for storing individual traveler details

-- Create booking_passengers table
CREATE TABLE IF NOT EXISTS mysiacrm.booking_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES mysiacrm.bookings(id) ON DELETE CASCADE,
  
  -- Personal info
  full_name TEXT NOT NULL,
  tc_no TEXT,
  birth_date DATE,
  passenger_type TEXT NOT NULL DEFAULT 'adult' CHECK (passenger_type IN ('adult', 'child', 'baby')),
  
  -- Contact & logistics
  phone TEXT,
  pickup_point TEXT,
  
  -- Extra
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE mysiacrm.booking_passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON mysiacrm.booking_passengers 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_passengers_booking ON mysiacrm.booking_passengers(booking_id);

-- Trigger
CREATE TRIGGER set_timestamp_passengers 
  BEFORE UPDATE ON mysiacrm.booking_passengers 
  FOR EACH ROW EXECUTE FUNCTION mysiacrm.handle_updated_at();

-- Capacity functions (if not exists)
CREATE OR REPLACE FUNCTION mysiacrm.decrease_tour_date_capacity(date_id UUID, pax_count INT)
RETURNS void AS $$
BEGIN
  UPDATE mysiacrm.tour_dates
  SET capacity_available = GREATEST(0, capacity_available - pax_count)
  WHERE id = date_id;
  
  UPDATE mysiacrm.tour_dates
  SET status = 'soldout'
  WHERE id = date_id AND capacity_available <= 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mysiacrm.increase_tour_date_capacity(date_id UUID, pax_count INT)
RETURNS void AS $$
BEGIN
  UPDATE mysiacrm.tour_dates
  SET capacity_available = capacity_available + pax_count,
      status = 'available'
  WHERE id = date_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
