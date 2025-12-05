'use client'

import { useState } from 'react'
import { Plus, Trash2, DollarSign, Home, Users } from 'lucide-react'
import { PriceGroup, deletePriceGroup } from '@/lib/actions/tour-details'
import { Tour } from '@/lib/actions/tours'
import { formatCurrency } from '@/lib/utils'
import PriceGroupForm from './PriceGroupForm'

export default function PriceGroupList({
    tour,
    tourId,
    priceGroups
}: {
    tour: Tour
    tourId: string
    priceGroups: PriceGroup[]
}) {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const isPackageTour = tour.pricing_model === 'room_based'

    const handleDelete = async (id: string) => {
        if (confirm('Bu fiyat grubunu silmek istediğinize emin misiniz?')) {
            await deletePriceGroup(id, tourId)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Fiyat Grupları</h3>
                    <p className="text-sm text-gray-500">
                        {isPackageTour
                            ? 'Oda tiplerini ve fiyatlarını yönetin.'
                            : 'Turun farklı fiyatlandırma seçeneklerini yönetin.'}
                    </p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {isPackageTour ? 'Yeni Oda Tipi Ekle' : 'Yeni Grup Ekle'}
                </button>
            </div>

            {/* Model Bilgisi */}
            <div className={`p-4 rounded-lg border ${isPackageTour ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center gap-3">
                    {isPackageTour ? (
                        <Home className="w-5 h-5 text-purple-600" />
                    ) : (
                        <Users className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                        <p className={`font-medium ${isPackageTour ? 'text-purple-900' : 'text-blue-900'}`}>
                            {isPackageTour ? 'Oda Bazlı Fiyatlandırma' : 'Kişi Başı Fiyatlandırma'}
                        </p>
                        <p className={`text-sm ${isPackageTour ? 'text-purple-700' : 'text-blue-700'}`}>
                            {isPackageTour
                                ? 'Paket turlarda oda tipine ve kişi sayısına göre fiyatlandırma yapılır.'
                                : 'Günübirlik turlarda yetişkin, çocuk ve bebek fiyatları belirlenir.'}
                        </p>
                    </div>
                </div>
            </div>

            {isFormOpen && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">
                        {isPackageTour ? 'Yeni Oda Tipi' : 'Yeni Fiyat Grubu'}
                    </h4>
                    <PriceGroupForm
                        tourId={tourId}
                        pricingModel={tour.pricing_model}
                        onClose={() => setIsFormOpen(false)}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {priceGroups.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        {isPackageTour ? (
                            <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        ) : (
                            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        )}
                        <p className="text-gray-500 font-medium">
                            {isPackageTour ? 'Henüz oda tipi eklenmemiş.' : 'Henüz fiyat grubu eklenmemiş.'}
                        </p>
                        <p className="text-sm text-gray-400">
                            {isPackageTour
                                ? 'Standart Oda, Deluxe gibi oda tipleri ekleyebilirsiniz.'
                                : 'Yeni bir fiyatlandırma oluşturmak için yukarıdaki butonu kullanın.'}
                        </p>
                    </div>
                ) : (
                    priceGroups.map((group) => (
                        <div key={group.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900">{group.name}</h4>
                                    <span className="text-xs text-gray-500 uppercase">{group.currency}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDelete(group.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Fiyat Gösterimi - Model'e göre */}
                            {isPackageTour ? (
                                // Paket Tur - Oda Bazlı
                                <div className="space-y-2">
                                    {group.price_single_pp !== undefined && group.price_single_pp !== null && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Single PP</span>
                                            <span className="font-medium text-gray-900">
                                                {formatCurrency(group.price_single_pp, group.currency)}
                                            </span>
                                        </div>
                                    )}
                                    {group.price_double_pp !== undefined && group.price_double_pp !== null && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Double PP</span>
                                            <span className="font-medium text-gray-900">
                                                {formatCurrency(group.price_double_pp, group.currency)}
                                            </span>
                                        </div>
                                    )}
                                    {group.price_triple_pp !== undefined && group.price_triple_pp !== null && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Triple PP</span>
                                            <span className="font-medium text-gray-900">
                                                {formatCurrency(group.price_triple_pp, group.currency)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-100 pt-2 mt-2">
                                        {group.price_child_1 !== undefined && group.price_child_1 !== null && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">1. Çocuk</span>
                                                <span className="font-medium text-gray-900">
                                                    {formatCurrency(group.price_child_1, group.currency)}
                                                </span>
                                            </div>
                                        )}
                                        {group.price_child_2 !== undefined && group.price_child_2 !== null && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">2. Çocuk</span>
                                                <span className="font-medium text-gray-900">
                                                    {formatCurrency(group.price_child_2, group.currency)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Günübirlik Tur - Kişi Başı
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Yetişkin</span>
                                        <span className="font-medium text-gray-900">
                                            {formatCurrency(group.price_adult || group.pricing?.adult || 0, group.currency)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Çocuk</span>
                                        <span className="font-medium text-gray-900">
                                            {formatCurrency(group.price_child || group.pricing?.child || 0, group.currency)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Bebek</span>
                                        <span className="font-medium text-gray-900">
                                            {formatCurrency(group.price_baby || group.pricing?.baby || 0, group.currency)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
