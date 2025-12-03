import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Mysia Turizm CRM',
    description: 'Turizm yönetim sistemi - Tur, rezervasyon, transfer ve muhasebe yönetimi',
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {children}
        </div>
    )
}
