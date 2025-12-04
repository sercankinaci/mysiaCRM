-- =============================================
-- 3. TOURS TABLOSU
-- Tur bilgileri ve finansal verileri
-- =============================================

-- Tabloyu oluştur
CREATE TABLE IF NOT EXISTS mysiacrm.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'cancelled', 'completed', 'postponed')),
  total_income DECIMAL(10, 2) DEFAULT 0 CHECK (total_income >= 0),
  total_expense DECIMAL(10, 2) DEFAULT 0 CHECK (total_expense >= 0),
  net_profit DECIMAL(10, 2) GENERATED ALWAYS AS (total_income - total_expense) STORED,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- RLS (Row Level Security) aktif et
ALTER TABLE mysiacrm.tours ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Yetkili kullanıcılar turları görebilir" ON mysiacrm.tours;
DROP POLICY IF EXISTS "Admin ve personel tur ekleyebilir" ON mysiacrm.tours;
DROP POLICY IF EXISTS "Admin ve personel tur güncelleyebilir" ON mysiacrm.tours;
DROP POLICY IF EXISTS "Sadece admin tur silebilir" ON mysiacrm.tours;

-- RLS Politikaları
CREATE POLICY "Yetkili kullanıcılar turları görebilir"
  ON mysiacrm.tours
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin ve personel tur ekleyebilir"
  ON mysiacrm.tours
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Admin ve personel tur güncelleyebilir"
  ON mysiacrm.tours
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Sadece admin tur silebilir"
  ON mysiacrm.tours
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_tours_status ON mysiacrm.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_start_date ON mysiacrm.tours(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_tours_created_at ON mysiacrm.tours(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tours_active ON mysiacrm.tours(status, start_date) 
  WHERE status = 'active';

-- Trigger: Tur iptal edildiğinde iptal nedeni zorunlu
CREATE OR REPLACE FUNCTION mysiacrm.check_cancellation_reason()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND (NEW.cancellation_reason IS NULL OR NEW.cancellation_reason = '') THEN
    RAISE EXCEPTION 'İptal nedeni belirtilmelidir';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_cancellation_reason ON mysiacrm.tours;
CREATE TRIGGER trigger_check_cancellation_reason
  BEFORE INSERT OR UPDATE ON mysiacrm.tours
  FOR EACH ROW
  EXECUTE FUNCTION mysiacrm.check_cancellation_reason();

-- Tablo açıklamaları
COMMENT ON TABLE mysiacrm.tours IS 'Tur bilgileri ve finansal verileri';
COMMENT ON COLUMN mysiacrm.tours.net_profit IS 'Otomatik hesaplanan net kâr (total_income - total_expense)';
COMMENT ON COLUMN mysiacrm.tours.status IS 'Tur durumu: draft, active, cancelled, completed, postponed';
