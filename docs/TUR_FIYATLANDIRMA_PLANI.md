# Mysia CRM - Tur ve Fiyatlandırma Sistemi Planı

## 📋 1. TUR TİPLERİ

### 1.1 Ana Tur Tipleri (Sadeleştirilmiş)

| Kod | Tur Tipi | Açıklama | Fiyatlandırma Modeli |
|-----|----------|----------|----------------------|
| `daily` | Günübirlik Tur | Tek günlük turlar (kültür turları dahil), konaklama yok | Kişi Başı (PP) |
| `package` | Paket Tur | Çok günlük, konaklama dahil turlar | Oda Bazlı |

### 1.2 Tur Kategorileri

| Kod | Kategori | Açıklama |
|-----|----------|----------|
| `domestic` | Yurtiçi | Türkiye içi turlar |
| `abroad` | Yurtdışı | Yurtdışı turlar |

### 1.3 Yapı Özeti

```
TUR TİPİ
├── Günübirlik (daily)
│   ├── Yurtiçi Günübirlik
│   └── Yurtdışı Günübirlik
│
└── Paket (package)
    ├── Yurtiçi Paket (2-3-4-5-6-7 gece)
    └── Yurtdışı Paket (Uçaklı/Otobüslü)
```

---

## 💰 2. FİYATLANDIRMA MODELLERİ

### 2.1 Model A: Kişi Başı Fiyatlandırma (Günübirlik)

**Kullanım:** Günübirlik turlar, kültür turları

```json
{
  "pricing_model": "per_person",
  "prices": {
    "adult": 1500,
    "child": 750,      // 3-11 yaş
    "baby": 0,         // 0-2 yaş
    "currency": "TRY"
  },
  "age_ranges": {
    "child_min": 3,
    "child_max": 11,
    "baby_max": 2
  }
}
```

### 2.2 Model B: Oda Bazlı Fiyatlandırma (Paket Tur)

**Kullanım:** Paket turlar, konaklamalı turlar

```json
{
  "pricing_model": "room_based",
  "room_types": [
    {
      "name": "Standart Oda",
      "max_pax": 4,
      "prices": {
        "single_pp": 15000,   // Tek kişi kalım (kişi başı)
        "double_pp": 12000,   // 2 kişi kalım (kişi başı)
        "triple_pp": 10000,   // 3 kişi kalım (kişi başı)
        "quad_pp": 9000,      // 4 kişi kalım (kişi başı)
        "child_1": 5000,      // 1. çocuk
        "child_2": 3000,      // 2. çocuk
        "baby_1": 0,          // 1. bebek
        "baby_2": 0,          // 2. bebek
        "currency": "TRY"
      }
    },
    {
      "name": "Deluxe Oda",
      "max_pax": 3,
      "prices": {
        "single_pp": 20000,
        "double_pp": 17000,
        "triple_pp": 15000,
        "quad_pp": null,      // Bu oda tipinde 4 kişi yok
        "child_1": 7000,
        "child_2": 5000,
        "baby_1": 0,
        "baby_2": 0,
        "currency": "TRY"
      }
    }
  ],
  "age_ranges": {
    "child_min": 3,
    "child_max": 11,
    "baby_max": 2
  }
}
```

---

## 🗄️ 3. VERİTABANI ŞEMASI

### 3.1 tours Tablosu (Güncelleme)

