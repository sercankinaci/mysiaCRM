-- =============================================================================
-- MYSIA CRM - FULL DATABASE SCHEMA (MYSIACRM SCHEMA VERSION)
-- Version: 1.2
-- Schema: mysiacrm
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. SCHEMA KURULUMU
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS mysiacrm;

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

GRANT ALL ON ALL FUNCTIONS IN SCHEMA mysiacrm TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA mysiacrm TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA mysiacrm TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA mysiacrm TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA mysiacrm GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA mysiacrm GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA mysiacrm GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mysiacrm.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'personel' CHECK (role IN ('admin', 'personel', 'rehber', 'müşteri')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mysiacrm.profiles ENABLE ROW LEVEL SECURITY;

-- Politikaları Temizle & Oluştur
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini görebilir" ON mysiacrm.profiles;
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini güncelleyebilir" ON mysiacrm.profiles;
DROP POLICY IF EXISTS "Admin tüm profilleri görebilir" ON mysiacrm.profiles;
DROP POLICY IF EXISTS "Admin tüm profilleri güncelleyebilir" ON mysiacrm.profiles;
DROP POLICY IF EXISTS "Yeni kullanıcılar profil oluşturabilir" ON mysiacrm.profiles;

CREATE POLICY "Kullanıcılar kendi profillerini görebilir" ON mysiacrm.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir" ON mysiacrm.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin tüm profilleri görebilir" ON mysiacrm.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin tüm profilleri güncelleyebilir" ON mysiacrm.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Yeni kullanıcılar profil oluşturabilir" ON mysiacrm.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON mysiacrm.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON mysiacrm.profiles(created_at);

-- -----------------------------------------------------------------------------
-- 2. CLIENTS TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mysiacrm.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mysiacrm.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar müşterileri görebilir" ON mysiacrm.clients;
DROP POLICY IF EXISTS "Admin ve personel müşteri ekleyebilir" ON mysiacrm.clients;
DROP POLICY IF EXISTS "Admin ve personel müşteri güncelleyebilir" ON mysiacrm.clients;
DROP POLICY IF EXISTS "Sadece admin müşteri silebilir" ON mysiacrm.clients;

CREATE POLICY "Yetkili kullanıcılar müşterileri görebilir" ON mysiacrm.clients FOR SELECT USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel müşteri ekleyebilir" ON mysiacrm.clients FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin ve personel müşteri güncelleyebilir" ON mysiacrm.clients FOR UPDATE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin müşteri silebilir" ON mysiacrm.clients FOR DELETE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_clients_name ON mysiacrm.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON mysiacrm.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON mysiacrm.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON mysiacrm.clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_search ON mysiacrm.clients USING gin(to_tsvector('turkish', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));

-- -----------------------------------------------------------------------------
-- 3. TOURS TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mysiacrm.tours (
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

ALTER TABLE mysiacrm.tours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar turları görebilir" ON mysiacrm.tours;
DROP POLICY IF EXISTS "Admin ve personel tur ekleyebilir" ON mysiacrm.tours;
DROP POLICY IF EXISTS "Admin ve personel tur güncelleyebilir" ON mysiacrm.tours;
DROP POLICY IF EXISTS "Sadece admin tur silebilir" ON mysiacrm.tours;

CREATE POLICY "Yetkili kullanıcılar turları görebilir" ON mysiacrm.tours FOR SELECT USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel tur ekleyebilir" ON mysiacrm.tours FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin ve personel tur güncelleyebilir" ON mysiacrm.tours FOR UPDATE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin tur silebilir" ON mysiacrm.tours FOR DELETE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_tours_status ON mysiacrm.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_start_date ON mysiacrm.tours(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_tours_created_at ON mysiacrm.tours(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tours_active ON mysiacrm.tours(status, start_date) WHERE status = 'active';

CREATE OR REPLACE FUNCTION mysiacrm.check_cancellation_reason() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND (NEW.cancellation_reason IS NULL OR NEW.cancellation_reason = '') THEN
    RAISE EXCEPTION 'İptal nedeni belirtilmelidir';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_cancellation_reason ON mysiacrm.tours;
CREATE TRIGGER trigger_check_cancellation_reason BEFORE INSERT OR UPDATE ON mysiacrm.tours FOR EACH ROW EXECUTE FUNCTION mysiacrm.check_cancellation_reason();

-- -----------------------------------------------------------------------------
-- 4. BOOKINGS TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mysiacrm.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES mysiacrm.tours(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES mysiacrm.clients(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL CHECK (seat_number > 0),
  amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid >= 0),
  booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'transferred')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'refunded')),
  new_tour_id UUID REFERENCES mysiacrm.tours(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_seat_per_tour UNIQUE (tour_id, seat_number)
);

