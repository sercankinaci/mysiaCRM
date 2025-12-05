-- Migration: Full CRM Schema
-- Description: Adds tour_operations, tour_date_finance tables and updates bookings

-- 0. Create handle_updated_at function if not exists
CREATE OR REPLACE FUNCTION mysiacrm.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Update BOOKINGS table to link with tour_dates
ALTER TABLE mysiacrm.bookings 
ADD COLUMN IF NOT EXISTS tour_date_id UUID REFERENCES mysiacrm.tour_dates(id);

ALTER TABLE mysiacrm.bookings 
ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB DEFAULT '{}'::jsonb;

ALTER TABLE mysiacrm.bookings 
ADD COLUMN IF NOT EXISTS pax JSONB DEFAULT '{"adult": 1, "child": 0, "baby": 0}'::jsonb;

-- 2. Create TOUR OPERATIONS table
CREATE TABLE IF NOT EXISTS mysiacrm.tour_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_date_id UUID NOT NULL UNIQUE REFERENCES mysiacrm.tour_dates(id) ON DELETE CASCADE,
  
  -- Personnel assignments
  vehicle_info JSONB DEFAULT '{}'::jsonb, -- { plate: "34 ABC 123", type: "Minibus", capacity: 20 }
  guide_info JSONB DEFAULT '{}'::jsonb,   -- { name: "Ahmet", phone: "555..." }
  driver_info JSONB DEFAULT '{}'::jsonb,  -- { name: "Mehmet", phone: "555..." }
  
  -- Operation details
  pickup_points JSONB DEFAULT '[]'::jsonb, -- [{ time: "08:00", location: "Taksim" }]
  notes TEXT,
  
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create TOUR DATE FINANCE table
CREATE TABLE IF NOT EXISTS mysiacrm.tour_date_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_date_id UUID NOT NULL REFERENCES mysiacrm.tour_dates(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL, -- reservation, fuel, guide_fee, hotel, meal, ticket, other
  
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  
  description TEXT,
  reference_type TEXT, -- booking, expense, manual
  reference_id UUID,   -- booking_id or expense_id
  
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS Policies
ALTER TABLE mysiacrm.tour_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mysiacrm.tour_date_finance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON mysiacrm.tour_operations 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users" ON mysiacrm.tour_date_finance 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_tour_date ON mysiacrm.bookings(tour_date_id);
CREATE INDEX IF NOT EXISTS idx_tour_operations_date ON mysiacrm.tour_operations(tour_date_id);
CREATE INDEX IF NOT EXISTS idx_finance_date ON mysiacrm.tour_date_finance(tour_date_id);
CREATE INDEX IF NOT EXISTS idx_finance_type ON mysiacrm.tour_date_finance(type);

-- 6. Triggers for updated_at
CREATE TRIGGER set_timestamp_operations 
  BEFORE UPDATE ON mysiacrm.tour_operations 
  FOR EACH ROW EXECUTE FUNCTION mysiacrm.handle_updated_at();

CREATE TRIGGER set_timestamp_finance 
  BEFORE UPDATE ON mysiacrm.tour_date_finance 
  FOR EACH ROW EXECUTE FUNCTION mysiacrm.handle_updated_at();
