-- =============================================
-- 0. SCHEMA KURULUMU
-- mysiacrm şemasını oluşturur
-- =============================================

-- Şemayı oluştur
CREATE SCHEMA IF NOT EXISTS mysiacrm;

-- Yetkileri ayarla (Gerekirse)
GRANT USAGE ON SCHEMA mysiacrm TO postgres;
GRANT USAGE ON SCHEMA mysiacrm TO anon;
GRANT USAGE ON SCHEMA mysiacrm TO authenticated;
GRANT USAGE ON SCHEMA mysiacrm TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA mysiacrm TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA mysiacrm TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA mysiacrm TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA mysiacrm TO service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA mysiacrm TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA mysiacrm TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA mysiacrm TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA mysiacrm TO service_role;

-- Varsayılan arama yoluna ekle (Opsiyonel)
-- ALTER ROLE authenticated SET search_path = public, mysiacrm;
