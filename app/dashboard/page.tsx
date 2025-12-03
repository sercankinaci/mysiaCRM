import { Calendar, Users, Plane, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
    // Bu veriler daha sonra Supabase'den çekilecek
    const stats = [
        {
            name: 'Aktif Turlar',
            value: '12',
            change: '+3',
            changeType: 'positive',
            icon: Calendar,
            color: 'blue',
        },
        {
            name: 'Toplam Müşteri',
            value: '248',
            change: '+12',
            changeType: 'positive',
            icon: Users,
            color: 'purple',
        },
        {
            name: 'Transfer Hizmetleri',
            value: '34',
            change: '+5',
            changeType: 'positive',
            icon: Plane,
            color: 'green',
        },
        {
            name: 'Aylık Gelir',
            value: '₺125,400',
            change: '+8%',
            changeType: 'positive',
            icon: DollarSign,
            color: 'orange',
        },
    ]

    const recentActivities = [
        { id: 1, type: 'booking', message: 'Yeni rezervasyon: Kapadokya Turu', time: '5 dk önce' },
        { id: 2, type: 'payment', message: 'Ödeme alındı: ₺2,500', time: '15 dk önce' },
        { id: 3, type: 'transfer', message: 'Transfer tamamlandı: Havalimanı', time: '1 saat önce' },
        { id: 4, type: 'client', message: 'Yeni müşteri eklendi: Ahmet Yılmaz', time: '2 saat önce' },
    ]

    const upcomingTours = [
        { id: 1, name: 'Kapadokya Turu', date: '15 Aralık 2024', seats: '12/20', status: 'active' },
        { id: 2, name: 'Pamukkale Gezisi', date: '18 Aralık 2024', seats: '8/15', status: 'active' },
        { id: 3, name: 'Efes Antik Kenti', date: '22 Aralık 2024', seats: '15/25', status: 'active' },
    ]

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h2 className="text-3xl font-bold mb-2">Hoş Geldiniz! 👋</h2>
                <p className="text-blue-100">İşte bugünkü özet bilgileriniz</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const colorClasses = {
                        blue: 'bg-blue-100 text-blue-600',
                        purple: 'bg-purple-100 text-purple-600',
                        green: 'bg-green-100 text-green-600',
                        orange: 'bg-orange-100 text-orange-600',
                    }[stat.color]

                    return (
                        <div
                            key={stat.name}
                            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    {stat.change}
                                </span>
                            </div>
                            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.name}</h3>
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    )
                })}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Son Aktiviteler</h3>
                    <div className="space-y-4">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                                <div className="flex-1">
                                    <p className="text-gray-900 font-medium">{activity.message}</p>
                                    <p className="text-gray-500 text-sm">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Tours */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Yaklaşan Turlar</h3>
                    <div className="space-y-4">
                        {upcomingTours.map((tour) => (
                            <div key={tour.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div>
                                    <h4 className="font-semibold text-gray-900">{tour.name}</h4>
                                    <p className="text-sm text-gray-600">{tour.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{tour.seats}</p>
                                    <p className="text-xs text-gray-500">Koltuk</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Hızlı İşlemler</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-center">
                        <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm font-medium text-gray-700">Yeni Tur</span>
                    </button>
                    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-all text-center">
                        <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm font-medium text-gray-700">Müşteri Ekle</span>
                    </button>
                    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all text-center">
                        <Plane className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm font-medium text-gray-700">Transfer Ekle</span>
                    </button>
                    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-600 hover:bg-orange-50 transition-all text-center">
                        <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm font-medium text-gray-700">Ödeme Kaydet</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
