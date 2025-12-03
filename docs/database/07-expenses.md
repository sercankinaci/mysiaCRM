# 7. Expenses Tablosu

Bu tablo, tur ve transfer giderlerini saklar.

## Tablo Yapısı

- **id**: UUID (otomatik)
- **tour_id**: Tur ID (FK, opsiyonel)
- **transfer_id**: Transfer ID (FK, opsiyonel)
- **type**: Gider tipi
- **supplier**: Tedarikçi
- **amount**: Tutar
- **notes**: Notlar
- **created_at**: Oluşturulma tarihi

## SQL Script

Aşağıdaki SQL kodunu **Supabase Studio > SQL Editor**'da çalıştırın:

```sql
-- 1. Expenses tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
  transfer_id UUID REFERENCES public.transfers(id) ON DELETE CASCADE,
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

-- 2. RLS (Row Level Security) aktif et
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 3. RLS Politikaları
-- Tüm yetkili kullanıcılar giderleri görebilir
CREATE POLICY "Yetkili kullanıcılar giderleri görebilir"
  ON public.expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Admin ve personel gider ekleyebilir
CREATE POLICY "Admin ve personel gider ekleyebilir"
  ON public.expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Admin ve personel gider güncelleyebilir
CREATE POLICY "Admin ve personel gider güncelleyebilir"
  ON public.expenses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Sadece admin gider silebilir
CREATE POLICY "Sadece admin gider silebilir"
  ON public.expenses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_expenses_tour_id ON public.expenses(tour_id);
CREATE INDEX IF NOT EXISTS idx_expenses_transfer_id ON public.expenses(transfer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses(type);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier ON public.expenses(supplier);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at DESC);

-- 5. Trigger: Gider eklendiğinde/güncellendiğinde tur giderini güncelle
CREATE OR REPLACE FUNCTION update_tour_expense()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.tour_id IS NOT NULL THEN
    -- Yeni gider eklendiğinde
    UPDATE public.tours
    SET total_expense = total_expense + NEW.amount
    WHERE id = NEW.tour_id;
    
  ELSIF TG_OP = 'UPDATE' AND NEW.tour_id IS NOT NULL THEN
    -- Gider güncellendiğinde
    IF OLD.tour_id = NEW.tour_id THEN
      -- Aynı tur için güncelleme
      UPDATE public.tours
      SET total_expense = total_expense - OLD.amount + NEW.amount
      WHERE id = NEW.tour_id;
    ELSE
      -- Farklı tura taşınma
      UPDATE public.tours
      SET total_expense = total_expense - OLD.amount
      WHERE id = OLD.tour_id;
      
      UPDATE public.tours
      SET total_expense = total_expense + NEW.amount
      WHERE id = NEW.tour_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' AND OLD.tour_id IS NOT NULL THEN
    -- Gider silindiğinde
    UPDATE public.tours
    SET total_expense = total_expense - OLD.amount
    WHERE id = OLD.tour_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tour_expense
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_tour_expense();

COMMENT ON TABLE public.expenses IS 'Tur ve transfer giderleri';
COMMENT ON COLUMN public.expenses.type IS 'Gider tipi (örn: konaklama, ulaşım, yemek, rehber)';
COMMENT ON CONSTRAINT expense_source_check ON public.expenses IS 'Gider ya tura ya da transfere ait olmalı, ikisine birden olamaz';
```

## Doğrulama

Script çalıştıktan sonra kontrol edin:

1. **Table Editor**'da `expenses` tablosunu görmelisiniz
2. **Policies** sekmesinde 4 politika olmalı
3. **Indexes** sekmesinde 5 index olmalı
4. **Triggers** sekmesinde 1 trigger olmalı
5. **Constraints** sekmesinde `expense_source_check` kısıtlaması olmalı

## Test Verisi (Opsiyonel)

```sql
-- Önce tours tablosunda veri olduğundan emin olun
-- Örnek gider verileri
INSERT INTO public.expenses (tour_id, type, supplier, amount, notes)
SELECT 
  id,
  'Konaklama',
  'Hilton Otel',
  15000.00,
  '3 gece konaklama'
FROM public.tours
LIMIT 1;

INSERT INTO public.expenses (tour_id, type, supplier, amount, notes)
SELECT 
  id,
  'Ulaşım',
  'ABC Turizm',
  5000.00,
  'Otobüs kiralama'
FROM public.tours
LIMIT 1;
```

---

**Sonraki Adım:** `08-finance.md` dosyasını çalıştırın.
