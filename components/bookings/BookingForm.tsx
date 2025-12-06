'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Minus, ChevronRight, ChevronLeft, User, Users, Check, Home, Trash2, Copy, CreditCard, FileText, UserPlus } from 'lucide-react'
import { createBookingWithPassengers, Passenger } from '@/lib/actions/bookings'
import { getClientByPhone } from '@/lib/actions/clients'
import { PriceGroup } from '@/lib/actions/tour-details'
import { formatCurrency } from '@/lib/utils'
import { useDebounce } from 'use-debounce'
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

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

    // Odalar
    const [rooms, setRooms] = useState<RoomConfig[]>([
        { id: '1', priceGroupId: priceGroups[0]?.id || '', adults: 1, children: 0, babies: 0 }
    ])

    const [passengers, setPassengers] = useState<PassengerInfo[]>([])

    // Müşteri
    const [isNewClient, setIsNewClient] = useState(true)
    const [clientId, setClientId] = useState('')
    const [newClient, setNewClient] = useState({ full_name: '', phone: '', email: '' })

    // Telefon araması için debounce
    const [debouncedPhone] = useDebounce(newClient.phone, 500)
    const [isSearchingClient, setIsSearchingClient] = useState(false)
    const [foundClientMessage, setFoundClientMessage] = useState<string | null>(null)

    // Telefon değiştiğinde otomatik ara
    useEffect(() => {
        async function search() {
            // E.164 formatında en az +90... (yaklaşık 10-12 karakter) olmalı
            if (!isNewClient || !debouncedPhone || debouncedPhone.length < 8) return

            // Numara geçerli mi kontrol et (kütüphane fonksiyonu)
            if (!isPossiblePhoneNumber(debouncedPhone)) return

            setIsSearchingClient(true)
            try {
                const client = await getClientByPhone(debouncedPhone)
                if (client) {
                    setNewClient(prev => ({
                        ...prev,
                        full_name: client.name,
                        email: client.email || '',
                        // Telefonu ellemiyoruz, input zaten yönetiyor
                    }))
                    setFoundClientMessage(`Kayıtlı müşteri bulundu: ${client.name}`)
                } else {
                    setFoundClientMessage(null)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setIsSearchingClient(false)
            }
        }
        search()
    }, [debouncedPhone, isNewClient])

    const [paidAmount, setPaidAmount] = useState(0)
    const [notes, setNotes] = useState('')

    // --- Helpers (Fiyat hesaplama vb.) ---
    const getMaxAdultsForPriceGroup = (priceGroup: PriceGroup | undefined) => {
        if (!priceGroup) return 1
        if (pricingModel === 'per_person') return 99
        if (priceGroup.price_quad_pp && priceGroup.price_quad_pp > 0) return 4
        if (priceGroup.price_triple_pp && priceGroup.price_triple_pp > 0) return 3
        if (priceGroup.price_double_pp && priceGroup.price_double_pp > 0) return 2
        return 1
    }

    const getRoomPrice = (room: RoomConfig) => {
        const priceGroup = priceGroups.find(pg => pg.id === room.priceGroupId)
        if (!priceGroup) return { total: 0, breakdown: [], currency: 'TRY' }

        const currency = priceGroup.currency || 'TRY'
        const breakdown: { label: string; amount: number }[] = []

        if (pricingModel === 'room_based') {
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
            const child1Price = priceGroup.price_child_1 || 0
            const child2Price = priceGroup.price_child_2 || 0
            const baby1Price = priceGroup.price_baby_1 || 0
            const baby2Price = priceGroup.price_baby_2 || 0

            if (room.children >= 1) breakdown.push({ label: '1. Çocuk', amount: child1Price })
            if (room.children >= 2) breakdown.push({ label: `${room.children - 1} Çocuk (2.+)`, amount: (room.children - 1) * child2Price })
            if (room.babies >= 1) breakdown.push({ label: '1. Bebek', amount: baby1Price })
            if (room.babies >= 2) breakdown.push({ label: `${room.babies - 1} Bebek (2.+)`, amount: (room.babies - 1) * baby2Price })
        } else {
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

    const totalPrice = useMemo(() => {
        let total = 0
        let currency = 'TRY'
        const allBreakdown: { label: string; amount: number }[] = []

        rooms.forEach((room, index) => {
            const roomPrice = getRoomPrice(room)
            total += roomPrice.total
            currency = roomPrice.currency
            if (pricingModel === 'room_based' && rooms.length > 1) {
                allBreakdown.push({ label: `Oda ${index + 1}`, amount: roomPrice.total })
            } else {
                allBreakdown.push(...roomPrice.breakdown)
            }
        })
        return { total, breakdown: allBreakdown, currency }
    }, [rooms, priceGroups, pricingModel])

    const updateRoom = (roomId: string, field: keyof RoomConfig, value: number | string) => {
        setRooms(prev => prev.map(room => {
            if (room.id !== roomId) return room
            const priceGroup = priceGroups.find(pg => pg.id === room.priceGroupId)
            const isRoomBased = pricingModel === 'room_based'
            const maxPax = isRoomBased ? (priceGroup?.max_pax || 4) : 99
            const maxAdults = getMaxAdultsForPriceGroup(priceGroup)

            if (field === 'adults') {
                const newAdults = Math.max(1, Math.min(maxAdults, value as number))
                const maxExtra = isRoomBased ? maxPax - newAdults : 99
                return {
                    ...room,
                    adults: newAdults,
                    children: Math.min(room.children, maxExtra),
                    babies: Math.min(room.babies, Math.max(0, maxExtra - Math.min(room.children, maxExtra)))
                }
            } else if (field === 'children') {
                const maxChildren = isRoomBased ? maxPax - room.adults - room.babies : 99
                return { ...room, children: Math.max(0, Math.min(maxChildren, value as number)) }
            } else if (field === 'babies') {
                const maxBabies = isRoomBased ? maxPax - room.adults - room.children : 99
                return { ...room, babies: Math.max(0, Math.min(maxBabies, value as number)) }
            } else if (field === 'priceGroupId') {
                const newPriceGroup = priceGroups.find(pg => pg.id === value)
                const newMaxAdults = getMaxAdultsForPriceGroup(newPriceGroup)
                return { ...room, priceGroupId: value as string, adults: Math.min(room.adults, newMaxAdults) }
            }
            return room
        }))
    }

    const addRoom = () => setRooms([...rooms, { id: Date.now().toString(), priceGroupId: priceGroups[0]?.id || '', adults: 1, children: 0, babies: 0 }])
    const duplicateRoom = (room: RoomConfig) => setRooms([...rooms, { ...room, id: Date.now().toString() }])
    const removeRoom = (roomId: string) => { if (rooms.length > 1) setRooms(rooms.filter(r => r.id !== roomId)) }
    const totalPax = rooms.reduce((sum, r) => sum + r.adults + r.children + r.babies, 0)

    const proceedToStep2 = () => {
        const newPassengers: PassengerInfo[] = []
        rooms.forEach((room, roomIndex) => {
            for (let i = 0; i < room.adults; i++) newPassengers.push({ full_name: '', tc_no: '', birth_date: '', phone: '', pickup_point: '', passenger_type: 'adult', roomIndex })
            for (let i = 0; i < room.children; i++) newPassengers.push({ full_name: '', tc_no: '', birth_date: '', phone: '', pickup_point: '', passenger_type: 'child', roomIndex })
            for (let i = 0; i < room.babies; i++) newPassengers.push({ full_name: '', tc_no: '', birth_date: '', phone: '', pickup_point: '', passenger_type: 'baby', roomIndex })
        })
        setPassengers(newPassengers)
        setStep(2)
    }

    async function handleSubmit() {
        if (isNewClient && !newClient.full_name.trim()) {
            alert('Müşteri adı gerekli')
            return
        }
        // Telefon kontrolü
        if (isNewClient && (!newClient.phone || !isPossiblePhoneNumber(newClient.phone))) {
            alert('Lütfen geçerli bir telefon numarası girin')
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
            // Fiyatlandırma stratejisi:
            // Oda bazlı sistemde toplam fiyatı yetişkin sayısına bölerek 'sanal' bir yetişkin fiyatı oluşturuyoruz.
            // Böylece backend (Yetişkin * Fiyat) + (Çocuk * 0) hesabı yaptığında Toplam Tutar, UI'daki ile birebir aynı çıkıyor.
            const totalAdults = passengers.filter(p => p.passenger_type === 'adult').length

            // Eğer yetişkin yoksa (çok nadir), toplam pax'a böl (fallback)
            const divisor = totalAdults > 0 ? totalAdults : Math.max(1, totalPax)

            await createBookingWithPassengers({
                tour_date_id: tourDateId,
                client_id: isNewClient ? undefined : clientId,
                new_client: isNewClient ? newClient : undefined,
                passengers: finalPassengers,
                pricing: {
                    adult_price: totalPrice.total / divisor,
                    child_price: 0,
                    baby_price: 0,
                    currency: totalPrice.currency
                },
                paid_amount: paidAmount,
                notes
            })
            if (onSuccess) onSuccess()
            else onClose()
        } catch (error) {
            alert('Rezervasyon oluşturulurken hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const RoomCard = ({ room, index }: { room: RoomConfig; index: number }) => {
        const priceGroup = priceGroups.find(pg => pg.id === room.priceGroupId)
        const isRoomBased = pricingModel === 'room_based'

        const maxPax = isRoomBased ? (priceGroup?.max_pax || 4) : 99
        const maxAdults = getMaxAdultsForPriceGroup(priceGroup)
        const currentPax = room.adults + room.children + room.babies
        const remainingPax = isRoomBased ? (maxPax - currentPax) : 99
        const roomPrice = getRoomPrice(room)

        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isRoomBased ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                            {isRoomBased ? index + 1 : <UserPlus className="w-5 h-5" />}
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">
                                {isRoomBased ? (rooms.length > 1 ? `Oda ${index + 1}` : 'Oda Seçimi') : 'Kişi Sayısı Seçimi'}
                            </h4>
                            <p className="text-xs text-gray-500">
                                {isRoomBased ? `Kapasite: ${currentPax}/${maxPax} Kişi` : `${currentPax} Kişi Seçildi`}
                            </p>
                        </div>
                    </div>
                    {isRoomBased && (
                        <div className="flex gap-1">
                            <button onClick={() => duplicateRoom(room)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Kopyala"><Copy className="w-4 h-4" /></button>
                            {rooms.length > 1 && <button onClick={() => removeRoom(room.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                    )}
                </div>

                {priceGroups.length > 1 && (
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            {isRoomBased ? 'Oda Tipi' : 'Fiyat Grubu'}
                        </label>
                        <select
                            value={room.priceGroupId}
                            onChange={(e) => updateRoom(room.id, 'priceGroupId', e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                        >
                            {priceGroups.map(pg => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: 'Yetişkin', field: 'adults' as const, val: room.adults, max: maxAdults, min: 1, age: `${childAgeMax + 1}+` },
                        { label: 'Çocuk', field: 'children' as const, val: room.children, max: room.children + remainingPax, min: 0, age: `${childAgeMin}-${childAgeMax}` },
                        { label: 'Bebek', field: 'babies' as const, val: room.babies, max: room.babies + remainingPax, min: 0, age: `0-${babyAgeMax}` }
                    ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-xs font-medium text-gray-900 mb-0.5">{item.label}</span>
                            <span className="text-[10px] text-gray-400 mb-2">{item.age}</span>
                            <div className="flex items-center gap-3">
                                <button onClick={() => updateRoom(room.id, item.field, item.val - 1)} disabled={item.val <= item.min} className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30"><Minus className="w-3 h-3" /></button>
                                <span className="text-sm font-semibold w-2 text-center">{item.val}</span>
                                <button onClick={() => updateRoom(room.id, item.field, item.val + 1)} disabled={isRoomBased && item.val >= item.max} className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30"><Plus className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto pb-8">
            {/* Custom Styles for Phone Input */}
            <style jsx global>{`
                .PhoneInput {
                    display: flex;
                    align-items: center;
                    background-color: #F9FAFB; /* bg-gray-50 */
                    border: 1px solid #E5E7EB; /* border-gray-200 */
                    border-radius: 0.75rem; /* rounded-xl */
                    padding: 0.75rem 1rem; /* px-4 py-3 */
                    transition: all 0.2s;
                }
                .PhoneInput:focus-within {
                    background-color: #FFFFFF; /* bg-white */
                    border-color: #3B82F6; /* border-blue-500 */
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); /* ring-blue-50/50 approx */
                }
                .PhoneInput.success:focus-within {
                    border-color: #22C55E; /* border-green-500 */
                    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1); /* ring-green-50/50 approx */
                }
                .PhoneInputInput {
                    flex: 1;
                    min-width: 0;
                    background-color: transparent;
                    border: none;
                    outline: none;
                    font-size: 1rem;
                    color: #111827; /* text-gray-900 */
                }
                .PhoneInputInput::placeholder {
                    color: #9CA3AF; /* text-gray-400 */
                }
                .PhoneInputCountry {
                    margin-right: 0.75rem; /* mr-3 */
                    opacity: 0.7;
                }
                .PhoneInputCountrySelect {
                    background-color: white;
                }
            `}</style>

            {/* Step Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full -z-10" />
                    {[
                        { id: 1, label: pricingModel === 'room_based' ? 'Oda Seçimi' : 'Kişi Seçimi', icon: Home },
                        { id: 2, label: 'Yolcu Bilgileri', icon: Users },
                        { id: 3, label: 'Ödeme', icon: CreditCard }
                    ].map((s) => (
                        <div key={s.id} className="flex flex-col items-center gap-2 bg-white px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${step >= s.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-medium ${step >= s.id ? 'text-blue-600' : 'text-gray-400'}`}>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                        {rooms.map((room, index) => <RoomCard key={room.id} room={room} index={index} />)}
                    </div>

                    {/* Sadece oda bazlı (konaklamalı) turlarda yeni oda eklenebilir */}
                    {pricingModel === 'room_based' && (
                        <button onClick={addRoom} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" /> Yeni Oda Ekle
                        </button>
                    )}

                    <div className="sticky bottom-0 bg-white/80 backdrop-blur-md p-4 -mx-4 border-t border-gray-100 flex items-center justify-between rounded-xl shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                        <div>
                            <p className="text-sm text-gray-500">
                                {totalPax} Kişi
                                {pricingModel === 'room_based' && `, ${rooms.length} Oda`}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPrice.total, totalPrice.currency)}</p>
                        </div>
                        <button onClick={proceedToStep2} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
                            Devam Et <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-3">
                        {passengers.map((passenger, index) => (
                            <div key={index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
                                <div className={`w-1 shrink-0 rounded-full ${passenger.passenger_type === 'adult' ? 'bg-blue-500' : passenger.passenger_type === 'child' ? 'bg-green-500' : 'bg-pink-500'}`} />
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                            {passenger.passenger_type === 'adult' ? 'Yetişkin' : passenger.passenger_type === 'child' ? 'Çocuk' : 'Bebek'}
                                            {pricingModel === 'room_based' && rooms.length > 1 && (
                                                <span className="text-xs font-normal text-gray-400 px-2 py-0.5 bg-gray-50 rounded-full">Oda {passenger.roomIndex + 1}</span>
                                            )}
                                        </h4>
                                        <span className="text-xs text-gray-400">Yolcu {index + 1}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input type="text" placeholder="Ad Soyad" value={passenger.full_name} onChange={(e) => { const u = [...passengers]; u[index].full_name = e.target.value; setPassengers(u) }} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-gray-400" />
                                        <input type="text" placeholder="TC Kimlik No" value={passenger.tc_no} onChange={(e) => { const u = [...passengers]; u[index].tc_no = e.target.value; setPassengers(u) }} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-gray-400" />
                                        <input type="date" value={passenger.birth_date} onChange={(e) => { const u = [...passengers]; u[index].birth_date = e.target.value; setPassengers(u) }} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all" />
                                        <input type="text" placeholder="Biniş Noktası" value={passenger.pickup_point} onChange={(e) => { const u = [...passengers]; u[index].pickup_point = e.target.value; setPassengers(u) }} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setStep(1)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all">Geri Dön</button>
                        <button onClick={() => setStep(3)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Ödeme Adımına Geç</button>
                    </div>
                </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Müşteri Bilgileri */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" /> Rezervasyon Sahibi
                            </h4>
                            <div className="flex p-1 bg-gray-50 rounded-xl w-fit mb-6">
                                <button onClick={() => setIsNewClient(true)} className={`px-4 py-1.5 text-sm rounded-lg transition-all ${isNewClient ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'}`}>Yeni Müşteri</button>
                                <button onClick={() => setIsNewClient(false)} className={`px-4 py-1.5 text-sm rounded-lg transition-all ${!isNewClient ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'}`}>Mevcut Müşteri</button>
                            </div>

                            {isNewClient ? (
                                <div className="space-y-4">
                                    <input type="text" placeholder="Ad Soyad (Zorunlu)" value={newClient.full_name} onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all" />
                                    {foundClientMessage && (
                                        <div className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded-lg flex items-center gap-1">
                                            <Check className="w-3 h-3" /> {foundClientMessage}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <PhoneInput
                                                defaultCountry="TR"
                                                placeholder="5XX XXX XX XX"
                                                value={newClient.phone}
                                                onChange={(value) => setNewClient({ ...newClient, phone: value || '' })}
                                                className={`PhoneInput ${foundClientMessage ? 'success' : ''}`}
                                            />
                                            {isSearchingClient && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                                        </div>
                                        <input type="email" placeholder="E-posta" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all" />
                                    </div>
                                </div>
                            ) : (
                                <input type="text" placeholder="Müşteri ID ile ara..." value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all" />
                            )}
                        </div>

                        {/* Ödeme Bilgileri */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-green-500" /> Ödeme Alınan Tutar
                            </h4>
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₺</span>
                                    <input type="number" min="0" placeholder="0.00" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-50/50 outline-none transition-all font-semibold text-gray-900" />
                                </div>
                                <button onClick={() => setPaidAmount(totalPrice.total)} className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-medium hover:bg-green-100 transition-colors">Tam Ödeme</button>
                            </div>
                            <textarea rows={3} placeholder="Rezervasyon notları..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all resize-none text-sm" />
                        </div>
                    </div>

                    {/* Özet Kartı */}
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 sticky top-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-500" /> Fiyat Özeti
                            </h3>
                            <div className="space-y-3 mb-6">
                                {totalPrice.breakdown.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm text-gray-600">
                                        <span>{item.label}</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(item.amount, totalPrice.currency)}</span>
                                    </div>
                                ))}
                                <div className="h-px bg-gray-200 my-2" />
                                <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                                    <span>Toplam</span>
                                    <span>{formatCurrency(totalPrice.total, totalPrice.currency)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-600">Ödenecek</span>
                                    <span className="font-medium text-green-600">{formatCurrency(paidAmount, totalPrice.currency)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-500">Kalan</span>
                                    <span className="font-medium text-red-500">{formatCurrency(totalPrice.total - paidAmount, totalPrice.currency)}</span>
                                </div>
                            </div>

                            <button onClick={handleSubmit} disabled={loading} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {loading ? 'İşleniyor...' : 'Rezervasyonu Tamamla'}
                                <Check className="w-5 h-5" />
                            </button>
                            <button onClick={() => setStep(2)} className="w-full mt-3 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all">
                                Düzenle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
