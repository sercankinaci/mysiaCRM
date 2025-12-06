'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebounce } from 'use-debounce'
import { Plus, Search, Trash2, Edit2, Phone, Mail, MoreHorizontal } from 'lucide-react'
import { Client, deleteClient } from '@/lib/actions/clients'
import ClientModal from './ClientModal'
import { formatPhoneNumberDisplay } from '@/lib/utils'

interface ClientsContentProps {
    clients: Client[]
    total: number
    totalPages: number
    currentPage: number
    searchQuery: string
}

export default function ClientsContent({ clients, total, totalPages, currentPage, searchQuery }: ClientsContentProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isInternalSearch, setIsInternalSearch] = useState(false)
    const [searchTerm, setSearchTerm] = useState(searchQuery)
    const [debouncedSearch] = useDebounce(searchTerm, 500)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null)

    // Sync search with URL
    if (isInternalSearch && debouncedSearch !== searchQuery) {
        const params = new URLSearchParams(window.location.search)
        if (debouncedSearch) {
            params.set('q', debouncedSearch)
        } else {
            params.delete('q')
        }
        params.set('page', '1') // Reset page on search
        router.push(`${pathname}?${params.toString()}`)
        setIsInternalSearch(false) // Reset flag
    }

    const handleSearch = (val: string) => {
        setSearchTerm(val)
        setIsInternalSearch(true)
    }

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(window.location.search)
        params.set('page', page.toString())
        router.push(`${pathname}?${params.toString()}`)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return
        try {
            await deleteClient(id)
        } catch (error: any) {
            alert(error.message)
        }
    }

    const openEditModal = (client: Client) => {
        setClientToEdit(client)
        setIsModalOpen(true)
    }

    const openNewModal = () => {
        setClientToEdit(null)
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <input
                        type="text"
                        placeholder="İsim, telefon veya e-posta ile ara..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <button
                    onClick={openNewModal}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Yeni Müşteri
                </button>
            </div>

            {/* Client List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100 text-xs text-gray-500 uppercase font-medium">
                                <th className="px-6 py-4">Müşteri Adı</th>
                                <th className="px-6 py-4">İletişim</th>
                                <th className="px-6 py-4 text-center">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {clients.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                        Müşteri bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{client.name}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">ID: {client.id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="px-6 py-4 space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium font-mono">{formatPhoneNumberDisplay(client.phone)}</span>
                                            </div>
                                            {client.email && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    {client.email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(client)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Düzenle">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(client.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                        <div className="text-sm text-gray-500">
                            Toplam <span className="font-semibold text-gray-900">{total}</span> kayıt
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Önceki
                            </button>
                            <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Sonraki
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                clientToEdit={clientToEdit}
            />
        </div>
    )
}
