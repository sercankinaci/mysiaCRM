'use server'

import { createClient } from '@/lib/supabase/server'

export async function getActiveToursForQuickBooking() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tours')
        .select('id, title, slug, tour_type, pricing_model')
        .eq('status', 'active')
        .order('title', { ascending: true })

    if (error) {
        console.error('Aktif turlar getirilirken hata:', error)
        return []
    }

    return data
}

export async function getAvailableDatesForQuickBooking(tourId: string) {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: dates, error } = await supabase
        .from('tour_dates')
        .select(`
            *,
            price_group:tour_price_groups(*)
        `)
        .eq('tour_id', tourId)
        .gte('start_date', today) // Bugünden sonraki tarihler
        .eq('status', 'available') // Müsait durumdakiler
        .gt('capacity_available', 0) // Yer olanlar
        .order('start_date', { ascending: true })

    if (error) {
        console.error('Müsait tarihler getirilirken hata:', error)
        return []
    }

    return dates
}

// Seçilen turun ve tarihin detaylı bilgilerini almak için (BookingForm'a paslamak üzere)
export async function getQuickBookingDetails(tourId: string, tourDateId: string) {
    const supabase = await createClient()

    // Tur bilgileri
    const { data: tour, error: tourError } = await supabase
        .from('tours')
        .select('*')
        .eq('id', tourId)
        .single()

    if (tourError || !tour) return null

    // Tarih bilgileri
    const { data: tourDate, error: dateError } = await supabase
        .from('tour_dates')
        .select('*')
        .eq('id', tourDateId)
        .single()

    if (dateError || !tourDate) return null

    // Fiyat grupları
    const { data: priceGroups, error: pgError } = await supabase
        .from('tour_price_groups')
        .select('*')
        .eq('tour_id', tourId)
        .eq('status', 'active')
        .order('sort_order', { ascending: true })

    if (pgError) return null

    return {
        tour,
        tourDate,
        priceGroups
    }
}
