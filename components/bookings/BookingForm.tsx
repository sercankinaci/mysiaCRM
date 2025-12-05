'use client'

import { useState, useMemo } from 'react'
import { Plus, Minus, ChevronRight, ChevronLeft, User, Users, AlertTriangle, Check, Home } from 'lucide-react'
import { createBookingWithPassengers, Passenger } from '@/lib/actions/bookings'
import { PriceGroup } from '@/lib/actions/tour-details'
import { formatCurrency } from '@/lib/utils'

type PricingModel = 'per_person' | 'room_based'

interface BookingFormProps {
    tourDateId: string
    pricingModel: PricingModel
    priceGroups: PriceGroup[]
    childAgeMin?: number
    childAgeMax?: number
    babyAgeMax?: number
    onClose: () => void
}

type PassengerInfo = {
    full_name: string
    tc_no: string
    birth_date: string
    phone: string
    pickup_point: string
    passenger_type: 'adult' | 'child' | 'baby'
}

export default function BookingForm({
    tourDateId,
    pricingModel,
    priceGroups,
    childAgeMin = 3,
    childAgeMax = 11,
    babyAgeMax = 2,
    onClose
}: BookingFormProps) {
    // Steps: 1 = Kişi Sayısı, 2 = Yolcu Bilgileri, 3 = Ödeme
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Fiyat Grubu
    const [selectedPriceGroupId, setSelectedPriceGroupId] = useState(priceGroups[0]?.id || '')
    const selectedPriceGroup = priceGroups.find(pg => pg.id === selectedPriceGroupId)

    // Kişi Sayıları
    const [paxCount, setPaxCount] = useState({
        adults: 1,
        children: 0,
        babies: 0
    })

    // Yolcu Bilgileri
    const [passengers, setPassengers] = useState<PassengerInfo[]>([])

    // Müşteri
    const [isNewClient, setIsNewClient] = useState(true)
    const [clientId, setClientId] = useState('')
    const [newClient, setNewClient] = useState({ full_name: '', phone: '', email: '' })

    // Ödeme
    const [paidAmount, setPaidAmount] = useState(0)
    const [notes, setNotes] = useState('')

    // Oda kapasitesi ve fiyat kontrolü
    const maxPax = selectedPriceGroup?.max_pax || 4
    const totalPax = paxCount.adults + paxCount.children + paxCount.babies

    // Mevcut fiyatlara göre kontrol
    const getOccupancyAndPrice = (adultCount: number) => {
        if (!selectedPriceGroup) return { occupancy: 'SNG', price: 0, available: false }

        switch (adultCount) {
            case 1: return { occupancy: 'SNG', price: selectedPriceGroup.price_single_pp || 0, available: (selectedPriceGroup.price_single_pp || 0) > 0 }
            case 2: return { occupancy: 'DBL', price: selectedPriceGroup.price_double_pp || 0, available: (selectedPriceGroup.price_double_pp || 0) > 0 }
            case 3: return { occupancy: 'TRPL', price: selectedPriceGroup.price_triple_pp || 0, available: (selectedPriceGroup.price_triple_pp || 0) > 0 }
            case 4: return { occupancy: 'QUAD', price: selectedPriceGroup.price_quad_pp || 0, available: (selectedPriceGroup.price_quad_pp || 0) > 0 }
            default: return { occupancy: 'SNG', price: selectedPriceGroup.price_single_pp || 0, available: (selectedPriceGroup.price_single_pp || 0) > 0 }
        }
    }

    const currentOccupancy = getOccupancyAndPrice(paxCount.adults)

    // Validasyon
    const validationErrors = useMemo(() => {
        const errors: string[] = []

        if (pricingModel === 'room_based') {
            if (!currentOccupancy.available) {
                errors.push(`${paxCount.adults} yetişkin için fiyat tanımlanmamış. Lütfen farklı bir yetişkin sayısı seçin.`)
            }
            if (totalPax > maxPax) {
                errors.push(`Oda kapasitesi aşıldı! Maksimum ${maxPax} kişi. Şu an: ${totalPax} kişi.`)
            }
        }

        if (paxCount.adults < 1) {
            errors.push('En az 1 yetişkin gerekli.')
        }

        return errors
    }, [paxCount, currentOccupancy, totalPax, maxPax, pricingModel])

    // Fiyat Hesaplama
    const priceCalculation = useMemo(() => {
        if (!selectedPriceGroup) {
            return { total: 0, breakdown: [], currency: 'TRY' }
        }

        const currency = selectedPriceGroup.currency || 'TRY'
        const breakdown: { label: string; amount: number }[] = []

        if (pricingModel === 'room_based') {
            const { price: adultPrice, occupancy } = currentOccupancy

            const child1Price = selectedPriceGroup.price_child_1 || 0
            const child2Price = selectedPriceGroup.price_child_2 || 0
            const baby1Price = selectedPriceGroup.price_baby_1 || 0
            const baby2Price = selectedPriceGroup.price_baby_2 || 0

            if (paxCount.adults > 0 && adultPrice > 0) {
                breakdown.push({ label: `${paxCount.adults} Yetişkin (${occupancy})`, amount: paxCount.adults * adultPrice })
            }
            if (paxCount.children >= 1) {
                breakdown.push({ label: '1. Çocuk', amount: child1Price })
            }
            if (paxCount.children >= 2) {
                breakdown.push({ label: `${paxCount.children - 1} Çocuk (2.+)`, amount: (paxCount.children - 1) * child2Price })
            }
            if (paxCount.babies >= 1) {
                breakdown.push({ label: '1. Bebek', amount: baby1Price })
            }
            if (paxCount.babies >= 2) {
                breakdown.push({ label: `${paxCount.babies - 1} Bebek (2.+)`, amount: (paxCount.babies - 1) * baby2Price })
            }
        } else {
            const adultPrice = selectedPriceGroup.price_adult || selectedPriceGroup.pricing?.adult || 0
            const childPrice = selectedPriceGroup.price_child || selectedPriceGroup.pricing?.child || 0
            const babyPrice = selectedPriceGroup.price_baby || selectedPriceGroup.pricing?.baby || 0

            if (paxCount.adults > 0) breakdown.push({ label: `${paxCount.adults} Yetişkin`, amount: paxCount.adults * adultPrice })
            if (paxCount.children > 0) breakdown.push({ label: `${paxCount.children} Çocuk`, amount: paxCount.children * childPrice })
            if (paxCount.babies > 0) breakdown.push({ label: `${paxCount.babies} Bebek`, amount: paxCount.babies * babyPrice })
        }

        const total = breakdown.reduce((sum, item) => sum + item.amount, 0)
        return { total, breakdown, currency }
    }, [paxCount, selectedPriceGroup, pricingModel, currentOccupancy])

    // Kişi Sayısı Değiştirme
    const updatePax = (type: 'adults' | 'children' | 'babies', delta: number) => {
        setPaxCount(prev => {
            const newValue = Math.max(type === 'adults' ? 1 : 0, prev[type] + delta)

            // Maksimum kontrol
            if (type === 'adults') {
                return { ...prev, adults: Math.min(4, newValue) }
            } else if (pricingModel === 'room_based') {
                const maxExtra = maxPax - prev.adults
                const otherExtra = type === 'children' ? prev.babies : prev.children
                return { ...prev, [type]: Math.min(newValue, maxExtra - otherExtra) }
            } else {
                return { ...prev, [type]: Math.min(10, newValue) }
            }
        })
    }

    // Step 1 -> Step 2: Yolcu formlarını oluştur
    const proceedToStep2 = () => {
        if (validationErrors.length > 0) return

        const newPassengers: PassengerInfo[] = []
        for (let i = 0; i < paxCount.adults; i++) {
            newPassengers.push({ full_name: '', tc_no: '', birth_date: '', phone: '', pickup_point: '', passenger_type: 'adult' })
        }
        for (let i = 0; i < paxCount.children; i++) {
            newPassengers.push({ full_name: '', tc_no: '', birth_date: '', phone: '', pickup_point: '', passenger_type: 'child' })
        }
        for (let i = 0; i < paxCount.babies; i++) {
            newPassengers.push({ full_name: '', tc_no: '', birth_date: '', phone: '', pickup_point: '', passenger_type: 'baby' })
        }
        setPassengers(newPassengers)
        setStep(2)
    }

    // Form gönderme
    async function handleSubmit() {
        if (isNewClient && !newClient.full_name.trim()) {
            alert('Müşteri adı gerekli')
            return
        }

        setLoading(true)
        try {
            const finalPassengers: Passenger[] = passengers.map(p => ({
                full_name: p.full_name || `${p.passenger_type === 'adult' ? 'Yetişkin' : p.passenger_type === 'child' ? 'Çocuk' : 'Bebek'}`,
                tc_no: p.tc_no,
                birth_date: p.birth_date,
                phone: p.phone,
                pickup_point: p.pickup_point,
                passenger_type: p.passenger_type
            }))

            await createBookingWithPassengers({
                tour_date_id: tourDateId,
                client_id: isNewClient ? undefined : clientId,
                new_client: isNewClient ? newClient : undefined,
                passengers: finalPassengers,
                pricing: {
                    adult_price: priceCalculation.breakdown.find(b => b.label.includes('Yetişkin'))?.amount || 0,
                    child_price: priceCalculation.breakdown.find(b => b.label.includes('Çocuk'))?.amount || 0,
                    baby_price: priceCalculation.breakdown.find(b => b.label.includes('Bebek'))?.amount || 0,
                    currency: priceCalculation.currency
                },
                paid_amount: paidAmount,
                notes
            })
            onClose()
        } catch (error) {
            alert('Rezervasyon oluşturulurken hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= s
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                            {step > s ? <Check className="w-4 h-4" /> : s}
                        </div>
                        {s < 3 && (
                            <div className={`w-12 h-1 mx-1 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* STEP 1: Kişi Sayısı Seçimi */}
            {step === 1 && (
                <div className="space-y-4">
                    {/* Oda/Fiyat Grubu Seçimi */}
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <label className="block text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            {pricingModel === 'room_based' ? 'Oda Tipi' : 'Fiyat Grubu'}
                        </label>
                        <select
                            value={selectedPriceGroupId}
                            onChange={(e) => setSelectedPriceGroupId(e.target.value)}
                            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm bg-white"
                        >
                            {priceGroups.map(pg => (
                                <option key={pg.id} value={pg.id}>{pg.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Kişi Sayısı Seçimi */}
                    <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-600" />
                            Kişi Sayısı
                        </h4>

                        {/* Yetişkin */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div>
                                <p className="font-medium text-gray-900">Yetişkin</p>
                                <p className="text-xs text-gray-500">{childAgeMax + 1}+ yaş</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => updatePax('adults', -1)}
                                    disabled={paxCount.adults <= 1}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-semibold text-lg">{paxCount.adults}</span>
                                <button
                                    type="button"
                                    onClick={() => updatePax('adults', 1)}
                                    disabled={paxCount.adults >= 4}
                                    className="w-8 h-8 rounded-full border border-purple-300 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Çocuk */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div>
                                <p className="font-medium text-gray-900">Çocuk</p>
                                <p className="text-xs text-gray-500">{childAgeMin} - {childAgeMax} yaş</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => updatePax('children', -1)}
                                    disabled={paxCount.children <= 0}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-semibold text-lg">{paxCount.children}</span>
                                <button
                                    type="button"
                                    onClick={() => updatePax('children', 1)}
                                    className="w-8 h-8 rounded-full border border-purple-300 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Bebek */}
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium text-gray-900">Bebek</p>
                                <p className="text-xs text-gray-500">0 - {babyAgeMax} yaş</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => updatePax('babies', -1)}
                                    disabled={paxCount.babies <= 0}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-semibold text-lg">{paxCount.babies}</span>
                                <button
                                    type="button"
                                    onClick={() => updatePax('babies', 1)}
                                    className="w-8 h-8 rounded-full border border-purple-300 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Kapasite Bilgisi */}
                        {pricingModel === 'room_based' && (
                            <div className="pt-2 text-xs text-gray-500 flex justify-between">
                                <span>Oda Kapasitesi: {maxPax} kişi</span>
                                <span>Toplam: {totalPax} kişi</span>
                            </div>
                        )}
                    </div>

                    {/* Hata Mesajları */}
                    {validationErrors.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            {validationErrors.map((error, i) => (
                                <p key={i} className="text-sm text-red-700 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Fiyat Özeti */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Tahmini Tutar</span>
                            <span className="text-xl font-bold text-purple-700">
                                {formatCurrency(priceCalculation.total, priceCalculation.currency)}
                            </span>
                        </div>
                        <div className="space-y-1">
                            {priceCalculation.breakdown.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs text-gray-500">
                                    <span>{item.label}</span>
                                    <span>{formatCurrency(item.amount, priceCalculation.currency)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* İleri Butonu */}
                    <button
                        type="button"
                        onClick={proceedToStep2}
                        disabled={validationErrors.length > 0}
                        className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        İleri
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* STEP 2: Yolcu Bilgileri */}
            {step === 2 && (
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900">
                        Yolcu Bilgileri ({passengers.length} kişi)
                    </h4>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {passengers.map((passenger, index) => (
                            <div key={index} className={`p-4 rounded-lg border ${passenger.passenger_type === 'adult'
                                    ? 'bg-blue-50 border-blue-200'
                                    : passenger.passenger_type === 'child'
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-pink-50 border-pink-200'
                                }`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <User className={`w-4 h-4 ${passenger.passenger_type === 'adult' ? 'text-blue-600' :
                                            passenger.passenger_type === 'child' ? 'text-green-600' : 'text-pink-600'
                                        }`} />
                                    <span className="font-medium text-gray-900">
                                        {index + 1}. {passenger.passenger_type === 'adult' ? 'Yetişkin' :
                                            passenger.passenger_type === 'child' ? 'Çocuk' : 'Bebek'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ad Soyad *"
                                        value={passenger.full_name}
                                        onChange={(e) => {
                                            const updated = [...passengers]
                                            updated[index].full_name = e.target.value
                                            setPassengers(updated)
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="TC Kimlik No"
                                        value={passenger.tc_no}
                                        onChange={(e) => {
                                            const updated = [...passengers]
                                            updated[index].tc_no = e.target.value
                                            setPassengers(updated)
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                    />
                                    <input
                                        type="date"
                                        placeholder="Doğum Tarihi"
                                        value={passenger.birth_date}
                                        onChange={(e) => {
                                            const updated = [...passengers]
                                            updated[index].birth_date = e.target.value
                                            setPassengers(updated)
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Biniş Noktası"
                                        value={passenger.pickup_point}
                                        onChange={(e) => {
                                            const updated = [...passengers]
                                            updated[index].pickup_point = e.target.value
                                            setPassengers(updated)
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Geri
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
                        >
                            İleri
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: Ödeme ve Onay */}
            {step === 3 && (
                <div className="space-y-4">
                    {/* Müşteri */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Rezervasyon Sahibi
                        </h4>
                        <div className="flex gap-2 mb-2">
                            <button
                                type="button"
                                onClick={() => setIsNewClient(true)}
                                className={`px-3 py-1 text-xs rounded-full ${isNewClient ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                            >
                                Yeni Müşteri
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsNewClient(false)}
                                className={`px-3 py-1 text-xs rounded-full ${!isNewClient ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                            >
                                Mevcut Müşteri
                            </button>
                        </div>
                        {isNewClient ? (
                            <div className="grid grid-cols-1 gap-2">
                                <input
                                    type="text"
                                    placeholder="Ad Soyad *"
                                    value={newClient.full_name}
                                    onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="tel"
                                        placeholder="Telefon"
                                        value={newClient.phone}
                                        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                    <input
                                        type="email"
                                        placeholder="E-posta"
                                        value={newClient.email}
                                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        ) : (
                            <input
                                type="text"
                                placeholder="Müşteri ID"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        )}
                    </div>

                    {/* Fiyat Özeti */}
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="text-sm font-semibold text-purple-900 mb-3">Fiyat Detayı</h4>
                        <div className="space-y-2">
                            {priceCalculation.breakdown.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{item.label}</span>
                                    <span className="font-medium">{formatCurrency(item.amount, priceCalculation.currency)}</span>
                                </div>
                            ))}
                            <div className="border-t border-purple-200 pt-2 mt-2 flex justify-between">
                                <span className="font-semibold text-purple-900">Toplam</span>
                                <span className="text-xl font-bold text-purple-700">
                                    {formatCurrency(priceCalculation.total, priceCalculation.currency)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Ödeme */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <label className="block text-sm font-semibold text-green-900 mb-2">Ödenen Tutar</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                className="flex-1 px-3 py-2 border border-green-200 rounded-lg text-sm bg-white"
                            />
                            <button
                                type="button"
                                onClick={() => setPaidAmount(priceCalculation.total)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                            >
                                Tam Ödeme
                            </button>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                            Kalan: {formatCurrency(priceCalculation.total - paidAmount, priceCalculation.currency)}
                        </p>
                    </div>

                    {/* Not */}
                    <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notlar (opsiyonel)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />

                    {/* Navigation */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Geri
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Kaydediliyor...' : 'Rezervasyonu Tamamla'}
                            <Check className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* İptal Butonu */}
            <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
                İptal
            </button>
        </div>
    )
}
