'use client'

import { useState } from 'react'
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { TourDateFinance, createFinanceRecord, deleteFinanceRecord } from '@/lib/actions/operations'
import { formatCurrency, formatDate } from '@/lib/utils'

const categoryLabels: Record<string, string> = {
    reservation: 'Rezervasyon',
    fuel: 'Yakıt',
    guide_fee: 'Rehber Ücreti',
    driver_fee: 'Şoför Ücreti',
    hotel: 'Otel',
    meal: 'Yemek',
    ticket: 'Bilet/Giriş',
    other: 'Diğer'
}

export default function FinancePanel({
    tourDateId,
    records,
    summary
}: {
    tourDateId: string
    records: TourDateFinance[]
    summary: { income: number; expense: number; profit: number }
}) {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            await createFinanceRecord(tourDateId, formData)
            setIsFormOpen(false)
        } catch (error) {
            alert('Kayıt oluşturulurken hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
            await deleteFinanceRecord(id)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gray-500" />
                    Finans
                </h2>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                    <Plus className="w-4 h-4" />
                    Kayıt Ekle
                </button>
            </div>

            {isFormOpen && (
                <form action={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <select
                            name="type"
                            required
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="income">Gelir</option>
                            <option value="expense">Gider</option>
                        </select>
                        <select
                            name="category"
                            required
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                            {Object.entries(categoryLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="number"
                            name="amount"
                            placeholder="Tutar"
                            required
                            step="0.01"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                            type="date"
                            name="transaction_date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                    <input
                        type="text"
                        name="description"
                        placeholder="Açıklama"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                            İptal
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
                {records.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                        <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm">Henüz finans kaydı yok.</p>
                    </div>
                ) : (
                    records.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                {record.type === 'income' ? (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {categoryLabels[record.category] || record.category}
                                    </p>
                                    {record.description && (
                                        <p className="text-xs text-gray-500">{record.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-semibold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                                </span>
                                <button
                                    onClick={() => handleDelete(record.id)}
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
