import { request } from './client'
import type { Venue } from '../types/venue'

type VenuesResponse = {
  items: Venue[]
}

type CreateVenuePayload = {
  id?: string
  name: string
  address: string
}

export async function listVenues() {
  const data = await request<VenuesResponse>('/api/venues')
  return data.items
}

export async function createVenue(payload: CreateVenuePayload) {
  return request<Venue>('/api/venues', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function updateVenue(id: string, payload: CreateVenuePayload) {
  return request<Venue>(`/api/venues/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function deleteVenue(id: string) {
  return request<void>(`/api/venues/${id}`, {
    method: 'DELETE',
  })
}
