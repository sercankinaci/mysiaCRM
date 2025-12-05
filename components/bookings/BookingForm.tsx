'use client'

import { useState } from 'react'
import { Plus, Trash2, User, Users } from 'lucide-react'
import { createBookingWithPassengers, Passenger } from '@/lib/actions/bookings'
import { formatCurrency } from '@/lib/utils'

type PassengerInput = Passenger & { tempId: string }

export default function BookingForm({
    tourDateId,
    priceInfo,
    onClose
}: {
    tourDateId: string
    priceInfo: {
        adult: number
        child: number
        baby: number
        currency: string
    }
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [isNewClient, setIsNewClient] = useState(true)
    const [clientId, setClientId] = useState('')
    const [newClient, setNewClient] = useState({ full_name: '', phone: '', email: '' })
    const [passengers, setPassengers] = useState<PassengerInput[]>([
        { tempId: '1', full_name: '', tc_no: '', passenger_type: 'adult', pickup_point: '' }
    ])
    const [paidAmount, setPaidAmount] = useState(0)
    const [notes, setNotes] = useState('')

    // Calculate total
    const paxCounts = {
        adult: passengers.filter(p => p.passenger_type === 'adult').length,
        child: passengers.filter(p => p.passenger_type === 'child').length,
        baby: passengers.filter(p => p.passenger_type === 'baby').length
    }
    const totalAmount =
        (paxCounts.adult * priceInfo.adult) +
        (paxCounts.child * priceInfo.child) +
        (paxCounts.baby * priceInfo.baby)

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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // Validation
        if (isNewClient && !newClient.full_name.trim()) {
            alert('Müşteri adı gerekli')
            return
        }
        if (!isNewClient && !clientId.trim()) {
            alert('Müşteri ID gerekli')
            return
        }
        if (passengers.some(p => !p.full_name.trim())) {
            alert('Tüm yolcuların ad soyad bilgisi gerekli')
            return
        }

        setLoading(true)
        try {
            await createBookingWithPassengers({
                tour_date_id: tourDateId,
                client_id: isNewClient ? undefined : clientId,
                new_client: isNewClient ? newClient : undefined,
                passengers: passengers.map(({ tempId, ...p }) => p),
                pricing: {
                    adult_price: priceInfo.adult,
                    child_price: priceInfo.child,
                    baby_price: priceInfo.baby,
                    currency: priceInfo.currency
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
            {/* Customer Section */}
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

            {/* Passengers Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Yolcular ({passengers.length} kişi)
                    </h4>
                    <button
                        type="button"
                        onClick={addPassenger}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
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
                                    <button
                                        type="button"
                                        onClick={() => removePassenger(passenger.tempId)}
                                        className="text-gray-400 hover:text-red-600"
                                    >
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

            {/* Summary & Payment */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">Toplam Tutar</p>
                    <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalAmount, priceInfo.currency)}</p>
                    <p className="text-xs text-blue-600 mt-1">
                        {paxCounts.adult} Yetişkin, {paxCounts.child} Çocuk, {paxCounts.baby} Bebek
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
                    <button
                        type="button"
                        onClick={() => setPaidAmount(totalAmount)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                        Tam Ödeme
                    </button>
                </div>
            </div>

            {/* Notes */}
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

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    disabled={loading || passengers.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Kaydediliyor...' : 'Rezervasyon Oluştur'}
                </button>
            </div>
        </form>
    )
}