ALTER TABLE mysiacrm.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar rezervasyonları görebilir" ON mysiacrm.bookings;
DROP POLICY IF EXISTS "Admin ve personel rezervasyon ekleyebilir" ON mysiacrm.bookings;
DROP POLICY IF EXISTS "Admin ve personel rezervasyon güncelleyebilir" ON mysiacrm.bookings;
DROP POLICY IF EXISTS "Sadece admin rezervasyon silebilir" ON mysiacrm.bookings;

CREATE POLICY "Yetkili kullanıcılar rezervasyonları görebilir" ON mysiacrm.bookings FOR SELECT USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel rezervasyon ekleyebilir" ON mysiacrm.bookings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin ve personel rezervasyon güncelleyebilir" ON mysiacrm.bookings FOR UPDATE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin rezervasyon silebilir" ON mysiacrm.bookings FOR DELETE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_bookings_tour_id ON mysiacrm.bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON mysiacrm.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON mysiacrm.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON mysiacrm.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON mysiacrm.bookings(created_at DESC);

CREATE OR REPLACE FUNCTION mysiacrm.check_seat_capacity() RETURNS TRIGGER AS $$
DECLARE
  tour_capacity INTEGER;
BEGIN
  SELECT capacity INTO tour_capacity FROM mysiacrm.tours WHERE id = NEW.tour_id;
  IF NEW.seat_number > tour_capacity THEN
    RAISE EXCEPTION 'Koltuk numarası (%) tur kapasitesini (%) aşıyor', NEW.seat_number, tour_capacity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_seat_capacity ON mysiacrm.bookings;
CREATE TRIGGER trigger_check_seat_capacity BEFORE INSERT OR UPDATE ON mysiacrm.bookings FOR EACH ROW EXECUTE FUNCTION mysiacrm.check_seat_capacity();

CREATE OR REPLACE FUNCTION mysiacrm.update_tour_income_on_booking() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.booking_status = 'confirmed' THEN
    UPDATE mysiacrm.tours SET total_income = total_income + NEW.amount_paid WHERE id = NEW.tour_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
      UPDATE mysiacrm.tours SET total_income = total_income - OLD.amount_paid WHERE id = OLD.tour_id;
    END IF;
    IF OLD.booking_status = 'cancelled' AND NEW.booking_status = 'confirmed' THEN
      UPDATE mysiacrm.tours SET total_income = total_income + NEW.amount_paid WHERE id = NEW.tour_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.booking_status = 'confirmed' THEN
    UPDATE mysiacrm.tours SET total_income = total_income - OLD.amount_paid WHERE id = OLD.tour_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tour_income ON mysiacrm.bookings;
CREATE TRIGGER trigger_update_tour_income AFTER INSERT OR UPDATE OR DELETE ON mysiacrm.bookings FOR EACH ROW EXECUTE FUNCTION mysiacrm.update_tour_income_on_booking();