```sql
CREATE TABLE mysiacrm.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Temel Bilgiler
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Tur Tipi ve Kategorisi
  tour_type TEXT NOT NULL CHECK (tour_type IN ('daily', 'package', 'cultural', 'event')),
  category TEXT NOT NULL CHECK (category IN ('domestic', 'abroad', 'special')),
  
  -- Fiyatlandırma Modeli
  pricing_model TEXT NOT NULL DEFAULT 'per_person' 
    CHECK (pricing_model IN ('per_person', 'room_based')),
  
  -- Paket Tur için Süre
  duration_days INT DEFAULT 1,    -- Gün sayısı
  duration_nights INT DEFAULT 0,  -- Gece sayısı
  
  -- Yaş Aralıkları (Varsayılan değerler)
  child_age_min INT DEFAULT 3,
  child_age_max INT DEFAULT 11,
  baby_age_max INT DEFAULT 2,
  
  -- Durum
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passive')),
  
  -- Meta
  featured_image TEXT,
  gallery JSONB DEFAULT '[]',
  seo_title TEXT,
  seo_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 tour_price_groups Tablosu (Güncelleme)

```sql
CREATE TABLE mysiacrm.tour_price_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES mysiacrm.tours(id) ON DELETE CASCADE,
  
  -- Grup Bilgileri
  name TEXT NOT NULL,             -- "Standart Paket", "Ekonomik", "Premium"
  currency TEXT DEFAULT 'TRY',
  
  -- Kişi Başı Fiyatlandırma (per_person modeli için)
  price_adult DECIMAL(12, 2),
  price_child DECIMAL(12, 2),
  price_baby DECIMAL(12, 2) DEFAULT 0,
  
  -- Durum ve Sıralama
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'passive')),
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 tour_room_types Tablosu (YENİ - Paket Turlar için)

```sql
CREATE TABLE mysiacrm.tour_room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_group_id UUID NOT NULL REFERENCES mysiacrm.tour_price_groups(id) ON DELETE CASCADE,
  
  -- Oda Bilgileri
  name TEXT NOT NULL,             -- "Standart Oda", "Deluxe", "Suite"
  max_pax INT DEFAULT 4,          -- Maksimum kişi sayısı
  
  -- Oda Bazlı Fiyatlar (Kişi Başı)
  price_single_pp DECIMAL(12, 2), -- Tek kişilik odada kişi başı
  price_double_pp DECIMAL(12, 2), -- İki kişilik odada kişi başı
  price_triple_pp DECIMAL(12, 2), -- Üç kişilik odada kişi başı
  price_quad_pp DECIMAL(12, 2),   -- Dört kişilik odada kişi başı
  
  -- Çocuk ve Bebek Fiyatları
  price_child_1 DECIMAL(12, 2),   -- 1. çocuk
  price_child_2 DECIMAL(12, 2),   -- 2. ve sonraki çocuklar
  price_baby_1 DECIMAL(12, 2) DEFAULT 0,
  price_baby_2 DECIMAL(12, 2) DEFAULT 0,
  
  -- Ekstra bilgiler
  description TEXT,
  
  -- Durum ve Sıralama
  status TEXT DEFAULT 'active',
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Güncellenmiş İlişki Diyagramı

```
tours
  │
  ├──> tour_price_groups (1:N)
  │         │
  │         └──> tour_room_types (1:N) [Sadece room_based modelde]
  │
  ├──> tour_dates (1:N)
  │         │
  │         └──> tour_operations (1:1)
  │         │
  │         └──> tour_date_finance (1:N)
  │         │
  │         └──> bookings (1:N)
  │                   │
  │                   └──> booking_passengers (1:N)
  │
  └──> tour_galleries (1:N) [opsiyonel]
```

---

## 🖥️ 4. KULLANICI ARAYÜZÜ AKIŞI

### 4.1 Yeni Tur Ekleme Akışı

```
ADIM 1: Temel Bilgiler
├── Tur Adı
├── Tur Tipi (Günübirlik / Paket / Kültür / Etkinlik)
├── Kategori (Yurtiçi / Yurtdışı / Özel)
└── [İLERİ]

ADIM 2: Detaylar (Tur Tipine Göre Değişir)
├── Açıklama
├── Süre (Paket için: X gün Y gece)
├── Yaş Aralıkları
└── [İLERİ]

ADIM 3: Fiyat Grupları
├── Günübirlik ise:
│   └── Yetişkin / Çocuk / Bebek fiyatları
│
├── Paket ise:
│   ├── Fiyat Grubu Adı (Standart, Premium vs.)
│   └── Oda Tipleri:
│       ├── Oda Adı
│       ├── Max Kişi
│       └── Single/Double/Triple/Quad PP + Çocuk + Bebek
│
└── [İLERİ]

