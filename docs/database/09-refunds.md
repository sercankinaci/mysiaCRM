# 9. Refunds Tablosu

Bu tablo, iade işlemlerini saklar.

## Tablo Yapısı

- **id**: UUID (otomatik)
- **booking_id**: Rezervasyon ID (FK)
- **client_id**: Müşteri ID (FK)
- **amount**: İade tutarı
- **method**: İade yöntemi (manual, credit, bank)
- **created_at**: Oluşturulma tarihi

## SQL Script

Aşağıdaki SQL kodunu **Supabase Studio > SQL Editor**'da çalıştırın:

```sql
-- 1. Refunds tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  method TEXT NOT NULL CHECK (method IN ('manual', 'credit', 'bank')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS (Row Level Security) aktif et
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- 3. RLS Politikaları
-- Tüm yetkili kullanıcılar iadeleri görebilir
CREATE POLICY "Yetkili kullanıcılar iadeleri görebilir"
  ON public.refunds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Admin ve personel iade ekleyebilir
CREATE POLICY "Admin ve personel iade ekleyebilir"
  ON public.refunds
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Sadece admin iade güncelleyebilir
CREATE POLICY "Sadece admin iade güncelleyebilir"
  ON public.refunds
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sadece admin iade silebilir
CREATE POLICY "Sadece admin iade silebilir"
  ON public.refunds
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON public.refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_client_id ON public.refunds(client_id);
CREATE INDEX IF NOT EXISTS idx_refunds_method ON public.refunds(method);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON public.refunds(created_at DESC);

-- 5. Trigger: İade oluşturulduğunda finans kaydı ekle
CREATE OR REPLACE FUNCTION log_refund_to_finance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.finance (type, source_type, source_id, amount, description)
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

CREATE TRIGGER trigger_log_refund_to_finance
  AFTER INSERT ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION log_refund_to_finance();

COMMENT ON TABLE public.refunds IS 'İade işlemleri';
COMMENT ON COLUMN public.refunds.method IS 'İade yöntemi: manual (nakit), credit (kredi kartı), bank (banka transferi)';
```

## Doğrulama

Script çalıştıktan sonra kontrol edin:

1. **Table Editor**'da `refunds` tablosunu görmelisiniz
2. **Policies** sekmesinde 4 politika olmalı
3. **Indexes** sekmesinde 4 index olmalı
4. **Triggers** sekmesinde 1 trigger olmalı

## Test Verisi (Opsiyonel)

```sql
-- Önce bookings ve clients tablolarında veri olduğundan emin olun
-- Örnek iade verisi
INSERT INTO public.refunds (booking_id, client_id, amount, method)
SELECT 
  b.id,
  b.client_id,
  b.amount_paid,
  'bank'
FROM public.bookings b
WHERE b.booking_status = 'cancelled'
LIMIT 1;
```

---

## ✅ VERİTABANI KURULUMU TAMAMLANDI!

Tüm tabloları başarıyla oluşturdunuz. Şimdi yapmanız gerekenler:

### 1. İlk Admin Kullanıcısı Oluşturun

1. **Supabase Dashboard > Authentication > Users** bölümüne gidin
2. "Add User" butonuna tıklayın
3. E-posta ve şifre girin
4. Kullanıcı oluşturulduktan sonra, kullanıcının ID'sini kopyalayın
5. **SQL Editor**'da şu sorguyu çalıştırın:

```sql
INSERT INTO public.profiles (id, full_name, phone, role)
VALUES (
  'KULLANICI_ID_BURAYA_YAPIŞTIRIN',
  'Admin Kullanıcı',
  '+90 555 123 4567',
  'admin'
);
```

### 2. Veritabanı Yapısını Kontrol Edin

```sql
-- Tüm tabloları listele
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Tüm RLS politikalarını listele
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Beklenen Sonuç

Aşağıdaki tablolar olmalı:
- ✅ profiles
- ✅ clients
- ✅ tours
- ✅ bookings
- ✅ transfers
- ✅ transfer_bookings
- ✅ expenses
- ✅ finance
- ✅ refunds

### 4. Sonraki Adımlar

Artık frontend tarafında:
- Turlar modülünü geliştirebiliriz
- Müşteriler (CRM) modülünü ekleyebiliriz
- Rezervasyon sistemini kurabiliriz
- Koltuk seçimi UI'ını oluşturabiliriz

---

**Tebrikler! Veritabanı kurulumu tamamlandı.** 🎉
