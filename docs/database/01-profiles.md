# 1. Profiles Tablosu

Bu tablo, kullanıcı profillerini saklar ve `auth.users` tablosu ile ilişkilidir.

## Tablo Yapısı

- **id**: UUID (auth.users.id ile ilişkili)
- **full_name**: Kullanıcının tam adı
- **phone**: Telefon numarası
- **role**: Kullanıcı rolü (admin, personel, rehber, müşteri)
- **created_at**: Oluşturulma tarihi

## SQL Script

Aşağıdaki SQL kodunu **Supabase Studio > SQL Editor**'da çalıştırın:

```sql
-- 1. Profiles tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'personel' CHECK (role IN ('admin', 'personel', 'rehber', 'müşteri')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS (Row Level Security) aktif et
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Politikaları
-- Kullanıcılar kendi profillerini görebilir
CREATE POLICY "Kullanıcılar kendi profillerini görebilir"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admin tüm profilleri görebilir
CREATE POLICY "Admin tüm profilleri görebilir"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin tüm profilleri güncelleyebilir
CREATE POLICY "Admin tüm profilleri güncelleyebilir"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Yeni kullanıcı kaydında otomatik profil oluştur
CREATE POLICY "Yeni kullanıcılar profil oluşturabilir"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- 5. Trigger: Kullanıcı silindiğinde profili de sil (CASCADE ile otomatik)
-- Ek bir trigger'a gerek yok, ON DELETE CASCADE zaten bunu yapıyor

COMMENT ON TABLE public.profiles IS 'Kullanıcı profil bilgileri';
COMMENT ON COLUMN public.profiles.role IS 'Kullanıcı rolü: admin, personel, rehber, müşteri';
```

## Doğrulama

Script çalıştıktan sonra kontrol edin:

1. **Table Editor**'da `profiles` tablosunu görmelisiniz
2. **Policies** sekmesinde 5 politika olmalı
3. **Indexes** sekmesinde 2 index olmalı

## Test Verisi (Opsiyonel)

İlk admin kullanıcısını oluşturmak için:

```sql
-- Önce auth.users'da bir kullanıcı oluşturun (Supabase Dashboard > Authentication)
-- Sonra bu kullanıcının ID'sini alıp aşağıdaki sorguyu çalıştırın:

INSERT INTO public.profiles (id, full_name, phone, role)
VALUES (
  'KULLANICI_ID_BURAYA', -- Auth'dan aldığınız kullanıcı ID'si
  'Admin Kullanıcı',
  '+90 555 123 4567',
  'admin'
);
```

---

**Sonraki Adım:** `02-clients.md` dosyasını çalıştırın.
