-- =============================================
-- 2. CLIENTS TABLOSU
-- Müşteri (CRM) bilgileri
-- =============================================

-- Tabloyu oluştur
CREATE TABLE IF NOT EXISTS mysiacrm.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) aktif et
ALTER TABLE mysiacrm.clients ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Yetkili kullanıcılar müşterileri görebilir" ON mysiacrm.clients;
DROP POLICY IF EXISTS "Admin ve personel müşteri ekleyebilir" ON mysiacrm.clients;
DROP POLICY IF EXISTS "Admin ve personel müşteri güncelleyebilir" ON mysiacrm.clients;
DROP POLICY IF EXISTS "Sadece admin müşteri silebilir" ON mysiacrm.clients;

-- RLS Politikaları
CREATE POLICY "Yetkili kullanıcılar müşterileri görebilir"
  ON mysiacrm.clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin ve personel müşteri ekleyebilir"
  ON mysiacrm.clients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Admin ve personel müşteri güncelleyebilir"
  ON mysiacrm.clients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

CREATE POLICY "Sadece admin müşteri silebilir"
  ON mysiacrm.clients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM mysiacrm.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_clients_name ON mysiacrm.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON mysiacrm.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON mysiacrm.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON mysiacrm.clients(created_at DESC);

-- Full-text search için (Türkçe arama)
CREATE INDEX IF NOT EXISTS idx_clients_search ON mysiacrm.clients 
  USING gin(to_tsvector('turkish', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));

-- Tablo açıklaması
COMMENT ON TABLE mysiacrm.clients IS 'Müşteri (CRM) bilgileri';
COMMENT ON COLUMN mysiacrm.clients.notes IS 'Müşteri hakkında notlar';
