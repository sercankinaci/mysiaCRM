'use server'

import { createClient } from '@/lib/supabase/server'
import { normalizePhoneNumber } from '@/lib/utils'

export type Client = {
    id: string
    name: string
    phone: string | null
    email: string | null
    created_at: string
}

export async function searchClients(query: string) {
    const supabase = await createClient()
    const searchTerm = query.trim()

    // Telefon numarası temizle
    const phoneQuery = normalizePhoneNumber(searchTerm)

    let queryBuilder = supabase
        .from('clients')
        .select('*')
        .limit(10)

    if (phoneQuery) {
        // Hem normal arama hem de normalize edilmiş telefon araması
        queryBuilder = queryBuilder.or(`name.ilike.%${searchTerm}%,phone.eq.${phoneQuery},phone.ilike.%${searchTerm}%`)
    } else {
        queryBuilder = queryBuilder.ilike('name', `%${searchTerm}%`)
    }

    const { data, error } = await queryBuilder

    if (error) {
        console.error('Müşteri aramada hata:', error)
        return []
    }

    return data as Client[]
}

export async function getClientByPhone(phone: string) {
    const supabase = await createClient()
    const normalizedPhone = normalizePhoneNumber(phone)

    if (!normalizedPhone) return null

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('phone', normalizedPhone)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows returned
        console.error('Telefon ile müşteri getirmede hata:', error)
    }

    return data as Client | null
}

export async function upsertClient(data: {
    full_name: string
    phone?: string
    email?: string
}) {
    const supabase = await createClient()

    // Telefonu normalize et
    const normalizedPhone = data.phone ? normalizePhoneNumber(data.phone) : null

    if (!normalizedPhone) {
        throw new Error('Geçerli bir telefon numarası gerekli')
    }

    // Önce var olanı kontrol et
    const existing = await getClientByPhone(normalizedPhone)

    if (existing) {
        // Güncelle (isim veya email değişmiş olabilir)
        const { data: updated, error } = await supabase
            .from('clients')
            .update({
                name: data.full_name,
                email: data.email || existing.email, // Email boşsa eskisini koru
                // Phone zaten aynı, güncellemeye gerek yok
            })
            .eq('id', existing.id)
            .select()
            .single()

        if (error) throw new Error(`Müşteri güncellenemedi: ${error.message}`)
        return updated as Client
    }

    // Yeni oluştur
    const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
            name: data.full_name,
            phone: normalizedPhone,
            email: data.email,
            source: 'reservation'
        })
        .select()
        .single()

    if (error) {
        // Eş zamanlı ekleme durumunda unique constraint hatası alabiliriz
        if (error.code === '23505') { // unique_violation
            return await getClientByPhone(normalizedPhone) as Client
        }
        throw new Error(`Müşteri oluşturulamadı: ${error.message}`)
    }

    return newClient as Client
}
