'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Calendar, Users, ExternalLink } from 'lucide-react'
import { TourDate, PriceGroup, deleteTourDate } from '@/lib/actions/tour-details'
import { formatDate } from '@/lib/utils'
import TourDateForm from './TourDateForm'

export default function TourDateList({
    tourId,
    tourDates,
    priceGroups
}: {
    tourId: string
    tourDates: TourDate[]
    priceGroups: PriceGroup[]
}) {
    const [isFormOpen, setIsFormOpen] = useState(false)

    const handleDelete = async (id: string) => {
        if (confirm('Bu tur tarihini silmek istediğinize emin misiniz?')) {
            await deleteTourDate(id, tourId)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Tur Tarihleri</h3>
                    <p className="text-sm text-gray-500">Turun gerçekleşeceği tarihleri ve kontenjanları yönetin.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    disabled={priceGroups.length === 0}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Tarih Ekle
                </button>
            </div>

            {priceGroups.length === 0 && (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm">
                    Tarih ekleyebilmek için önce en az bir <strong>Fiyat Grubu</strong> oluşturmalısınız.
                </div>
            )}

            {isFormOpen && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Yeni Tur Tarihi</h4>
                    <TourDateForm
                        tourId={tourId}
                        priceGroups={priceGroups}
                        onClose={() => setIsFormOpen(false)}
                    />
                </div>
            )}

            <div className="overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-gray-700">Başlangıç - Bitiş</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Fiyat Grubu</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Kapasite</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Durum</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tourDates.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p>Henüz tarih eklenmemiş.</p>
                                </td>
                            </tr>
                        ) : (
                            tourDates.map((date) => (
                                <tr key={date.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/dashboard/tours/${tourId}/dates/${date.id}`}
                                            className="text-gray-900 font-medium hover:text-blue-600"
                                        >
                                            {formatDate(date.start_date)} - {formatDate(date.end_date)}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {date.price_group?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <span>{date.capacity_available} / {date.capacity_total}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${date.status === 'available' ? 'bg-green-100 text-green-800' :
                                                date.status === 'soldout' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {date.status === 'available' ? 'Müsait' :
                                                date.status === 'soldout' ? 'Doldu' : date.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/dashboard/tours/${tourId}/dates/${date.id}`}
                                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Detayları Gör"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(date.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
