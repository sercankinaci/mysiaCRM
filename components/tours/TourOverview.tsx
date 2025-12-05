'use client'

import { PriceGroup, TourDate } from '@/lib/actions/tour-details'
import { Tour } from '@/lib/actions/tours'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
    Calendar,
    Users,
    TrendingUp,
    MapPin,
    Clock,
    DollarSign,
    CheckCircle,
    AlertCircle,
    Ticket
} from 'lucide-react'

interface TourOverviewProps {
    tour: Tour
    priceGroups: PriceGroup[]
    tourDates: TourDate[]
}

export default function TourOverview({ tour, priceGroups, tourDates }: TourOverviewProps) {
    // İstatistik hesaplamaları
    const totalCapacity = tourDates.reduce((sum, date) => sum + date.capacity_total, 0)
    const availableCapacity = tourDates.reduce((sum, date) => sum + date.capacity_available, 0)
    const soldSeats = totalCapacity - availableCapacity
    const occupancyRate = totalCapacity > 0 ? Math.round((soldSeats / totalCapacity) * 100) : 0

    // Fiyat aralığı
    const allPrices = priceGroups.flatMap(pg => [pg.pricing.adult, pg.pricing.child, pg.pricing.baby].filter(p => p > 0))
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0

    // Yaklaşan turlar (bugünden sonraki)
    const today = new Date().toISOString().split('T')[0]
    const upcomingDates = tourDates
        .filter(date => date.start_date >= today && date.status !== 'cancelled')
        .slice(0, 3)

    // Sonraki tur tarihi
    const nextTourDate = upcomingDates[0]

    return (
        <div className="space-y-6">
            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Toplam Tarih */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Tur Tarihleri</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{tourDates.length}</p>
                            <p className="text-xs text-blue-500 mt-1">
                                {tourDates.filter(d => d.status === 'available').length} aktif
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Toplam Kapasite */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Toplam Kapasite</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">{totalCapacity}</p>
                            <p className="text-xs text-green-500 mt-1">
                                {availableCapacity} boş koltuk
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Doluluk Oranı */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Doluluk Oranı</p>
                            <p className="text-2xl font-bold text-purple-900 mt-1">%{occupancyRate}</p>
                            <p className="text-xs text-purple-500 mt-1">
                                {soldSeats} satılan koltuk
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Fiyat Aralığı */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Fiyat Aralığı</p>
                            <p className="text-2xl font-bold text-amber-900 mt-1">
                                {priceGroups.length > 0 ? `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}` : '-'}
                            </p>
                            <p className="text-xs text-amber-500 mt-1">
                                {priceGroups.length} fiyat grubu
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tur Bilgileri */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        Tur Bilgileri
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide">Tur Adı</label>
                                <p className="text-sm font-medium text-gray-900">{tour.title}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide">Tur Tipi</label>
                                <p className="text-sm font-medium text-gray-900">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${tour.tour_type === 'package'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {tour.tour_type === 'package' ? '📦 Paket Tur' : '☀️ Günübirlik'}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide">Kategori</label>
                                <p className="text-sm font-medium text-gray-900">
                                    {tour.category === 'abroad' ? '🌍 Yurtdışı' : '🗺️ Yurtiçi'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide">URL Slug</label>
                                <p className="text-sm font-mono text-gray-600">/{tour.slug}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide">Durum</label>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tour.status === 'active' ? 'bg-green-100 text-green-700' :
                                    tour.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {tour.status === 'active' ? <CheckCircle className="w-3.5 h-3.5" /> :
                                        tour.status === 'draft' ? <Clock className="w-3.5 h-3.5" /> :
                                            <AlertCircle className="w-3.5 h-3.5" />}
                                    {tour.status === 'active' ? 'Aktif' :
                                        tour.status === 'draft' ? 'Taslak' : 'Pasif'}
                                </span>
                            </div>
                            {tour.tour_type === 'package' && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">Süre</label>
                                    <p className="text-sm font-medium text-gray-900">
                                        {tour.duration_days} Gün / {tour.duration_nights} Gece
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide">Fiyatlandırma</label>
                                <p className="text-sm font-medium text-gray-900">
                                    {tour.pricing_model === 'room_based' ? 'Oda Bazlı' : 'Kişi Başı'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wide">Oluşturulma</label>
                                <p className="text-sm font-medium text-gray-900">{formatDate(tour.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Yaş Aralıkları */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Yaş Aralıkları</label>
                        <div className="flex gap-4 mt-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                👶 Bebek: 0-{tour.baby_age_max} yaş
                            </span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                🧒 Çocuk: {tour.child_age_min}-{tour.child_age_max} yaş
                            </span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                👤 Yetişkin: {tour.child_age_max + 1}+ yaş
                            </span>
                        </div>
                    </div>

                    {/* Açıklama */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Açıklama</label>
                        <p className="text-sm text-gray-600 mt-1">
                            {tour.description || 'Henüz açıklama eklenmemiş.'}
                        </p>
                    </div>
                </div>

                {/* Yaklaşan Turlar */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-purple-500" />
                        Yaklaşan Turlar
                    </h3>

                    {upcomingDates.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingDates.map((date, index) => (
                                <div
                                    key={date.id}
                                    className={`p-3 rounded-lg border ${index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-sm font-medium ${index === 0 ? 'text-blue-900' : 'text-gray-900'}`}>
                                                {formatDate(date.start_date)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {date.end_date !== date.start_date && `- ${formatDate(date.end_date)}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${date.capacity_available === 0 ? 'text-red-600' :
                                                date.capacity_available < 5 ? 'text-amber-600' : 'text-green-600'
                                                }`}>
                                                {date.capacity_available}/{date.capacity_total}
                                            </p>
                                            <p className="text-xs text-gray-500">koltuk</p>
                                        </div>
                                    </div>
                                    {date.price_group && (
                                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" />
                                            {date.price_group.name} - {formatCurrency(date.price_group.pricing.adult)}
                                        </p>
                                    )}
                                    {index === 0 && (
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                            Sonraki Tur
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">Yaklaşan tur tarihi yok</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Tur Tarihleri sekmesinden ekleyebilirsiniz
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Fiyat Grupları Özeti */}
            {priceGroups.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-amber-500" />
                        Fiyat Grupları Özeti
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {priceGroups.map((group) => (
                            <div
                                key={group.id}
                                className={`p-4 rounded-lg border ${group.status === 'active'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-gray-50 border-gray-200 opacity-60'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${group.status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {group.status === 'active' ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Yetişkin</span>
                                        <span className="font-medium">{formatCurrency(group.pricing.adult)} {group.currency}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Çocuk</span>
                                        <span className="font-medium">{formatCurrency(group.pricing.child)} {group.currency}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Bebek</span>
                                        <span className="font-medium">{formatCurrency(group.pricing.baby)} {group.currency}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
