'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Map } from 'lucide-react'
import { createTour } from '@/lib/actions/tours'

export default function NewTourPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const result = await createTour(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else {
            // Başarılı olursa action içinde redirect yapılacak
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
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
            <form action={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Tur Adı
                        </label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            required
                            placeholder="Örn: Büyük Balkan Turu"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="tour_type" className="block text-sm font-medium text-gray-700 mb-1">
                            Tur Tipi
                        </label>
                        <div className="relative">
                            <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                name="tour_type"
                                id="tour_type"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                            >
                                <option value="">Seçiniz...</option>
                                <option value="daily">Günübirlik Tur</option>
                                <option value="cultural">Kültür Turu (Konaklamalı)</option>
                                <option value="ship">Gemi Turu</option>
                                <option value="abroad">Yurt Dışı Turu</option>
                                <option value="visa">Vizeli Tur</option>
                            </select>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Tur tipine göre fiyatlandırma ve tarih seçenekleri belirlenecektir.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Devam Et
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
