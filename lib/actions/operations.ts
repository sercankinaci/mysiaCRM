'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Types ---

export type TourOperation = {
    id: string
    tour_date_id: string
    vehicle_info: {
        plate?: string
        type?: string
        capacity?: number
    }
    guide_info: {
        name?: string
        phone?: string
    }
    driver_info: {
        name?: string
        phone?: string
    }
    pickup_points: Array<{
        time: string
        location: string
    }>
    notes?: string
    status: 'planned' | 'active' | 'completed' | 'cancelled'
    created_at: string
}

export type TourDateFinance = {
    id: string
    tour_date_id: string
    type: 'income' | 'expense'
    category: string
    amount: number
    currency: string
    description?: string
    reference_type?: string
    reference_id?: string
    transaction_date: string
    created_at: string
}

// --- Operations Actions ---

export async function getOperation(tourDateId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tour_operations')
        .select('*')
        .eq('tour_date_id', tourDateId)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Operasyon getirilirken hata:', error)
    }

    return data as TourOperation | null
}

export async function upsertOperation(tourDateId: string, formData: FormData) {
    const supabase = await createClient()

    const vehiclePlate = formData.get('vehicle_plate') as string
    const vehicleType = formData.get('vehicle_type') as string
    const vehicleCapacity = parseInt(formData.get('vehicle_capacity') as string) || 0

    const guideName = formData.get('guide_name') as string
    const guidePhone = formData.get('guide_phone') as string

    const driverName = formData.get('driver_name') as string
    const driverPhone = formData.get('driver_phone') as string

    const notes = formData.get('notes') as string

    const { error } = await supabase
        .from('tour_operations')
        .upsert({
            tour_date_id: tourDateId,
            vehicle_info: { plate: vehiclePlate, type: vehicleType, capacity: vehicleCapacity },
            guide_info: { name: guideName, phone: guidePhone },
            driver_info: { name: driverName, phone: driverPhone },
            notes,
            status: 'planned'
        }, { onConflict: 'tour_date_id' })

    if (error) {
        console.error('Operasyon kaydedilirken hata:', error)
        throw new Error(`Operasyon kaydedilemedi: ${error.message}`)
    }

    revalidatePath(`/dashboard/tours`)
}

// --- Finance Actions ---

export async function getFinanceRecords(tourDateId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tour_date_finance')
        .select('*')
        .eq('tour_date_id', tourDateId)
        .order('transaction_date', { ascending: false })

    if (error) {
        console.error('Finans kayıtları getirilirken hata:', error)
        return []
    }

    return data as TourDateFinance[]
}

export async function getFinanceSummary(tourDateId: string) {
    const records = await getFinanceRecords(tourDateId)

    const income = records
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0)

    const expense = records
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0)

    return {
        income,
        expense,
        profit: income - expense,
        recordCount: records.length
    }
}

export async function createFinanceRecord(tourDateId: string, formData: FormData) {
    const supabase = await createClient()

    const type = formData.get('type') as 'income' | 'expense'
    const category = formData.get('category') as string
    const amount = parseFloat(formData.get('amount') as string) || 0
    const currency = formData.get('currency') as string || 'TRY'
    const description = formData.get('description') as string
    const transactionDate = formData.get('transaction_date') as string

    const { error } = await supabase
        .from('tour_date_finance')
        .insert({
            tour_date_id: tourDateId,
            type,
            category,
            amount,
            currency,
            description,
            transaction_date: transactionDate || new Date().toISOString().split('T')[0]
        })

    if (error) {
        console.error('Finans kaydı oluşturulurken hata:', error)
        throw new Error(`Finans kaydı oluşturulamadı: ${error.message}`)
    }

    revalidatePath(`/dashboard/tours`)
}

export async function deleteFinanceRecord(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tour_date_finance')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Finans kaydı silinirken hata:', error)
        throw new Error(`Finans kaydı silinemedi: ${error.message}`)
    }

    revalidatePath(`/dashboard/tours`)
}

// --- Booking helpers ---

export async function addReservationIncome(tourDateId: string, bookingId: string, amount: number) {
    const supabase = await createClient()

    await supabase
        .from('tour_date_finance')
        .insert({
            tour_date_id: tourDateId,
            type: 'income',
            category: 'reservation',
            amount,
            currency: 'TRY',
            description: 'Rezervasyon ödemesi',
            reference_type: 'booking',
            reference_id: bookingId
        })
}
