'use client'

import { useState, useMemo } from 'react'
import { Calendar, CalendarRange, Plus, X, Check, Trash2 } from 'lucide-react'
import { createTourDate, createBulkTourDates, PriceGroup } from '@/lib/actions/tour-details'

type SelectionMode = 'single' | 'range'

const DAYS_OF_WEEK = [
    { id: 0, label: 'Pazar', short: 'Pz' },
    { id: 1, label: 'Pazartesi', short: 'Pt' },
    { id: 2, label: 'Salı', short: 'Sa' },
    { id: 3, label: 'Çarşamba', short: 'Ça' },
    { id: 4, label: 'Perşembe', short: 'Pe' },
    { id: 5, label: 'Cuma', short: 'Cu' },
    { id: 6, label: 'Cumartesi', short: 'Ct' },
]

export default function TourDateForm({
    tourId,
    priceGroups,
    onClose
}: {
    tourId: string
    priceGroups: PriceGroup[]
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<SelectionMode>('single')

    // Ortak ayarlar
    const [priceGroupId, setPriceGroupId] = useState(priceGroups[0]?.id || '')
    const [capacity, setCapacity] = useState(45)

    // Tek tarih seçimi
    const [selectedDates, setSelectedDates] = useState<string[]>([])
    const [calendarInput, setCalendarInput] = useState('')

    // Tarih aralığı
    const [rangeStart, setRangeStart] = useState('')
    const [rangeEnd, setRangeEnd] = useState('')
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]) // Tüm günler

    // Tarih aralığından seçili günlere göre tarihleri hesapla
    const generatedDates = useMemo(() => {
        if (!rangeStart || !rangeEnd || selectedDays.length === 0) return []

        const start = new Date(rangeStart)
        const end = new Date(rangeEnd)
        const dates: string[] = []

        if (start > end) return []

        const current = new Date(start)
        while (current <= end) {
            if (selectedDays.includes(current.getDay())) {
                dates.push(current.toISOString().split('T')[0])
            }
            current.setDate(current.getDate() + 1)
        }

        return dates
    }, [rangeStart, rangeEnd, selectedDays])

    // Tek tarih ekle
    const addDate = () => {
        if (calendarInput && !selectedDates.includes(calendarInput)) {
            setSelectedDates([...selectedDates, calendarInput].sort())
            setCalendarInput('')
        }
    }

    // Tarih sil
    const removeDate = (date: string) => {
        setSelectedDates(selectedDates.filter(d => d !== date))
    }

    // Gün seçimi toggle
    const toggleDay = (dayId: number) => {
        if (selectedDays.includes(dayId)) {
            setSelectedDays(selectedDays.filter(d => d !== dayId))
        } else {
            setSelectedDays([...selectedDays, dayId])
        }
    }

    // Tüm günleri seç/kaldır
    const toggleAllDays = () => {
        if (selectedDays.length === 7) {
            setSelectedDays([])
        } else {
            setSelectedDays([0, 1, 2, 3, 4, 5, 6])
        }
    }

    // Hafta sonu seç
    const selectWeekends = () => {
        setSelectedDays([0, 6]) // Pazar ve Cumartesi
    }

    // Hafta içi seç
    const selectWeekdays = () => {
        setSelectedDays([1, 2, 3, 4, 5]) // Pazartesi - Cuma
    }

    // Form gönder
    async function handleSubmit() {
        if (!priceGroupId) {
            alert('Lütfen fiyat grubu seçin')
            return
        }

        const datesToCreate = mode === 'single' ? selectedDates : generatedDates

        if (datesToCreate.length === 0) {
            alert('Lütfen en az bir tarih seçin')
            return
        }

        setLoading(true)
        try {
            if (datesToCreate.length === 1) {
                await createTourDate(tourId, {
                    price_group_id: priceGroupId,
                    start_date: datesToCreate[0],
                    capacity
                })
            } else {
                await createBulkTourDates(tourId, {
                    price_group_id: priceGroupId,
                    dates: datesToCreate,
                    capacity
                })
            }
            onClose()
        } catch (error) {
            alert('Tarihler oluşturulurken hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    // Tarihi formatla
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('tr-TR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        })
    }

    const datesToShow = mode === 'single' ? selectedDates : generatedDates

    return (
        <div className="space-y-6">
            {/* Fiyat Grubu ve Kapasite */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat Grubu</label>
                    <select
                        value={priceGroupId}
                        onChange={(e) => setPriceGroupId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                        <option value="">Seçin...</option>
                        {priceGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.name} ({group.currency})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kapasite</label>
                    <input
                        type="number"
                        min="1"
                        value={capacity}
                        onChange={(e) => setCapacity(parseInt(e.target.value) || 45)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Mod Seçimi */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Seçim Aracı</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setMode('single')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${mode === 'single'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Calendar className="w-5 h-5" />
                        Tek Tarih Seçimi
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('range')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${mode === 'range'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <CalendarRange className="w-5 h-5" />
                        Tarih Aralığı
                    </button>
                </div>
            </div>

            {/* Tek Tarih Seçimi */}
            {mode === 'single' && (
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih Seçin</label>
                        <p className="text-xs text-gray-500 mb-2">
                            İstediğiniz tarihleri tek tek seçebilirsiniz. Birden fazla tarih seçmek için tarihlere tek tek tıklayın.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={calendarInput}
                                onChange={(e) => setCalendarInput(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            <button
                                type="button"
                                onClick={addDate}
                                disabled={!calendarInput}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tarih Aralığı */}
            {mode === 'range' && (
                <div className="space-y-4">
                    {/* Tarih Aralığı Seçimi */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
                            <input
                                type="date"
                                value={rangeStart}
                                onChange={(e) => setRangeStart(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
                            <input
                                type="date"
                                value={rangeEnd}
                                onChange={(e) => setRangeEnd(e.target.value)}
                                min={rangeStart}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Gün Filtresi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hangi Günler?</label>
                        <div className="flex gap-2 mb-2">
                            <button
                                type="button"
                                onClick={toggleAllDays}
                                className={`px-3 py-1.5 text-xs rounded-full ${selectedDays.length === 7
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Tümü
                            </button>
                            <button
                                type="button"
                                onClick={selectWeekends}
                                className={`px-3 py-1.5 text-xs rounded-full ${selectedDays.length === 2 && selectedDays.includes(0) && selectedDays.includes(6)
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Hafta Sonu
                            </button>
                            <button
                                type="button"
                                onClick={selectWeekdays}
                                className={`px-3 py-1.5 text-xs rounded-full ${selectedDays.length === 5 && !selectedDays.includes(0) && !selectedDays.includes(6)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Hafta İçi
                            </button>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {DAYS_OF_WEEK.map((day) => (
                                <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => toggleDay(day.id)}
                                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${selectedDays.includes(day.id)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {day.short}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Seçili Tarihler */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seçili Tarihler {datesToShow.length > 0 && `(${datesToShow.length} tarih)`}
                </label>
                <div className="min-h-[100px] max-h-[200px] overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {datesToShow.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Henüz tarih seçilmedi. Lütfen en az bir tarih ekleyin.</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {datesToShow.map((date) => (
                                <div
                                    key={date}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm"
                                >
                                    <Check className="w-3 h-3 text-green-500" />
                                    <span>{formatDate(date)}</span>
                                    {mode === 'single' && (
                                        <button
                                            type="button"
                                            onClick={() => removeDate(date)}
                                            className="ml-1 text-gray-400 hover:text-red-500"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Butonlar */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                    {datesToShow.length > 0 && `${datesToShow.length} tarih eklenecek`}
                </p>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        İptal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || datesToShow.length === 0 || !priceGroupId}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>Kaydediliyor...</>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                {datesToShow.length > 1 ? `${datesToShow.length} Tarih Ekle` : 'Tarih Ekle'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
