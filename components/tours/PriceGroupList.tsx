'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, DollarSign } from 'lucide-react'
import { PriceGroup, deletePriceGroup } from '@/lib/actions/tour-details'
import { formatCurrency } from '@/lib/utils'
import PriceGroupForm from './PriceGroupForm'

export default function PriceGroupList({
    tourId,
    priceGroups
}: {
    tourId: string
    priceGroups: PriceGroup[]
}) {
    const [isFormOpen, setIsFormOpen] = useState(false)

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
                    <p className="text-sm text-gray-500">Turun farklı fiyatlandırma seçeneklerini yönetin.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Grup Ekle
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Yeni Fiyat Grubu</h4>
                    <PriceGroupForm tourId={tourId} onClose={() => setIsFormOpen(false)} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {priceGroups.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Henüz fiyat grubu eklenmemiş.</p>
                        <p className="text-sm text-gray-400">Yeni bir fiyatlandırma oluşturmak için yukarıdaki butonu kullanın.</p>
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

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Yetişkin</span>
                                    <span className="font-medium text-gray-900">
                                        {formatCurrency(group.pricing.adult, group.currency)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Çocuk</span>
                                    <span className="font-medium text-gray-900">
                                        {formatCurrency(group.pricing.child, group.currency)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Bebek</span>
                                    <span className="font-medium text-gray-900">
                                        {formatCurrency(group.pricing.baby, group.currency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
