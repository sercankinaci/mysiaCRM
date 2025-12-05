'use client'

import { useState } from 'react'
import { createPriceGroup } from '@/lib/actions/tour-details'

interface PriceGroupFormProps {
    tourId: string
    pricingModel: 'per_person' | 'room_based'
    onClose: () => void
}

export default function PriceGroupForm({
    tourId,
    pricingModel,
    onClose
}: PriceGroupFormProps) {
    const [loading, setLoading] = useState(false)
    const isRoomBased = pricingModel === 'room_based'

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            await createPriceGroup(tourId, formData, pricingModel)
            onClose()
        } catch (error) {
            alert('Fiyat grubu oluşturulurken bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isRoomBased ? 'Oda Tipi Adı' : 'Grup Adı'}
                    </label>
                    <input
                        type="text"
                        name="name"
                        required
                        placeholder={isRoomBased ? 'Örn: Standart Oda' : 'Örn: 2024 Yaz Sezonu'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                    <select
                        name="currency"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                        <option value="TRY">Türk Lirası (₺)</option>
                        <option value="USD">Amerikan Doları ($)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">Sterlin (£)</option>
                    </select>
                </div>
            </div>

            {isRoomBased ? (
                // PAKET TUR - Oda Bazlı Fiyatlandırma
                <>
                    {/* Oda Bilgileri */}
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-purple-900 mb-3">Oda Kapasitesi</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-purple-700 mb-1">Max Kişi</label>
                                <input
                                    type="number"
                                    name="max_pax"
                                    min="1"
                                    max="6"
                                    defaultValue="4"
                                    className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Kişi Başı Fiyatlar (PP) */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900 mb-3">Kişi Başı Fiyatlar (PP)</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Single PP</label>
                                <input
                                    type="number"
                                    name="price_single_pp"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                                <p className="text-xs text-gray-400 mt-1">Tek kişi odada</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Double PP</label>
                                <input
                                    type="number"
                                    name="price_double_pp"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                                <p className="text-xs text-gray-400 mt-1">2 kişi odada</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Triple PP</label>
                                <input
                                    type="number"
                                    name="price_triple_pp"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                                <p className="text-xs text-gray-400 mt-1">3 kişi odada</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Quad PP</label>
                                <input
                                    type="number"
                                    name="price_quad_pp"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                                <p className="text-xs text-gray-400 mt-1">4 kişi odada</p>
                            </div>
                        </div>
                    </div>

                    {/* Çocuk ve Bebek Fiyatları */}
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-sm font-medium text-amber-900 mb-3">Çocuk & Bebek Fiyatları</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs text-amber-700 mb-1">1. Çocuk</label>
                                <input
                                    type="number"
                                    name="price_child_1"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-amber-700 mb-1">2. Çocuk</label>
                                <input
                                    type="number"
                                    name="price_child_2"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-amber-700 mb-1">1. Bebek</label>
                                <input
                                    type="number"
                                    name="price_baby_1"
                                    min="0"
                                    step="0.01"
                                    defaultValue="0"
                                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-amber-700 mb-1">2. Bebek</label>
                                <input
                                    type="number"
                                    name="price_baby_2"
                                    min="0"
                                    step="0.01"
                                    defaultValue="0"
                                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                            * Sıfır veya boş bırakılan fiyatlar "ücretsiz" olarak değerlendirilir.
                        </p>
                    </div>
                </>
            ) : (
                // GÜNÜBİRLİK TUR - Kişi Başı Fiyatlandırma
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Yetişkin Fiyatı</label>
                        <input
                            type="number"
                            name="price_adult"
                            required
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Çocuk Fiyatı</label>
                        <input
                            type="number"
                            name="price_child"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bebek Fiyatı</label>
                        <input
                            type="number"
                            name="price_baby"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>
        </form>
    )
}
