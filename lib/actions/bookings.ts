'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addReservationIncome } from './operations'

// --- Types ---

export type Passenger = {
    id?: string
    booking_id?: string
    full_name: string
    tc_no?: string
    birth_date?: string
    passenger_type: 'adult' | 'child' | 'baby'
    phone?: string
    pickup_point?: string
    notes?: string
}

export type Booking = {
    id: string
    tour_date_id: string
    client_id: string
    pax: {
        adult: number
        child: number
        baby: number
    }
    pricing_snapshot: {
        adult_price: number
        child_price: number
        baby_price: number
        currency: string
    }
    total_amount: number
    amount_paid: number
    notes?: string
    booking_status: 'confirmed' | 'pending' | 'cancelled'
    created_at: string
    // Joined data
    client?: {
        id: string
        name: string
        phone?: string
        email?: string
    }
    passengers?: Passenger[]
    tour_date?: {
        start_date: string
        end_date: string
        tour?: {
            title: string
        }
    }
}

// --- Get Bookings ---

export async function getBookingsByTourDate(tourDateId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            client:clients(id, name, phone, email),
            passengers:booking_passengers(*)
        `)
        .eq('tour_date_id', tourDateId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Rezervasyonlar getirilirken hata:', error)
        return []
    }

    return data as Booking[]
}

export async function getBookingById(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            client:clients(id, name, phone, email),
            passengers:booking_passengers(*),
            tour_date:tour_dates(
                start_date, 
                end_date,
                tour:tours(title)
            )
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Rezervasyon getirilirken hata:', error)
        return null
    }

    return data as Booking
}

// --- Create Client (inline) ---

export async function createClient_inline(data: {
    full_name: string
    phone?: string
    email?: string
}) {
    const supabase = await createClient()

    const { data: client, error } = await supabase
        .from('clients')
        .insert({
            name: data.full_name, // clients tablosunda kolon adı 'name'
            phone: data.phone,
            email: data.email,
            source: 'reservation'
        })
        .select()
        .single()

    if (error) {
        console.error('Müşteri oluşturulurken hata:', error)
        throw new Error(`Müşteri oluşturulamadı: ${error.message}`)
    }

    return client
}

// --- Create Booking with Passengers ---

export async function createBookingWithPassengers(data: {
    tour_date_id: string
    client_id?: string
    new_client?: {
        full_name: string
        phone?: string
        email?: string
    }
    passengers: Passenger[]
    pricing: {
        adult_price: number
        child_price: number
        baby_price: number
        currency: string
    }
    paid_amount: number
    notes?: string
}) {
    const supabase = await createClient()

    // 0. Get tour_id from tour_date
    const { data: tourDate, error: tourDateError } = await supabase
        .from('tour_dates')
        .select('tour_id')
        .eq('id', data.tour_date_id)
        .single()

    if (tourDateError || !tourDate) {
        throw new Error('Tur tarihi bulunamadı')
    }

    // 1. Create client if new
    let clientId = data.client_id
    if (!clientId && data.new_client) {
        const newClient = await createClient_inline(data.new_client)
        clientId = newClient.id
    }

    if (!clientId) {
        throw new Error('Müşteri bilgisi gerekli')
    }

    // 2. Calculate pax and total
    const pax = {
        adult: data.passengers.filter(p => p.passenger_type === 'adult').length,
        child: data.passengers.filter(p => p.passenger_type === 'child').length,
        baby: data.passengers.filter(p => p.passenger_type === 'baby').length
    }

    const totalAmount =
        (pax.adult * data.pricing.adult_price) +
        (pax.child * data.pricing.child_price) +
        (pax.baby * data.pricing.baby_price)

    // 3. Create booking
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
            tour_id: tourDate.tour_id,
            tour_date_id: data.tour_date_id,
            client_id: clientId,
            pax,
            pricing_snapshot: {
                adult_price: data.pricing.adult_price,
                child_price: data.pricing.child_price,
                baby_price: data.pricing.baby_price,
                currency: data.pricing.currency
            },
            total_amount: totalAmount,
            amount_paid: data.paid_amount,
            notes: data.notes,
            booking_status: data.paid_amount >= totalAmount ? 'confirmed' : 'pending'
        })
        .select()
        .single()

    if (bookingError) {
        console.error('Rezervasyon oluşturulurken hata:', bookingError)
        throw new Error(`Rezervasyon oluşturulamadı: ${bookingError.message}`)
    }

    // 4. Insert passengers
    const passengersToInsert = data.passengers.map(p => ({
        booking_id: booking.id,
        full_name: p.full_name,
        tc_no: p.tc_no,
        birth_date: p.birth_date,
        passenger_type: p.passenger_type,
        phone: p.phone,
        pickup_point: p.pickup_point,
        notes: p.notes
    }))

    const { error: passengersError } = await supabase
        .from('booking_passengers')
        .insert(passengersToInsert)

    if (passengersError) {
        console.error('Yolcular eklenirken hata:', passengersError)
        // Rollback: delete booking
        await supabase.from('bookings').delete().eq('id', booking.id)
        throw new Error(`Yolcular eklenemedi: ${passengersError.message}`)
    }

    // 5. Update tour date capacity (TEMPORARILY DISABLED for debugging)
    const totalPax = pax.adult + pax.child + pax.baby
    console.log('Booking created, total pax:', totalPax)
    // Capacity update temporarily disabled - will enable after fixing trigger/policy
    /* await supabase
        .from('tour_dates')
        .update({
            capacity_available: (await supabase
                .from('tour_dates')
                .select('capacity_available')
                .eq('id', data.tour_date_id)
                .single()
            ).data?.capacity_available - totalPax
        })
        .eq('id', data.tour_date_id) */

    // 6. Add income if paid
    if (data.paid_amount > 0) {
        await addReservationIncome(data.tour_date_id, booking.id, data.paid_amount)
    }

    revalidatePath(`/dashboard/tours`)
    revalidatePath(`/dashboard/bookings`)

    return booking
}

// --- Cancel Booking ---

export async function cancelBooking(bookingId: string) {
    const supabase = await createClient()

    const { data: booking } = await supabase
        .from('bookings')
        .select('tour_date_id, pax')
        .eq('id', bookingId)
        .single()

    if (!booking) return

    await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', bookingId)

    const totalPax = booking.pax.adult + booking.pax.child + booking.pax.baby

    // Restore capacity with direct query
    const { data: tourDate } = await supabase
        .from('tour_dates')
        .select('capacity_available')
        .eq('id', booking.tour_date_id)
        .single()

    if (tourDate) {
        await supabase
            .from('tour_dates')
            .update({ capacity_available: tourDate.capacity_available + totalPax })
            .eq('id', booking.tour_date_id)
    }

    revalidatePath(`/dashboard/bookings`)
}

// --- Get Booking Stats ---

export async function getBookingStats(tourDateId: string) {
    const bookings = await getBookingsByTourDate(tourDateId)

    const active = bookings.filter(b => b.booking_status !== 'cancelled')

    const totalRevenue = active.reduce((sum, b) => sum + b.total_amount, 0)
    const collectedRevenue = active.reduce((sum, b) => sum + b.amount_paid, 0)
    const totalPax = active.reduce((sum, b) => sum + b.pax.adult + b.pax.child + b.pax.baby, 0)

    return {
        totalBookings: active.length,
        confirmedCount: active.filter(b => b.booking_status === 'confirmed').length,
        pendingCount: active.filter(b => b.booking_status === 'pending').length,
        totalRevenue,
        collectedRevenue,
        pendingRevenue: totalRevenue - collectedRevenue,
        totalPax
    }
}
