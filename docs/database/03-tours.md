# 3. Tours Tablosu

Bu tablo, tur bilgilerini ve finansal verilerini saklar.

## Tablo Yapısı

- **id**: UUID (otomatik)
- **title**: Tur başlığı
- **start_date**: Başlangıç tarihi
- **end_date**: Bitiş tarihi
- **capacity**: Kapasite (koltuk sayısı)
- **price**: Kişi başı fiyat
- **status**: Durum (draft, active, cancelled, completed, postponed)
- **total_income**: Toplam gelir
- **total_expense**: Toplam gider
- **net_profit**: Net kâr
- **cancellation_reason**: İptal nedeni
- **created_at**: Oluşturulma tarihi

## SQL Script

Aşağıdaki SQL kodunu **Supabase Studio > SQL Editor**'da çalıştırın:

```sql
-- 1. Tours tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.tours (
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

-- 2. RLS (Row Level Security) aktif et
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- 3. RLS Politikaları
-- Tüm yetkili kullanıcılar turları görebilir
CREATE POLICY "Yetkili kullanıcılar turları görebilir"
  ON public.tours
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Admin ve personel tur ekleyebilir
CREATE POLICY "Admin ve personel tur ekleyebilir"
  ON public.tours
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Admin ve personel tur güncelleyebilir
CREATE POLICY "Admin ve personel tur güncelleyebilir"
  ON public.tours
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Sadece admin tur silebilir
CREATE POLICY "Sadece admin tur silebilir"
  ON public.tours
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_start_date ON public.tours(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_tours_created_at ON public.tours(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tours_active ON public.tours(status, start_date) 
  WHERE status = 'active';

-- 5. Trigger: Tur iptal edildiğinde iptal nedeni zorunlu
CREATE OR REPLACE FUNCTION check_cancellation_reason()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND (NEW.cancellation_reason IS NULL OR NEW.cancellation_reason = '') THEN
    RAISE EXCEPTION 'İptal nedeni belirtilmelidir';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_cancellation_reason
  BEFORE INSERT OR UPDATE ON public.tours
  FOR EACH ROW
  EXECUTE FUNCTION check_cancellation_reason();

COMMENT ON TABLE public.tours IS 'Tur bilgileri ve finansal verileri';
COMMENT ON COLUMN public.tours.net_profit IS 'Otomatik hesaplanan net kâr (total_income - total_expense)';
COMMENT ON COLUMN public.tours.status IS 'Tur durumu: draft, active, cancelled, completed, postponed';
```

## Doğrulama

Script çalıştıktan sonra kontrol edin:

1. **Table Editor**'da `tours` tablosunu görmelisiniz
2. **Policies** sekmesinde 4 politika olmalı
3. **Indexes** sekmesinde 4 index olmalı
4. **Triggers** sekmesinde 1 trigger olmalı

## Test Verisi (Opsiyonel)

```sql
-- Örnek tur verileri
INSERT INTO public.tours (title, start_date, end_date, capacity, price, status) VALUES
  ('Kapadokya Turu', '2024-12-15', '2024-12-17', 20, 2500.00, 'active'),
  ('Pamukkale Gezisi', '2024-12-18', '2024-12-19', 15, 1800.00, 'active'),
  ('Efes Antik Kenti', '2024-12-22', '2024-12-23', 25, 1500.00, 'draft');
```

---

**Sonraki Adım:** `04-bookings.md` dosyasını çalıştırın.
