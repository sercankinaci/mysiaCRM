'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Calendar as CalendarIcon, ArrowRight, Loader2, Search, MapPin, ChevronLeft, ChevronRight, User, Hash } from 'lucide-react'
import Modal from '@/components/ui/modal'
import { getActiveToursForQuickBooking, getAvailableDatesForQuickBooking, getQuickBookingDetails } from '@/lib/actions/quick-booking'
import { formatDate } from '@/lib/utils'
import BookingForm from './BookingForm'
import { PriceGroup, TourDate } from '@/lib/actions/tour-details'
import { Tour } from '@/lib/actions/tours'
import { useDebounce } from 'use-debounce'

type Step = 'tour_selection' | 'date_selection' | 'booking_form'

// --- Custom Components ---

// 1. Arama Yapılabilir Tur Listesi
function TourSearch({ onSelect }: { onSelect: (tour: any) => void }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch] = useDebounce(searchTerm, 300)
    const [tours, setTours] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadTours()
    }, [])

    async function loadTours() {
        try {
            const data = await getActiveToursForQuickBooking()
            setTours(data)
        } catch (error) {
            console.error('Turlar yüklenemedi', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredTours = useMemo(() => {
        if (!debouncedSearch) return tours
        const lowerSearch = debouncedSearch.toLowerCase()
        return tours.filter(t =>
            t.title.toLowerCase().includes(lowerSearch) ||
            t.slug.includes(lowerSearch)
        )
    }, [debouncedSearch, tours])

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nereye gitmek istersiniz?</label>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Tur, şehir veya bölge arayın..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 text-lg border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : filteredTours.length > 0 ? (
                    filteredTours.map((tour) => (
                        <button
                            key={tour.id}
                            onClick={() => onSelect(tour)}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all group text-left"
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tour.tour_type === 'package' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 group-hover:text-blue-700">{tour.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                                        {tour.tour_type === 'package' ? 'Paket Tur' : 'Günübirlik'}
                                    </span>
                                    {tour.pricing_model === 'room_based' && (
                                        <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">
                                            Oda Bazlı
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ArrowRight className="ml-auto w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </button>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        Tur bulunamadı
                    </div>
                )}
            </div>
        </div>
    )
}

// 2. Özel Takvim Bileşeni
function TourCalendar({ availableDates, onDateSelect, loading }: { availableDates: any[], onDateSelect: (date: any) => void, loading: boolean }) {
    const today = new Date()
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

    // Tarihlerin listesi
    const datesMap = useMemo(() => {
        const map = new Map()
        availableDates.forEach(d => {
            map.set(d.start_date, d)
        })
        return map
    }, [availableDates])

    // Ayın günlerini oluştur
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() // 0 = Pazar

    // Pazartesi ile başlaması için shift et (0 = Pazar -> 6, 1 = Pazartesi -> 0)
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

    const days = []
    // Boşluklar
    for (let i = 0; i < startDay; i++) {
        days.push(null)
    }
    // Günler
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
    }

    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
                <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 hover:shadow-sm transition-all text-gray-600">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold text-gray-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 hover:shadow-sm transition-all text-gray-600">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-2">
                        {days.map((date, idx) => {
                            if (!date) return <div key={`empty-${idx}`} />

                            const dateStr = date.toISOString().split('T')[0]
                            const tourDate = datesMap.get(dateStr)
                            const isAvailable = !!tourDate
                            const isPast = date < new Date(today.setHours(0, 0, 0, 0))

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => isAvailable && onDateSelect(tourDate)}
                                    disabled={!isAvailable}
                                    className={`
                                        relative h-14 rounded-lg flex flex-col items-center justify-center border transition-all
                                        ${isAvailable
                                            ? 'bg-white border-blue-200 hover:border-blue-500 hover:shadow-md cursor-pointer group'
                                            : 'bg-gray-50 border-transparent text-gray-300 cursor-default'
                                        }
                                        ${isPast && 'opacity-50'}
                                    `}
                                >
                                    <span className={`text-sm font-medium ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {date.getDate()}
                                    </span>

                                    {isAvailable && (
                                        <>
                                            <div className="mt-1 flex gap-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${tourDate.capacity_available > 5 ? 'bg-green-500' : 'bg-amber-500'}`} />
                                            </div>
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                {tourDate.capacity_available} Boş Yer
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                                            </div>
                                        </>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}
                {/* Legend */}
                {!loading && (
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Müsait
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            Son Yerler
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                            Dolu / Tur Yok
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


export default function QuickBookingDialog() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<Step>('tour_selection')
    const [loading, setLoading] = useState(false)

    // Selection states
    const [selectedTour, setSelectedTour] = useState<any>(null)
    const [selectedDate, setSelectedDate] = useState<any>(null)
    const [availableDates, setAvailableDates] = useState<any[]>([])

    // Booking Form Props
    const [bookingDetails, setBookingDetails] = useState<{
        tour: Tour
        tourDate: TourDate
        priceGroups: PriceGroup[]
    } | null>(null)

    // Reset when closed
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep('tour_selection')
                setSelectedTour(null)
                setSelectedDate(null)
                setBookingDetails(null)
            }, 300)
        }
    }, [open])

    async function handleTourSelect(tour: any) {
        setSelectedTour(tour)
        setStep('date_selection')
        // Tarihleri yükle
        setLoading(true)
        try {
            const dates = await getAvailableDatesForQuickBooking(tour.id)
            setAvailableDates(dates)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDateSelect(date: any) {
        setSelectedDate(date)
        setLoading(true)
        try {
            const details = await getQuickBookingDetails(selectedTour.id, date.id)
            if (details) {
                // @ts-ignore
                setBookingDetails(details)
                setStep('booking_form')
            }
        } catch (error) {
            console.error('Detaylar yüklenemedi', error)
        } finally {
            setLoading(false)
        }
    }

    function handleSuccess() {
        setOpen(false)
    }

    function handleBack() {
        if (step === 'booking_form') setStep('date_selection')
        if (step === 'date_selection') setStep('tour_selection')
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
            >
                <Plus className="w-4 h-4" />
                Hızlı Rezervasyon
            </button>

            <Modal
                isOpen={open}
                onClose={() => setOpen(false)}
                title={
                    step === 'tour_selection' ? 'Hızlı Rezervasyon' :
                        step === 'date_selection' ? 'Tarih Seçimi' :
                            'Rezervasyon Formu'
                }
                description={
                    step === 'tour_selection' ? 'Rezervasyon başlatmak için bir tur seçin.' :
                        step === 'date_selection' ? `${selectedTour?.title} için uygun tarihi seçin.` :
                            'Müşteri ve yolcu bilgilerini girin.'
                }
                className="!max-w-3xl"
            >
                <div>
                    {/* Back Button (except first step) */}
                    {step !== 'tour_selection' && (
                        <div className="px-6 pt-2">
                            <button onClick={handleBack} className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                                <ChevronLeft className="w-4 h-4" /> Geri Dön
                            </button>
                        </div>
                    )}

                    <div className="p-6 pt-4">
                        {step === 'tour_selection' && (
                            <TourSearch onSelect={handleTourSelect} />
                        )}

                        {step === 'date_selection' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Tour Info Card */}
                                <div className="md:col-span-1 space-y-4">
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <h4 className="font-semibold text-blue-900 mb-2">{selectedTour?.title}</h4>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <span className="px-2 py-1 bg-white text-blue-700 rounded-lg shadow-sm">
                                                {selectedTour?.tour_type === 'package' ? 'Paket Tur' : 'Günübirlik'}
                                            </span>
                                            <span className="px-2 py-1 bg-white text-blue-700 rounded-lg shadow-sm">
                                                /{selectedTour?.slug}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <Hash className="w-4 h-4 text-gray-500" />
                                            İstatistikler
                                        </h4>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex justify-between">
                                                <span>Toplam Tarih:</span>
                                                <span className="font-medium text-gray-900">{availableDates.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Calendar */}
                                <div className="md:col-span-2">
                                    <TourCalendar
                                        availableDates={availableDates}
                                        onDateSelect={handleDateSelect}
                                        loading={loading}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 'booking_form' && bookingDetails && (
                            <div className="h-[650px] overflow-y-auto pr-2 -mr-2">
                                <BookingForm
                                    tourDateId={selectedDate.id}
                                    priceGroups={bookingDetails.priceGroups}
                                    pricingModel={bookingDetails.tour.pricing_model || 'per_person'}
                                    onClose={() => setOpen(false)}
                                    onSuccess={handleSuccess}
                                    childAgeMin={bookingDetails.tour.child_age_min}
                                    childAgeMax={bookingDetails.tour.child_age_max}
                                    babyAgeMax={bookingDetails.tour.baby_age_max}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    )
}
