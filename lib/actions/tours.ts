'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Tur Tipi Tanımları (Veritabanı şemasına uygun)
export type Tour = {
    id: string
    title: string
    start_date: string
    end_date: string
    capacity: number
    price: number
    status: 'draft' | 'active' | 'cancelled' | 'completed' | 'postponed'
    total_income: number
    total_expense: number
    net_profit: number
    cancellation_reason?: string | null
    created_at: string
}

export type CreateTourData = {
    title: string
    start_date: string
    end_date: string
    capacity: number
    price: number
    status: 'draft' | 'active'
}

// Tüm turları getir
export async function getTours(query?: string, status?: string) {
    const supabase = await createClient()

    // Kullanıcı kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        console.error('Kullanıcı doğrulanamadı:', authError)
        return [] // Giriş yapmamış kullanıcı için boş array döndür
    }

    // Kullanıcının profil kaydı var mı kontrol et
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        console.error('Profil bulunamadı:', profileError, 'User ID:', user.id)
        throw new Error('Kullanıcı profili bulunamadı. Lütfen yöneticinize başvurun.')
    }

    console.log('Kullanıcı bilgisi:', { id: user.id, role: profile.role })

    let queryBuilder = supabase
        .from('tours')
        .select('*')
        .order('start_date', { ascending: true })

    if (query) {
        queryBuilder = queryBuilder.ilike('title', `%${query}%`)
    }

    if (status && status !== 'all') {
        queryBuilder = queryBuilder.eq('status', status)
    }

    const { data, error } = await queryBuilder

    if (error) {
        console.error('Turlar getirilirken hata:', error)
        throw new Error('Turlar yüklenemedi: ' + (error.message || 'Bilinmeyen hata'))
    }

    return data as Tour[]
}

// Tek bir turu getir
export async function getTourById(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Tur detayı getirilirken hata:', error)
        return null
    }

    return data as Tour
}

// Yeni tur oluştur
export async function createTour(formData: FormData) {
    const supabase = await createClient()

    const rawData: CreateTourData = {
        title: formData.get('title') as string,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        capacity: Number(formData.get('capacity')),
        price: Number(formData.get('price')),
        status: formData.get('status') as 'draft' | 'active' || 'draft',
    }

    // Validasyon (Basit)
    if (!rawData.title || !rawData.start_date || !rawData.end_date || rawData.capacity <= 0 || rawData.price < 0) {
        return { error: 'Lütfen tüm alanları geçerli şekilde doldurun.' }
    }

    const { error } = await supabase
        .from('tours')
        .insert(rawData)

    if (error) {
        console.error('Tur oluşturulurken hata:', error)
        return { error: 'Tur oluşturulurken bir hata oluştu.' }
    }

    revalidatePath('/dashboard/tours')
    redirect('/dashboard/tours')
}

// Turu güncelle
export async function updateTour(id: string, formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        title: formData.get('title') as string,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        capacity: Number(formData.get('capacity')),
        price: Number(formData.get('price')),
        status: formData.get('status') as string,
        cancellation_reason: formData.get('cancellation_reason') as string || null,
    }

    const { error } = await supabase
        .from('tours')
        .update(rawData)
        .eq('id', id)

    if (error) {
        console.error('Tur güncellenirken hata:', error)
        return { error: 'Tur güncellenirken bir hata oluştu.' }
    }

    revalidatePath('/dashboard/tours')
    revalidatePath(`/dashboard/tours/${id}`)
    return { success: true }
}

// Turu sil (Sadece admin)
export async function deleteTour(id: string) {
    const supabase = await createClient()

    // Önce yetki kontrolü yapılmalı (Middleware veya RLS hallediyor ama burada da check edilebilir)

    const { error } = await supabase
        .from('tours')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Tur silinirken hata:', error)
        return { error: 'Tur silinemedi. İlişkili kayıtlar olabilir.' }
    }

    revalidatePath('/dashboard/tours')
    return { success: true }
}