ADIM 4: Tur Tarihleri
├── Başlangıç - Bitiş
├── Kapasite
├── Fiyat Grubu Seçimi
└── [KAYDET]
```

### 4.2 Fiyat Grubu Formu (Dinamik)

**Günübirlik Tur için:**
```
┌─────────────────────────────────────────────┐
│  Fiyat Grubu: Standart                      │
├─────────────────────────────────────────────┤
│  Yetişkin:  [  1500  ] TL                   │
│  Çocuk:     [   750  ] TL (3-11 yaş)        │
│  Bebek:     [     0  ] TL (0-2 yaş)         │
└─────────────────────────────────────────────┘
```

**Paket Tur için:**
```
┌─────────────────────────────────────────────┐
│  Fiyat Grubu: Standart Paket                │
├─────────────────────────────────────────────┤
│  + Oda Tipi Ekle                            │
│                                             │
│  ┌─ Standart Oda ─────────────────────────┐ │
│  │  Max Kişi: 4                           │ │
│  │  Single PP: 15000  Double PP: 12000    │ │
│  │  Triple PP: 10000  Quad PP: 9000       │ │
│  │  1.Çocuk: 5000     2.Çocuk: 3000       │ │
│  │  1.Bebek: 0        2.Bebek: 0          │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌─ Deluxe Oda ───────────────────────────┐ │
│  │  Max Kişi: 3                           │ │
│  │  Single PP: 20000  Double PP: 17000    │ │
│  │  Triple PP: 15000  Quad PP: -          │ │
│  │  ...                                   │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 📊 5. REZERVASYON SİSTEMİ

### 5.1 Günübirlik Tur Rezervasyonu

```
Seçimler:
├── Tur Tarihi
├── Yetişkin Sayısı: 2
├── Çocuk Sayısı: 1
└── Bebek Sayısı: 0

Hesaplama:
├── 2 x 1500 TL = 3000 TL
├── 1 x 750 TL = 750 TL
└── TOPLAM: 3750 TL
```

### 5.2 Paket Tur Rezervasyonu

```
Seçimler:
├── Tur Tarihi
├── Oda Tipi: Standart Oda
├── Kişi Sayısı: 2 Yetişkin + 1 Çocuk
└── Oda Konfigürasyonu: Double (2 kişi odada kalıyor)

Hesaplama:
├── 2 x 12000 TL (Double PP) = 24000 TL
├── 1 x 5000 TL (1. Çocuk) = 5000 TL
└── TOPLAM: 29000 TL
```

---

## ✅ 6. UYGULAMA ADIMLARI

### Faz 1: Veritabanı Güncellemesi
- [ ] `tours` tablosuna yeni alanlar ekleme
- [ ] `tour_room_types` tablosu oluşturma
- [ ] Migration SQL yazma

### Faz 2: Backend (Server Actions)
- [ ] `createTour` fonksiyonunu güncelleme
- [ ] `createPriceGroup` fonksiyonunu güncelleme
- [ ] `createRoomType` fonksiyonu ekleme

### Faz 3: Frontend - Tur Ekleme
- [ ] Tur tipi seçim adımı
- [ ] Dinamik form yapısı

### Faz 4: Frontend - Fiyat Grupları
- [ ] Günübirlik fiyat formu
- [ ] Paket tur oda tipi formu

### Faz 5: Rezervasyon
- [ ] Günübirlik rezervasyon formu
- [ ] Paket tur rezervasyon formu (oda seçimi)

---

## 📝 NOTLAR

1. **Geriye Uyumluluk:** Mevcut turlar `per_person` modeli olarak kabul edilecek
2. **Varsayılan Değerler:** Yaş aralıkları tur bazında özelleştirilebilir
3. **Döviz Desteği:** TRY, EUR, USD desteklenmeli
4. **Sıfır Fiyat:** `0` değeri "ücretsiz" anlamına gelir
5. **Null Fiyat:** `null` değeri "bu seçenek mevcut değil" anlamına gelir

---

*Son Güncelleme: 5 Aralık 2025*
