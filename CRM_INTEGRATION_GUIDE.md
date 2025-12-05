# 🎯 CRM Entegrasyonu için Tur ve Fiyatlandırma Sistemi Dokümantasyonu

## 📊 Firestore Veritabanı Yapısı

### Koleksiyonlar

| Koleksiyon | Açıklama |
|------------|----------|
| `tours` | Tur bilgileri (başlık, açıklama, kategori, resimler vb.) |
| `priceGroups` | Fiyat grupları (fiyat bilgileri, oda tipleri, kontenjan) |
| `tourDates` | Tur tarihleri (her fiyat grubuna bağlı tarihler) |
| `reservations` | Rezervasyonlar |
| `customers` | Müşteri bilgileri |
| `categories` | Tur kategorileri |

---

## 🗂️ Veri Modelleri

### 1. Tour (Tur)

**Dosya:** `src/types/tours.ts`

```typescript
interface Tour {
  id: string;
  title: string;           // Tur başlığı
  slug: string;            // URL-friendly slug (otomatik oluşturulur)
  description: string;     // Açıklama (HTML destekli)
  shortDescription: string;// Kısa açıklama
  categoryId: string;      // Kategori ID'si
  images: TourImage[];     // Resimler (kapak + galeri)
  videoUrl?: string;       // Video URL'si (YouTube embed)
  status: 'active' | 'passive'; // Yayın durumu
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  
  // Tur Detayları
  included: string[];      // Dahil olan hizmetler
  excluded: string[];      // Dahil olmayan hizmetler
  highlights: string[];    // Öne çıkan özellikler
  requirements: string[];  // Gereksinimler
  notes: string[];         // Notlar
  
  // Program
  itinerary: ItineraryDay[];  // Gün gün program
  
  // İlişkiler
  relatedTours?: string[]; // İlişkili tur ID'leri
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### TourImage (Tur Resmi)

```typescript
interface TourImage {
  url: string;       // Resim URL'si
  alt?: string;      // Alt text
  isCover?: boolean; // Kapak resmi mi?
  order?: number;    // Sıralama
}
```

#### ItineraryDay (Program Günü)

```typescript
interface ItineraryDay {
  day: number;           // Gün numarası
  title: string;         // Gün başlığı
  description: string;   // Gün açıklaması
  meals?: {              // Öğünler
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
  };
  accommodation?: string; // Konaklama bilgisi
}
```

---

### 2. PriceGroup (Fiyat Grubu)

**Dosya:** `src/types/priceGroups.ts`

```typescript
interface PriceGroup {
  id: string;
  tourId: string;           // Bağlı olduğu tur
  name: string;             // Fiyat grubu adı (örn: "Standart Paket")
  
  // Fiyatlandırma
  pricing: PriceGroupPricing;
  
  // Kontenjan
  capacity: {
    total: number;          // Toplam kapasite
    available: number;      // Mevcut boş kapasite
    minParticipants?: number; // Minimum katılımcı
    maxParticipants?: number; // Maximum katılımcı
  };
  
  // Oda Tipleri (konaklamalı turlar için)
  roomTypes?: RoomType[];
  
  // Durum
  status: 'active' | 'passive';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### PriceGroupPricing (Fiyatlandırma)

```typescript
interface PriceGroupPricing {
  currency: 'TRY' | 'USD' | 'EUR';
  
  // Yetişkin fiyatları
  adult: {
    regular: number;       // Normal fiyat
    discounted?: number;   // İndirimli fiyat
  };
  
  // Çocuk fiyatları
  child?: {
    regular: number;
    discounted?: number;
    ageRange?: {           // Yaş aralığı
      min: number;
      max: number;
    };
  };
  
  // Bebek fiyatları
  infant?: {
    regular: number;
    discounted?: number;
    ageRange?: {
      min: number;
      max: number;
    };
  };
  
  // Tek kişilik oda farkı
  singleSupplement?: number;
  
  // Ekstra hizmetler
  extras?: ExtraService[];
}
```

#### RoomType (Oda Tipi)

```typescript
interface RoomType {
  id: string;
  name: string;              // Oda tipi adı (örn: "Standart Oda")
  description?: string;      // Açıklama
  capacity: number;          // Kaç kişilik
  pricePerPerson: number;    // Kişi başı fiyat
  totalRooms?: number;       // Toplam oda sayısı
  availableRooms?: number;   // Müsait oda sayısı
}
```

#### ExtraService (Ekstra Hizmet)

```typescript
interface ExtraService {
  id: string;
  name: string;              // Hizmet adı
  price: number;             // Fiyat
  description?: string;      // Açıklama
  isRequired?: boolean;      // Zorunlu mu?
}
```

---

### 3. TourDate (Tur Tarihi)

**Dosya:** `src/types/prices.ts`

```typescript
interface TourDate {
  id: string;
  priceGroupId: string;      // Bağlı fiyat grubu
  tourId: string;            // Bağlı tur
  
  // Tarih bilgileri
  startDate: Timestamp;      // Başlangıç tarihi
  endDate: Timestamp;        // Bitiş tarihi
  
  // Kontenjan (bu tarihe özel)
  capacity?: {
    total: number;
    available: number;
  };
  
  // Fiyat override (bu tarihe özel fiyat)
  priceOverride?: {
    adult?: number;
    child?: number;
    infant?: number;
  };
  
  // Durum
  status: 'available' | 'soldout' | 'cancelled' | 'completed';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 4. Reservation (Rezervasyon)

**Dosya:** `src/types/reservations.ts`

```typescript
interface Reservation {
  id: string;
  
