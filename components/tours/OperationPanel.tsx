'use client'

import { useState } from 'react'
import { Truck, User, MapPin, Save } from 'lucide-react'
import { TourOperation, upsertOperation } from '@/lib/actions/operations'

export default function OperationPanel({
    tourDateId,
    operation
}: {
    tourDateId: string
    operation: TourOperation | null
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            await upsertOperation(tourDateId, formData)
            setIsEditing(false)
        } catch (error) {
            alert('Operasyon kaydedilirken hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-gray-500" />
                    Operasyon
                </h2>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Düzenle
                    </button>
                )}
            </div>

            {isEditing ? (
                <form action={handleSubmit} className="space-y-4">
                    {/* Vehicle */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Araç Bilgisi</label>
                        <div className="grid grid-cols-3 gap-2">
                            <input
                                type="text"
                                name="vehicle_plate"
                                placeholder="Plaka"
                                defaultValue={operation?.vehicle_info?.plate || ''}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <input
                                type="text"
                                name="vehicle_type"
                                placeholder="Araç Tipi"
                                defaultValue={operation?.vehicle_info?.type || ''}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <input
                                type="number"
                                name="vehicle_capacity"
                                placeholder="Kapasite"
                                defaultValue={operation?.vehicle_info?.capacity || ''}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    {/* Guide */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Rehber</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                name="guide_name"
                                placeholder="Ad Soyad"
                                defaultValue={operation?.guide_info?.name || ''}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <input
                                type="tel"
                                name="guide_phone"
                                placeholder="Telefon"
                                defaultValue={operation?.guide_info?.phone || ''}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    {/* Driver */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Şoför</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                name="driver_name"
                                placeholder="Ad Soyad"
                                defaultValue={operation?.driver_info?.name || ''}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <input
                                type="tel"
                                name="driver_phone"
                                placeholder="Telefon"
                                defaultValue={operation?.driver_info?.phone || ''}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Notlar</label>
                        <textarea
                            name="notes"
                            rows={2}
                            defaultValue={operation?.notes || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                        >
                            İptal
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    {operation ? (
                        <>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Truck className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {operation.vehicle_info?.plate || 'Araç atanmadı'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {operation.vehicle_info?.type} - {operation.vehicle_info?.capacity} kişilik
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <User className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        Rehber: {operation.guide_info?.name || 'Atanmadı'}
                                    </p>
                                    <p className="text-xs text-gray-500">{operation.guide_info?.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <User className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        Şoför: {operation.driver_info?.name || 'Atanmadı'}
                                    </p>
                                    <p className="text-xs text-gray-500">{operation.driver_info?.phone}</p>
                                </div>
                            </div>

                            {operation.notes && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                                    {operation.notes}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-6 text-gray-500">
                            <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm">Henüz operasyon bilgisi girilmemiş.</p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                                Bilgi Ekle
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
