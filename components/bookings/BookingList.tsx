'use client'

import { useState } from 'react'
import { Plus, Users, Phone, ChevronDown, ChevronUp, Check, Clock, X, Home, Pencil, DollarSign, Trash2 } from 'lucide-react'
import { Booking, updateBooking, cancelBooking } from '@/lib/actions/bookings'
import { PriceGroup } from '@/lib/actions/tour-details'
import { formatCurrency } from '@/lib/utils'
import BookingForm from './BookingForm'

const statusConfig = {
    confirmed: { label: 'Onaylandı', color: 'bg-green-100 text-green-800', icon: Check },
    pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    cancelled: { label: 'İptal', color: 'bg-red-100 text-red-800', icon: X }
} as const

type PricingModel = 'per_person' | 'room_based'

interface BookingListProps {
    tourDateId: string
    bookings: Booking[]
    pricingModel: PricingModel
    priceGroups: PriceGroup[]
}

export default function BookingList({
    tourDateId,
    bookings,
    pricingModel,
    priceGroups
}: BookingListProps) {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
    const [editForm, setEditForm] = useState({
        booking_status: '' as 'confirmed' | 'pending' | 'cancelled' | '',
        amount_paid: 0,
        notes: ''
    })
    const [saving, setSaving] = useState(false)

    const isPackageTour = pricingModel === 'room_based'

    const handleEdit = (booking: Booking) => {
        setEditingBooking(booking)
        setEditForm({
            booking_status: booking.booking_status,
            amount_paid: booking.amount_paid,
            notes: booking.notes || ''
        })
        setExpandedBooking(booking.id)
    }

    const handleSaveEdit = async () => {
        if (!editingBooking) return

        setSaving(true)
        try {
            await updateBooking(editingBooking.id, {
                booking_status: editForm.booking_status as 'confirmed' | 'pending' | 'cancelled',
                amount_paid: editForm.amount_paid,
                notes: editForm.notes
            })
            setEditingBooking(null)
        } catch (error) {
            alert('Güncelleme sırasında hata oluştu')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = async (bookingId: string) => {
        if (confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?')) {
            await cancelBooking(bookingId)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Rezervasyonlar</h2>
                    <p className="text-xs text-gray-500">
                        {isPackageTour ? '📦 Paket Tur - Oda Bazlı' : '☀️ Günübirlik - Kişi Başı'}
                    </p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm ${isPackageTour ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    <Plus className="w-4 h-4" />
                    Rezervasyon Ekle
                </button>
            </div>

            {isFormOpen && (
                <div className={`mb-6 p-4 rounded-lg border ${isPackageTour ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                    <h3 className={`text-sm font-semibold mb-4 ${isPackageTour ? 'text-purple-900' : 'text-gray-900'}`}>
                        Yeni Rezervasyon
                    </h3>
                    <BookingForm
                        tourDateId={tourDateId}
                        pricingModel={pricingModel}
                        priceGroups={priceGroups}
                        onClose={() => setIsFormOpen(false)}
                    />
                </div>
            )}

            {bookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>Bu tarihe ait rezervasyon bulunmuyor.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {bookings.map((booking) => {
                        const status = statusConfig[booking.booking_status] || statusConfig.pending
                        const StatusIcon = status.icon
                        const totalPax = booking.pax.adult + booking.pax.child + booking.pax.baby
                        const isExpanded = expandedBooking === booking.id
                        const isEditing = editingBooking?.id === booking.id

                        return (
                            <div key={booking.id} className={`border rounded-lg overflow-hidden ${isEditing ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200'
                                }`}>
                                {/* Main Row */}
                                <div
                                    className={`flex items-center justify-between p-4 cursor-pointer ${isEditing ? 'bg-amber-50' : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                    onClick={() => !isEditing && setExpandedBooking(isExpanded ? null : booking.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPackageTour ? 'bg-purple-100' : 'bg-blue-100'
                                            }`}>
                                            {isPackageTour ? (
                                                <Home className={`w-5 h-5 text-purple-600`} />
                                            ) : (
                                                <Users className={`w-5 h-5 text-blue-600`} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {booking.client?.name || 'Müşteri Bilgisi Yok'}
                                            </p>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span>{totalPax} Kişi</span>
                                                {booking.client?.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {booking.client.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                {formatCurrency(booking.total_amount)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Ödenen: {formatCurrency(booking.amount_paid)}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {status.label}
                                        </span>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleEdit(booking)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Düzenle"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {booking.booking_status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleCancel(booking.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="İptal Et"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {isExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="px-4 py-3 bg-white border-t border-gray-100">
                                        {/* Edit Form */}
                                        {isEditing && (
                                            <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                                <h4 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                                    <Pencil className="w-4 h-4" />
                                                    Rezervasyonu Düzenle
                                                </h4>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs text-amber-700 mb-1">Durum</label>
                                                        <select
                                                            value={editForm.booking_status}
                                                            onChange={(e) => setEditForm({ ...editForm, booking_status: e.target.value as typeof editForm.booking_status })}
                                                            className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white"
                                                        >
                                                            <option value="pending">Beklemede</option>
                                                            <option value="confirmed">Onaylandı</option>
                                                            <option value="cancelled">İptal</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-amber-700 mb-1">Ödenen Tutar</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                value={editForm.amount_paid}
                                                                onChange={(e) => setEditForm({ ...editForm, amount_paid: parseFloat(e.target.value) || 0 })}
                                                                className="flex-1 px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditForm({ ...editForm, amount_paid: booking.total_amount })}
                                                                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                                                                title="Tam Ödeme"
                                                            >
                                                                <DollarSign className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-amber-700 mb-1">Notlar</label>
                                                        <input
                                                            type="text"
                                                            value={editForm.notes}
                                                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                                            className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2 mt-4">
                                                    <button
                                                        onClick={() => setEditingBooking(null)}
                                                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                                    >
                                                        İptal
                                                    </button>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        disabled={saving}
                                                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50"
                                                    >
                                                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Passengers */}
                                        {booking.passengers && booking.passengers.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Yolcular</p>
                                                <div className="space-y-1">
                                                    {booking.passengers.map((passenger, idx) => (
                                                        <div key={passenger.id || idx} className="flex items-center justify-between text-sm py-1">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500">
                                                                    {idx + 1}
                                                                </span>
                                                                <span className="font-medium text-gray-900">{passenger.full_name}</span>
                                                                <span className={`px-1.5 py-0.5 rounded text-xs ${passenger.passenger_type === 'adult' ? 'bg-blue-50 text-blue-700' :
                                                                    passenger.passenger_type === 'child' ? 'bg-green-50 text-green-700' :
                                                                        'bg-purple-50 text-purple-700'
                                                                    }`}>
                                                                    {passenger.passenger_type === 'adult' ? 'Yetişkin' :
                                                                        passenger.passenger_type === 'child' ? 'Çocuk' : 'Bebek'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-gray-500 text-xs">
                                                                {passenger.tc_no && <span>TC: {passenger.tc_no}</span>}
                                                                {passenger.pickup_point && <span>📍 {passenger.pickup_point}</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Booking Notes */}
                                        {booking.notes && !isEditing && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs text-gray-500">
                                                    <span className="font-medium">Not:</span> {booking.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
