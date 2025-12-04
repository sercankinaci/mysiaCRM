-- =============================================
-- 9. REFUNDS TABLOSU
-- İade işlemleri
-- =============================================

-- Tabloyu oluştur
CREATE TABLE IF NOT EXISTS mysiacrm.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES mysiacrm.bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES mysiacrm.clients(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  method TEXT NOT NULL CHECK (method IN ('manual', 'credit', 'bank')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) aktif et
ALTER TABLE mysiacrm.refunds ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Yetkili kullanıcılar iadeleri görebilir" ON mysiacrm.refunds;
DROP POLICY IF EXISTS "Admin ve personel iade ekleyebilir" ON mysiacrm.refunds;
DROP POLICY IF EXISTS "Sadece admin iade güncelleyebilir" ON mysiacrm.refunds;
DROP POLICY IF EXISTS "Sadece admin iade silebilir" ON mysiacrm.refunds;

-- RLS Politikaları
CREATE POLICY "Yetkili kullanıcılar iadeleri görebilir"
  ON mysiacrm.refunds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin ve personel iade ekleyebilir"
  ON mysiacrm.refunds
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Sadece admin iade güncelleyebilir"
  ON mysiacrm.refunds
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Sadece admin iade silebilir"
  ON mysiacrm.refunds
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON mysiacrm.refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_client_id ON mysiacrm.refunds(client_id);
CREATE INDEX IF NOT EXISTS idx_refunds_method ON mysiacrm.refunds(method);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON mysiacrm.refunds(created_at DESC);

-- Trigger: İade oluşturulduğunda finans kaydı ekle
CREATE OR REPLACE FUNCTION mysiacrm.log_refund_to_finance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO mysiacrm.finance (type, source_type, source_id, amount, description)
    VALUES (
      'refund',
      'refund',
      NEW.id,
      -NEW.amount,
      'İade - ' || NEW.method
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_refund_to_finance ON mysiacrm.refunds;
CREATE TRIGGER trigger_log_refund_to_finance
  AFTER INSERT ON mysiacrm.refunds
  FOR EACH ROW
  EXECUTE FUNCTION mysiacrm.log_refund_to_finance();

-- Tablo açıklamaları
COMMENT ON TABLE mysiacrm.refunds IS 'İade işlemleri';
COMMENT ON COLUMN mysiacrm.refunds.method IS 'İade yöntemi: manual (nakit), credit (kredi kartı), bank (banka transferi)';
