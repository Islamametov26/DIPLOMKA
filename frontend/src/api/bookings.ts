import { request } from './client'
import type { Booking } from '../types/booking'

type BookingsResponse = {
  items: Booking[]
}

type CreateBookingResponse = Booking

export async function listBookings() {
  const data = await request<BookingsResponse>('/api/bookings')
  return data.items
}

export async function createBooking(eventId: string, seats: string[]) {
  return request<CreateBookingResponse>('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ eventId, seats }),
  })
}

export async function cancelBooking(id: string) {
  return request<void>(`/api/bookings/${id}`, {
    method: 'DELETE',
  })
}
