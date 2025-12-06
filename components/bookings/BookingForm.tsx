'use client'

import { useState, useMemo } from 'react'
import { Plus, Minus, ChevronRight, ChevronLeft, User, Users, Check, Home, Trash2, Copy } from 'lucide-react'
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
    onSuccess?: () => void
}

type RoomConfig = {
    id: string
    priceGroupId: string
    adults: number
    children: number
    babies: number
}

type PassengerInfo = {
    full_name: string
    tc_no: string
    birth_date: string
    phone: string
    pickup_point: string
    passenger_type: 'adult' | 'child' | 'baby'
    roomIndex: number
}

export default function BookingForm({
    tourDateId,
    pricingModel,
    priceGroups,
    childAgeMin = 3,
    childAgeMax = 11,
    babyAgeMax = 2,
    onClose,
    onSuccess
}: BookingFormProps) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Odalar (birden fazla oda eklenebilir)
    const [rooms, setRooms] = useState<RoomConfig[]>([
        { id: '1', priceGroupId: priceGroups[0]?.id || '', adults: 1, children: 0, babies: 0 }
    ])

    // Yolcu Bilgileri
    const [passengers, setPassengers] = useState<PassengerInfo[]>([])

    // Müşteri
    const [isNewClient, setIsNewClient] = useState(true)
    const [clientId, setClientId] = useState('')
    const [newClient, setNewClient] = useState({ full_name: '', phone: '', email: '' })

    // Ödeme
    const [paidAmount, setPaidAmount] = useState(0)
    const [notes, setNotes] = useState('')

    // Fiyat grubuna göre maksimum yetişkin sayısını hesapla
    const getMaxAdultsForPriceGroup = (priceGroup: PriceGroup | undefined) => {
        if (!priceGroup) return 1
        if (priceGroup.price_quad_pp && priceGroup.price_quad_pp > 0) return 4
        if (priceGroup.price_triple_pp && priceGroup.price_triple_pp > 0) return 3
        if (priceGroup.price_double_pp && priceGroup.price_double_pp > 0) return 2
        return 1 // En az SNG fiyatı var
    }

    // Oda fiyat hesaplama
    const getRoomPrice = (room: RoomConfig) => {
        const priceGroup = priceGroups.find(pg => pg.id === room.priceGroupId)
        if (!priceGroup) return { total: 0, breakdown: [], currency: 'TRY' }

        const currency = priceGroup.currency || 'TRY'
        const breakdown: { label: string; amount: number }[] = []

        if (pricingModel === 'room_based') {
            // Yetişkin fiyatı
            let adultPrice = 0
            let occupancy = 'SNG'
            switch (room.adults) {
                case 1: adultPrice = priceGroup.price_single_pp || 0; occupancy = 'SNG'; break
                case 2: adultPrice = priceGroup.price_double_pp || 0; occupancy = 'DBL'; break
                case 3: adultPrice = priceGroup.price_triple_pp || 0; occupancy = 'TRPL'; break
                case 4: adultPrice = priceGroup.price_quad_pp || 0; occupancy = 'QUAD'; break
            }

            if (room.adults > 0 && adultPrice > 0) {
                breakdown.push({ label: `${room.adults} Yetişkin (${occupancy})`, amount: room.adults * adultPrice })
            }

            // Çocuk fiyatları
            const child1Price = priceGroup.price_child_1 || 0
            const child2Price = priceGroup.price_child_2 || 0
            if (room.children >= 1) breakdown.push({ label: '1. Çocuk', amount: child1Price })
            if (room.children >= 2) breakdown.push({ label: `${room.children - 1} Çocuk (2.+)`, amount: (room.children - 1) * child2Price })

            // Bebek fiyatları
            const baby1Price = priceGroup.price_baby_1 || 0
            const baby2Price = priceGroup.price_baby_2 || 0
            if (room.babies >= 1) breakdown.push({ label: '1. Bebek', amount: baby1Price })
            if (room.babies >= 2) breakdown.push({ label: `${room.babies - 1} Bebek (2.+)`, amount: (room.babies - 1) * baby2Price })
        } else {
            // Günübirlik tur
            const adultPrice = priceGroup.price_adult || priceGroup.pricing?.adult || 0
            const childPrice = priceGroup.price_child || priceGroup.pricing?.child || 0
            const babyPrice = priceGroup.price_baby || priceGroup.pricing?.baby || 0

            if (room.adults > 0) breakdown.push({ label: `${room.adults} Yetişkin`, amount: room.adults * adultPrice })
            if (room.children > 0) breakdown.push({ label: `${room.children} Çocuk`, amount: room.children * childPrice })
            if (room.babies > 0) breakdown.push({ label: `${room.babies} Bebek`, amount: room.babies * babyPrice })
        }

        const total = breakdown.reduce((sum, item) => sum + item.amount, 0)
        return { total, breakdown, currency }
    }

    // Toplam fiyat
    const totalPrice = useMemo(() => {
        let total = 0
        let currency = 'TRY'
        const allBreakdown: { label: string; amount: number }[] = []

        rooms.forEach((room, index) => {
            const roomPrice = getRoomPrice(room)
            total += roomPrice.total
            currency = roomPrice.currency
            if (rooms.length > 1) {
                allBreakdown.push({ label: `Oda ${index + 1}`, amount: roomPrice.total })
            } else {
                allBreakdown.push(...roomPrice.breakdown)
            }
        })

        return { total, breakdown: allBreakdown, currency }
    }, [rooms, priceGroups, pricingModel])

    // Oda güncelleme
    const updateRoom = (roomId: string, field: keyof RoomConfig, value: number | string) => {
        setRooms(prev => prev.map(room => {
            if (room.id !== roomId) return room

            const priceGroup = priceGroups.find(pg => pg.id === room.priceGroupId)
            const maxPax = priceGroup?.max_pax || 4
            const maxAdults = getMaxAdultsForPriceGroup(priceGroup)

            if (field === 'adults') {
                const newAdults = Math.max(1, Math.min(maxAdults, value as number))
                const maxExtra = maxPax - newAdults
                return {
                    ...room,
                    adults: newAdults,
                    children: Math.min(room.children, maxExtra),
                    babies: Math.min(room.babies, Math.max(0, maxExtra - Math.min(room.children, maxExtra)))
                }
            } else if (field === 'children') {
                const maxChildren = maxPax - room.adults - room.babies
                return { ...room, children: Math.max(0, Math.min(maxChildren, value as number)) }
            } else if (field === 'babies') {
                const maxBabies = maxPax - room.adults - room.children
                return { ...room, babies: Math.max(0, Math.min(maxBabies, value as number)) }
            } else if (field === 'priceGroupId') {
                const newPriceGroup = priceGroups.find(pg => pg.id === value)
                const newMaxAdults = getMaxAdultsForPriceGroup(newPriceGroup)
                return {
                    ...room,
                    priceGroupId: value as string,
                    adults: Math.min(room.adults, newMaxAdults)
                }
            }
            return room
        }))
    }

    // Oda ekleme
    const addRoom = () => {
        setRooms([...rooms, {
            id: Date.now().toString(),
            priceGroupId: priceGroups[0]?.id || '',
            adults: 1,
            children: 0,
            babies: 0
        }])
    }

    // Oda kopyalama
    const duplicateRoom = (room: RoomConfig) => {
        setRooms([...rooms, { ...room, id: Date.now().toString() }])
    }

    // Oda silme
    const removeRoom = (roomId: string) => {
        if (rooms.length > 1) {
            setRooms(rooms.filter(r => r.id !== roomId))
        }
    }

    // Toplam kişi sayısı
    const totalPax = rooms.reduce((sum, r) => sum + r.adults + r.children + r.babies, 0)

    // Step 1 -> Step 2
    const proceedToStep2 = () => {
        const newPassengers: PassengerInfo[] = []
        rooms.forEach((room, roomIndex) => {
            for (let i = 0; i < room.adults; i++) {
                newPassengers.push({ full_name: '', tc_no: '', birth_date: '', phone: '', pickup_point: '', passenger_type: 'adult', roomIndex })
            }
            for (let i = 0; i < room.children; i++) {
                newPassengers.push({ full_name: '', tc_no: '', birth_date: '', phone: '', pickup_point: '', passenger_type: 'child', roomIndex })
            }
            for (let i = 0; i < room.babies; i++) {
                newPassengers.push({ full_name: '', tc_no: '', birth_date: '', phone: '', pickup_point: '', passenger_type: 'baby', roomIndex })
            }
        })
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
                    adult_price: totalPrice.total / Math.max(1, totalPax),
                    child_price: 0,
                    baby_price: 0,
                    currency: totalPrice.currency
                },
                paid_amount: paidAmount,
                notes
            })
            if (onSuccess) {
                onSuccess()
            } else {
                onClose()
            }
        } catch (error) {
            alert('Rezervasyon oluşturulurken hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    // Oda kartı bileşeni
    const RoomCard = ({ room, index }: { room: RoomConfig; index: number }) => {
        const priceGroup = priceGroups.find(pg => pg.id === room.priceGroupId)
        const maxPax = priceGroup?.max_pax || 4
        const maxAdults = getMaxAdultsForPriceGroup(priceGroup)
        const currentPax = room.adults + room.children + room.babies
        const remainingPax = maxPax - currentPax
        const roomPrice = getRoomPrice(room)

        return (
            <div className="p-4 bg-white rounded-xl border-2 border-purple-200 space-y-4">
                {/* Oda Başlığı */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Home className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-semibold text-gray-900">
                            {rooms.length > 1 ? `Oda ${index + 1}` : 'Oda'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => duplicateRoom(room)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                            title="Odayı Kopyala"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        {rooms.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeRoom(room.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Odayı Sil"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Oda Tipi Seçimi */}
                {priceGroups.length > 1 && (
                    <select
                        value={room.priceGroupId}
                        onChange={(e) => updateRoom(room.id, 'priceGroupId', e.target.value)}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm bg-purple-50"
                    >
                        {priceGroups.map(pg => (
                            <option key={pg.id} value={pg.id}>{pg.name}</option>
                        ))}
                    </select>
                )}

                {/* Kişi Sayıları */}
                <div className="space-y-3">
                    {/* Yetişkin */}
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div>
                            <p className="font-medium text-gray-900">Yetişkin</p>
                            <p className="text-xs text-gray-500">{childAgeMax + 1}+ yaş</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => updateRoom(room.id, 'adults', room.adults - 1)}
                                disabled={room.adults <= 1}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold text-lg">{room.adults}</span>
                            <button
                                type="button"
                                onClick={() => updateRoom(room.id, 'adults', room.adults + 1)}
                                disabled={room.adults >= maxAdults}
                                className="w-8 h-8 rounded-full border border-purple-300 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Çocuk */}
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div>
                            <p className="font-medium text-gray-900">Çocuk</p>
                            <p className="text-xs text-gray-500">{childAgeMin} - {childAgeMax} yaş</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => updateRoom(room.id, 'children', room.children - 1)}
                                disabled={room.children <= 0}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold text-lg">{room.children}</span>
                            <button
                                type="button"
                                onClick={() => updateRoom(room.id, 'children', room.children + 1)}
                                disabled={remainingPax <= 0}
                                className="w-8 h-8 rounded-full border border-green-300 flex items-center justify-center text-green-600 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Bebek */}
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="font-medium text-gray-900">Bebek</p>
                            <p className="text-xs text-gray-500">0 - {babyAgeMax} yaş</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => updateRoom(room.id, 'babies', room.babies - 1)}
                                disabled={room.babies <= 0}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold text-lg">{room.babies}</span>
                            <button
                                type="button"
                                onClick={() => updateRoom(room.id, 'babies', room.babies + 1)}
                                disabled={remainingPax <= 0}
                                className="w-8 h-8 rounded-full border border-pink-300 flex items-center justify-center text-pink-600 hover:bg-pink-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Oda Bilgisi */}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-500">
                        Kapasite: {currentPax}/{maxPax} kişi
                    </span>
                    <span className="font-semibold text-purple-700">
                        {formatCurrency(roomPrice.total, roomPrice.currency)}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                            {step > s ? <Check className="w-4 h-4" /> : s}
                        </div>
                        {s < 3 && <div className={`w-12 h-1 mx-1 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            {/* STEP 1: Oda ve Kişi Seçimi */}
            {step === 1 && (
                <div className="space-y-4">
                    {/* Odalar */}
                    <div className="space-y-4">
                        {rooms.map((room, index) => (
                            <RoomCard key={room.id} room={room} index={index} />
                        ))}
                    </div>

                    {/* Oda Ekle Butonu */}
                    <button
                        type="button"
                        onClick={addRoom}
                        className="w-full py-3 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 font-medium hover:bg-purple-50 hover:border-purple-400 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Oda Ekle
                    </button>

                    {/* Toplam Özet */}
                    <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl border border-purple-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-600">{rooms.length} Oda, {totalPax} Kişi</p>
                                <p className="text-2xl font-bold text-purple-700">
                                    {formatCurrency(totalPrice.total, totalPrice.currency)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={proceedToStep2}
                                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all flex items-center gap-2"
                            >
                                İleri
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
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
                                        {rooms.length > 1 && <span className="text-xs text-gray-500 ml-1">(Oda {passenger.roomIndex + 1})</span>}
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

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2">
                            <ChevronLeft className="w-5 h-5" />
                            Geri
                        </button>
                        <button type="button" onClick={() => setStep(3)} className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center justify-center gap-2">
                            İleri
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: Ödeme */}
            {step === 3 && (
                <div className="space-y-4">
                    {/* Müşteri */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Rezervasyon Sahibi
                        </h4>
                        <div className="flex gap-2 mb-2">
                            <button type="button" onClick={() => setIsNewClient(true)} className={`px-3 py-1 text-xs rounded-full ${isNewClient ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                Yeni Müşteri
                            </button>
                            <button type="button" onClick={() => setIsNewClient(false)} className={`px-3 py-1 text-xs rounded-full ${!isNewClient ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                Mevcut Müşteri
                            </button>
                        </div>
                        {isNewClient ? (
                            <div className="grid grid-cols-1 gap-2">
                                <input type="text" placeholder="Ad Soyad *" value={newClient.full_name} onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="tel" placeholder="Telefon" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                    <input type="email" placeholder="E-posta" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                </div>
                            </div>
                        ) : (
                            <input type="text" placeholder="Müşteri ID" value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        )}
                    </div>

                    {/* Fiyat Özeti */}
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="text-sm font-semibold text-purple-900 mb-3">Fiyat Detayı</h4>
                        <div className="space-y-2">
                            {rooms.map((room, index) => {
                                const roomPrice = getRoomPrice(room)
                                return (
                                    <div key={room.id} className="border-b border-purple-100 pb-2 mb-2">
                                        <p className="font-medium text-gray-800 mb-1">{rooms.length > 1 ? `Oda ${index + 1}` : 'Oda'}</p>
                                        {roomPrice.breakdown.map((item, i) => (
                                            <div key={i} className="flex justify-between text-sm text-gray-600">
                                                <span>{item.label}</span>
                                                <span>{formatCurrency(item.amount, roomPrice.currency)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })}
                            <div className="flex justify-between pt-2">
                                <span className="font-semibold text-purple-900">Toplam</span>
                                <span className="text-xl font-bold text-purple-700">
                                    {formatCurrency(totalPrice.total, totalPrice.currency)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Ödeme */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <label className="block text-sm font-semibold text-green-900 mb-2">Ödenen Tutar</label>
                        <div className="flex gap-2">
                            <input type="number" min="0" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} className="flex-1 px-3 py-2 border border-green-200 rounded-lg text-sm bg-white" />
                            <button type="button" onClick={() => setPaidAmount(totalPrice.total)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                                Tam Ödeme
                            </button>
                        </div>
                        <p className="text-xs text-green-600 mt-1">Kalan: {formatCurrency(totalPrice.total - paidAmount, totalPrice.currency)}</p>
                    </div>

                    <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notlar (opsiyonel)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2">
                            <ChevronLeft className="w-5 h-5" />
                            Geri
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? 'Kaydediliyor...' : 'Tamamla'}
                            <Check className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            <button type="button" onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
                İptal
            </button>
        </div>
    )
}
