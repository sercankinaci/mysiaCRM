'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Types ---

export type PriceGroup = {
    id: string
    tour_id: string
    name: string
    currency: string
    // Kişi başı fiyatlandırma (günübirlik turlar)
    pricing?: {
        adult: number
        child: number
        baby: number
    }
    price_adult?: number
    price_child?: number
    price_baby?: number
    // Oda bazlı fiyatlandırma (paket turlar)
    max_pax?: number
    price_single_pp?: number
    price_double_pp?: number
    price_triple_pp?: number
    price_quad_pp?: number
    price_child_1?: number
    price_child_2?: number
    price_baby_1?: number
    price_baby_2?: number

    status: 'active' | 'passive'
    sort_order?: number
    created_at: string
}

export type TourDate = {
    id: string
    tour_id: string
    price_group_id: string
    start_date: string
    end_date: string
    capacity_total: number
    capacity_available: number
    status: 'available' | 'soldout' | 'cancelled' | 'completed'
    price_group?: PriceGroup // Joined data
    created_at: string
}

// --- Price Groups Actions ---

export async function getPriceGroups(tourId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tour_price_groups')
        .select('*')
        .eq('tour_id', tourId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fiyat grupları getirilirken hata:', error)
        return []
    }

    return data as PriceGroup[]
}

export async function createPriceGroup(tourId: string, formData: FormData, pricingModel: string = 'per_person') {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const currency = formData.get('currency') as string

    let insertData: Record<string, unknown> = {
        tour_id: tourId,
        name,
        currency,
        status: 'active'
    }

    if (pricingModel === 'room_based') {
        // Paket Tur - Oda Bazlı Fiyatlandırma
        insertData = {
            ...insertData,
            max_pax: parseInt(formData.get('max_pax') as string) || 4,
            price_single_pp: parseFloat(formData.get('price_single_pp') as string) || null,
            price_double_pp: parseFloat(formData.get('price_double_pp') as string) || null,
            price_triple_pp: parseFloat(formData.get('price_triple_pp') as string) || null,
            price_quad_pp: parseFloat(formData.get('price_quad_pp') as string) || null,
            price_child_1: parseFloat(formData.get('price_child_1') as string) || null,
            price_child_2: parseFloat(formData.get('price_child_2') as string) || null,
            price_baby_1: parseFloat(formData.get('price_baby_1') as string) || 0,
            price_baby_2: parseFloat(formData.get('price_baby_2') as string) || 0,
        }
    } else {
        // Günübirlik Tur - Kişi Başı Fiyatlandırma
        const adultPrice = parseFloat(formData.get('price_adult') as string) || 0
        const childPrice = parseFloat(formData.get('price_child') as string) || 0
        const babyPrice = parseFloat(formData.get('price_baby') as string) || 0

        insertData = {
            ...insertData,
            price_adult: adultPrice,
            price_child: childPrice,
            price_baby: babyPrice,
            // Eski format için de (geriye uyumluluk)
            pricing: {
                adult: adultPrice,
                child: childPrice,
                baby: babyPrice
            }
        }
    }

    console.log('Creating price group:', insertData)

    const { data, error } = await supabase
        .from('tour_price_groups')
        .insert(insertData)
        .select()

    if (error) {
        console.error('Supabase Error:', JSON.stringify(error, null, 2))
        throw new Error(`Fiyat grubu oluşturulamadı: ${error.message}`)
    }

    console.log('Created price group:', data)
    revalidatePath(`/dashboard/tours/${tourId}`)
}

export async function deletePriceGroup(id: string, tourId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tour_price_groups')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Fiyat grubu silinirken hata:', error)
        throw new Error('Fiyat grubu silinemedi')
    }

    revalidatePath(`/dashboard/tours/${tourId}`)
}

export async function updatePriceGroup(id: string, tourId: string, formData: FormData, pricingModel: string = 'per_person') {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const currency = formData.get('currency') as string

    let updateData: Record<string, unknown> = {
        name,
        currency
    }

    if (pricingModel === 'room_based') {
        updateData = {
            ...updateData,
            max_pax: parseInt(formData.get('max_pax') as string) || 4,
            price_single_pp: parseFloat(formData.get('price_single_pp') as string) || null,
            price_double_pp: parseFloat(formData.get('price_double_pp') as string) || null,
            price_triple_pp: parseFloat(formData.get('price_triple_pp') as string) || null,
            price_quad_pp: parseFloat(formData.get('price_quad_pp') as string) || null,
            price_child_1: parseFloat(formData.get('price_child_1') as string) || null,
            price_child_2: parseFloat(formData.get('price_child_2') as string) || null,
            price_baby_1: parseFloat(formData.get('price_baby_1') as string) || 0,
            price_baby_2: parseFloat(formData.get('price_baby_2') as string) || 0,
        }
    } else {
        const adultPrice = parseFloat(formData.get('price_adult') as string) || 0
        const childPrice = parseFloat(formData.get('price_child') as string) || 0
        const babyPrice = parseFloat(formData.get('price_baby') as string) || 0

        updateData = {
            ...updateData,
            price_adult: adultPrice,
            price_child: childPrice,
            price_baby: babyPrice,
            pricing: {
                adult: adultPrice,
                child: childPrice,
                baby: babyPrice
            }
        }
    }

    const { error } = await supabase
        .from('tour_price_groups')
        .update(updateData)
        .eq('id', id)

    if (error) {
        console.error('Fiyat grubu güncellenirken hata:', error)
        throw new Error(`Fiyat grubu güncellenemedi: ${error.message}`)
    }

    revalidatePath(`/dashboard/tours/${tourId}`)
}

// --- Tour Dates Actions ---

export async function getTourDates(tourId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tour_dates')
        .select(`
            *,
            price_group:tour_price_groups(*)
        `)
        .eq('tour_id', tourId)
        .order('start_date', { ascending: true })

    if (error) {
        console.error('Tur tarihleri getirilirken hata:', error)
        return []
    }

    return data as TourDate[]
}

export async function createTourDate(tourId: string, data: {
    price_group_id: string
    start_date: string
    capacity: number
}) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tour_dates')
        .insert({
            tour_id: tourId,
            price_group_id: data.price_group_id,
            start_date: data.start_date,
            end_date: data.start_date, // Bitiş tarihi = Başlangıç tarihi (geriye uyumluluk)
            capacity_total: data.capacity,
            capacity_available: data.capacity,
            status: 'available'
        })

    if (error) {
        console.error('Tur tarihi oluşturulurken hata:', error)
        throw new Error('Tur tarihi oluşturulamadı')
    }

    revalidatePath(`/dashboard/tours/${tourId}`)
}

export async function createBulkTourDates(tourId: string, data: {
    price_group_id: string
    dates: string[]
    capacity: number
}) {
    const supabase = await createClient()

    const datesToInsert = data.dates.map(date => ({
        tour_id: tourId,
        price_group_id: data.price_group_id,
        start_date: date,
        end_date: date,
        capacity_total: data.capacity,
        capacity_available: data.capacity,
        status: 'available'
    }))

    const { error } = await supabase
        .from('tour_dates')
        .insert(datesToInsert)

    if (error) {
        console.error('Toplu tur tarihleri oluşturulurken hata:', error)
        throw new Error('Tur tarihleri oluşturulamadı: ' + error.message)
    }

    revalidatePath(`/dashboard/tours/${tourId}`)
    return { count: data.dates.length }
}

export async function deleteTourDate(id: string, tourId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tour_dates')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Tur tarihi silinirken hata:', error)
        throw new Error('Tur tarihi silinemedi')
    }

    revalidatePath(`/dashboard/tours/${tourId}`)
}
