import Link from 'next/link'
import { ArrowRight, BarChart3, Calendar, Users, Plane } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Plane className="w-4 h-4" />
            Turizm Yönetim Sistemi
          </div>

          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Mysia Turizm
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              CRM Platformu
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Tur yönetimi, rezervasyon, transfer hizmetleri ve muhasebe işlemlerinizi
            tek platformdan yönetin. Modern, hızlı ve güvenli.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Giriş Yap
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-blue-600 hover:shadow-lg transition-all duration-200"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Calendar className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Tur Yönetimi</h3>
            <p className="text-gray-600">
              Turlarınızı kolayca oluşturun, düzenleyin ve takip edin. Koltuk seçimi ve rezervasyon yönetimi.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">CRM & Müşteri</h3>
            <p className="text-gray-600">
              Müşteri bilgilerini merkezi bir sistemde saklayın. Rezervasyon geçmişi ve notlar.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <BarChart3 className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Muhasebe & Raporlama</h3>
            <p className="text-gray-600">
              Gelir-gider takibi, kâr hesaplama ve detaylı finansal raporlar.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2024 Mysia Turizm CRM. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}