-- -----------------------------------------------------------------------------
-- 5. TRANSFERS TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mysiacrm.transfers (
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
  related_tour_id UUID REFERENCES mysiacrm.tours(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mysiacrm.transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar transferleri görebilir" ON mysiacrm.transfers;
DROP POLICY IF EXISTS "Admin ve personel transfer ekleyebilir" ON mysiacrm.transfers;
DROP POLICY IF EXISTS "Admin ve personel transfer güncelleyebilir" ON mysiacrm.transfers;
DROP POLICY IF EXISTS "Sadece admin transfer silebilir" ON mysiacrm.transfers;

CREATE POLICY "Yetkili kullanıcılar transferleri görebilir" ON mysiacrm.transfers FOR SELECT USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel transfer ekleyebilir" ON mysiacrm.transfers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin ve personel transfer güncelleyebilir" ON mysiacrm.transfers FOR UPDATE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin transfer silebilir" ON mysiacrm.transfers FOR DELETE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_transfers_date ON mysiacrm.transfers(date DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON mysiacrm.transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_type ON mysiacrm.transfers(type);
CREATE INDEX IF NOT EXISTS idx_transfers_driver_id ON mysiacrm.transfers(driver_id);
CREATE INDEX IF NOT EXISTS idx_transfers_vehicle_id ON mysiacrm.transfers(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_transfers_related_tour ON mysiacrm.transfers(related_tour_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON mysiacrm.transfers(created_at DESC);

-- -----------------------------------------------------------------------------
-- 6. TRANSFER BOOKINGS TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mysiacrm.transfer_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES mysiacrm.transfers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES mysiacrm.clients(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL CHECK (seat_number > 0),
  amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid >= 0),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'refunded')),
  booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'transferred')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_seat_per_transfer UNIQUE (transfer_id, seat_number)
);

ALTER TABLE mysiacrm.transfer_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar transfer rezervasyonlarını görebilir" ON mysiacrm.transfer_bookings;
DROP POLICY IF EXISTS "Admin ve personel transfer rezervasyonu ekleyebilir" ON mysiacrm.transfer_bookings;
DROP POLICY IF EXISTS "Admin ve personel transfer rezervasyonu güncelleyebilir" ON mysiacrm.transfer_bookings;
DROP POLICY IF EXISTS "Sadece admin transfer rezervasyonu silebilir" ON mysiacrm.transfer_bookings;

CREATE POLICY "Yetkili kullanıcılar transfer rezervasyonlarını görebilir" ON mysiacrm.transfer_bookings FOR SELECT USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel transfer rezervasyonu ekleyebilir" ON mysiacrm.transfer_bookings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin ve personel transfer rezervasyonu güncelleyebilir" ON mysiacrm.transfer_bookings FOR UPDATE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin transfer rezervasyonu silebilir" ON mysiacrm.transfer_bookings FOR DELETE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_transfer_bookings_transfer_id ON mysiacrm.transfer_bookings(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_client_id ON mysiacrm.transfer_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_status ON mysiacrm.transfer_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_payment_status ON mysiacrm.transfer_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_created_at ON mysiacrm.transfer_bookings(created_at DESC);

CREATE OR REPLACE FUNCTION mysiacrm.check_transfer_seat_capacity() RETURNS TRIGGER AS $$
DECLARE
  transfer_capacity INTEGER;
BEGIN
  SELECT passenger_count INTO transfer_capacity FROM mysiacrm.transfers WHERE id = NEW.transfer_id;
  IF NEW.seat_number > transfer_capacity THEN
    RAISE EXCEPTION 'Koltuk numarası (%) transfer kapasitesini (%) aşıyor', NEW.seat_number, transfer_capacity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_transfer_seat_capacity ON mysiacrm.transfer_bookings;
CREATE TRIGGER trigger_check_transfer_seat_capacity BEFORE INSERT OR UPDATE ON mysiacrm.transfer_bookings FOR EACH ROW EXECUTE FUNCTION mysiacrm.check_transfer_seat_capacity();

-- -----------------------------------------------------------------------------
-- 7. EXPENSES TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mysiacrm.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES mysiacrm.tours(id) ON DELETE CASCADE,
  transfer_id UUID REFERENCES mysiacrm.transfers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  supplier TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT expense_source_check CHECK ((tour_id IS NOT NULL AND transfer_id IS NULL) OR (tour_id IS NULL AND transfer_id IS NOT NULL))
);

