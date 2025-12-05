import { ArrowUp, ArrowDown } from 'lucide-react'

export default function DashboardPage() {
    // Bu veriler daha sonra Supabase'den çekilecek
    const stats = [
        {
            name: 'Aktif Turlar',
            value: '12',
            change: '+5.2%',
            trend: 'up',
        },
        {
            name: 'Toplam Rezervasyon',
            value: '284',
            change: '+12.0%',
            trend: 'up',
        },
        {
            name: 'Aylık Ciro',
            value: '₺124.500',
            change: '-1.8%',
            trend: 'down',
        },
        {
            name: 'Bekleyen İşler',
            value: '6',
            change: '+3 son 7 gün',
            trend: 'up',
        },
    ]

    const upcomingTours = [
        { name: 'Kapadokya Balon Turu', date: '25 Eki', filled: 35, total: 40, color: 'bg-blue-600' },
        { name: 'Ege Sahilleri Macerası', date: '28 Eki', filled: 15, total: 30, color: 'bg-blue-600' },
        { name: 'Karadeniz Yaylaları', date: '02 Kas', filled: 24, total: 32, color: 'bg-blue-600' },
    ]

    const recentBookings = [
        { client: 'Ahmet Yılmaz', tour: 'Kapadokya Balon Turu', date: '17.10.2023', amount: '₺3.500', status: 'Onaylandı', statusColor: 'green' },
        { client: 'Zeynep Kaya', tour: 'Ege Sahilleri Macerası', date: '16.10.2023', amount: '₺5.200', status: 'Beklemede', statusColor: 'yellow' },
        { client: 'Mehmet Öztürk', tour: 'Karadeniz Yaylaları', date: '15.10.2023', amount: '₺4.800', status: 'Onaylandı', statusColor: 'green' },
        { client: 'Fatma Demir', tour: 'Kapadokya Balon Turu', date: '14.10.2023', amount: '₺3.500', status: 'İptal Edildi', statusColor: 'red' },
    ]

    return (
        <div className="space-y-8">
            {/* PageHeading */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex flex-col gap-1">
                    <p className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight">Hoş geldin, Elif</p>
                    <p className="text-gray-500 dark:text-gray-400 text-base font-normal">18 Ekim 2023, Cuma</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-gray-500 dark:text-gray-400 text-base font-medium">{stat.name}</p>
                        <p className="text-gray-900 dark:text-white text-3xl font-bold">{stat.value}</p>
                        <p className={`${stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} text-sm font-medium flex items-center gap-1`}>
                            {stat.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            {stat.change}
                        </p>
                    </div>
                ))}
            </div>

            {/* Main Grid Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Charts */}
                <div className="lg:col-span-2 flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 shadow-sm">
                    <div className="flex flex-col">
                        <p className="text-gray-900 dark:text-white text-lg font-semibold">Gelir vs Gider (6 Ay)</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Son 6 aydaki performansı görüntüle.</p>
                    </div>
                    {/* CSS Chart */}
                    <div className="grid min-h-[250px] grid-flow-col gap-6 grid-rows-[1fr_auto] items-end justify-items-center pt-4">
                        {[
                            { month: 'Nisan', height: '30%', color: 'bg-blue-600/20' },
                            { month: 'Mayıs', height: '60%', color: 'bg-blue-600/20' },
                            { month: 'Haziran', height: '80%', color: 'bg-blue-600' },
                            { month: 'Temmuz', height: '45%', color: 'bg-blue-600/20' },
                            { month: 'Ağustos', height: '70%', color: 'bg-blue-600' },
                            { month: 'Eylül', height: '55%', color: 'bg-blue-600/20' },
                        ].map((bar) => (
                            <div key={bar.month} className="w-full flex flex-col items-center gap-2 h-full justify-end">
                                <div className={`${bar.color} w-3/4 rounded-t-lg transition-all hover:opacity-80`} style={{ height: bar.height }}></div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold tracking-wide">{bar.month}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Tours Widget */}
                <div className="lg:col-span-1 flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 shadow-sm">
                    <p className="text-gray-900 dark:text-white text-lg font-semibold">Yaklaşan Turlar</p>
                    <div className="flex flex-col gap-4">
                        {upcomingTours.map((tour) => (
                            <div key={tour.name} className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{tour.name}</p>
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">{tour.date}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(tour.filled / tour.total) * 100}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{tour.filled} / {tour.total} Dolu</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                <div className="p-6">
                    <p className="text-gray-900 dark:text-white text-lg font-semibold">Son Rezervasyonlar</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3">Müşteri</th>
                                <th className="px-6 py-3">Tur</th>
                                <th className="px-6 py-3">Tarih</th>
                                <th className="px-6 py-3">Tutar</th>
                                <th className="px-6 py-3">Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentBookings.map((booking, index) => (
                                <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 last:border-0">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{booking.client}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{booking.tour}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{booking.date}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{booking.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full 
                                            ${booking.statusColor === 'green' ? 'text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-300' :
                                                booking.statusColor === 'yellow' ? 'text-yellow-800 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300' :
                                                    'text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-300'}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

