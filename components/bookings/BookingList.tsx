'use client'

import { useState } from 'react'
import { Plus, Users, Phone, ChevronDown, ChevronUp, Check, Clock, X, Home } from 'lucide-react'
import { Booking } from '@/lib/actions/bookings'
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

    const isPackageTour = pricingModel === 'room_based'

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

                        return (
                            <div key={booking.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Main Row */}
                                <div
                                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
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
                                        {isExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Passengers */}
                                {isExpanded && booking.passengers && booking.passengers.length > 0 && (
                                    <div className="px-4 py-3 bg-white border-t border-gray-100">
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
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
