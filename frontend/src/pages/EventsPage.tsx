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

type MonthOption = {
  key: string
  year: number
  month: number
  label: string
}

function toLocalParts(value: string) {
  const date = new Date(value)
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  }
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function EventsPage({ onRequireAuth }: Props) {
  const [state, setState] = useState<EventsState>(emptyState)
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<number>(1)
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

  const monthOptions = useMemo<MonthOption[]>(() => {
    const unique = new Map<string, MonthOption>()
    for (const event of safeItems) {
      const parts = toLocalParts(event.startAt)
      const key = `${parts.year}-${String(parts.month).padStart(2, '0')}`
      if (!unique.has(key)) {
        unique.set(key, {
          key,
          year: parts.year,
          month: parts.month,
          label: monthLabel(parts.year, parts.month),
        })
      }
    }
    return [...unique.values()].sort((a, b) => a.key.localeCompare(b.key))
  }, [safeItems])

  useEffect(() => {
    if (monthOptions.length === 0) {
      setSelectedMonthKey('')
      return
    }

    if (!selectedMonthKey || !monthOptions.some((item) => item.key === selectedMonthKey)) {
      const fallback = monthOptions[0]
      setSelectedMonthKey(fallback.key)

      const firstDay = safeItems
        .map((event) => toLocalParts(event.startAt))
        .find((parts) => parts.year === fallback.year && parts.month === fallback.month)?.day

      setSelectedDay(firstDay || 1)
    }
  }, [monthOptions, safeItems, selectedMonthKey])

  const selectedMonth = useMemo(
    () => monthOptions.find((item) => item.key === selectedMonthKey) || null,
    [monthOptions, selectedMonthKey],
  )

  const days = useMemo(() => {
    if (!selectedMonth) {
      return [] as number[]
    }
    const total = daysInMonth(selectedMonth.year, selectedMonth.month)
    return Array.from({ length: total }, (_, i) => i + 1)
  }, [selectedMonth])

  const filteredItems = useMemo(() => {
    if (!selectedMonth) {
      return [] as Event[]
    }

    const normalizedQuery = query.trim().toLowerCase()

    return safeItems.filter((event) => {
      const parts = toLocalParts(event.startAt)
      if (parts.year !== selectedMonth.year || parts.month !== selectedMonth.month || parts.day !== selectedDay) {
        return false
      }
      if (selectedCategoryId !== 'all' && event.categoryId !== selectedCategoryId) {
        return false
      }
      if (!normalizedQuery) {
        return true
      }
      return `${event.title} ${event.description}`.toLowerCase().includes(normalizedQuery)
    })
  }, [query, safeItems, selectedCategoryId, selectedMonth, selectedDay])

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

        {monthOptions.length > 0 && (
          <>
            <div className="events__months">
              {monthOptions.map((month) => (
                <button
                  className={`events__month${selectedMonthKey === month.key ? ' events__month--active' : ''}`}
                  key={month.key}
                  type="button"
                  onClick={() => {
                    setSelectedMonthKey(month.key)
                    const firstEventDay = safeItems
                      .map((event) => toLocalParts(event.startAt))
                      .find((parts) => parts.year === month.year && parts.month === month.month)?.day
                    setSelectedDay(firstEventDay || 1)
                  }}
                >
                  {month.label}
                </button>
              ))}
            </div>

            <div className="events__days">
              {days.map((day) => (
                <button
                  className={`events__day${selectedDay === day ? ' events__day--active' : ''}`}
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </>
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

        <div className="events__panel-title">События на выбранную дату</div>
        {(state.status === 'idle' || state.status === 'loading') && <div className="events__status">Загружаем афишу...</div>}
        {state.status === 'error' && <div className="events__status events__status--error">{state.error}</div>}
        {state.status === 'success' && filteredItems.length === 0 && (
          <div className="events__status">Событий на эту дату нет.</div>
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
