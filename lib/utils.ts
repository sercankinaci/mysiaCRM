import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

export function formatCurrency(amount: number, currency: string = 'TRY') {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency,
    }).format(amount)
}


export function normalizePhoneNumber(phone: string): string | null {
    // Sadece rakamları al
    const cleaned = phone.replace(/\D/g, '')

    // Boşsa null dön
    if (cleaned.length === 0) return null

    // TR numarası kontrolü (basit)
    // 10 hane ise başına +90 ekle (5551234567 -> +905551234567)
    if (cleaned.length === 10) return '+90' + cleaned

    // 11 hane ve 0 ile başlıyorsa 0'ı atıp +90 ekle (05551234567 -> +905551234567)
    if (cleaned.length === 11 && cleaned.startsWith('0')) return '+90' + cleaned.substring(1)

    // 12 hane ve 90 ile başlıyorsa başına + ekle (905551234567 -> +905551234567)
    if (cleaned.length === 12 && cleaned.startsWith('90')) return '+' + cleaned

    // Diğer durumlar için başına + ekleyip dön
    return '+' + cleaned
}

export function formatPhoneNumberDisplay(phone: string | null | undefined): string {
    if (!phone) return '-'
    // E.164 (+905551234567) -> TR Display (0555 123 45 67)
    const normalized = normalizePhoneNumber(phone)
    if (!normalized) return phone

    if (normalized.startsWith('+90')) {
        const rest = normalized.substring(3)
        if (rest.length === 10) {
            return `0${rest.substring(0, 3)} ${rest.substring(3, 6)} ${rest.substring(6, 8)} ${rest.substring(8, 10)}`
        }
    }
    return normalized
}
