'use client'

import Link from 'next/link'
import { PriceGroup, TourDate } from '@/lib/actions/tour-details'
import PriceGroupList from './PriceGroupList'
import TourDateList from './TourDateList'

const tabs = [
    { id: 'overview', label: 'Genel Bakış' },
    { id: 'pricing', label: 'Fiyat Grupları' },
    { id: 'dates', label: 'Tur Tarihleri' },
    { id: 'settings', label: 'Ayarlar' },
]

export default function TourDetailTabs({
    tourId,
    activeTab,
    priceGroups,
    tourDates
}: {
    tourId: string
    activeTab: string
    priceGroups: PriceGroup[]
    tourDates: TourDate[]
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm min-h-[400px]">
            {/* Tab Navigation */}
            <div className="border-b border-gray-100">
                <nav className="flex gap-6 px-6" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.id}
                            href={`/dashboard/tours/${tourId}?tab=${tab.id}`}
                            className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {activeTab === 'overview' && (
                    <div className="text-center py-12 text-gray-500">
                        <p className="font-medium">Genel Bakış</p>
                        <p className="text-sm mt-2">Burada turun genel bilgileri, açıklaması ve resimleri gösterilecek.</p>
                    </div>
                )}

                {activeTab === 'pricing' && (
                    <PriceGroupList tourId={tourId} priceGroups={priceGroups} />
                )}

                {activeTab === 'dates' && (
                    <TourDateList tourId={tourId} tourDates={tourDates} priceGroups={priceGroups} />
                )}

                {activeTab === 'settings' && (
                    <div className="text-center py-12 text-gray-500">
                        <p className="font-medium">Ayarlar</p>
                        <p className="text-sm mt-2">Burada tur durumu, silme ve diğer ayarlar yapılacak.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
