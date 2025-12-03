# 6. Transfer Bookings Tablosu

Bu tablo, transfer rezervasyonlarını saklar.

## Tablo Yapısı

- **id**: UUID (otomatik)
- **transfer_id**: Transfer ID (FK)
- **client_id**: Müşteri ID (FK)
- **seat_number**: Koltuk numarası
- **amount_paid**: Ödenen tutar
- **payment_status**: Ödeme durumu (paid, pending, refunded)
- **booking_status**: Rezervasyon durumu (confirmed, cancelled, transferred)
- **created_at**: Oluşturulma tarihi

## SQL Script

Aşağıdaki SQL kodunu **Supabase Studio > SQL Editor**'da çalıştırın:

```sql
-- 1. Transfer Bookings tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.transfer_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL CHECK (seat_number > 0),
  amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid >= 0),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'refunded')),
  booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'transferred')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_seat_per_transfer UNIQUE (transfer_id, seat_number)
);

-- 2. RLS (Row Level Security) aktif et
ALTER TABLE public.transfer_bookings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Politikaları
-- Tüm yetkili kullanıcılar transfer rezervasyonlarını görebilir
CREATE POLICY "Yetkili kullanıcılar transfer rezervasyonlarını görebilir"
  ON public.transfer_bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Admin ve personel transfer rezervasyonu ekleyebilir
CREATE POLICY "Admin ve personel transfer rezervasyonu ekleyebilir"
  ON public.transfer_bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Admin ve personel transfer rezervasyonu güncelleyebilir
CREATE POLICY "Admin ve personel transfer rezervasyonu güncelleyebilir"
  ON public.transfer_bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Sadece admin transfer rezervasyonu silebilir
CREATE POLICY "Sadece admin transfer rezervasyonu silebilir"
  ON public.transfer_bookings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_transfer_id ON public.transfer_bookings(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_client_id ON public.transfer_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_status ON public.transfer_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_payment_status ON public.transfer_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_created_at ON public.transfer_bookings(created_at DESC);

-- 5. Trigger: Koltuk numarası yolcu sayısını aşmasın
CREATE OR REPLACE FUNCTION check_transfer_seat_capacity()
RETURNS TRIGGER AS $$
DECLARE
  transfer_capacity INTEGER;
BEGIN
  SELECT passenger_count INTO transfer_capacity
  FROM public.transfers
  WHERE id = NEW.transfer_id;
  
  IF NEW.seat_number > transfer_capacity THEN
    RAISE EXCEPTION 'Koltuk numarası (%) transfer kapasitesini (%) aşıyor', NEW.seat_number, transfer_capacity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_transfer_seat_capacity
  BEFORE INSERT OR UPDATE ON public.transfer_bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_transfer_seat_capacity();

COMMENT ON TABLE public.transfer_bookings IS 'Transfer rezervasyonları';
COMMENT ON COLUMN public.transfer_bookings.seat_number IS 'Koltuk numarası (transfer kapasitesini aşamaz)';
COMMENT ON CONSTRAINT unique_seat_per_transfer ON public.transfer_bookings IS 'Bir transferde aynı koltuk numarası tekrar edilemez';
```

## Doğrulama

Script çalıştıktan sonra kontrol edin:

1. **Table Editor**'da `transfer_bookings` tablosunu görmelisiniz
2. **Policies** sekmesinde 4 politika olmalı
3. **Indexes** sekmesinde 5 index olmalı
4. **Triggers** sekmesinde 1 trigger olmalı
5. **Constraints** sekmesinde `unique_seat_per_transfer` kısıtlaması olmalı

## Test Verisi (Opsiyonel)

```sql
-- Önce transfers ve clients tablolarında veri olduğundan emin olun
-- Örnek transfer rezervasyon verileri
INSERT INTO public.transfer_bookings (transfer_id, client_id, seat_number, amount_paid, booking_status, payment_status)
SELECT 
  t.id,
  c.id,
  1,
  150.00,
  'confirmed',
  'paid'
FROM public.transfers t
CROSS JOIN public.clients c
LIMIT 1;
```

---

**Sonraki Adım:** `07-expenses.md` dosyasını çalıştırın.
