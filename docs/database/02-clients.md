# 2. Clients Tablosu

Bu tablo, müşteri (CRM) bilgilerini saklar.

## Tablo Yapısı

- **id**: UUID (otomatik)
- **name**: Müşteri adı
- **phone**: Telefon numarası
- **email**: E-posta adresi
- **notes**: Notlar
- **created_at**: Oluşturulma tarihi

## SQL Script

Aşağıdaki SQL kodunu **Supabase Studio > SQL Editor**'da çalıştırın:

```sql
-- 1. Clients tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS (Row Level Security) aktif et
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 3. RLS Politikaları
-- Tüm yetkili kullanıcılar müşterileri görebilir
CREATE POLICY "Yetkili kullanıcılar müşterileri görebilir"
  ON public.clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Admin ve personel müşteri ekleyebilir
CREATE POLICY "Admin ve personel müşteri ekleyebilir"
  ON public.clients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Admin ve personel müşteri güncelleyebilir
CREATE POLICY "Admin ve personel müşteri güncelleyebilir"
  ON public.clients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Sadece admin müşteri silebilir
CREATE POLICY "Sadece admin müşteri silebilir"
  ON public.clients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);

-- 5. Full-text search için (Türkçe arama)
CREATE INDEX IF NOT EXISTS idx_clients_search ON public.clients 
  USING gin(to_tsvector('turkish', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));

COMMENT ON TABLE public.clients IS 'Müşteri (CRM) bilgileri';
COMMENT ON COLUMN public.clients.notes IS 'Müşteri hakkında notlar';
```

## Doğrulama

Script çalıştıktan sonra kontrol edin:

1. **Table Editor**'da `clients` tablosunu görmelisiniz
2. **Policies** sekmesinde 4 politika olmalı
3. **Indexes** sekmesinde 5 index olmalı

## Test Verisi (Opsiyonel)

```sql
-- Örnek müşteri verileri
INSERT INTO public.clients (name, phone, email, notes) VALUES
  ('Ahmet Yılmaz', '+90 555 111 2233', 'ahmet@example.com', 'VIP müşteri'),
  ('Ayşe Demir', '+90 555 222 3344', 'ayse@example.com', 'Kurumsal müşteri'),
  ('Mehmet Kaya', '+90 555 333 4455', 'mehmet@example.com', NULL);
```

---

**Sonraki Adım:** `03-tours.md` dosyasını çalıştırın.
