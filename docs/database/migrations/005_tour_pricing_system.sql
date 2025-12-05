-- Migration: Tour Pricing System Refactor
-- Version: 005
-- Date: 2025-12-05
-- Description: Adds tour types, pricing models, and room-based pricing for package tours

-- ============================================================================
-- 1. TOURS TABLOSU GÜNCELLEMESİ
-- ============================================================================

-- 1.1 Yeni alanlar ekle
ALTER TABLE mysiacrm.tours 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE mysiacrm.tours 
ADD COLUMN IF NOT EXISTS tour_type TEXT DEFAULT 'daily' CHECK (tour_type IN ('daily', 'package'));

ALTER TABLE mysiacrm.tours 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'domestic' CHECK (category IN ('domestic', 'abroad'));

ALTER TABLE mysiacrm.tours 
ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'per_person' CHECK (pricing_model IN ('per_person', 'room_based'));

ALTER TABLE mysiacrm.tours 
ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT 1;

ALTER TABLE mysiacrm.tours 
ADD COLUMN IF NOT EXISTS duration_nights INT DEFAULT 0;

-- Yaş aralıkları
ALTER TABLE mysiacrm.tours 
ADD COLUMN IF NOT EXISTS child_age_min INT DEFAULT 3;

ALTER TABLE mysiacrm.tours 
ADD COLUMN IF NOT EXISTS child_age_max INT DEFAULT 11;

ALTER TABLE mysiacrm.tours 
ADD COLUMN IF NOT EXISTS baby_age_max INT DEFAULT 2;

-- SEO ve görsel alanları
ALTER TABLE mysiacrm.tours 
ADD COLUMN IF NOT EXISTS featured_image TEXT;

ALTER TABLE mysiacrm.tours 
ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;

-- 1.2 Mevcut tour_type alanını güncelle (eğer foreign destination vardı ise)
UPDATE mysiacrm.tours 
SET tour_type = 'daily', 
    pricing_model = 'per_person',
    category = CASE 
      WHEN tour_type = 'abroad' THEN 'abroad' 
      ELSE 'domestic' 
    END
WHERE tour_type IS NULL OR tour_type NOT IN ('daily', 'package');

-- ============================================================================
-- 2. TOUR_PRICE_GROUPS TABLOSU GÜNCELLEMESİ
-- ============================================================================

-- 2.1 Kişi başı fiyat alanları ekle (günübirlik turlar için)
ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS price_adult DECIMAL(12, 2);

ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS price_child DECIMAL(12, 2);

ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS price_baby DECIMAL(12, 2) DEFAULT 0;

ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 2.2 Oda bazlı fiyat alanları ekle (paket turlar için)
ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS max_pax INT DEFAULT 4;

ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS price_single_pp DECIMAL(12, 2);

ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS price_double_pp DECIMAL(12, 2);

ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS price_triple_pp DECIMAL(12, 2);

ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS price_quad_pp DECIMAL(12, 2);

ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS price_child_1 DECIMAL(12, 2);

ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS price_child_2 DECIMAL(12, 2);

ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS price_baby_1 DECIMAL(12, 2) DEFAULT 0;

ALTER TABLE mysiacrm.tour_price_groups 
ADD COLUMN IF NOT EXISTS price_baby_2 DECIMAL(12, 2) DEFAULT 0;

-- 2.3 Mevcut pricing JSONB'den yeni alanlara veri taşı (eğer varsa)
UPDATE mysiacrm.tour_price_groups
SET 
  price_adult = (pricing->>'adult')::DECIMAL,
  price_child = (pricing->>'child')::DECIMAL,
  price_baby = COALESCE((pricing->>'baby')::DECIMAL, 0)
WHERE pricing IS NOT NULL AND price_adult IS NULL;

-- ============================================================================
-- 3. TOUR_ROOM_TYPES TABLOSU (YENİ)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mysiacrm.tour_room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_group_id UUID NOT NULL REFERENCES mysiacrm.tour_price_groups(id) ON DELETE CASCADE,
  
  -- Oda Bilgileri
  name TEXT NOT NULL,             -- "Standart Oda", "Deluxe", "Suite"
  max_pax INT DEFAULT 4,          -- Maksimum kişi sayısı
  
  -- Oda Bazlı Fiyatlar (Kişi Başı)
  price_single_pp DECIMAL(12, 2), -- Tek kişilik odada kişi başı
  price_double_pp DECIMAL(12, 2), -- İki kişilik odada kişi başı
  price_triple_pp DECIMAL(12, 2), -- Üç kişilik odada kişi başı
  price_quad_pp DECIMAL(12, 2),   -- Dört kişilik odada kişi başı
  
  -- Çocuk ve Bebek Fiyatları
  price_child_1 DECIMAL(12, 2),   -- 1. çocuk
  price_child_2 DECIMAL(12, 2),   -- 2. ve sonraki çocuklar
  price_baby_1 DECIMAL(12, 2) DEFAULT 0,
  price_baby_2 DECIMAL(12, 2) DEFAULT 0,
  
  -- Ekstra bilgiler
  description TEXT,
  
  -- Durum ve Sıralama
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'passive')),
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE mysiacrm.tour_room_types ENABLE ROW LEVEL SECURITY;

-- Politikalar
DROP POLICY IF EXISTS "Allow authenticated users" ON mysiacrm.tour_room_types;
CREATE POLICY "Allow authenticated users" ON mysiacrm.tour_room_types 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. İNDEKSLER
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tours_tour_type ON mysiacrm.tours(tour_type);
CREATE INDEX IF NOT EXISTS idx_tours_category ON mysiacrm.tours(category);
CREATE INDEX IF NOT EXISTS idx_tours_pricing_model ON mysiacrm.tours(pricing_model);
CREATE INDEX IF NOT EXISTS idx_room_types_price_group ON mysiacrm.tour_room_types(price_group_id);
CREATE INDEX IF NOT EXISTS idx_room_types_status ON mysiacrm.tour_room_types(status);

-- ============================================================================
-- 6. TRİGGER FONKSİYONU
-- ============================================================================

-- Updated at trigger for room_types
DROP TRIGGER IF EXISTS set_timestamp_room_types ON mysiacrm.tour_room_types;
CREATE TRIGGER set_timestamp_room_types 
  BEFORE UPDATE ON mysiacrm.tour_room_types 
  FOR EACH ROW EXECUTE FUNCTION mysiacrm.handle_updated_at();

-- ============================================================================
-- 7. GRANTS
-- ============================================================================

GRANT ALL ON mysiacrm.tour_room_types TO postgres;
GRANT ALL ON mysiacrm.tour_room_types TO anon;
GRANT ALL ON mysiacrm.tour_room_types TO authenticated;
GRANT ALL ON mysiacrm.tour_room_types TO service_role;

-- ============================================================================
-- MIGRATION TAMAMLANDI
-- ============================================================================
