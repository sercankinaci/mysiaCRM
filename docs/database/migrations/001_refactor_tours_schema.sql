-- Migration: Refactor Tours to Product Catalog Model (Simplified)
-- Description: Splits the monolithic 'tours' table into 'tours' (catalog), 'tour_price_groups', and 'tour_dates'.

-- 1. Rename existing table to preserve data (optional, or just drop if dev)
ALTER TABLE mysiacrm.tours RENAME TO tours_old;

-- 2. Create new TOURS table (The Product/Template)
-- User Requirement: Sadece Adı ve Tipi olacak.
CREATE TABLE IF NOT EXISTS mysiacrm.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tour_type TEXT NOT NULL, -- 'daily', 'package', 'ship', etc.
  
  -- Optional details (can be filled later if needed, but initial creation only needs above)
  description TEXT, 
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'passive', 'draft')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create PRICE GROUPS table
CREATE TABLE IF NOT EXISTS mysiacrm.tour_price_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES mysiacrm.tours(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Standart Paket", "Her Şey Dahil"
  
  -- Pricing Configuration
  pricing JSONB NOT NULL DEFAULT '{}'::jsonb, 
  -- Structure: { 
  --   currency: 'TRY', 
  --   adult: { regular: 1000, discounted: 900 }, 
  --   child: { regular: 500 },
  --   infant: { regular: 0 }
  -- }
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passive')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create TOUR DATES table (The Instances)
CREATE TABLE IF NOT EXISTS mysiacrm.tour_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES mysiacrm.tours(id) ON DELETE CASCADE,
  price_group_id UUID NOT NULL REFERENCES mysiacrm.tour_price_groups(id) ON DELETE CASCADE,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Capacity
  capacity_total INTEGER NOT NULL DEFAULT 45,
  capacity_available INTEGER NOT NULL DEFAULT 45,
  
  -- Price Overrides (optional)
  price_override JSONB, 
  
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'soldout', 'cancelled', 'completed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Update BOOKINGS table
-- We need to link bookings to a specific DATE (instance).
ALTER TABLE mysiacrm.bookings ADD COLUMN tour_date_id UUID REFERENCES mysiacrm.tour_dates(id);
ALTER TABLE mysiacrm.bookings ADD COLUMN price_group_id UUID REFERENCES mysiacrm.tour_price_groups(id);

-- 6. RLS Policies
ALTER TABLE mysiacrm.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE mysiacrm.tour_price_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mysiacrm.tour_dates ENABLE ROW LEVEL SECURITY;

-- Policies for TOURS
CREATE POLICY "Public read active tours" ON mysiacrm.tours FOR SELECT USING (status = 'active' OR EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin/Personel manage tours" ON mysiacrm.tours FOR ALL USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));

-- Policies for PRICE GROUPS
CREATE POLICY "Public read active price groups" ON mysiacrm.tour_price_groups FOR SELECT USING (status = 'active' OR EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin/Personel manage price groups" ON mysiacrm.tour_price_groups FOR ALL USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));

-- Policies for TOUR DATES
CREATE POLICY "Public read available dates" ON mysiacrm.tour_dates FOR SELECT USING (status != 'cancelled' OR EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin/Personel manage dates" ON mysiacrm.tour_dates FOR ALL USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));

-- 7. Triggers for Updated At
CREATE OR REPLACE FUNCTION mysiacrm.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_tours ON mysiacrm.tours;
CREATE TRIGGER set_timestamp_tours BEFORE UPDATE ON mysiacrm.tours FOR EACH ROW EXECUTE FUNCTION mysiacrm.handle_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_price_groups ON mysiacrm.tour_price_groups;
CREATE TRIGGER set_timestamp_price_groups BEFORE UPDATE ON mysiacrm.tour_price_groups FOR EACH ROW EXECUTE FUNCTION mysiacrm.handle_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_tour_dates ON mysiacrm.tour_dates;
CREATE TRIGGER set_timestamp_tour_dates BEFORE UPDATE ON mysiacrm.tour_dates FOR EACH ROW EXECUTE FUNCTION mysiacrm.handle_updated_at();
