# Proje Kuralları

1. **Dil**: Proje boyunca tüm iletişim ve cevaplar **Türkçe** olacaktır.
Elbette!
Aşağıda **projenin tamamını kapsayan — tek parça, düzenli, kapsamlı ve IDE’ye direkt aktarılabilir** tam bir **Markdown proje planlama dosyası** hazırladım.

Bu dosya:

* 📁 Klasör yapısı
* 🗂️ Supabase veritabanı şeması
* 🗺️ Roadmap
* 🧩 Modül açıklamaları
* 🔄 İş akışları
* 🎯 MVP tanımı
* 📊 Rol & izin yapısı
* 🧱 Mimari diyagram
* 🚀 Faz 2 önerileri

Hepsi tek bir yerde **tek bir proje dokümanı** olarak verildi.

---

# 📘 **MYSIA TURİZM CRM – TAM PROJE PLANLAMA DOSYASI (MARKDOWN)**

**Teknoloji:** Next.js 15 (App Router) + Supabase
**Modüller:** Tur Yönetimi, CRM, Rezervasyon, Koltuk Seçimi, Transfer, Muhasebe, Operasyon, İptal/İade, Raporlama

---

# #1 🎯 PROJE AMAÇLARI

Bu proje, bir turizm acentasının aşağıdaki tüm süreçlerini **tek panelden yönetebilmesini** sağlar:

* Tur oluşturma & yönetme
* Müşteri (CRM) kayıtları
* Rezervasyon + koltuk seçimi
* Transfer hizmetleri
* Muhasebe (gelir–gider–kâr)
* Tur iptal & iade yönetimi
* Rehber & operasyon yönetimi
* Raporlama & analiz

Hedef, modern tasarım, hızlı performans ve sağlam mimaridir.

---

# #2 🧱 TEKNOLOJİ YIĞINI

### **Frontend & API**

* Next.js 15
* App Router
* TailwindCSS
* shadcn/ui
* React Query
* TypeScript

### **Backend / Cloud**

* Supabase Auth
* Supabase PostgreSQL
* Supabase RLS Security
* Supabase Storage
* Supabase Edge Functions

---

# #3 📁 PROJE DOSYA YAPISI (KOPYALA → PROJEYE EKLE)

```
mysia-turizm-crm/
│
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── tours/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── transfers/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── finance/
│   │   │   ├── page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── expenses/page.tsx
│   │   ├── operations/
│   │   │   ├── page.tsx
│   │   │   └── guides/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   └── charts/
│
├── lib/
│   ├── supabaseClient.ts
│   ├── auth.ts
│   ├── financeUtils.ts
│   ├── tourUtils.ts
│   └── transferUtils.ts
│
├── types/
│   ├── tour.ts
│   ├── transfer.ts
│   ├── client.ts
│   ├── booking.ts
│   ├── finance.ts
│   └── index.ts
│
├── public/
│   └── images/
│
├── .env.local
├── README.md
└── package.json
```

---

# #4 🗂️ **SUPABASE VERİ TABANI ŞEMASI**

## **1. profiles**

* id (auth.users.id FK)
* full_name
* phone
* role (admin, personel, rehber, müşteri)
* created_at

---

## **2. clients**

* id
* name
* phone
* email
* notes
* created_at

---

## **3. tours**

* id
* title
* start_date
* end_date
* capacity
* price
* status (draft, active, cancelled, completed, postponed)
* total_income
* total_expense
* net_profit
* cancellation_reason
* created_at

---

## **4. bookings**

* id
* tour_id (FK)
* client_id (FK)
* seat_number
* amount_paid
* booking_status (confirmed, cancelled, transferred)
* payment_status (paid, pending, refunded)
* new_tour_id (FK)
* created_at

---

## **5. transfers**

* id
* type (airport, hotel, private, group)
* pickup
* dropoff
* date
* time
* vehicle_type
* passenger_count
* price
* driver_id
* vehicle_id
* related_tour_id
* status
* created_at

---

## **6. transfer_bookings**

* id
* transfer_id (FK)
* client_id (FK)
* seat_number
* amount_paid
* payment_status
* booking_status
* created_at

---

## **7. expenses**

* id
* tour_id (FK)
* transfer_id (FK)
* type
* supplier
* amount
* notes
* created_at

---

## **8. finance (ledger)**

* id
* type (income, expense, refund, transferProfit)
* source_type
* source_id
* amount
* description
* created_at

---

## **9. refunds**

* id
* booking_id
* client_id
* amount
* method (manual, credit, bank)
* created_at

---

