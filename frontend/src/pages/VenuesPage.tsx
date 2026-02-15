import { useEffect, useMemo, useState } from 'react'
import { listEvents } from '../api/events'
import { listVenues } from '../api/venues'
import type { Event } from '../types/event'
import type { Venue } from '../types/venue'

type LoadState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  venues: Venue[]
  events: Event[]
  error: string | null
}

const emptyState: LoadState = {
  status: 'loading',
  venues: [],
  events: [],
  error: null,
}

function VenuesPage() {
  const [state, setState] = useState<LoadState>(emptyState)
  const [selectedVenueId, setSelectedVenueId] = useState<string>('')
  const safeVenues = Array.isArray(state.venues) ? state.venues : []
  const safeEvents = Array.isArray(state.events) ? state.events : []

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setState((prev) => ({ ...prev, status: 'loading', error: null }))
      try {
        const [venues, events] = await Promise.all([
          listVenues(),
          listEvents(controller.signal),
        ])
        setState({ status: 'ready', venues, events, error: null })
        if (venues.length > 0) {
          setSelectedVenueId((prev) => prev || venues[0].id)
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        const message = error instanceof Error ? error.message : 'Не удалось загрузить площадки.'
        setState({ status: 'error', venues: [], events: [], error: message })
      }
    }

    load()

    return () => controller.abort()
  }, [])

  const selectedVenue = useMemo(
    () => safeVenues.find((venue) => venue.id === selectedVenueId) || null,
    [safeVenues, selectedVenueId],
  )

  const venueEvents = useMemo(() => {
    const now = Date.now()
    return safeEvents
      .filter((event) => event.venueId === selectedVenueId)
      .filter((event) => new Date(event.startAt).getTime() >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }, [safeEvents, selectedVenueId])

  return (
    <section className="venues">
      <div className="events__hero">
        <p className="events__eyebrow">Площадки города</p>
        <h1 className="events__title">Места проведения</h1>
        <p className="events__subtitle">
          Выберите площадку и посмотрите, какие события там будут проходить в ближайшее время.
        </p>
      </div>

      <div className="events__panel">
        <div className="events__panel-title">Список площадок</div>
        {(state.status === 'idle' || state.status === 'loading') && (
          <div className="events__status">Загружаем площадки...</div>
        )}
        {state.status === 'error' && <div className="events__status events__status--error">{state.error}</div>}
        {state.status === 'ready' && safeVenues.length === 0 && (
          <div className="events__status">Площадок пока нет.</div>
        )}

        <div className="venues__grid">
          {safeVenues.map((venue) => {
            const isSelected = selectedVenueId === venue.id
            return (
              <article
                className={`venue-card${isSelected ? ' venue-card--selected' : ''}`}
                key={venue.id}
              >
                <div className="venue-card__name">{venue.name}</div>
                <div className="venue-card__address">{venue.address}</div>
                <button
                  className="venue-card__button"
                  type="button"
                  onClick={() => setSelectedVenueId(venue.id)}
                >
                  {isSelected ? 'Выбрано' : 'Показать события'}
                </button>
              </article>
            )
          })}
        </div>
      </div>

      {selectedVenue && (
        <div className="events__panel">
          <div className="events__panel-title">События на площадке: {selectedVenue.name}</div>
          {venueEvents.length === 0 && (
            <div className="events__status">На этой площадке пока нет предстоящих событий.</div>
          )}
          <div className="venue-events">
            {venueEvents.map((event) => (
              <article className="venue-event" key={event.id}>
                <div className="venue-event__title">{event.title}</div>
                <div className="venue-event__meta">{new Date(event.startAt).toLocaleString()}</div>
                <div className="venue-event__description">{event.description}</div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default VenuesPage
