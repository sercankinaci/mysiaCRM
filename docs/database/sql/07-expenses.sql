-- =============================================
-- 7. EXPENSES TABLOSU
-- Tur ve transfer giderleri
-- =============================================

-- Tabloyu oluştur
CREATE TABLE IF NOT EXISTS mysiacrm.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES mysiacrm.tours(id) ON DELETE CASCADE,
  transfer_id UUID REFERENCES mysiacrm.transfers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  supplier TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT expense_source_check CHECK (
    (tour_id IS NOT NULL AND transfer_id IS NULL) OR
    (tour_id IS NULL AND transfer_id IS NOT NULL)
  )
);

-- RLS (Row Level Security) aktif et
ALTER TABLE mysiacrm.expenses ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Yetkili kullanıcılar giderleri görebilir" ON mysiacrm.expenses;
DROP POLICY IF EXISTS "Admin ve personel gider ekleyebilir" ON mysiacrm.expenses;
DROP POLICY IF EXISTS "Admin ve personel gider güncelleyebilir" ON mysiacrm.expenses;
DROP POLICY IF EXISTS "Sadece admin gider silebilir" ON mysiacrm.expenses;

-- RLS Politikaları
CREATE POLICY "Yetkili kullanıcılar giderleri görebilir"
  ON mysiacrm.expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin ve personel gider ekleyebilir"
  ON mysiacrm.expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Admin ve personel gider güncelleyebilir"
  ON mysiacrm.expenses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Sadece admin gider silebilir"
  ON mysiacrm.expenses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_expenses_tour_id ON mysiacrm.expenses(tour_id);
CREATE INDEX IF NOT EXISTS idx_expenses_transfer_id ON mysiacrm.expenses(transfer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON mysiacrm.expenses(type);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier ON mysiacrm.expenses(supplier);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON mysiacrm.expenses(created_at DESC);

-- Trigger: Gider eklendiğinde/güncellendiğinde tur giderini güncelle
CREATE OR REPLACE FUNCTION mysiacrm.update_tour_expense()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.tour_id IS NOT NULL THEN
    -- Yeni gider eklendiğinde
    UPDATE mysiacrm.tours
    SET total_expense = total_expense + NEW.amount
    WHERE id = NEW.tour_id;
    
  ELSIF TG_OP = 'UPDATE' AND NEW.tour_id IS NOT NULL THEN
    -- Gider güncellendiğinde
    IF OLD.tour_id = NEW.tour_id THEN
      -- Aynı tur için güncelleme
      UPDATE mysiacrm.tours
      SET total_expense = total_expense - OLD.amount + NEW.amount
      WHERE id = NEW.tour_id;
    ELSE
      -- Farklı tura taşınma
      UPDATE mysiacrm.tours
      SET total_expense = total_expense - OLD.amount
      WHERE id = OLD.tour_id;
      
      UPDATE mysiacrm.tours
      SET total_expense = total_expense + NEW.amount
      WHERE id = NEW.tour_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' AND OLD.tour_id IS NOT NULL THEN
    -- Gider silindiğinde
    UPDATE mysiacrm.tours
    SET total_expense = total_expense - OLD.amount
    WHERE id = OLD.tour_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tour_expense ON mysiacrm.expenses;
CREATE TRIGGER trigger_update_tour_expense
  AFTER INSERT OR UPDATE OR DELETE ON mysiacrm.expenses
  FOR EACH ROW
  EXECUTE FUNCTION mysiacrm.update_tour_expense();

-- Tablo açıklamaları
COMMENT ON TABLE mysiacrm.expenses IS 'Tur ve transfer giderleri';
COMMENT ON COLUMN mysiacrm.expenses.type IS 'Gider tipi (örn: konaklama, ulaşım, yemek, rehber)';
COMMENT ON CONSTRAINT expense_source_check ON mysiacrm.expenses IS 'Gider ya tura ya da transfere ait olmalı, ikisine birden olamaz';
