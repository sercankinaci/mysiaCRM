# 5. Transfers Tablosu

Bu tablo, transfer hizmetlerini saklar.

## Tablo Yapısı

- **id**: UUID (otomatik)
- **type**: Transfer tipi (airport, hotel, private, group)
- **pickup**: Alış noktası
- **dropoff**: Bırakış noktası
- **date**: Transfer tarihi
- **time**: Transfer saati
- **vehicle_type**: Araç tipi
- **passenger_count**: Yolcu sayısı
- **price**: Fiyat
- **driver_id**: Şoför ID
- **vehicle_id**: Araç ID
- **related_tour_id**: İlişkili tur ID (opsiyonel)
- **status**: Durum
- **created_at**: Oluşturulma tarihi

## SQL Script

Aşağıdaki SQL kodunu **Supabase Studio > SQL Editor**'da çalıştırın:

```sql
-- 1. Transfers tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.transfers (
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
  related_tour_id UUID REFERENCES public.tours(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS (Row Level Security) aktif et
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- 3. RLS Politikaları
-- Tüm yetkili kullanıcılar transferleri görebilir
CREATE POLICY "Yetkili kullanıcılar transferleri görebilir"
  ON public.transfers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Admin ve personel transfer ekleyebilir
CREATE POLICY "Admin ve personel transfer ekleyebilir"
  ON public.transfers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Admin ve personel transfer güncelleyebilir
CREATE POLICY "Admin ve personel transfer güncelleyebilir"
  ON public.transfers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Sadece admin transfer silebilir
CREATE POLICY "Sadece admin transfer silebilir"
  ON public.transfers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_transfers_date ON public.transfers(date DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_type ON public.transfers(type);
CREATE INDEX IF NOT EXISTS idx_transfers_driver_id ON public.transfers(driver_id);
CREATE INDEX IF NOT EXISTS idx_transfers_vehicle_id ON public.transfers(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_transfers_related_tour ON public.transfers(related_tour_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON public.transfers(created_at DESC);

COMMENT ON TABLE public.transfers IS 'Transfer hizmetleri';
COMMENT ON COLUMN public.transfers.type IS 'Transfer tipi: airport, hotel, private, group';
COMMENT ON COLUMN public.transfers.status IS 'Transfer durumu: pending, confirmed, in_progress, completed, cancelled';
COMMENT ON COLUMN public.transfers.related_tour_id IS 'İlişkili tur (opsiyonel)';
```

## Doğrulama

Script çalıştıktan sonra kontrol edin:

1. **Table Editor**'da `transfers` tablosunu görmelisiniz
2. **Policies** sekmesinde 4 politika olmalı
3. **Indexes** sekmesinde 7 index olmalı

## Test Verisi (Opsiyonel)

```sql
-- Örnek transfer verileri
INSERT INTO public.transfers (type, pickup, dropoff, date, time, vehicle_type, passenger_count, price, status) VALUES
  ('airport', 'Antalya Havalimanı', 'Lara Otel', '2024-12-15', '14:30', 'VIP Minibüs', 8, 1200.00, 'confirmed'),
  ('hotel', 'Side Otel', 'Manavgat Şelalesi', '2024-12-16', '09:00', 'Otobüs', 25, 2500.00, 'pending'),
  ('private', 'Kemer Marina', 'Olimpos', '2024-12-17', '10:00', 'Sedan', 3, 800.00, 'confirmed');
```

---

**Sonraki Adım:** `06-transfer-bookings.md` dosyasını çalıştırın.
