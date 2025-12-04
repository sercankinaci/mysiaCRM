-- =============================================
-- 4. BOOKINGS TABLOSU
-- Tur rezervasyonları ve koltuk bilgileri
-- =============================================

-- Tabloyu oluştur
CREATE TABLE IF NOT EXISTS mysiacrm.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES mysiacrm.tours(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES mysiacrm.clients(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL CHECK (seat_number > 0),
  amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid >= 0),
  booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'transferred')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'refunded')),
  new_tour_id UUID REFERENCES mysiacrm.tours(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_seat_per_tour UNIQUE (tour_id, seat_number)
);

-- RLS (Row Level Security) aktif et
ALTER TABLE mysiacrm.bookings ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Yetkili kullanıcılar rezervasyonları görebilir" ON mysiacrm.bookings;
DROP POLICY IF EXISTS "Admin ve personel rezervasyon ekleyebilir" ON mysiacrm.bookings;
DROP POLICY IF EXISTS "Admin ve personel rezervasyon güncelleyebilir" ON mysiacrm.bookings;
DROP POLICY IF EXISTS "Sadece admin rezervasyon silebilir" ON mysiacrm.bookings;

-- RLS Politikaları
CREATE POLICY "Yetkili kullanıcılar rezervasyonları görebilir"
  ON mysiacrm.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin ve personel rezervasyon ekleyebilir"
  ON mysiacrm.bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Admin ve personel rezervasyon güncelleyebilir"
  ON mysiacrm.bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Sadece admin rezervasyon silebilir"
  ON mysiacrm.bookings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id ON mysiacrm.bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON mysiacrm.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON mysiacrm.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON mysiacrm.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON mysiacrm.bookings(created_at DESC);

-- Trigger: Koltuk numarası tur kapasitesini aşmasın
CREATE OR REPLACE FUNCTION mysiacrm.check_seat_capacity()
RETURNS TRIGGER AS $$
DECLARE
  tour_capacity INTEGER;
BEGIN
  SELECT capacity INTO tour_capacity
  FROM mysiacrm.tours
  WHERE id = NEW.tour_id;
  
  IF NEW.seat_number > tour_capacity THEN
    RAISE EXCEPTION 'Koltuk numarası (%) tur kapasitesini (%) aşıyor', NEW.seat_number, tour_capacity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_seat_capacity ON mysiacrm.bookings;
CREATE TRIGGER trigger_check_seat_capacity
  BEFORE INSERT OR UPDATE ON mysiacrm.bookings
  FOR EACH ROW
  EXECUTE FUNCTION mysiacrm.check_seat_capacity();

-- Trigger: Rezervasyon oluşturulduğunda tur gelirini güncelle
CREATE OR REPLACE FUNCTION mysiacrm.update_tour_income_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.booking_status = 'confirmed' THEN
    UPDATE mysiacrm.tours
    SET total_income = total_income + NEW.amount_paid
    WHERE id = NEW.tour_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
      UPDATE mysiacrm.tours
      SET total_income = total_income - OLD.amount_paid
      WHERE id = OLD.tour_id;
    END IF;
    
    IF OLD.booking_status = 'cancelled' AND NEW.booking_status = 'confirmed' THEN
      UPDATE mysiacrm.tours
      SET total_income = total_income + NEW.amount_paid
      WHERE id = NEW.tour_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' AND OLD.booking_status = 'confirmed' THEN
    UPDATE mysiacrm.tours
    SET total_income = total_income - OLD.amount_paid
    WHERE id = OLD.tour_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tour_income ON mysiacrm.bookings;
CREATE TRIGGER trigger_update_tour_income
  AFTER INSERT OR UPDATE OR DELETE ON mysiacrm.bookings
  FOR EACH ROW
  EXECUTE FUNCTION mysiacrm.update_tour_income_on_booking();

-- Tablo açıklamaları
COMMENT ON TABLE mysiacrm.bookings IS 'Tur rezervasyonları ve koltuk bilgileri';
COMMENT ON COLUMN mysiacrm.bookings.seat_number IS 'Koltuk numarası (tur kapasitesini aşamaz)';
COMMENT ON COLUMN mysiacrm.bookings.new_tour_id IS 'Transfer durumunda yeni tur ID';
COMMENT ON CONSTRAINT unique_seat_per_tour ON mysiacrm.bookings IS 'Bir turda aynı koltuk numarası tekrar edilemez';