ALTER TABLE mysiacrm.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar giderleri görebilir" ON mysiacrm.expenses;
DROP POLICY IF EXISTS "Admin ve personel gider ekleyebilir" ON mysiacrm.expenses;
DROP POLICY IF EXISTS "Admin ve personel gider güncelleyebilir" ON mysiacrm.expenses;
DROP POLICY IF EXISTS "Sadece admin gider silebilir" ON mysiacrm.expenses;

CREATE POLICY "Yetkili kullanıcılar giderleri görebilir" ON mysiacrm.expenses FOR SELECT USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel gider ekleyebilir" ON mysiacrm.expenses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin ve personel gider güncelleyebilir" ON mysiacrm.expenses FOR UPDATE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin gider silebilir" ON mysiacrm.expenses FOR DELETE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_expenses_tour_id ON mysiacrm.expenses(tour_id);
CREATE INDEX IF NOT EXISTS idx_expenses_transfer_id ON mysiacrm.expenses(transfer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON mysiacrm.expenses(type);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier ON mysiacrm.expenses(supplier);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON mysiacrm.expenses(created_at DESC);

CREATE OR REPLACE FUNCTION mysiacrm.update_tour_expense() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.tour_id IS NOT NULL THEN
    UPDATE mysiacrm.tours SET total_expense = total_expense + NEW.amount WHERE id = NEW.tour_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.tour_id IS NOT NULL THEN
    IF OLD.tour_id = NEW.tour_id THEN
      UPDATE mysiacrm.tours SET total_expense = total_expense - OLD.amount + NEW.amount WHERE id = NEW.tour_id;
    ELSE
      UPDATE mysiacrm.tours SET total_expense = total_expense - OLD.amount WHERE id = OLD.tour_id;
      UPDATE mysiacrm.tours SET total_expense = total_expense + NEW.amount WHERE id = NEW.tour_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.tour_id IS NOT NULL THEN
    UPDATE mysiacrm.tours SET total_expense = total_expense - OLD.amount WHERE id = OLD.tour_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tour_expense ON mysiacrm.expenses;
CREATE TRIGGER trigger_update_tour_expense AFTER INSERT OR UPDATE OR DELETE ON mysiacrm.expenses FOR EACH ROW EXECUTE FUNCTION mysiacrm.update_tour_expense();

-- -----------------------------------------------------------------------------
-- 8. FINANCE TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mysiacrm.finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'refund', 'transferProfit')),
  source_type TEXT NOT NULL CHECK (source_type IN ('tour', 'transfer', 'booking', 'expense', 'refund')),
  source_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mysiacrm.finance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar finans kayıtlarını görebilir" ON mysiacrm.finance;
DROP POLICY IF EXISTS "Admin ve personel finans kaydı ekleyebilir" ON mysiacrm.finance;
DROP POLICY IF EXISTS "Sadece admin finans kaydı güncelleyebilir" ON mysiacrm.finance;
DROP POLICY IF EXISTS "Sadece admin finans kaydı silebilir" ON mysiacrm.finance;

