-- =============================================
-- 8. FINANCE (LEDGER) TABLOSU
-- Genel muhasebe defteri
-- =============================================

-- Tabloyu oluştur
CREATE TABLE IF NOT EXISTS mysiacrm.finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'refund', 'transferProfit')),
  source_type TEXT NOT NULL CHECK (source_type IN ('tour', 'transfer', 'booking', 'expense', 'refund')),
  source_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) aktif et
ALTER TABLE mysiacrm.finance ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Yetkili kullanıcılar finans kayıtlarını görebilir" ON mysiacrm.finance;
DROP POLICY IF EXISTS "Admin ve personel finans kaydı ekleyebilir" ON mysiacrm.finance;
DROP POLICY IF EXISTS "Sadece admin finans kaydı güncelleyebilir" ON mysiacrm.finance;
DROP POLICY IF EXISTS "Sadece admin finans kaydı silebilir" ON mysiacrm.finance;

-- RLS Politikaları
CREATE POLICY "Yetkili kullanıcılar finans kayıtlarını görebilir"
  ON mysiacrm.finance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin ve personel finans kaydı ekleyebilir"
  ON mysiacrm.finance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Sadece admin finans kaydı güncelleyebilir"
  ON mysiacrm.finance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Sadece admin finans kaydı silebilir"
  ON mysiacrm.finance
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_finance_type ON mysiacrm.finance(type);
CREATE INDEX IF NOT EXISTS idx_finance_source_type ON mysiacrm.finance(source_type);
CREATE INDEX IF NOT EXISTS idx_finance_source_id ON mysiacrm.finance(source_id);
CREATE INDEX IF NOT EXISTS idx_finance_created_at ON mysiacrm.finance(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_amount ON mysiacrm.finance(amount);

-- Trigger: Rezervasyon oluşturulduğunda finans kaydı ekle
CREATE OR REPLACE FUNCTION mysiacrm.log_booking_to_finance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.booking_status = 'confirmed' THEN
    INSERT INTO mysiacrm.finance (type, source_type, source_id, amount, description)
    VALUES (
      'income',
      'booking',
      NEW.id,
      NEW.amount_paid,
      'Rezervasyon geliri'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
    INSERT INTO mysiacrm.finance (type, source_type, source_id, amount, description)
    VALUES (
      'refund',
      'booking',
      NEW.id,
      -NEW.amount_paid,
      'Rezervasyon iptali - iade'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_booking_to_finance ON mysiacrm.bookings;
CREATE TRIGGER trigger_log_booking_to_finance
  AFTER INSERT OR UPDATE ON mysiacrm.bookings
  FOR EACH ROW
  EXECUTE FUNCTION mysiacrm.log_booking_to_finance();

-- Trigger: Gider eklendiğinde finans kaydı ekle
CREATE OR REPLACE FUNCTION mysiacrm.log_expense_to_finance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO mysiacrm.finance (type, source_type, source_id, amount, description)
    VALUES (
      'expense',
      'expense',
      NEW.id,
      -NEW.amount,
      NEW.type || ' - ' || NEW.supplier
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Eski kaydı sil ve yeni kayıt ekle
    DELETE FROM mysiacrm.finance WHERE source_type = 'expense' AND source_id = OLD.id;
    INSERT INTO mysiacrm.finance (type, source_type, source_id, amount, description)
    VALUES (
      'expense',
      'expense',
      NEW.id,
      -NEW.amount,
      NEW.type || ' - ' || NEW.supplier
    );
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM mysiacrm.finance WHERE source_type = 'expense' AND source_id = OLD.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_expense_to_finance ON mysiacrm.expenses;
CREATE TRIGGER trigger_log_expense_to_finance
  AFTER INSERT OR UPDATE OR DELETE ON mysiacrm.expenses
  FOR EACH ROW
  EXECUTE FUNCTION mysiacrm.log_expense_to_finance();

-- View: Finansal özet
CREATE OR REPLACE VIEW mysiacrm.finance_summary AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expense,
  SUM(CASE WHEN type = 'refund' THEN ABS(amount) ELSE 0 END) as total_refund,
  SUM(amount) as net_profit
FROM mysiacrm.finance
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Tablo açıklamaları
COMMENT ON TABLE mysiacrm.finance IS 'Genel muhasebe defteri - tüm finansal işlemler';
COMMENT ON COLUMN mysiacrm.finance.type IS 'İşlem tipi: income (gelir), expense (gider), refund (iade), transferProfit (transfer kârı)';
COMMENT ON COLUMN mysiacrm.finance.amount IS 'Tutar (gelir pozitif, gider negatif)';
COMMENT ON VIEW mysiacrm.finance_summary IS 'Aylık finansal özet raporu';
