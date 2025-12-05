'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Calendar, Users, Map, Globe, Sun, Package } from 'lucide-react'
import { createTour } from '@/lib/actions/tours'

type TourType = 'daily' | 'package' | ''
type Category = 'domestic' | 'abroad'

export default function NewTourPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tourType, setTourType] = useState<TourType>('')
    const [category, setCategory] = useState<Category>('domestic')

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const result = await createTour(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
        // Başarılı olursa action içinde redirect yapılacak
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/tours"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Yeni Tur Ekle</h1>
                    <p className="text-gray-500">Turun temel bilgilerini girin</p>
                </div>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Tur Tipi Seçimi */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-500" />
                        Tur Tipi
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Günübirlik */}
                        <label
                            className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${tourType === 'daily'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <input
                                type="radio"
                                name="tour_type"
                                value="daily"
                                checked={tourType === 'daily'}
                                onChange={(e) => setTourType(e.target.value as TourType)}
                                className="sr-only"
                            />
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tourType === 'daily' ? 'bg-blue-500' : 'bg-gray-100'
                                    }`}>
                                    <Sun className={`w-5 h-5 ${tourType === 'daily' ? 'text-white' : 'text-gray-500'}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Günübirlik Tur</p>
                                    <p className="text-xs text-gray-500">Tek günlük, konaklama yok</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">
                                Kişi başı fiyatlandırma (Yetişkin / Çocuk / Bebek)
                            </p>
                            {tourType === 'daily' && (
                                <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </label>

                        {/* Paket Tur */}
                        <label
                            className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${tourType === 'package'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <input
                                type="radio"
                                name="tour_type"
                                value="package"
                                checked={tourType === 'package'}
                                onChange={(e) => setTourType(e.target.value as TourType)}
                                className="sr-only"
                            />
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tourType === 'package' ? 'bg-purple-500' : 'bg-gray-100'
                                    }`}>
                                    <Calendar className={`w-5 h-5 ${tourType === 'package' ? 'text-white' : 'text-gray-500'}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Paket Tur</p>
                                    <p className="text-xs text-gray-500">Çok günlük, konaklama dahil</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">
                                Oda bazlı fiyatlandırma (Single / Double / Triple PP)
                            </p>
                            {tourType === 'package' && (
                                <div className="absolute top-3 right-3 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Hidden input for pricing_model */}
                    <input
                        type="hidden"
                        name="pricing_model"
                        value={tourType === 'package' ? 'room_based' : 'per_person'}
                    />
                </div>

                {/* Kategori Seçimi */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-green-500" />
                        Kategori
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <label
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${category === 'domestic'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <input
                                type="radio"
                                name="category"
                                value="domestic"
                                checked={category === 'domestic'}
                                onChange={(e) => setCategory(e.target.value as Category)}
                                className="sr-only"
                            />
                            <Map className={`w-5 h-5 ${category === 'domestic' ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={`font-medium ${category === 'domestic' ? 'text-green-900' : 'text-gray-700'}`}>
                                Yurtiçi
                            </span>
                        </label>

                        <label
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${category === 'abroad'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <input
                                type="radio"
                                name="category"
                                value="abroad"
                                checked={category === 'abroad'}
                                onChange={(e) => setCategory(e.target.value as Category)}
                                className="sr-only"
                            />
                            <Globe className={`w-5 h-5 ${category === 'abroad' ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={`font-medium ${category === 'abroad' ? 'text-green-900' : 'text-gray-700'}`}>
                                Yurtdışı
                            </span>
                        </label>
                    </div>
                </div>

                {/* Tur Bilgileri */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Map className="w-5 h-5 text-amber-500" />
                        Tur Bilgileri
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                Tur Adı *
                            </label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                placeholder="Örn: Kapadokya Balon Turu"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Açıklama
                            </label>
                            <textarea
                                name="description"
                                id="description"
                                rows={3}
                                placeholder="Tur hakkında kısa açıklama..."
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Paket Tur için Süre */}
                        {tourType === 'package' && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <div>
                                    <label htmlFor="duration_days" className="block text-sm font-medium text-purple-900 mb-1">
                                        Süre (Gün)
                                    </label>
                                    <input
                                        type="number"
                                        name="duration_days"
                                        id="duration_days"
                                        min="1"
                                        defaultValue="3"
                                        className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="duration_nights" className="block text-sm font-medium text-purple-900 mb-1">
                                        Süre (Gece)
                                    </label>
                                    <input
                                        type="number"
                                        name="duration_nights"
                                        id="duration_nights"
                                        min="0"
                                        defaultValue="2"
                                        className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Yaş Aralıkları */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Yaş Aralıkları
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Çocuk Min</label>
                                    <input
                                        type="number"
                                        name="child_age_min"
                                        min="0"
                                        max="17"
                                        defaultValue="3"
                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Çocuk Max</label>
                                    <input
                                        type="number"
                                        name="child_age_max"
                                        min="0"
                                        max="17"
                                        defaultValue="11"
                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Bebek Max</label>
                                    <input
                                        type="number"
                                        name="baby_age_max"
                                        min="0"
                                        max="5"
                                        defaultValue="2"
                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Bebek: 0-2 yaş, Çocuk: 3-11 yaş varsayılan değerlerdir.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-between items-center bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <p className="text-sm text-gray-500">
                        {tourType ? (
                            <span>
                                Tur oluşturulduktan sonra <strong>fiyat grupları</strong> ve <strong>tarihler</strong> ekleyebileceksiniz.
                            </span>
                        ) : (
                            <span className="text-amber-600">Lütfen bir tur tipi seçin.</span>
                        )}
                    </p>
                    <button
                        type="submit"
                        disabled={loading || !tourType}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Tur Oluştur
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
