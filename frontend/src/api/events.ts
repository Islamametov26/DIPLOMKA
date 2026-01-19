import { request } from './client'
import type { Event } from '../types/event'

type EventsResponse = {
  items: Event[]
}

export async function listEvents(signal?: AbortSignal): Promise<Event[]> {
  const data = await request<EventsResponse>('/api/events', { signal })
  return data.items
}

type EventPayload = {
  title: string
  description: string
  startAt: string
  endAt: string
  venueId: string
  published: boolean
}

export async function createEvent(payload: EventPayload) {
  return request<Event>('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function updateEvent(id: string, payload: EventPayload) {
  return request<Event>(`/api/events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function deleteEvent(id: string) {
  return request<void>(`/api/events/${id}`, {
    method: 'DELETE',
  })
}

type SeatsResponse = {
  items: string[]
}

export async function listOccupiedSeats(eventId: string) {
  const data = await request<SeatsResponse>(`/api/events/${eventId}/occupied-seats`)
  return data.items
}
