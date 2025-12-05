import Link from 'next/link'
import { Plus, Filter, MoreHorizontal, Map } from 'lucide-react'
import Search from '@/components/ui/search'
import { getTours } from '@/lib/actions/tours'
import { formatDate } from '@/lib/utils'

export default async function ToursPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; status?: string }>
}) {
    const params = await searchParams
    const query = params?.query || ''
    const status = params?.status || 'all'

    const tours = await getTours(query, status)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Turlar</h1>
                    <p className="text-gray-500">Tüm tur programlarını yönetin</p>
                </div>
                <Link
                    href="/dashboard/tours/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Tur Ekle
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex-1">
                    <Search placeholder="Tur adı ara..." />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                        className="border border-gray-200 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={status}
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="active">Aktif</option>
                        <option value="draft">Taslak</option>
                        <option value="passive">Pasif</option>
                    </select>
                </div>
            </div>

            {/* Tours Grid/List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Tur Adı</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Tip</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Durum</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Oluşturulma</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tours.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Kayıtlı tur bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                tours.map((tour) => (
                                    <tr key={tour.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <Link href={`/dashboard/tours/${tour.id}`} className="hover:text-blue-600 block">
                                                {tour.title}
                                                <span className="block text-xs text-gray-400 font-normal mt-0.5">
                                                    /{tour.slug}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Map className="w-4 h-4 text-gray-400" />
                                                <span className="capitalize">{tour.tour_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${tour.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : tour.status === 'draft'
                                                            ? 'bg-gray-100 text-gray-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {tour.status === 'active'
                                                    ? 'Aktif'
                                                    : tour.status === 'draft'
                                                        ? 'Taslak'
                                                        : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {formatDate(tour.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/tours/${tour.id}`}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                Yönet
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
