import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Map } from 'lucide-react'
import { getTourById } from '@/lib/actions/tours'
import { getPriceGroups, getTourDates } from '@/lib/actions/tour-details'
import { formatDate } from '@/lib/utils'
import TourDetailTabs from '@/components/tours/TourDetailTabs'

export default async function TourDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ tab?: string }>
}) {
    const { id } = await params
    const { tab = 'overview' } = await searchParams

    const tour = await getTourById(id)

    if (!tour) {
        notFound()
    }

    // Fetch related data
    const priceGroups = await getPriceGroups(id)
    const tourDates = await getTourDates(id)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/tours"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{tour.title}</h1>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${tour.status === 'active' ? 'bg-green-100 text-green-800' :
                                tour.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'}`}>
                            {tour.status === 'active' ? 'Aktif' : tour.status === 'draft' ? 'Taslak' : 'Pasif'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                            <Map className="w-4 h-4" />
                            {tour.tour_type}
                        </span>
                        <span>•</span>
                        <span>/{tour.slug}</span>
                        <span>•</span>
                        <span>Oluşturulma: {formatDate(tour.created_at)}</span>
                    </div>
                </div>
            </div>

            {/* Tabs Component */}
            <TourDetailTabs
                tourId={id}
                activeTab={tab}
                priceGroups={priceGroups}
                tourDates={tourDates}
            />
        </div>
    )
}
