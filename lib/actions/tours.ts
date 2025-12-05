'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Tur Tipi Tanımları (Yeni Veritabanı şemasına uygun)
export type Tour = {
    id: string
    title: string
    slug: string
    description?: string
    tour_type: 'daily' | 'package'
    category: 'domestic' | 'abroad'
    pricing_model: 'per_person' | 'room_based'
    duration_days: number
    duration_nights: number
    child_age_min: number
    child_age_max: number
    baby_age_max: number
    status: 'draft' | 'active' | 'passive'
    featured_image?: string
    gallery?: string[]
    created_at: string
    updated_at?: string
}

export type CreateTourData = {
    title: string
    tour_type: 'daily' | 'package'
    category: 'domestic' | 'abroad'
    pricing_model: 'per_person' | 'room_based'
    slug: string
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

    let queryBuilder = supabase
        .from('tours')
        .select('*')
        .order('created_at', { ascending: false })

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

    const title = formData.get('title') as string
    const tour_type = formData.get('tour_type') as string
    const category = formData.get('category') as string || 'domestic'
    const pricing_model = formData.get('pricing_model') as string || 'per_person'
    const description = formData.get('description') as string || null

    // Paket tur için süre bilgileri
    const duration_days = parseInt(formData.get('duration_days') as string) || 1
    const duration_nights = parseInt(formData.get('duration_nights') as string) || 0

    // Yaş aralıkları
    const child_age_min = parseInt(formData.get('child_age_min') as string) || 3
    const child_age_max = parseInt(formData.get('child_age_max') as string) || 11
    const baby_age_max = parseInt(formData.get('baby_age_max') as string) || 2

    // Validasyon
    if (!title || !tour_type) {
        return { error: 'Lütfen tur adı ve tipini belirtin.' }
    }

    // Slug oluştur
    const slug = title
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4)

    const rawData = {
        title,
        slug,
        description,
        tour_type,
        category,
        pricing_model,
        duration_days,
        duration_nights,
        child_age_min,
        child_age_max,
        baby_age_max,
        status: 'draft'
    }

    const { data, error } = await supabase
        .from('tours')
        .insert(rawData)
        .select('id')
        .single()

    if (error) {
        console.error('Tur oluşturulurken hata:', error)
        return { error: 'Tur oluşturulurken bir hata oluştu: ' + error.message }
    }

    revalidatePath('/dashboard/tours')
    redirect(`/dashboard/tours/${data.id}`)
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

// Tur durumunu güncelle
export async function updateTourStatus(id: string, status: string) {
    const supabase = await createClient()

    // Geçerli durum kontrolü
    if (!['draft', 'active', 'passive'].includes(status)) {
        return { error: 'Geçersiz durum değeri.' }
    }

    const { error } = await supabase
        .from('tours')
        .update({ status })
        .eq('id', id)

    if (error) {
        console.error('Tur durumu güncellenirken hata:', error)
        return { error: 'Tur durumu güncellenemedi: ' + error.message }
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