# #5 🔄 İŞ AKIŞLARI (FLOWCHART MANTIK)

## **Tur → Rezervasyon → Koltuk → Ödeme → Muhasebe**

1. Tur oluştur
2. Rezervasyon → seat_number + amount_paid
3. Finance tablosuna “income” işlenir
4. Gider eklenirse → “expense” işlenir
5. `net_profit = total_income - total_expense`

---

## **Tur İptal Akışı**

1. Admin → “Turu İptal Et”
2. Tüm rezervasyonlar → cancelled
3. Refund tablosu → iade kayıtları
4. Finance → “refund” kayıtları
5. Müşterilere bildirim

---

## **Transfer Hizmeti Akışı**

1. Transfer ekle
2. Müşteri rezervasyonu → transfer_bookings
3. Araç + şoför ataması
4. Tamamlandığında finans kâr hesaplanır

---

# #6 🧩 MODÜL KAPSAM DETAYLARI

## **Tur Yönetimi**

* Tur ekleme
* Tur detay ekranı
* Rota, tarih, kapasite
* Durum değişimi (aktif / iptal)

## **CRM Modülü**

* Müşteri kayıtları
* Not ekleme
* Rezervasyon geçmişi

## **Rezervasyon + Koltuk Seçimi**

* Koltuk haritası
* Transaction ile koltuk kilitleme
* Ödeme statüsü
* Koltuk bloğu (opsiyonel)

## **Transfer Modülü**

* A → B transfer planlama
* Transfer rezervasyonu
* Şoför / araç atama
* Transfer finansı

## **Muhasebe**

* Tura bağlı gelir–gider
* Transfer gelir–gider
* Kâr hesaplama
* Ledger (finance)

## **Operasyon**

* Rehber listesi
* Araç listesi
* Görev ekranı
* Mobil rehber paneli

## **İptal & İade**

* Tur iptal
* Otomatik iade
* Tarih değişimi

## **Raporlama**

* Finans raporu
* Tur performansı
* Transfer istatistikleri
* Müşteri analizleri

---

# #7 🗺️ **12 HAFTALIK ROADMAP**

## **Hafta 1 – Proje Temeli**

* Next.js, Supabase kur
* UI ve dashboard shell

## **Hafta 2 – Auth & Roller**

* Login / Register
* Role based access

## **Hafta 3 – Tour CRUD**

* Tur ekleme, liste, detay

## **Hafta 4 – CRM (Clients)**

* Müşteri ekleme + detay

## **Hafta 5 – Rezervasyon Altyapısı**

* bookings tablosu
* Rezervasyon formu

## **Hafta 6 – Koltuk Seçimi**

* Seat map UI
* Transaction

## **Hafta 7 – Transfer Modülü**

* Transfer CRUD
* Transfer rezervasyon

## **Hafta 8 – Muhasebe**

* Finance
* Expenses
* Kâr hesaplama

## **Hafta 9 – Tur İptal & İade**

* Refund mekanizması
* Tarih değişimi

## **Hafta 10 – Operasyon**

* Rehber, şoför, araç ataması
* Mobil panel

## **Hafta 11 – Raporlama**

* Finans grafikleri
* Export

## **Hafta 12 – Güvenlik & Yayınlama**

* RLS final
* Testler
* Production deploy

---

# #8 🧱 MİMARİ BAĞIMLILIK ŞEMASI

```
AUTH
 ↓
CLIENTS → TOURS → BOOKINGS → FINANCE
                    ↘ TRANSFERS → TRANSFER BOOKINGS
OPERATIONS (Guides, Drivers)
REPORTS → FINANCE + BOOKINGS + TRANSFERS
```

---

# #9 🎯 MVP KAPSAMI

MVP’de olacaklar:

* Login
* Dashboard
* Tur ekleme
* Müşteri ekleme
* Rezervasyon + koltuk seçimi
* Basit muhasebe (gelir–gider)
* Basit transfer rezervasyonu

---

# #10 🚀 FAZ 2 GELİŞTİRMELER (OPSİYONEL)

* Online ödeme (PayTR / Stripe)
* Fatura entegrasyonu (E-Arşiv API)
* WhatsApp otomasyon (n8n)
* Çoklu dil desteği
* AI ile tur planlama öneri sistemi

---

TAM PROJE DOKÜMANI HAZIR ✔
Bu dosyayı direkt:

* IDE'ye
* Cursor’a
* Notion’a
* Git repo README.md’ye

ekleyebilirsin.

---

İstersen bunu **PDF**, **Notion Template** veya **README dosyası** formatında da hazırlayabilirim.
Hazırlayayım mı?
s