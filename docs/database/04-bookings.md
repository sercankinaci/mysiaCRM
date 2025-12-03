# 4. Bookings Tablosu

Bu tablo, tur rezervasyonlarını ve koltuk bilgilerini saklar.

## Tablo Yapısı

- **id**: UUID (otomatik)
- **tour_id**: Tur ID (FK)
- **client_id**: Müşteri ID (FK)
- **seat_number**: Koltuk numarası
- **amount_paid**: Ödenen tutar
- **booking_status**: Rezervasyon durumu (confirmed, cancelled, transferred)
- **payment_status**: Ödeme durumu (paid, pending, refunded)
- **new_tour_id**: Yeni tur ID (transfer durumunda)
- **created_at**: Oluşturulma tarihi

## SQL Script

Aşağıdaki SQL kodunu **Supabase Studio > SQL Editor**'da çalıştırın:

```sql
-- 1. Bookings tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL CHECK (seat_number > 0),
  amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid >= 0),
  booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'transferred')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'refunded')),
  new_tour_id UUID REFERENCES public.tours(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_seat_per_tour UNIQUE (tour_id, seat_number)
);

-- 2. RLS (Row Level Security) aktif et
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Politikaları
-- Tüm yetkili kullanıcılar rezervasyonları görebilir
CREATE POLICY "Yetkili kullanıcılar rezervasyonları görebilir"
  ON public.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Admin ve personel rezervasyon ekleyebilir
CREATE POLICY "Admin ve personel rezervasyon ekleyebilir"
  ON public.bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Admin ve personel rezervasyon güncelleyebilir
CREATE POLICY "Admin ve personel rezervasyon güncelleyebilir"
  ON public.bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Sadece admin rezervasyon silebilir
CREATE POLICY "Sadece admin rezervasyon silebilir"
  ON public.bookings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id ON public.bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- 5. Trigger: Koltuk numarası tur kapasitesini aşmasın
CREATE OR REPLACE FUNCTION check_seat_capacity()
RETURNS TRIGGER AS $$
DECLARE
  tour_capacity INTEGER;
BEGIN
  SELECT capacity INTO tour_capacity
  FROM public.tours
  WHERE id = NEW.tour_id;
  
  IF NEW.seat_number > tour_capacity THEN
    RAISE EXCEPTION 'Koltuk numarası (%) tur kapasitesini (%) aşıyor', NEW.seat_number, tour_capacity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_seat_capacity
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_seat_capacity();

-- 6. Trigger: Rezervasyon oluşturulduğunda tur gelirini güncelle
CREATE OR REPLACE FUNCTION update_tour_income_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.booking_status = 'confirmed' THEN
    -- Yeni rezervasyon eklendiğinde geliri artır
    UPDATE public.tours
    SET total_income = total_income + NEW.amount_paid
    WHERE id = NEW.tour_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Rezervasyon iptal edildiğinde geliri azalt
    IF OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
      UPDATE public.tours
      SET total_income = total_income - OLD.amount_paid
      WHERE id = OLD.tour_id;
    END IF;
    
    -- Rezervasyon yeniden onaylandığında geliri artır
    IF OLD.booking_status = 'cancelled' AND NEW.booking_status = 'confirmed' THEN
      UPDATE public.tours
      SET total_income = total_income + NEW.amount_paid
      WHERE id = NEW.tour_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' AND OLD.booking_status = 'confirmed' THEN
    -- Rezervasyon silindiğinde geliri azalt
    UPDATE public.tours
    SET total_income = total_income - OLD.amount_paid
    WHERE id = OLD.tour_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tour_income
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_tour_income_on_booking();

COMMENT ON TABLE public.bookings IS 'Tur rezervasyonları ve koltuk bilgileri';
COMMENT ON COLUMN public.bookings.seat_number IS 'Koltuk numarası (tur kapasitesini aşamaz)';
COMMENT ON COLUMN public.bookings.new_tour_id IS 'Transfer durumunda yeni tur ID';
COMMENT ON CONSTRAINT unique_seat_per_tour ON public.bookings IS 'Bir turda aynı koltuk numarası tekrar edilemez';
```

## Doğrulama

Script çalıştıktan sonra kontrol edin:

1. **Table Editor**'da `bookings` tablosunu görmelisiniz
2. **Policies** sekmesinde 4 politika olmalı
3. **Indexes** sekmesinde 5 index olmalı
4. **Triggers** sekmesinde 2 trigger olmalı
5. **Constraints** sekmesinde `unique_seat_per_tour` kısıtlaması olmalı

## Test Verisi (Opsiyonel)

```sql
-- Önce tours ve clients tablolarında veri olduğundan emin olun
-- Örnek rezervasyon verileri
INSERT INTO public.bookings (tour_id, client_id, seat_number, amount_paid, booking_status, payment_status)
SELECT 
  t.id,
  c.id,
  1,
  t.price,
  'confirmed',
  'paid'
FROM public.tours t
CROSS JOIN public.clients c
LIMIT 1;
```

---

**Sonraki Adım:** `05-transfers.md` dosyasını çalıştırın.