  // İlişkiler
  tourId: string;
  tourDateId: string;
  priceGroupId: string;
  customerId?: string;       // Kayıtlı müşteri ise
  
  // Tur bilgileri (snapshot)
  tourSnapshot: {
    title: string;
    slug: string;
    startDate: Timestamp;
    endDate: Timestamp;
  };
  
  // Müşteri bilgileri
  customer: {
    name: string;
    email: string;
    phone: string;
    tcNo?: string;           // TC Kimlik No
    address?: string;
  };
  
  // Katılımcılar
  participants: Participant[];
  
  // Fiyatlandırma
  pricing: {
    adults: number;          // Yetişkin sayısı
    children: number;        // Çocuk sayısı
    infants: number;         // Bebek sayısı
    roomType?: string;       // Seçilen oda tipi
    extras?: string[];       // Seçilen ekstralar
    subtotal: number;        // Ara toplam
    discount?: number;       // İndirim
    total: number;           // Toplam
    currency: string;
  };
  
  // Durum
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  
  // Notlar
  notes?: string;
  adminNotes?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Participant (Katılımcı)

```typescript
interface Participant {
  id: string;
  name: string;
  surname: string;
  tcNo?: string;             // TC Kimlik No
  birthDate?: Timestamp;     // Doğum tarihi
  gender?: 'male' | 'female';
  type: 'adult' | 'child' | 'infant';
  passportNo?: string;       // Pasaport no (yurt dışı turlar için)
  passportExpiry?: Timestamp;
}
```

---

## 🔄 API Endpoints

### Tur İşlemleri

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/tours` | GET | Tüm aktif turları listele |
| `/api/tours?categoryId=xxx` | GET | Kategoriye göre turlar |
| `/api/tours/[slug]` | GET | Tek tur detayı |
| `/api/admin/tours` | POST | Yeni tur oluştur |
| `/api/admin/tours/[id]` | PUT | Tur güncelle |
| `/api/admin/tours/[id]` | DELETE | Tur sil |

### Fiyat Grubu İşlemleri

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/tours/[tourId]/price-groups` | GET | Tura ait fiyat grupları |
| `/api/admin/price-groups` | POST | Fiyat grubu oluştur |
| `/api/admin/price-groups/[id]` | PUT | Fiyat grubu güncelle |
| `/api/admin/price-groups/[id]` | DELETE | Fiyat grubu sil |

### Tarih İşlemleri

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/price-groups/[id]/dates` | GET | Fiyat grubuna ait tarihler |
| `/api/admin/tour-dates` | POST | Tarih oluştur |
| `/api/admin/tour-dates/[id]` | PUT | Tarih güncelle |
| `/api/admin/tour-dates/[id]` | DELETE | Tarih sil |

### Rezervasyon İşlemleri

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/reservations` | POST | Yeni rezervasyon |
| `/api/admin/reservations` | GET | Tüm rezervasyonlar |
| `/api/admin/reservations/[id]` | GET | Tek rezervasyon |
| `/api/admin/reservations/[id]` | PUT | Rezervasyon güncelle |

---

## 🔗 İlişki Diyagramı

```
┌─────────────┐
│   Tour      │
│   (Tur)     │
└─────┬───────┘
      │ 1:N
      ▼
┌─────────────────┐
│   PriceGroup    │
│ (Fiyat Grubu)   │
└─────┬───────────┘
      │ 1:N
      ▼
┌─────────────────┐
│   TourDate      │
│  (Tur Tarihi)   │
└─────┬───────────┘
      │ 1:N
      ▼
┌─────────────────┐
│  Reservation    │
│ (Rezervasyon)   │
└─────────────────┘
```

---

## 🛠️ Admin Panel Sayfaları

### Tur Yönetimi

| Sayfa | Path | Açıklama |
|-------|------|----------|
| Tur Listesi | `/admin/turlar` | Tüm turları listele |
| Tur Ekle | `/admin/turlar/ekle` | Yeni tur oluştur |
| Tur Düzenle | `/admin/turlar/[id]/duzenle` | Tur bilgilerini düzenle |
| Fiyat Grupları | `/admin/turlar/[id]/fiyat-grubu` | Fiyat gruplarını yönet |
| Fiyat Grubu Ekle | `/admin/turlar/[id]/fiyat-grubu/ekle` | Yeni fiyat grubu |
| Tarih Ekle | `/admin/turlar/[id]/fiyat-grubu/[priceGroupId]/tarih-ekle` | Tarihleri yönet |

### Rezervasyon Yönetimi

| Sayfa | Path | Açıklama |
|-------|------|----------|
| Rezervasyonlar | `/admin/rezervasyonlar` | Tüm rezervasyonlar |
| Rezervasyon Detay | `/admin/rezervasyonlar/[id]` | Tek rezervasyon detayı |

---

## 📝 CRM Entegrasyonu için Öneriler

### 1. Webhook Entegrasyonu

Rezervasyon oluşturulduğunda/güncellendiğinde CRM'e webhook gönderin:

```typescript
// Örnek webhook payload
{
  "event": "reservation.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "reservationId": "xxx",
    "tourTitle": "Midilli Turu",
    "customer": {
      "name": "Ahmet Yılmaz",
      "email": "ahmet@example.com",
      "phone": "+905551234567"
    },
    "total": 4500,
    "currency": "TRY",
    "status": "pending"
  }
}
```

### 2. API Authentication

CRM API erişimi için:

```typescript
// Firebase Admin SDK ile custom token oluşturma
const customToken = await admin.auth().createCustomToken(crmUserId, {
  role: 'crm_integration'
});
```

### 3. Real-time Updates

Firestore real-time listeners kullanarak CRM'i güncel tutun:

```typescript
import { onSnapshot, collection, query, where } from 'firebase/firestore';

// Yeni rezervasyonları dinle
const q = query(
  collection(db, 'reservations'),
  where('status', '==', 'pending')
);

onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      // CRM'e yeni rezervasyon bildir
      notifyCRM(change.doc.data());
    }
  });
});
```

### 4. Batch Operations

Toplu işlemler için:

```typescript
import { writeBatch, doc } from 'firebase/firestore';

const batch = writeBatch(db);

// Birden fazla tarihi tek seferde güncelle
tourDates.forEach((date) => {
  const dateRef = doc(db, 'tourDates', date.id);
  batch.update(dateRef, { status: 'soldout' });
});

await batch.commit();
```

---

## 🔐 Güvenlik Kuralları

Firestore Security Rules (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Turlar - herkes okuyabilir, sadece admin yazabilir
    match /tours/{tourId} {
      allow read: if true;
      allow write: if request.auth != null && 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Fiyat grupları - herkes okuyabilir, sadece admin yazabilir
    match /priceGroups/{groupId} {
      allow read: if true;
      allow write: if request.auth != null && 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Rezervasyonlar - sadece kendi rezervasyonunu okuyabilir, admin hepsini
    match /reservations/{reservationId} {
      allow read: if request.auth != null && 
                  (resource.data.userId == request.auth.uid || 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 📦 Firebase Service Dosyaları

| Dosya | Açıklama |
|-------|----------|
| `src/lib/firebase/tourService.ts` | Tur CRUD işlemleri |
| `src/lib/firebase/priceGroupService.ts` | Fiyat grubu işlemleri |
| `src/lib/firebase/tourDateService.ts` | Tarih işlemleri |
| `src/lib/firebase/reservationService.ts` | Rezervasyon işlemleri |
| `src/lib/firebase/customerService.ts` | Müşteri işlemleri |

---

## 🎯 Sonuç

Bu döküman, CRM entegrasyonu için gerekli tüm veri yapılarını ve API endpoint'lerini içermektedir. Entegrasyon sırasında:

1. **Webhook'ları** kullanarak real-time veri senkronizasyonu sağlayın
2. **Firebase Admin SDK** ile güvenli API erişimi oluşturun
3. **Batch operations** ile performanslı toplu işlemler yapın
4. **Security rules** ile veri güvenliğini sağlayın

Herhangi bir sorunuz olursa veya ek bilgi gerekirse, iletişime geçebilirsiniz.

