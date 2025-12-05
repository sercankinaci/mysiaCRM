'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Types ---

export type PriceGroup = {
    id: string
    tour_id: string
    name: string
    currency: string
    pricing: {
        adult: number
        child: number
        baby: number
    }
    status: 'active' | 'passive'
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
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fiyat grupları getirilirken hata:', error)
        return []
    }

    return data as PriceGroup[]
}

export async function createPriceGroup(tourId: string, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const currency = formData.get('currency') as string
    const adultPrice = parseFloat(formData.get('price_adult') as string) || 0
    const childPrice = parseFloat(formData.get('price_child') as string) || 0
    const babyPrice = parseFloat(formData.get('price_baby') as string) || 0

    const pricing = {
        adult: adultPrice,
        child: childPrice,
        baby: babyPrice
    }

    console.log('Creating price group:', { tourId, name, currency, pricing })

    const { data, error } = await supabase
        .from('tour_price_groups')
        .insert({
            tour_id: tourId,
            name,
            currency,
            pricing,
            status: 'active'
        })
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

export async function createTourDate(tourId: string, formData: FormData) {
    const supabase = await createClient()

    const priceGroupId = formData.get('price_group_id') as string
    const startDate = formData.get('start_date') as string
    const endDate = formData.get('end_date') as string
    const capacity = parseInt(formData.get('capacity') as string) || 45

    const { error } = await supabase
        .from('tour_dates')
        .insert({
            tour_id: tourId,
            price_group_id: priceGroupId,
            start_date: startDate,
            end_date: endDate,
            capacity_total: capacity,
            capacity_available: capacity, // Başlangıçta hepsi boş
            status: 'available'
        })

    if (error) {
        console.error('Tur tarihi oluşturulurken hata:', error)
        throw new Error('Tur tarihi oluşturulamadı')
    }

    revalidatePath(`/dashboard/tours/${tourId}`)
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
