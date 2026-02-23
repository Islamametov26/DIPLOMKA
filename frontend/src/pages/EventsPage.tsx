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

type Props = {
  onRequireAuth: () => void
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    weekday: 'short',
  })
}

function toDateKey(value: string) {
  const date = new Date(value)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function EventsPage({ onRequireAuth }: Props) {
  const [state, setState] = useState<EventsState>(emptyState)
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('all')
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

  const availableDates = useMemo(() => {
    const unique = new Map<string, string>()
    for (const event of safeItems) {
      const key = toDateKey(event.startAt)
      if (!unique.has(key)) {
        unique.set(key, event.startAt)
      }
    }
    return [...unique.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, raw]) => ({ key, label: formatDateLabel(raw) }))
  }, [safeItems])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return safeItems.filter((event) => {
      if (selectedCategoryId !== 'all' && event.categoryId !== selectedCategoryId) {
        return false
      }
      if (selectedDate !== 'all' && toDateKey(event.startAt) !== selectedDate) {
        return false
      }
      if (!normalizedQuery) {
        return true
      }
      return `${event.title} ${event.description}`.toLowerCase().includes(normalizedQuery)
    })
  }, [query, safeItems, selectedCategoryId, selectedDate])

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
          События города на ближайшие недели: выставки, лекции, концерты и спектакли. Выбирайте формат и планируйте
          вечер заранее.
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

        {availableDates.length > 0 && (
          <div className="events__dates">
            <button
              className={`events__date${selectedDate === 'all' ? ' events__date--active' : ''}`}
              type="button"
              onClick={() => setSelectedDate('all')}
            >
              Все даты
            </button>
            {availableDates.map((date) => (
              <button
                className={`events__date${selectedDate === date.key ? ' events__date--active' : ''}`}
                key={date.key}
                type="button"
                onClick={() => setSelectedDate(date.key)}
              >
                {date.label}
              </button>
            ))}
          </div>
        )}

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
        {(state.status === 'idle' || state.status === 'loading') && <div className="events__status">Загружаем афишу...</div>}
        {state.status === 'error' && <div className="events__status events__status--error">{state.error}</div>}
        {state.status === 'success' && filteredItems.length === 0 && (
          <div className="events__status">На выбранную дату и категорию событий пока нет.</div>
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
          onRequireAuth={onRequireAuth}
        />
      )}
    </section>
  )
}

export default EventsPage
