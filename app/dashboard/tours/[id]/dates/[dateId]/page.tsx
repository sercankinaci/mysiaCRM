import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, DollarSign } from 'lucide-react'
import { getTourById } from '@/lib/actions/tours'
import { getTourDates, getPriceGroups } from '@/lib/actions/tour-details'
import { getOperation, getFinanceSummary, getFinanceRecords } from '@/lib/actions/operations'
import { getBookingsByTourDate, getBookingStats } from '@/lib/actions/bookings'
import { formatDate, formatCurrency } from '@/lib/utils'
import OperationPanel from '@/components/tours/OperationPanel'
import FinancePanel from '@/components/tours/FinancePanel'
import BookingList from '@/components/bookings/BookingList'

export default async function TourDateDetailPage({
    params,
}: {
    params: Promise<{ id: string; dateId: string }>
}) {
    const { id: tourId, dateId } = await params

    const tour = await getTourById(tourId)
    if (!tour) notFound()

    const tourDates = await getTourDates(tourId)
    const tourDate = tourDates.find(d => d.id === dateId)
    if (!tourDate) notFound()

    const priceGroups = await getPriceGroups(tourId)
    const priceGroup = priceGroups.find(pg => pg.id === tourDate.price_group_id)

    const operation = await getOperation(dateId)
    const financeSummary = await getFinanceSummary(dateId)
    const financeRecords = await getFinanceRecords(dateId)
    const bookings = await getBookingsByTourDate(dateId)
    const bookingStats = await getBookingStats(dateId)

    const capacityPercent = ((tourDate.capacity_total - tourDate.capacity_available) / tourDate.capacity_total) * 100

    // Price info for booking form
    const priceInfo = {
        adult: priceGroup?.pricing?.adult || 0,
        child: priceGroup?.pricing?.child || 0,
        baby: priceGroup?.pricing?.baby || 0,
        currency: priceGroup?.currency || 'TRY'
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb Header */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/dashboard/tours/${tourId}?tab=dates`}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/dashboard/tours" className="hover:text-gray-700">Turlar</Link>
                        <span>/</span>
                        <Link href={`/dashboard/tours/${tourId}`} className="hover:text-gray-700">{tour.title}</Link>
                        <span>/</span>
                        <span>Tarih Detayı</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mt-1">
                        {formatDate(tourDate.start_date)} - {formatDate(tourDate.end_date)}
                    </h1>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Doluluk</p>
                            <p className="text-xl font-bold text-gray-900">
                                {tourDate.capacity_total - tourDate.capacity_available} / {tourDate.capacity_total}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${capacityPercent}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Toplam Gelir</p>
                            <p className="text-xl font-bold text-green-600">
                                {formatCurrency(financeSummary.income)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Toplam Gider</p>
                            <p className="text-xl font-bold text-red-600">
                                {formatCurrency(financeSummary.expense)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Net Kâr</p>
                            <p className={`text-xl font-bold ${financeSummary.profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                {formatCurrency(financeSummary.profit)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Operations Panel */}
                <OperationPanel tourDateId={dateId} operation={operation} />

                {/* Finance Panel */}
                <FinancePanel tourDateId={dateId} records={financeRecords} summary={financeSummary} />
            </div>

            {/* Bookings Section */}
            <BookingList
                tourDateId={dateId}
                bookings={bookings}
                priceInfo={priceInfo}
            />
        </div>
    )
}
