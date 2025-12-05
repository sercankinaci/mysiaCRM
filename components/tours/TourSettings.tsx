'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tour, updateTourStatus, deleteTour } from '@/lib/actions/tours'
import {
    Settings,
    CheckCircle,
    Clock,
    XCircle,
    Trash2,
    AlertTriangle,
    Loader2
} from 'lucide-react'

interface TourSettingsProps {
    tour: Tour
}

export default function TourSettings({ tour }: TourSettingsProps) {
    const router = useRouter()
    const [status, setStatus] = useState(tour.status)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const statusOptions = [
        {
            value: 'draft',
            label: 'Taslak',
            description: 'Tur henüz yayınlanmadı, sadece yöneticiler görebilir',
            icon: Clock,
            color: 'gray'
        },
        {
            value: 'active',
            label: 'Aktif',
            description: 'Tur yayında ve rezervasyona açık',
            icon: CheckCircle,
            color: 'green'
        },
        {
            value: 'passive',
            label: 'Pasif',
            description: 'Tur geçici olarak kapatıldı',
            icon: XCircle,
            color: 'red'
        },
    ]

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(true)
        setMessage(null)

        try {
            const result = await updateTourStatus(tour.id, newStatus)

            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setStatus(newStatus as typeof status)
                setMessage({ type: 'success', text: 'Tur durumu güncellendi!' })
                router.refresh()
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Bir hata oluştu.' })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)

        try {
            const result = await deleteTour(tour.id)

            if (result.error) {
                setMessage({ type: 'error', text: result.error })
                setShowDeleteConfirm(false)
            } else {
                router.push('/dashboard/tours')
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Tur silinemedi.' })
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Mesaj */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Durum Ayarları */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-500" />
                    Tur Durumu
                </h3>

                <p className="text-sm text-gray-500 mb-4">
                    Turun durumunu değiştirerek yayın kontrolü yapabilirsiniz.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statusOptions.map((option) => {
                        const Icon = option.icon
                        const isSelected = status === option.value

                        return (
                            <button
                                key={option.value}
                                onClick={() => handleStatusChange(option.value)}
                                disabled={isUpdating || isSelected}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                        ? option.color === 'green'
                                            ? 'border-green-500 bg-green-50'
                                            : option.color === 'red'
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-500 bg-gray-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${option.color === 'green'
                                            ? 'bg-green-100'
                                            : option.color === 'red'
                                                ? 'bg-red-100'
                                                : 'bg-gray-100'
                                        }`}>
                                        {isUpdating && status !== option.value ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                        ) : (
                                            <Icon className={`w-5 h-5 ${option.color === 'green'
                                                    ? 'text-green-600'
                                                    : option.color === 'red'
                                                        ? 'text-red-600'
                                                        : 'text-gray-600'
                                                }`} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{option.label}</p>
                                        {isSelected && (
                                            <span className="text-xs text-blue-600 font-medium">Mevcut</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">{option.description}</p>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tehlikeli Bölge */}
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Tehlikeli Bölge
                </h3>

                <p className="text-sm text-red-700 mb-4">
                    Bu işlemler geri alınamaz. Dikkatli olun.
                </p>

                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Turu Sil
                    </button>
                ) : (
                    <div className="bg-white rounded-lg border border-red-300 p-4">
                        <p className="text-sm text-red-800 font-medium mb-3">
                            "{tour.title}" turunu silmek istediğinize emin misiniz?
                        </p>
                        <p className="text-xs text-red-600 mb-4">
                            Bu işlem tüm fiyat gruplarını, tur tarihlerini ve ilişkili verileri silecektir.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Evet, Sil
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
