# 8. Finance (Ledger) Tablosu

Bu tablo, tüm finansal işlemlerin kaydını tutar (genel muhasebe defteri).

## Tablo Yapısı

- **id**: UUID (otomatik)
- **type**: İşlem tipi (income, expense, refund, transferProfit)
- **source_type**: Kaynak tipi (tour, transfer, booking, expense)
- **source_id**: Kaynak ID
- **amount**: Tutar
- **description**: Açıklama
- **created_at**: Oluşturulma tarihi

## SQL Script

Aşağıdaki SQL kodunu **Supabase Studio > SQL Editor**'da çalıştırın:

```sql
-- 1. Finance tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'refund', 'transferProfit')),
  source_type TEXT NOT NULL CHECK (source_type IN ('tour', 'transfer', 'booking', 'expense', 'refund')),
  source_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS (Row Level Security) aktif et
ALTER TABLE public.finance ENABLE ROW LEVEL SECURITY;

-- 3. RLS Politikaları
-- Tüm yetkili kullanıcılar finans kayıtlarını görebilir
CREATE POLICY "Yetkili kullanıcılar finans kayıtlarını görebilir"
  ON public.finance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Admin ve personel finans kaydı ekleyebilir
CREATE POLICY "Admin ve personel finans kaydı ekleyebilir"
  ON public.finance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'personel')
    )
  );

-- Sadece admin finans kaydı güncelleyebilir
CREATE POLICY "Sadece admin finans kaydı güncelleyebilir"
  ON public.finance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sadece admin finans kaydı silebilir
CREATE POLICY "Sadece admin finans kaydı silebilir"
  ON public.finance
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_finance_type ON public.finance(type);
CREATE INDEX IF NOT EXISTS idx_finance_source_type ON public.finance(source_type);
CREATE INDEX IF NOT EXISTS idx_finance_source_id ON public.finance(source_id);
CREATE INDEX IF NOT EXISTS idx_finance_created_at ON public.finance(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_amount ON public.finance(amount);

-- 5. Trigger: Rezervasyon oluşturulduğunda finans kaydı ekle
CREATE OR REPLACE FUNCTION log_booking_to_finance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.booking_status = 'confirmed' THEN
    INSERT INTO public.finance (type, source_type, source_id, amount, description)
    VALUES (
      'income',
      'booking',
      NEW.id,
      NEW.amount_paid,
      'Rezervasyon geliri'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
    INSERT INTO public.finance (type, source_type, source_id, amount, description)
    VALUES (
      'refund',
      'booking',
      NEW.id,
      -NEW.amount_paid,
      'Rezervasyon iptali - iade'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_booking_to_finance
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_to_finance();

-- 6. Trigger: Gider eklendiğinde finans kaydı ekle
CREATE OR REPLACE FUNCTION log_expense_to_finance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.finance (type, source_type, source_id, amount, description)
    VALUES (
      'expense',
      'expense',
      NEW.id,
      -NEW.amount,
      NEW.type || ' - ' || NEW.supplier
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Eski kaydı sil ve yeni kayıt ekle
    DELETE FROM public.finance WHERE source_type = 'expense' AND source_id = OLD.id;
    INSERT INTO public.finance (type, source_type, source_id, amount, description)
    VALUES (
      'expense',
      'expense',
      NEW.id,
      -NEW.amount,
      NEW.type || ' - ' || NEW.supplier
    );
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.finance WHERE source_type = 'expense' AND source_id = OLD.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_expense_to_finance
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION log_expense_to_finance();

-- 7. View: Finansal özet
CREATE OR REPLACE VIEW finance_summary AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expense,
  SUM(CASE WHEN type = 'refund' THEN ABS(amount) ELSE 0 END) as total_refund,
  SUM(amount) as net_profit
FROM public.finance
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

COMMENT ON TABLE public.finance IS 'Genel muhasebe defteri - tüm finansal işlemler';
COMMENT ON COLUMN public.finance.type IS 'İşlem tipi: income (gelir), expense (gider), refund (iade), transferProfit (transfer kârı)';
COMMENT ON COLUMN public.finance.amount IS 'Tutar (gelir pozitif, gider negatif)';
COMMENT ON VIEW finance_summary IS 'Aylık finansal özet raporu';
```

## Doğrulama

Script çalıştıktan sonra kontrol edin:

1. **Table Editor**'da `finance` tablosunu görmelisiniz
2. **Policies** sekmesinde 4 politika olmalı
3. **Indexes** sekmesinde 5 index olmalı
4. **Triggers** sekmesinde 2 trigger olmalı
5. **Views** sekmesinde `finance_summary` view'ı olmalı

## Finansal Özet Sorgulama

```sql
-- Aylık finansal özet
SELECT * FROM finance_summary;

-- Toplam gelir-gider
SELECT 
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expense,
  SUM(amount) as net_profit
FROM public.finance;

-- Son 30 günün işlemleri
SELECT * FROM public.finance
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

---

**Sonraki Adım:** `09-refunds.md` dosyasını çalıştırın.
