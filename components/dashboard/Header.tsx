'use client'

import { Search, Bell, Settings } from 'lucide-react'
import QuickBookingDialog from '@/components/bookings/QuickBookingDialog'

export default function Header({ user }: { user?: any }) {
    return (
        <header className="flex items-center justify-end gap-2 px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
            {/* Search */}
            <div className="relative w-full max-w-xs mr-auto flex items-center gap-4">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ara..."
                        type="text"
                    />
                </div>
                <QuickBookingDialog />
            </div>

            {/* Actions */}
            <button className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Settings className="w-5 h-5" />
            </button>

            {/* Profile */}
            <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı'}
                </span>
            </button>
        </header>
    )
}
