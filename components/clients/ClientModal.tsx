'use client'

import { useState, useEffect } from 'react'
import { X, Save, Check } from 'lucide-react'
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { Client, upsertClient } from '@/lib/actions/clients'
import { useRouter } from 'next/navigation'

interface ClientModalProps {
    isOpen: boolean
    onClose: () => void
    clientToEdit?: Client | null
}

export default function ClientModal({ isOpen, onClose, clientToEdit }: ClientModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: ''
    })

    useEffect(() => {
        if (clientToEdit) {
            setFormData({
                full_name: clientToEdit.name,
                phone: clientToEdit.phone || '',
                email: clientToEdit.email || ''
            })
        } else {
            setFormData({ full_name: '', phone: '', email: '' })
        }
    }, [clientToEdit, isOpen])

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!formData.full_name) {
            alert('Lütfen isim giriniz')
            return
        }
        if (!formData.phone || !isPossiblePhoneNumber(formData.phone)) {
            alert('Lütfen geçerli bir telefon numarası giriniz')
            return
        }

        setLoading(true)
        try {
            await upsertClient({
                full_name: formData.full_name,
                phone: formData.phone,
                email: formData.email
            })
            router.refresh()
            onClose()
        } catch (error: any) {
            alert(error.message || 'Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {clientToEdit ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* İsim */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Ad Soyad <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="Müşteri Adı"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>

                    {/* Telefon */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Telefon <span className="text-red-500">*</span></label>
                        <PhoneInput
                            defaultCountry="TR"
                            placeholder="5XX XXX XX XX"
                            value={formData.phone}
                            onChange={(value) => setFormData({ ...formData, phone: value || '' })}
                            className="PhoneInput"
                        />
                        <style jsx global>{`
                            .PhoneInput {
                                display: flex;
                                align-items: center;
                                background-color: #F9FAFB;
                                border: 1px solid #E5E7EB;
                                border-radius: 0.75rem;
                                padding: 0.625rem 1rem;
                                transition: all 0.2s;
                            }
                            .PhoneInput:focus-within {
                                background-color: #FFFFFF;
                                border-color: #3B82F6;
                                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                            }
                            .PhoneInputInput {
                                flex: 1;
                                min-width: 0;
                                background-color: transparent;
                                border: none;
                                outline: none;
                                font-size: 0.95rem;
                                color: #111827;
                            }
                            .PhoneInputInput::placeholder {
                                color: #9CA3AF;
                            }
                            .PhoneInputCountry {
                                margin-right: 0.75rem;
                                opacity: 0.7;
                            }
                        `}</style>
                    </div>

                    {/* E-posta */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">E-posta</label>
                        <input
                            type="email"
                            placeholder="ornek@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                            İptal
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
                            {loading ? 'Kaydediliyor...' : <><Save className="w-4 h-4" /> Kaydet</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
