import { useEffect, useMemo, useState } from 'react'
import { listCategories } from '../api/categories'
import { listEvents } from '../api/events'
import { listVenues } from '../api/venues'
import EventCard from '../components/EventCard'
import EventDetailsModal from '../components/EventDetailsModal'
import type { Category } from '../types/category'
import type { Event } from '../types/event'
import type { Venue } from '../types/venue'

const emptyState = {
  status: 'loading' as const,
  items: [] as Event[],
  categories: [] as Category[],
  venues: [] as Venue[],
  error: '' as string | null,
}

type EventsState = typeof emptyState

function EventsPage() {
  const [state, setState] = useState<EventsState>(emptyState)
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [query, setQuery] = useState('')
  const safeItems = Array.isArray(state.items) ? state.items : []
  const safeCategories = Array.isArray(state.categories) ? state.categories : []
  const safeVenues = Array.isArray(state.venues) ? state.venues : []

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setState((prev) => ({ ...prev, status: 'loading', error: null }))
      try {
        const [items, categories, venues] = await Promise.all([
          listEvents(controller.signal),
          listCategories(controller.signal),
          listVenues(),
        ])
        setState({ status: 'success', items, categories, venues, error: null })
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        const message = error instanceof Error ? error.message : 'Не удалось загрузить афишу.'
        setState({ status: 'error', items: [], categories: [], venues: [], error: message })
      }
    }

    load()

    return () => controller.abort()
  }, [])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (selectedCategoryId === 'all') {
      if (!normalizedQuery) {
        return safeItems
      }
      return safeItems.filter((event) =>
        `${event.title} ${event.description}`.toLowerCase().includes(normalizedQuery),
      )
    }
    return safeItems.filter((event) => {
      if (event.categoryId !== selectedCategoryId) {
        return false
      }
      if (!normalizedQuery) {
        return true
      }
      return `${event.title} ${event.description}`.toLowerCase().includes(normalizedQuery)
    })
  }, [query, safeItems, selectedCategoryId])

  const venueById = useMemo(
    () =>
      safeVenues.reduce<Record<string, Venue>>((acc, venue) => {
        acc[venue.id] = venue
        return acc
      }, {}),
    [safeVenues],
  )
  const categoryById = useMemo(
    () =>
      safeCategories.reduce<Record<string, string>>((acc, category) => {
        acc[category.id] = category.name
        return acc
      }, {}),
    [safeCategories],
  )

  return (
    <section className="events">
      <div className="events__hero">
        <p className="events__eyebrow">Городской портал</p>
        <h1 className="events__title">Афиша мероприятий</h1>
        <p className="events__subtitle">
          События города на ближайшие недели: выставки, лекции, концерты и спектакли. Выбирайте
          формат и планируйте вечер заранее.
        </p>
      </div>

      <div className="events__panel">
        <div className="events__search">
          <input
            className="events__search-input"
            type="search"
            placeholder="Поиск по названию или описанию..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {safeCategories.length > 0 && (
          <div className="events__filters">
            <button
              className={`events__filter${selectedCategoryId === 'all' ? ' events__filter--active' : ''}`}
              type="button"
              onClick={() => setSelectedCategoryId('all')}
            >
              Все
            </button>
            {safeCategories.map((category) => (
              <button
                className={`events__filter${selectedCategoryId === category.id ? ' events__filter--active' : ''}`}
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryId(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
        <div className="events__panel-title">Ближайшие события</div>
        {(state.status === 'idle' || state.status === 'loading') && (
          <div className="events__status">Загружаем афишу...</div>
        )}
        {state.status === 'error' && <div className="events__status events__status--error">{state.error}</div>}
        {state.status === 'success' && filteredItems.length === 0 && (
          <div className="events__status">Событий в выбранной категории пока нет.</div>
        )}
        <div className="events__grid">
          {filteredItems.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              venueName={venueById[event.venueId]?.name}
              onDetails={(selected) => setActiveEvent(selected)}
            />
          ))}
        </div>
      </div>

      {activeEvent && (
        <EventDetailsModal
          event={activeEvent}
          venueName={venueById[activeEvent.venueId]?.name || 'Неизвестно'}
          venueAddress={venueById[activeEvent.venueId]?.address || 'Адрес не указан'}
          categoryName={categoryById[activeEvent.categoryId] || 'Без категории'}
          onClose={() => setActiveEvent(null)}
        />
      )}
    </section>
  )
}

export default EventsPage
