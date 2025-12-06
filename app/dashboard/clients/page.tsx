import { getClients } from '@/lib/actions/clients'
import ClientsContent from '@/components/clients/ClientsContent'

export default async function Page({ searchParams }: { searchParams: { q?: string, page?: string } }) {
    const query = searchParams.q || ''
    const page = Number(searchParams.page) || 1
    const { clients, total, totalPages } = await getClients(page, 20, query)

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Müşteriler</h1>
                <p className="text-gray-500 mt-1">Müşteri veritabanı ve yönetimi</p>
            </div>
            <ClientsContent
                clients={clients}
                total={total}
                totalPages={totalPages}
                currentPage={page}
                searchQuery={query}
            />
        </div>
    )
}
