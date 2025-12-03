export type UserRole = 'admin' | 'personel' | 'rehber' | 'müşteri'

export interface Profile {
    id: string
    full_name: string
    phone: string | null
    role: UserRole
    created_at: string
}

export interface Client {
    id: string
    name: string
    phone: string | null
    email: string | null
    notes: string | null
    created_at: string
}

export type TourStatus = 'draft' | 'active' | 'cancelled' | 'completed' | 'postponed'

export interface Tour {
    id: string
    title: string
    start_date: string
    end_date: string
    capacity: number
    price: number
    status: TourStatus
    total_income: number
    total_expense: number
    net_profit: number
    cancellation_reason: string | null
    created_at: string
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'transferred'
export type PaymentStatus = 'paid' | 'pending' | 'refunded'

export interface Booking {
    id: string
    tour_id: string
    client_id: string
    seat_number: number
    amount_paid: number
    booking_status: BookingStatus
    payment_status: PaymentStatus
    new_tour_id: string | null
    created_at: string
}

export type TransferType = 'airport' | 'hotel' | 'private' | 'group'

export interface Transfer {
    id: string
    type: TransferType
    pickup: string
    dropoff: string
    date: string
    time: string
    vehicle_type: string
    passenger_count: number
    price: number
    driver_id: string | null
    vehicle_id: string | null
    related_tour_id: string | null
    status: string
    created_at: string
}

export interface TransferBooking {
    id: string
    transfer_id: string
    client_id: string
    seat_number: number
    amount_paid: number
    payment_status: PaymentStatus
    booking_status: BookingStatus
    created_at: string
}

export interface Expense {
    id: string
    tour_id: string | null
    transfer_id: string | null
    type: string
    supplier: string
    amount: number
    notes: string | null
    created_at: string
}

export type FinanceType = 'income' | 'expense' | 'refund' | 'transferProfit'

export interface Finance {
    id: string
    type: FinanceType
    source_type: string
    source_id: string
    amount: number
    description: string | null
    created_at: string
}

export type RefundMethod = 'manual' | 'credit' | 'bank'

export interface Refund {
    id: string
    booking_id: string
    client_id: string
    amount: number
    method: RefundMethod
    created_at: string
}