CREATE POLICY "Yetkili kullanıcılar finans kayıtlarını görebilir" ON mysiacrm.finance FOR SELECT USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel finans kaydı ekleyebilir" ON mysiacrm.finance FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin finans kaydı güncelleyebilir" ON mysiacrm.finance FOR UPDATE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Sadece admin finans kaydı silebilir" ON mysiacrm.finance FOR DELETE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_finance_type ON mysiacrm.finance(type);
CREATE INDEX IF NOT EXISTS idx_finance_source_type ON mysiacrm.finance(source_type);
CREATE INDEX IF NOT EXISTS idx_finance_source_id ON mysiacrm.finance(source_id);
CREATE INDEX IF NOT EXISTS idx_finance_created_at ON mysiacrm.finance(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_amount ON mysiacrm.finance(amount);

CREATE OR REPLACE FUNCTION mysiacrm.log_booking_to_finance() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.booking_status = 'confirmed' THEN
    INSERT INTO mysiacrm.finance (type, source_type, source_id, amount, description) VALUES ('income', 'booking', NEW.id, NEW.amount_paid, 'Rezervasyon geliri');
  ELSIF TG_OP = 'UPDATE' AND OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
    INSERT INTO mysiacrm.finance (type, source_type, source_id, amount, description) VALUES ('refund', 'booking', NEW.id, -NEW.amount_paid, 'Rezervasyon iptali - iade');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_booking_to_finance ON mysiacrm.bookings;
CREATE TRIGGER trigger_log_booking_to_finance AFTER INSERT OR UPDATE ON mysiacrm.bookings FOR EACH ROW EXECUTE FUNCTION mysiacrm.log_booking_to_finance();

CREATE OR REPLACE FUNCTION mysiacrm.log_expense_to_finance() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO mysiacrm.finance (type, source_type, source_id, amount, description) VALUES ('expense', 'expense', NEW.id, -NEW.amount, NEW.type || ' - ' || NEW.supplier);
  ELSIF TG_OP = 'UPDATE' THEN
    DELETE FROM mysiacrm.finance WHERE source_type = 'expense' AND source_id = OLD.id;
    INSERT INTO mysiacrm.finance (type, source_type, source_id, amount, description) VALUES ('expense', 'expense', NEW.id, -NEW.amount, NEW.type || ' - ' || NEW.supplier);
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM mysiacrm.finance WHERE source_type = 'expense' AND source_id = OLD.id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_expense_to_finance ON mysiacrm.expenses;
CREATE TRIGGER trigger_log_expense_to_finance AFTER INSERT OR UPDATE OR DELETE ON mysiacrm.expenses FOR EACH ROW EXECUTE FUNCTION mysiacrm.log_expense_to_finance();

CREATE OR REPLACE VIEW mysiacrm.finance_summary AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expense,
  SUM(CASE WHEN type = 'refund' THEN ABS(amount) ELSE 0 END) as total_refund,
  SUM(amount) as net_profit
FROM mysiacrm.finance
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- -----------------------------------------------------------------------------
-- 9. REFUNDS TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mysiacrm.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES mysiacrm.bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES mysiacrm.clients(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  method TEXT NOT NULL CHECK (method IN ('manual', 'credit', 'bank')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mysiacrm.refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar iadeleri görebilir" ON mysiacrm.refunds;
DROP POLICY IF EXISTS "Admin ve personel iade ekleyebilir" ON mysiacrm.refunds;
DROP POLICY IF EXISTS "Sadece admin iade güncelleyebilir" ON mysiacrm.refunds;
DROP POLICY IF EXISTS "Sadece admin iade silebilir" ON mysiacrm.refunds;

CREATE POLICY "Yetkili kullanıcılar iadeleri görebilir" ON mysiacrm.refunds FOR SELECT USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel iade ekleyebilir" ON mysiacrm.refunds FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin iade güncelleyebilir" ON mysiacrm.refunds FOR UPDATE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Sadece admin iade silebilir" ON mysiacrm.refunds FOR DELETE USING (EXISTS (SELECT 1 FROM mysiacrm.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON mysiacrm.refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_client_id ON mysiacrm.refunds(client_id);
CREATE INDEX IF NOT EXISTS idx_refunds_method ON mysiacrm.refunds(method);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON mysiacrm.refunds(created_at DESC);

CREATE OR REPLACE FUNCTION mysiacrm.log_refund_to_finance() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO mysiacrm.finance (type, source_type, source_id, amount, description) VALUES ('refund', 'refund', NEW.id, -NEW.amount, 'İade - ' || NEW.method);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_refund_to_finance ON mysiacrm.refunds;
CREATE TRIGGER trigger_log_refund_to_finance AFTER INSERT ON mysiacrm.refunds FOR EACH ROW EXECUTE FUNCTION mysiacrm.log_refund_to_finance();

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
