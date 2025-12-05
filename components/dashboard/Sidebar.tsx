'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Plane,
    Users,
    BarChart3,
    Settings,
    HelpCircle,
    LogOut
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Turlar', href: '/dashboard/tours', icon: Plane },
    { name: 'Müşteriler', href: '/dashboard/clients', icon: Users },
    { name: 'Raporlar', href: '/dashboard/finance', icon: BarChart3 }, // Raporlar -> Finance for now
    { name: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen sticky top-0">
            <div className="flex h-full flex-col justify-between p-4">
                <div className="flex flex-col gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-3 p-2">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                            M
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-gray-900 dark:text-white text-base font-bold leading-normal">Mysia CRM</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">Luxury Tourism</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-2 mt-4">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <p className="text-sm font-medium leading-normal">{item.name}</p>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col gap-1">
                    <Link
                        href="#"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <HelpCircle className="w-5 h-5" />
                        <p className="text-sm font-medium leading-normal">Yardım</p>
                    </Link>
                </div>
            </div>
        </aside>
    )
}
