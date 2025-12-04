-- =============================================
-- 5. TRANSFERS TABLOSU
-- Transfer hizmetleri
-- =============================================

-- Tabloyu oluştur
CREATE TABLE IF NOT EXISTS mysiacrm.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('airport', 'hotel', 'private', 'group')),
  pickup TEXT NOT NULL,
  dropoff TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  vehicle_type TEXT NOT NULL,
  passenger_count INTEGER NOT NULL CHECK (passenger_count > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  driver_id UUID,
  vehicle_id UUID,
  related_tour_id UUID REFERENCES mysiacrm.tours(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) aktif et
ALTER TABLE mysiacrm.transfers ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Yetkili kullanıcılar transferleri görebilir" ON mysiacrm.transfers;
DROP POLICY IF EXISTS "Admin ve personel transfer ekleyebilir" ON mysiacrm.transfers;
DROP POLICY IF EXISTS "Admin ve personel transfer güncelleyebilir" ON mysiacrm.transfers;
DROP POLICY IF EXISTS "Sadece admin transfer silebilir" ON mysiacrm.transfers;

-- RLS Politikaları
CREATE POLICY "Yetkili kullanıcılar transferleri görebilir"
  ON mysiacrm.transfers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin ve personel transfer ekleyebilir"
  ON mysiacrm.transfers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Admin ve personel transfer güncelleyebilir"
  ON mysiacrm.transfers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Sadece admin transfer silebilir"
  ON mysiacrm.transfers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_transfers_date ON mysiacrm.transfers(date DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON mysiacrm.transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_type ON mysiacrm.transfers(type);
CREATE INDEX IF NOT EXISTS idx_transfers_driver_id ON mysiacrm.transfers(driver_id);
CREATE INDEX IF NOT EXISTS idx_transfers_vehicle_id ON mysiacrm.transfers(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_transfers_related_tour ON mysiacrm.transfers(related_tour_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON mysiacrm.transfers(created_at DESC);

-- Tablo açıklamaları
COMMENT ON TABLE mysiacrm.transfers IS 'Transfer hizmetleri';
COMMENT ON COLUMN mysiacrm.transfers.type IS 'Transfer tipi: airport, hotel, private, group';
COMMENT ON COLUMN mysiacrm.transfers.status IS 'Transfer durumu: pending, confirmed, in_progress, completed, cancelled';
COMMENT ON COLUMN mysiacrm.transfers.related_tour_id IS 'İlişkili tur (opsiyonel)';
