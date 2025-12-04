-- =============================================
-- 6. TRANSFER BOOKINGS TABLOSU
-- Transfer rezervasyonları
-- =============================================

-- Tabloyu oluştur
CREATE TABLE IF NOT EXISTS mysiacrm.transfer_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES mysiacrm.transfers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES mysiacrm.clients(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL CHECK (seat_number > 0),
  amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid >= 0),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'refunded')),
  booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'transferred')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_seat_per_transfer UNIQUE (transfer_id, seat_number)
);

-- RLS (Row Level Security) aktif et
ALTER TABLE mysiacrm.transfer_bookings ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Yetkili kullanıcılar transfer rezervasyonlarını görebilir" ON mysiacrm.transfer_bookings;
DROP POLICY IF EXISTS "Admin ve personel transfer rezervasyonu ekleyebilir" ON mysiacrm.transfer_bookings;
DROP POLICY IF EXISTS "Admin ve personel transfer rezervasyonu güncelleyebilir" ON mysiacrm.transfer_bookings;
DROP POLICY IF EXISTS "Sadece admin transfer rezervasyonu silebilir" ON mysiacrm.transfer_bookings;

-- RLS Politikaları
CREATE POLICY "Yetkili kullanıcılar transfer rezervasyonlarını görebilir"
  ON mysiacrm.transfer_bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin ve personel transfer rezervasyonu ekleyebilir"
  ON mysiacrm.transfer_bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Admin ve personel transfer rezervasyonu güncelleyebilir"
  ON mysiacrm.transfer_bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Sadece admin transfer rezervasyonu silebilir"
  ON mysiacrm.transfer_bookings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_transfer_id ON mysiacrm.transfer_bookings(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_client_id ON mysiacrm.transfer_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_status ON mysiacrm.transfer_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_payment_status ON mysiacrm.transfer_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_created_at ON mysiacrm.transfer_bookings(created_at DESC);

-- Trigger: Koltuk numarası yolcu sayısını aşmasın
CREATE OR REPLACE FUNCTION mysiacrm.check_transfer_seat_capacity()
RETURNS TRIGGER AS $$
DECLARE
  transfer_capacity INTEGER;
BEGIN
  SELECT passenger_count INTO transfer_capacity
  FROM mysiacrm.transfers
  WHERE id = NEW.transfer_id;
  
  IF NEW.seat_number > transfer_capacity THEN
    RAISE EXCEPTION 'Koltuk numarası (%) transfer kapasitesini (%) aşıyor', NEW.seat_number, transfer_capacity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_transfer_seat_capacity ON mysiacrm.transfer_bookings;
CREATE TRIGGER trigger_check_transfer_seat_capacity
  BEFORE INSERT OR UPDATE ON mysiacrm.transfer_bookings
  FOR EACH ROW
  EXECUTE FUNCTION mysiacrm.check_transfer_seat_capacity();

-- Tablo açıklamaları
COMMENT ON TABLE mysiacrm.transfer_bookings IS 'Transfer rezervasyonları';
COMMENT ON COLUMN mysiacrm.transfer_bookings.seat_number IS 'Koltuk numarası (transfer kapasitesini aşamaz)';
COMMENT ON CONSTRAINT unique_seat_per_transfer ON mysiacrm.transfer_bookings IS 'Bir transferde aynı koltuk numarası tekrar edilemez';
