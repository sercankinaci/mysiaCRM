'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, User, Users, Home, DollarSign } from 'lucide-react'
import { createBookingWithPassengers, Passenger } from '@/lib/actions/bookings'
import { PriceGroup } from '@/lib/actions/tour-details'
import { formatCurrency } from '@/lib/utils'

type PassengerInput = Passenger & { tempId: string }
type PricingModel = 'per_person' | 'room_based'

interface BookingFormProps {
    tourDateId: string
    pricingModel: PricingModel
    priceGroups: PriceGroup[]
    onClose: () => void
}

export default function BookingForm({
    tourDateId,
    pricingModel,
    priceGroups,
    onClose
}: BookingFormProps) {
    const [loading, setLoading] = useState(false)
    const [isNewClient, setIsNewClient] = useState(true)
    const [clientId, setClientId] = useState('')
    const [newClient, setNewClient] = useState({ full_name: '', phone: '', email: '' })
    const [notes, setNotes] = useState('')

    // Fiyat Grubu Seçimi
    const [selectedPriceGroupId, setSelectedPriceGroupId] = useState(priceGroups[0]?.id || '')
    const selectedPriceGroup = priceGroups.find(pg => pg.id === selectedPriceGroupId)

    // Günübirlik Tur - Yolcular
    const [passengers, setPassengers] = useState<PassengerInput[]>([
        { tempId: '1', full_name: '', tc_no: '', passenger_type: 'adult', pickup_point: '' }
    ])

    // Paket Tur - Oda Konfigürasyonu
    // Kullanıcı yetişkin sayısını seçer, oda tipi otomatik belirlenir
    const [roomConfig, setRoomConfig] = useState({
        adults: 1,      // Kullanıcı seçer (mevcut fiyatlara göre 1-4 arası)
        children: 0,    // max_pax - adults kadar
        babies: 0       // max_pax - adults - children kadar
    })

    const [paidAmount, setPaidAmount] = useState(0)

    // Yetişkin sayısına göre oda tipini ve fiyatını belirle
    const getOccupancyAndPrice = (adultCount: number) => {
        if (!selectedPriceGroup) return { occupancy: 'SNG', price: 0 }

        switch (adultCount) {
            case 1: return { occupancy: 'SNG', price: selectedPriceGroup.price_single_pp || 0 }
            case 2: return { occupancy: 'DBL', price: selectedPriceGroup.price_double_pp || 0 }
            case 3: return { occupancy: 'TRPL', price: selectedPriceGroup.price_triple_pp || 0 }
            case 4: return { occupancy: 'QUAD', price: selectedPriceGroup.price_quad_pp || 0 }
            default: return { occupancy: 'SNG', price: selectedPriceGroup.price_single_pp || 0 }
        }
    }

    // Oda kapasitesi - çocuk+bebek için limit
    const maxPax = selectedPriceGroup?.max_pax || 4
    const maxExtraPersons = Math.max(0, maxPax - roomConfig.adults)

    // Fiyat Hesaplama
    const priceCalculation = useMemo(() => {
        if (!selectedPriceGroup) {
            return { total: 0, breakdown: '', currency: 'TRY', occupancy: 'SNG', adultPrice: 0, childPrice: 0, babyPrice: 0 }
        }

        const currency = selectedPriceGroup.currency || 'TRY'

        if (pricingModel === 'room_based') {
            const { occupancy, price: adultPrice } = getOccupancyAndPrice(roomConfig.adults)

            const child1Price = selectedPriceGroup.price_child_1 || 0
            const child2Price = selectedPriceGroup.price_child_2 || 0
            const baby1Price = selectedPriceGroup.price_baby_1 || 0
            const baby2Price = selectedPriceGroup.price_baby_2 || 0

            const adultTotal = roomConfig.adults * adultPrice
            const childTotal = roomConfig.children >= 1
                ? child1Price + (roomConfig.children >= 2 ? child2Price * (roomConfig.children - 1) : 0)
                : 0
            const babyTotal = roomConfig.babies >= 1
                ? baby1Price + (roomConfig.babies >= 2 ? baby2Price * (roomConfig.babies - 1) : 0)
                : 0

            const total = adultTotal + childTotal + babyTotal
            const breakdown = `${roomConfig.adults} Yetişkin (${occupancy}) + ${roomConfig.children} Çocuk + ${roomConfig.babies} Bebek`

            return { total, breakdown, currency, occupancy, adultPrice, childPrice: child1Price, babyPrice: baby1Price }
        } else {
            const paxCounts = {
                adult: passengers.filter(p => p.passenger_type === 'adult').length,
                child: passengers.filter(p => p.passenger_type === 'child').length,
                baby: passengers.filter(p => p.passenger_type === 'baby').length
            }

            const adultPrice = selectedPriceGroup.price_adult || selectedPriceGroup.pricing?.adult || 0
            const childPrice = selectedPriceGroup.price_child || selectedPriceGroup.pricing?.child || 0
            const babyPrice = selectedPriceGroup.price_baby || selectedPriceGroup.pricing?.baby || 0

            const total = (paxCounts.adult * adultPrice) + (paxCounts.child * childPrice) + (paxCounts.baby * babyPrice)
            const breakdown = `${paxCounts.adult} Yetişkin + ${paxCounts.child} Çocuk + ${paxCounts.baby} Bebek`

            return { total, breakdown, currency, occupancy: '', adultPrice, childPrice, babyPrice }
        }
    }, [pricingModel, selectedPriceGroup, passengers, roomConfig])

    // Yolcu İşlemleri
    const addPassenger = () => {
        setPassengers([
            ...passengers,
            { tempId: Date.now().toString(), full_name: '', tc_no: '', passenger_type: 'adult', pickup_point: '' }
        ])
    }

    const removePassenger = (tempId: string) => {
        if (passengers.length > 1) {
            setPassengers(passengers.filter(p => p.tempId !== tempId))
        }
    }

    const updatePassenger = (tempId: string, field: keyof PassengerInput, value: string) => {
        setPassengers(passengers.map(p =>
            p.tempId === tempId ? { ...p, [field]: value } : p
        ))
    }

    // Paket tur için otomatik yolcu listesi
    const getPackagePassengers = (): Passenger[] => {
        const list: Passenger[] = []
        for (let i = 0; i < roomConfig.adults; i++) {
            list.push({ full_name: `Yetişkin ${i + 1}`, passenger_type: 'adult' })
        }
        for (let i = 0; i < roomConfig.children; i++) {
            list.push({ full_name: `Çocuk ${i + 1}`, passenger_type: 'child' })
        }
        for (let i = 0; i < roomConfig.babies; i++) {
            list.push({ full_name: `Bebek ${i + 1}`, passenger_type: 'baby' })
        }
        return list
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (isNewClient && !newClient.full_name.trim()) {
            alert('Müşteri adı gerekli')
            return
        }
        if (!isNewClient && !clientId.trim()) {
            alert('Müşteri ID gerekli')
            return
        }
        if (pricingModel === 'per_person' && passengers.some(p => !p.full_name.trim())) {
            alert('Tüm yolcuların ad soyad bilgisi gerekli')
            return
        }

        setLoading(true)
        try {
            const finalPassengers = pricingModel === 'room_based'
                ? getPackagePassengers()
                : passengers.map(({ tempId, ...p }) => p)

            await createBookingWithPassengers({
                tour_date_id: tourDateId,
                client_id: isNewClient ? undefined : clientId,
                new_client: isNewClient ? newClient : undefined,
                passengers: finalPassengers,
                pricing: {
                    adult_price: priceCalculation.adultPrice || 0,
                    child_price: priceCalculation.childPrice || 0,
                    baby_price: priceCalculation.babyPrice || 0,
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
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fiyat Grubu / Oda Tipi Seçimi */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    {pricingModel === 'room_based' ? (
                        <><Home className="w-4 h-4 text-purple-600" /> Oda Tipi</>
                    ) : (
                        <><DollarSign className="w-4 h-4 text-blue-600" /> Fiyat Grubu</>
                    )}
                </label>
                <select
                    value={selectedPriceGroupId}
                    onChange={(e) => setSelectedPriceGroupId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                    {priceGroups.map(pg => (
                        <option key={pg.id} value={pg.id}>
                            {pg.name} - {pg.currency}
                        </option>
                    ))}
                </select>
            </div>

            {/* Paket Tur - Oda Konfigürasyonu */}
            {pricingModel === 'room_based' && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-4">
                    <h4 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Oda Konfigürasyonu
                    </h4>

                    {/* Yetişkin Sayısı Seçimi */}
                    <div>
                        <label className="block text-xs text-purple-700 mb-2">Yetişkin Sayısı</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4].map((num) => {
                                const { price, occupancy } = getOccupancyAndPrice(num)
                                const isAvailable = price > 0
                                const isSelected = roomConfig.adults === num
                                return (
                                    <button
                                        key={num}
                                        type="button"
                                        disabled={!isAvailable}
                                        onClick={() => {
                                            const newMaxExtra = (selectedPriceGroup?.max_pax || 4) - num
                                            setRoomConfig({
                                                adults: num,
                                                children: Math.min(roomConfig.children, newMaxExtra),
                                                babies: Math.min(roomConfig.babies, Math.max(0, newMaxExtra - Math.min(roomConfig.children, newMaxExtra)))
                                            })
                                        }}
                                        className={`p-3 rounded-lg text-center transition-all ${isSelected
                                                ? 'bg-purple-600 text-white'
                                                : isAvailable
                                                    ? 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-100'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <span className="block text-lg font-bold">{num}</span>
                                        <span className="block text-xs opacity-80">{occupancy}</span>
                                        {isAvailable && (
                                            <span className="block text-xs mt-1">
                                                {formatCurrency(price, selectedPriceGroup?.currency)}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                        <p className="text-xs text-purple-500 mt-2">
                            ℹ️ Yetişkin sayısına göre oda tipi ve fiyat otomatik belirlenir
                        </p>
                    </div>

                    {/* Çocuk ve Bebek */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div>
                            <label className="block text-xs text-amber-700 mb-1">
                                Çocuk (Max: {Math.max(0, maxExtraPersons - roomConfig.babies)})
                            </label>
                            <input
                                type="number"
                                min="0"
                                max={Math.max(0, maxExtraPersons - roomConfig.babies)}
                                value={roomConfig.children}
                                onChange={(e) => {
                                    const val = Math.min(parseInt(e.target.value) || 0, Math.max(0, maxExtraPersons - roomConfig.babies))
                                    setRoomConfig({ ...roomConfig, children: val })
                                }}
                                className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-amber-700 mb-1">
                                Bebek (Max: {Math.max(0, maxExtraPersons - roomConfig.children)})
                            </label>
                            <input
                                type="number"
                                min="0"
                                max={Math.max(0, maxExtraPersons - roomConfig.children)}
                                value={roomConfig.babies}
                                onChange={(e) => {
                                    const val = Math.min(parseInt(e.target.value) || 0, Math.max(0, maxExtraPersons - roomConfig.children))
                                    setRoomConfig({ ...roomConfig, babies: val })
                                }}
                                className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white"
                            />
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-amber-600">
                                📌 Oda Kapasitesi: {maxPax} kişi | Kalan: {maxExtraPersons - roomConfig.children - roomConfig.babies} kişi
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Müşteri */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Müşteri (Rezervasyon Sahibi)
                    </h4>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsNewClient(true)}
                            className={`px-3 py-1 text-xs rounded-full ${isNewClient ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            Yeni Müşteri
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsNewClient(false)}
                            className={`px-3 py-1 text-xs rounded-full ${!isNewClient ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            Mevcut Müşteri
                        </button>
                    </div>
                </div>

                {isNewClient ? (
                    <div className="grid grid-cols-3 gap-3">
                        <input
                            type="text"
                            placeholder="Ad Soyad *"
                            value={newClient.full_name}
                            onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
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
                ) : (
                    <input
                        type="text"
                        placeholder="Müşteri ID (UUID)"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                )}
            </div>

            {/* Yolcular - Günübirlik için */}
            {pricingModel === 'per_person' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Yolcular ({passengers.length} kişi)
                        </h4>
                        <button type="button" onClick={addPassenger} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                            <Plus className="w-3 h-3" />
                            Yolcu Ekle
                        </button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {passengers.map((passenger, index) => (
                            <div key={passenger.tempId} className="p-3 bg-gray-50 rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">Yolcu {index + 1}</span>
                                    {passengers.length > 1 && (
                                        <button type="button" onClick={() => removePassenger(passenger.tempId)} className="text-gray-400 hover:text-red-600">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ad Soyad *"
                                        value={passenger.full_name}
                                        onChange={(e) => updatePassenger(passenger.tempId, 'full_name', e.target.value)}
                                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="TC Kimlik"
                                        value={passenger.tc_no || ''}
                                        onChange={(e) => updatePassenger(passenger.tempId, 'tc_no', e.target.value)}
                                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    />
                                    <select
                                        value={passenger.passenger_type}
                                        onChange={(e) => updatePassenger(passenger.tempId, 'passenger_type', e.target.value)}
                                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    >
                                        <option value="adult">Yetişkin</option>
                                        <option value="child">Çocuk</option>
                                        <option value="baby">Bebek</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Biniş Durağı"
                                        value={passenger.pickup_point || ''}
                                        onChange={(e) => updatePassenger(passenger.tempId, 'pickup_point', e.target.value)}
                                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Özet & Ödeme */}
            <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${pricingModel === 'room_based' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                    <p className={`text-sm ${pricingModel === 'room_based' ? 'text-purple-700' : 'text-blue-700'}`}>Toplam Tutar</p>
                    <p className={`text-2xl font-bold ${pricingModel === 'room_based' ? 'text-purple-800' : 'text-blue-800'}`}>
                        {formatCurrency(priceCalculation.total, priceCalculation.currency)}
                    </p>
                    <p className={`text-xs mt-1 ${pricingModel === 'room_based' ? 'text-purple-600' : 'text-blue-600'}`}>
                        {priceCalculation.breakdown}
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ödenen Tutar</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button type="button" onClick={() => setPaidAmount(priceCalculation.total)} className="text-xs text-blue-600 hover:text-blue-800 mt-1">
                        Tam Ödeme
                    </button>
                </div>
            </div>

            {/* Notlar */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Ek bilgiler..."
                />
            </div>

            {/* Butonlar */}
            <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
                    İptal
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 text-white rounded-lg text-sm disabled:opacity-50 ${pricingModel === 'room_based' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {loading ? 'Kaydediliyor...' : 'Rezervasyon Oluştur'}
                </button>
            </div>
        </form>
    )
}
