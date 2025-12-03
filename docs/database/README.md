# 📊 Supabase Veritabanı Kurulum Kılavuzu

Bu klasör, Mysia CRM projesinin Supabase veritabanı kurulumu için gerekli tüm SQL scriptlerini içerir.

## 📋 Kurulum Sırası

Aşağıdaki dosyaları **sırasıyla** Supabase Studio > SQL Editor'da çalıştırın:

1. ✅ **01-profiles.md** - Kullanıcı profilleri
2. ✅ **02-clients.md** - Müşteri (CRM) kayıtları
3. ✅ **03-tours.md** - Tur bilgileri ve finansal veriler
4. ✅ **04-bookings.md** - Tur rezervasyonları ve koltuk yönetimi
5. ✅ **05-transfers.md** - Transfer hizmetleri
6. ✅ **06-transfer-bookings.md** - Transfer rezervasyonları
7. ✅ **07-expenses.md** - Gider kayıtları
8. ✅ **08-finance.md** - Genel muhasebe defteri
9. ✅ **09-refunds.md** - İade işlemleri

## 🔐 Güvenlik Özellikleri

Her tablo için:
- ✅ **RLS (Row Level Security)** aktif
- ✅ **Rol bazlı erişim kontrolleri** (admin, personel, rehber, müşteri)
- ✅ **Veri bütünlüğü kontrolleri** (CHECK constraints)
- ✅ **Foreign Key ilişkileri** (CASCADE/SET NULL)

## 🚀 Otomatik İşlemler

Veritabanı şu işlemleri otomatik yapar:

### Finansal Hesaplamalar
- Rezervasyon eklendiğinde → Tur geliri otomatik artar
- Gider eklendiğinde → Tur gideri otomatik artar
- Net kâr → Otomatik hesaplanır (gelir - gider)

### Muhasebe Kayıtları
- Her rezervasyon → `finance` tablosuna gelir kaydı
- Her gider → `finance` tablosuna gider kaydı
- Her iade → `finance` tablosuna iade kaydı

### Veri Doğrulama
- Koltuk numarası → Kapasite kontrolü
- Tur iptali → İptal nedeni zorunlu
- Gider kaydı → Ya tura ya da transfere ait olmalı

## 📊 Veritabanı Şeması

```
profiles (Kullanıcılar)
    ↓
clients (Müşteriler)
    ↓
tours (Turlar) ←→ bookings (Rezervasyonlar) → refunds (İadeler)
    ↓                   ↓
expenses (Giderler)   finance (Muhasebe)
    
transfers (Transferler) ←→ transfer_bookings (Transfer Rezervasyonları)
```

## 🔍 Doğrulama Sorguları

Kurulum sonrası kontrol için:

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

-- Tüm trigger'ları listele
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

## 👤 İlk Admin Kullanıcısı

1. **Supabase Dashboard > Authentication > Users** → "Add User"
2. E-posta ve şifre girin
3. Kullanıcı ID'sini kopyalayın
4. SQL Editor'da çalıştırın:

```sql
INSERT INTO public.profiles (id, full_name, phone, role)
VALUES (
  'KULLANICI_ID_BURAYA',
  'Admin Kullanıcı',
  '+90 555 123 4567',
  'admin'
);
```

## 📈 Finansal Raporlar

### Aylık Özet
```sql
SELECT * FROM finance_summary;
```

### Toplam Gelir-Gider
```sql
SELECT 
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expense,
  SUM(amount) as net_profit
FROM public.finance;
```

### Tur Bazlı Kâr
```sql
SELECT 
  id,
  title,
  total_income,
  total_expense,
  net_profit,
  ROUND((net_profit / NULLIF(total_income, 0)) * 100, 2) as profit_margin
FROM public.tours
WHERE status = 'active'
ORDER BY net_profit DESC;
```

## 🛠️ Bakım ve Optimizasyon

### Index'leri Yeniden Oluştur
```sql
REINDEX DATABASE postgres;
```

### Veritabanı İstatistiklerini Güncelle
```sql
ANALYZE;
```

### Kullanılmayan Alanı Temizle
```sql
VACUUM;
```

## 📝 Notlar

- Tüm tarih/saat alanları **UTC** formatındadır
- Para birimleri **DECIMAL(10, 2)** formatındadır
- Tüm ID'ler **UUID** formatındadır
- Türkçe karakterler için **full-text search** desteği vardır

## 🆘 Sorun Giderme

### RLS Hatası
Eğer "new row violates row-level security policy" hatası alırsanız:
1. Kullanıcının `profiles` tablosunda kaydı olduğundan emin olun
2. Kullanıcının rolünün doğru olduğunu kontrol edin

### Foreign Key Hatası
Eğer "violates foreign key constraint" hatası alırsanız:
1. İlişkili tabloda kayıt olduğundan emin olun
2. Tabloları doğru sırayla oluşturduğunuzu kontrol edin

### Trigger Hatası
Eğer trigger çalışmıyorsa:
1. Trigger fonksiyonunun oluşturulduğunu kontrol edin
2. Trigger'ın aktif olduğunu doğrulayın

---

**Hazırlayan:** Mysia CRM Development Team  
**Tarih:** Aralık 2024  
**Versiyon:** 1.0
