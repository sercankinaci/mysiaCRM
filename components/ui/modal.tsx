'use client'

import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    children: React.ReactNode
    className?: string
}

export default function Modal({ isOpen, onClose, title, description, children, className = '' }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    // Portal kullanabiliriz veya body sonuna ekleyebiliriz ama Next.js'de portal daha güvenli.
    // Şimdilik hydration sorunlarını önlemek için client-side check yapmıyorum,
    // doğrudan render ediyorum. Proje yapısına göre document.body kullanılabilir.

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={overlayRef}
                onClick={(e) => e.target === overlayRef.current && onClose()}
                className="absolute inset-0"
            />

            <div
                className={`relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 ${className}`}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
                        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    )
}
