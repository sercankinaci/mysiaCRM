'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar, ArrowRight, Loader2, MapPin, CheckCircle, Ticket } from 'lucide-react'
import Modal from '@/components/ui/modal'
import { getActiveToursForQuickBooking, getAvailableDatesForQuickBooking, getQuickBookingDetails } from '@/lib/actions/quick-booking'
import { formatDate } from '@/lib/utils'
import BookingForm from './BookingForm'
import { PriceGroup, TourDate } from '@/lib/actions/tour-details'
import { Tour } from '@/lib/actions/tours'

type Step = 'tour_selection' | 'date_selection' | 'booking_form'

export default function QuickBookingDialog() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<Step>('tour_selection')
    const [loading, setLoading] = useState(false)

    // Data states
    const [tours, setTours] = useState<any[]>([])
    const [availableDates, setAvailableDates] = useState<any[]>([])

    // Selection states
    const [selectedTour, setSelectedTour] = useState<any>(null)
    const [selectedDate, setSelectedDate] = useState<any>(null)

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
        } else {
            // Load tours when opened
            loadTours()
        }
    }, [open])

    async function loadTours() {
        setLoading(true)
        try {
            const data = await getActiveToursForQuickBooking()
            setTours(data)
        } catch (error) {
            console.error('Turlar yüklenemedi', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleTourSelect(tour: any) {
        setSelectedTour(tour)
        setLoading(true)
        try {
            const dates = await getAvailableDatesForQuickBooking(tour.id)
            setAvailableDates(dates)
            setStep('date_selection')
        } catch (error) {
            console.error('Tarihler yüklenemedi', error)
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
        // Opsiyonel: Toast mesajı göster
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
            >
                <Plus className="w-4 h-4" />
                Hızlı Rezervasyon
            </button>

            <Modal
                isOpen={open}
                onClose={() => setOpen(false)}
                title={
                    step === 'tour_selection' ? 'Tur Seçimi' :
                        step === 'date_selection' ? 'Tarih Seçimi' :
                            'Rezervasyon Oluştur'
                }
                description={
                    step === 'tour_selection' ? 'Lütfen rezervasyon yapmak istediğiniz turu seçin.' :
                        step === 'date_selection' ? `${selectedTour?.title} için müsait bir tarih seçin.` :
                            'Rezervasyon detaylarını girerek işlemi tamamlayın.'
                }
            >
                <div className={`p-1 ${step === 'booking_form' ? 'min-h-[600px]' : ''}`}>
                    {/* Steps Indicator */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className={`flex items-center gap-2 ${step === 'tour_selection' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step === 'tour_selection' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>1</span>
                            Tour
                        </div>
                        <div className="w-8 h-px bg-gray-200" />
                        <div className={`flex items-center gap-2 ${step === 'date_selection' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step === 'date_selection' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>2</span>
                            Tarih
                        </div>
                        <div className="w-8 h-px bg-gray-200" />
                        <div className={`flex items-center gap-2 ${step === 'booking_form' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step === 'booking_form' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>3</span>
                            Detaylar
                        </div>
                    </div>

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                            <p className="text-gray-500">Yükleniyor...</p>
                        </div>
                    )}

                    {!loading && step === 'tour_selection' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tours.map((tour) => (
                                <button
                                    key={tour.id}
                                    onClick={() => handleTourSelect(tour)}
                                    className="group flex flex-col items-start p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                                >
                                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 mb-1">
                                        {tour.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto pt-2 w-full">
                                        <span className={`px-2 py-0.5 rounded-full ${tour.tour_type === 'package' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {tour.tour_type === 'package' ? 'Paket' : 'Günübirlik'}
                                        </span>
                                        <span className="ml-auto flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Seç <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </button>
                            ))}
                            {tours.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-500">
                                    Aktif tur bulunamadı.
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && step === 'date_selection' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                <button
                                    onClick={() => setStep('tour_selection')}
                                    className="hover:text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    <ArrowRight className="w-3 h-3 rotate-180" /> Turlara Dön
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableDates.map((date) => (
                                    <button
                                        key={date.id}
                                        onClick={() => handleDateSelect(date)}
                                        className="group flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex flex-col items-center justify-center shadow-sm">
                                                <span className="text-xs font-semibold uppercase">{new Date(date.start_date).toLocaleDateString('tr-TR', { month: 'short' })}</span>
                                                <span className="text-lg font-bold">{new Date(date.start_date).getDate()}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {formatDate(date.start_date)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {date.end_date !== date.start_date ? `${formatDate(date.end_date)}'e kadar` : 'Günübirlik'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${date.capacity_available < 5 ? 'text-amber-600' : 'text-green-600'
                                                }`}>
                                                {date.capacity_available}
                                            </p>
                                            <p className="text-xs text-gray-500">boş yer</p>
                                        </div>
                                    </button>
                                ))}
                                {availableDates.length === 0 && (
                                    <div className="col-span-full text-center py-12">
                                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">Bu tur için uygun tarih bulunamadı.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!loading && step === 'booking_form' && bookingDetails && (
                        <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
                                <button onClick={() => setStep('date_selection')} className="hover:text-blue-600 flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3 rotate-180" /> Tarihlere Dön
                                </button>
                                <span className="mx-2 text-gray-300">|</span>
                                <span className="font-medium text-gray-900">{bookingDetails.tour?.title} - {formatDate(selectedDate?.start_date)}</span>
                            </div>

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
            </Modal>
        </>
    )
}
