-- =============================================
-- 1. PROFILES TABLOSU
-- Kullanıcı profil bilgileri
-- =============================================

-- Tabloyu oluştur
CREATE TABLE IF NOT EXISTS mysiacrm.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'personel' CHECK (role IN ('admin', 'personel', 'rehber', 'müşteri')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) aktif et
ALTER TABLE mysiacrm.profiles ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini görebilir" ON mysiacrm.profiles;
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini güncelleyebilir" ON mysiacrm.profiles;
DROP POLICY IF EXISTS "Admin tüm profilleri görebilir" ON mysiacrm.profiles;
DROP POLICY IF EXISTS "Admin tüm profilleri güncelleyebilir" ON mysiacrm.profiles;
DROP POLICY IF EXISTS "Yeni kullanıcılar profil oluşturabilir" ON mysiacrm.profiles;

-- RLS Politikaları
CREATE POLICY "Kullanıcılar kendi profillerini görebilir"
  ON mysiacrm.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir"
  ON mysiacrm.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin tüm profilleri görebilir"
  ON mysiacrm.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin tüm profilleri güncelleyebilir"
  ON mysiacrm.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Yeni kullanıcılar profil oluşturabilir"
  ON mysiacrm.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON mysiacrm.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON mysiacrm.profiles(created_at);

-- Tablo açıklaması
COMMENT ON TABLE mysiacrm.profiles IS 'Kullanıcı profil bilgileri';
COMMENT ON COLUMN mysiacrm.profiles.role IS 'Kullanıcı rolü: admin, personel, rehber, müşteri';
