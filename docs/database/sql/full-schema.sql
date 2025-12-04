-- =============================================================================
-- MYSIA CRM - FULL DATABASE SCHEMA (PUBLIC SCHEMA VERSION)
-- Version: 1.1
-- Schema: public
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'personel' CHECK (role IN ('admin', 'personel', 'rehber', 'müşteri')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politikaları Temizle & Oluştur
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini güncelleyebilir" ON public.profiles;
DROP POLICY IF EXISTS "Admin tüm profilleri görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Admin tüm profilleri güncelleyebilir" ON public.profiles;
DROP POLICY IF EXISTS "Yeni kullanıcılar profil oluşturabilir" ON public.profiles;

CREATE POLICY "Kullanıcılar kendi profillerini görebilir" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin tüm profilleri görebilir" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin tüm profilleri güncelleyebilir" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Yeni kullanıcılar profil oluşturabilir" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- -----------------------------------------------------------------------------
-- 2. CLIENTS TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar müşterileri görebilir" ON public.clients;
DROP POLICY IF EXISTS "Admin ve personel müşteri ekleyebilir" ON public.clients;
DROP POLICY IF EXISTS "Admin ve personel müşteri güncelleyebilir" ON public.clients;
DROP POLICY IF EXISTS "Sadece admin müşteri silebilir" ON public.clients;

CREATE POLICY "Yetkili kullanıcılar müşterileri görebilir" ON public.clients FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel müşteri ekleyebilir" ON public.clients FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin ve personel müşteri güncelleyebilir" ON public.clients FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin müşteri silebilir" ON public.clients FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_search ON public.clients USING gin(to_tsvector('turkish', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));

-- -----------------------------------------------------------------------------
-- 3. TOURS TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tours (
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

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar turları görebilir" ON public.tours;
DROP POLICY IF EXISTS "Admin ve personel tur ekleyebilir" ON public.tours;
DROP POLICY IF EXISTS "Admin ve personel tur güncelleyebilir" ON public.tours;
DROP POLICY IF EXISTS "Sadece admin tur silebilir" ON public.tours;

CREATE POLICY "Yetkili kullanıcılar turları görebilir" ON public.tours FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel tur ekleyebilir" ON public.tours FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin ve personel tur güncelleyebilir" ON public.tours FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin tur silebilir" ON public.tours FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_start_date ON public.tours(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_tours_created_at ON public.tours(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tours_active ON public.tours(status, start_date) WHERE status = 'active';

CREATE OR REPLACE FUNCTION public.check_cancellation_reason() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND (NEW.cancellation_reason IS NULL OR NEW.cancellation_reason = '') THEN
    RAISE EXCEPTION 'İptal nedeni belirtilmelidir';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_cancellation_reason ON public.tours;
CREATE TRIGGER trigger_check_cancellation_reason BEFORE INSERT OR UPDATE ON public.tours FOR EACH ROW EXECUTE FUNCTION public.check_cancellation_reason();

-- -----------------------------------------------------------------------------
-- 4. BOOKINGS TABLOSU
-- -----------------------------------------------------------------------------
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

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar rezervasyonları görebilir" ON public.bookings;
DROP POLICY IF EXISTS "Admin ve personel rezervasyon ekleyebilir" ON public.bookings;
DROP POLICY IF EXISTS "Admin ve personel rezervasyon güncelleyebilir" ON public.bookings;
DROP POLICY IF EXISTS "Sadece admin rezervasyon silebilir" ON public.bookings;

CREATE POLICY "Yetkili kullanıcılar rezervasyonları görebilir" ON public.bookings FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel rezervasyon ekleyebilir" ON public.bookings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin ve personel rezervasyon güncelleyebilir" ON public.bookings FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin rezervasyon silebilir" ON public.bookings FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_bookings_tour_id ON public.bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

CREATE OR REPLACE FUNCTION public.check_seat_capacity() RETURNS TRIGGER AS $$
DECLARE
  tour_capacity INTEGER;
BEGIN
  SELECT capacity INTO tour_capacity FROM public.tours WHERE id = NEW.tour_id;
  IF NEW.seat_number > tour_capacity THEN
    RAISE EXCEPTION 'Koltuk numarası (%) tur kapasitesini (%) aşıyor', NEW.seat_number, tour_capacity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_seat_capacity ON public.bookings;
CREATE TRIGGER trigger_check_seat_capacity BEFORE INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.check_seat_capacity();

CREATE OR REPLACE FUNCTION public.update_tour_income_on_booking() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.booking_status = 'confirmed' THEN
    UPDATE public.tours SET total_income = total_income + NEW.amount_paid WHERE id = NEW.tour_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
      UPDATE public.tours SET total_income = total_income - OLD.amount_paid WHERE id = OLD.tour_id;
    END IF;
    IF OLD.booking_status = 'cancelled' AND NEW.booking_status = 'confirmed' THEN
      UPDATE public.tours SET total_income = total_income + NEW.amount_paid WHERE id = NEW.tour_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.booking_status = 'confirmed' THEN
    UPDATE public.tours SET total_income = total_income - OLD.amount_paid WHERE id = OLD.tour_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tour_income ON public.bookings;
CREATE TRIGGER trigger_update_tour_income AFTER INSERT OR UPDATE OR DELETE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_tour_income_on_booking();

-- -----------------------------------------------------------------------------
-- 5. TRANSFERS TABLOSU
-- -----------------------------------------------------------------------------
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

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar transferleri görebilir" ON public.transfers;
DROP POLICY IF EXISTS "Admin ve personel transfer ekleyebilir" ON public.transfers;
DROP POLICY IF EXISTS "Admin ve personel transfer güncelleyebilir" ON public.transfers;
DROP POLICY IF EXISTS "Sadece admin transfer silebilir" ON public.transfers;

CREATE POLICY "Yetkili kullanıcılar transferleri görebilir" ON public.transfers FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel transfer ekleyebilir" ON public.transfers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin ve personel transfer güncelleyebilir" ON public.transfers FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin transfer silebilir" ON public.transfers FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_transfers_date ON public.transfers(date DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_type ON public.transfers(type);
CREATE INDEX IF NOT EXISTS idx_transfers_driver_id ON public.transfers(driver_id);
CREATE INDEX IF NOT EXISTS idx_transfers_vehicle_id ON public.transfers(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_transfers_related_tour ON public.transfers(related_tour_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON public.transfers(created_at DESC);

-- -----------------------------------------------------------------------------
-- 6. TRANSFER BOOKINGS TABLOSU
-- -----------------------------------------------------------------------------
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

ALTER TABLE public.transfer_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar transfer rezervasyonlarını görebilir" ON public.transfer_bookings;
DROP POLICY IF EXISTS "Admin ve personel transfer rezervasyonu ekleyebilir" ON public.transfer_bookings;
DROP POLICY IF EXISTS "Admin ve personel transfer rezervasyonu güncelleyebilir" ON public.transfer_bookings;
DROP POLICY IF EXISTS "Sadece admin transfer rezervasyonu silebilir" ON public.transfer_bookings;

CREATE POLICY "Yetkili kullanıcılar transfer rezervasyonlarını görebilir" ON public.transfer_bookings FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel transfer rezervasyonu ekleyebilir" ON public.transfer_bookings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin ve personel transfer rezervasyonu güncelleyebilir" ON public.transfer_bookings FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin transfer rezervasyonu silebilir" ON public.transfer_bookings FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_transfer_bookings_transfer_id ON public.transfer_bookings(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_client_id ON public.transfer_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_status ON public.transfer_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_payment_status ON public.transfer_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_transfer_bookings_created_at ON public.transfer_bookings(created_at DESC);

CREATE OR REPLACE FUNCTION public.check_transfer_seat_capacity() RETURNS TRIGGER AS $$
DECLARE
  transfer_capacity INTEGER;
BEGIN
  SELECT passenger_count INTO transfer_capacity FROM public.transfers WHERE id = NEW.transfer_id;
  IF NEW.seat_number > transfer_capacity THEN
    RAISE EXCEPTION 'Koltuk numarası (%) transfer kapasitesini (%) aşıyor', NEW.seat_number, transfer_capacity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_transfer_seat_capacity ON public.transfer_bookings;
CREATE TRIGGER trigger_check_transfer_seat_capacity BEFORE INSERT OR UPDATE ON public.transfer_bookings FOR EACH ROW EXECUTE FUNCTION public.check_transfer_seat_capacity();

-- -----------------------------------------------------------------------------
-- 7. EXPENSES TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
  transfer_id UUID REFERENCES public.transfers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  supplier TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT expense_source_check CHECK ((tour_id IS NOT NULL AND transfer_id IS NULL) OR (tour_id IS NULL AND transfer_id IS NOT NULL))
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar giderleri görebilir" ON public.expenses;
DROP POLICY IF EXISTS "Admin ve personel gider ekleyebilir" ON public.expenses;
DROP POLICY IF EXISTS "Admin ve personel gider güncelleyebilir" ON public.expenses;
DROP POLICY IF EXISTS "Sadece admin gider silebilir" ON public.expenses;

CREATE POLICY "Yetkili kullanıcılar giderleri görebilir" ON public.expenses FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel gider ekleyebilir" ON public.expenses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Admin ve personel gider güncelleyebilir" ON public.expenses FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin gider silebilir" ON public.expenses FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_expenses_tour_id ON public.expenses(tour_id);
CREATE INDEX IF NOT EXISTS idx_expenses_transfer_id ON public.expenses(transfer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses(type);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier ON public.expenses(supplier);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at DESC);

CREATE OR REPLACE FUNCTION public.update_tour_expense() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.tour_id IS NOT NULL THEN
    UPDATE public.tours SET total_expense = total_expense + NEW.amount WHERE id = NEW.tour_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.tour_id IS NOT NULL THEN
    IF OLD.tour_id = NEW.tour_id THEN
      UPDATE public.tours SET total_expense = total_expense - OLD.amount + NEW.amount WHERE id = NEW.tour_id;
    ELSE
      UPDATE public.tours SET total_expense = total_expense - OLD.amount WHERE id = OLD.tour_id;
      UPDATE public.tours SET total_expense = total_expense + NEW.amount WHERE id = NEW.tour_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.tour_id IS NOT NULL THEN
    UPDATE public.tours SET total_expense = total_expense - OLD.amount WHERE id = OLD.tour_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tour_expense ON public.expenses;
CREATE TRIGGER trigger_update_tour_expense AFTER INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_tour_expense();

-- -----------------------------------------------------------------------------
-- 8. FINANCE TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'refund', 'transferProfit')),
  source_type TEXT NOT NULL CHECK (source_type IN ('tour', 'transfer', 'booking', 'expense', 'refund')),
  source_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.finance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar finans kayıtlarını görebilir" ON public.finance;
DROP POLICY IF EXISTS "Admin ve personel finans kaydı ekleyebilir" ON public.finance;
DROP POLICY IF EXISTS "Sadece admin finans kaydı güncelleyebilir" ON public.finance;
DROP POLICY IF EXISTS "Sadece admin finans kaydı silebilir" ON public.finance;

CREATE POLICY "Yetkili kullanıcılar finans kayıtlarını görebilir" ON public.finance FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel finans kaydı ekleyebilir" ON public.finance FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin finans kaydı güncelleyebilir" ON public.finance FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Sadece admin finans kaydı silebilir" ON public.finance FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_finance_type ON public.finance(type);
CREATE INDEX IF NOT EXISTS idx_finance_source_type ON public.finance(source_type);
CREATE INDEX IF NOT EXISTS idx_finance_source_id ON public.finance(source_id);
CREATE INDEX IF NOT EXISTS idx_finance_created_at ON public.finance(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_amount ON public.finance(amount);

CREATE OR REPLACE FUNCTION public.log_booking_to_finance() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.booking_status = 'confirmed' THEN
    INSERT INTO public.finance (type, source_type, source_id, amount, description) VALUES ('income', 'booking', NEW.id, NEW.amount_paid, 'Rezervasyon geliri');
  ELSIF TG_OP = 'UPDATE' AND OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
    INSERT INTO public.finance (type, source_type, source_id, amount, description) VALUES ('refund', 'booking', NEW.id, -NEW.amount_paid, 'Rezervasyon iptali - iade');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_booking_to_finance ON public.bookings;
CREATE TRIGGER trigger_log_booking_to_finance AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.log_booking_to_finance();

CREATE OR REPLACE FUNCTION public.log_expense_to_finance() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.finance (type, source_type, source_id, amount, description) VALUES ('expense', 'expense', NEW.id, -NEW.amount, NEW.type || ' - ' || NEW.supplier);
  ELSIF TG_OP = 'UPDATE' THEN
    DELETE FROM public.finance WHERE source_type = 'expense' AND source_id = OLD.id;
    INSERT INTO public.finance (type, source_type, source_id, amount, description) VALUES ('expense', 'expense', NEW.id, -NEW.amount, NEW.type || ' - ' || NEW.supplier);
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.finance WHERE source_type = 'expense' AND source_id = OLD.id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_expense_to_finance ON public.expenses;
CREATE TRIGGER trigger_log_expense_to_finance AFTER INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.log_expense_to_finance();

CREATE OR REPLACE VIEW public.finance_summary AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expense,
  SUM(CASE WHEN type = 'refund' THEN ABS(amount) ELSE 0 END) as total_refund,
  SUM(amount) as net_profit
FROM public.finance
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- -----------------------------------------------------------------------------
-- 9. REFUNDS TABLOSU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  method TEXT NOT NULL CHECK (method IN ('manual', 'credit', 'bank')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Yetkili kullanıcılar iadeleri görebilir" ON public.refunds;
DROP POLICY IF EXISTS "Admin ve personel iade ekleyebilir" ON public.refunds;
DROP POLICY IF EXISTS "Sadece admin iade güncelleyebilir" ON public.refunds;
DROP POLICY IF EXISTS "Sadece admin iade silebilir" ON public.refunds;

CREATE POLICY "Yetkili kullanıcılar iadeleri görebilir" ON public.refunds FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin ve personel iade ekleyebilir" ON public.refunds FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'personel')));
CREATE POLICY "Sadece admin iade güncelleyebilir" ON public.refunds FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Sadece admin iade silebilir" ON public.refunds FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON public.refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_client_id ON public.refunds(client_id);
CREATE INDEX IF NOT EXISTS idx_refunds_method ON public.refunds(method);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON public.refunds(created_at DESC);

CREATE OR REPLACE FUNCTION public.log_refund_to_finance() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.finance (type, source_type, source_id, amount, description) VALUES ('refund', 'refund', NEW.id, -NEW.amount, 'İade - ' || NEW.method);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_refund_to_finance ON public.refunds;
CREATE TRIGGER trigger_log_refund_to_finance AFTER INSERT ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.log_refund_to_finance();

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
