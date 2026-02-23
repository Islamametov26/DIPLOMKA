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

type CalendarDay = {
  key: string
  year: number
  month: number
  day: number
  weekLabel: string
  monthLabel: string
  monthShort: string
  hasEvents: boolean
  isMonthStart: boolean
}

function toDateKey(value: Date | string) {
  const date = new Date(value)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseKey(key: string) {
  const [y, m, d] = key.split('-').map((value) => Number(value))
  return new Date(y, m - 1, d)
}

function toMonthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })
}

function toMonthShort(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('ru-RU', {
    month: 'short',
  })
}

function EventsPage({ onRequireAuth }: Props) {
  const [state, setState] = useState<EventsState>(emptyState)
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedDateKey, setSelectedDateKey] = useState<string>('')
  const [dayWindowStart, setDayWindowStart] = useState<number>(0)
  const [visibleDayCount, setVisibleDayCount] = useState<number>(() => {
    if (typeof window === 'undefined') {
      return 9
    }
    if (window.innerWidth < 720) {
      return 5
    }
    if (window.innerWidth < 1024) {
      return 7
    }
    return 9
  })
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

  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth < 720) {
        setVisibleDayCount(5)
        return
      }
      if (window.innerWidth < 1024) {
        setVisibleDayCount(7)
        return
      }
      setVisibleDayCount(9)
    }

    updateVisibleCount()
    window.addEventListener('resize', updateVisibleCount)
    return () => window.removeEventListener('resize', updateVisibleCount)
  }, [])

  const eventDateSet = useMemo(() => {
    const set = new Set<string>()
    for (const event of safeItems) {
      set.add(toDateKey(event.startAt))
    }
    return set
  }, [safeItems])

  const calendarDays = useMemo<CalendarDay[]>(() => {
    if (safeItems.length === 0) {
      return []
    }

    const sortedKeys = [...eventDateSet].sort((a, b) => a.localeCompare(b))
    const first = parseKey(sortedKeys[0])
    const last = parseKey(sortedKeys[sortedKeys.length - 1])

    const days: CalendarDay[] = []
    let cursor = new Date(first.getFullYear(), first.getMonth(), first.getDate())
    const end = new Date(last.getFullYear(), last.getMonth(), last.getDate())

    while (cursor <= end) {
      const year = cursor.getFullYear()
      const month = cursor.getMonth() + 1
      const day = cursor.getDate()
      const key = toDateKey(cursor)
      days.push({
        key,
        year,
        month,
        day,
        weekLabel: cursor.toLocaleDateString('ru-RU', { weekday: 'short' }),
        monthLabel: toMonthLabel(year, month),
        monthShort: toMonthShort(year, month),
        hasEvents: eventDateSet.has(key),
        isMonthStart: day === 1,
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    return days
  }, [eventDateSet, safeItems.length])

  const visibleDays = useMemo(
    () => calendarDays.slice(dayWindowStart, dayWindowStart + visibleDayCount),
    [calendarDays, dayWindowStart, visibleDayCount],
  )

  const canSlideDaysLeft = dayWindowStart > 0
  const canSlideDaysRight = dayWindowStart + visibleDayCount < calendarDays.length

  useEffect(() => {
    if (calendarDays.length === 0) {
      setSelectedDateKey('')
      setDayWindowStart(0)
      return
    }

    if (!selectedDateKey || !calendarDays.some((day) => day.key === selectedDateKey)) {
      const firstEventDay = calendarDays.find((day) => day.hasEvents)
      setSelectedDateKey(firstEventDay?.key || calendarDays[0].key)
      setDayWindowStart(0)
    }
  }, [calendarDays, selectedDateKey])

  useEffect(() => {
    if (!selectedDateKey || calendarDays.length === 0) {
      return
    }

    const selectedIndex = calendarDays.findIndex((day) => day.key === selectedDateKey)
    if (selectedIndex === -1) {
      return
    }

    if (selectedIndex < dayWindowStart) {
      setDayWindowStart(selectedIndex)
      return
    }

    if (selectedIndex >= dayWindowStart + visibleDayCount) {
      setDayWindowStart(Math.max(0, selectedIndex - visibleDayCount + 1))
      return
    }

    const maxStart = Math.max(0, calendarDays.length - visibleDayCount)
    if (dayWindowStart > maxStart) {
      setDayWindowStart(maxStart)
    }
  }, [calendarDays, dayWindowStart, selectedDateKey, visibleDayCount])

  const currentMonthCaption = useMemo(() => {
    if (visibleDays.length === 0) {
      return ''
    }
    const first = visibleDays[0]
    const last = visibleDays[visibleDays.length - 1]
    if (first.monthLabel === last.monthLabel) {
      return first.monthLabel
    }
    return `${first.monthLabel} - ${last.monthLabel}`
  }, [visibleDays])

  const filteredItems = useMemo(() => {
    if (!selectedDateKey) {
      return [] as Event[]
    }

    const normalizedQuery = query.trim().toLowerCase()

    return safeItems.filter((event) => {
      if (toDateKey(event.startAt) !== selectedDateKey) {
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
  }, [query, safeItems, selectedCategoryId, selectedDateKey])

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

        {calendarDays.length > 0 && (
          <div className="events__datebar">
            <div className="events__month-caption">{currentMonthCaption}</div>
            <div className="events__days">
              <button
                className="events__day-arrow"
                type="button"
                onClick={() => setDayWindowStart((prev) => Math.max(0, prev - visibleDayCount))}
                disabled={!canSlideDaysLeft}
                aria-label="Предыдущие даты"
              >
                ‹
              </button>
              {visibleDays.map((day) => (
                <button
                  className={`events__day${selectedDateKey === day.key ? ' events__day--active' : ''}${!day.hasEvents ? ' events__day--empty' : ''}`}
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDateKey(day.key)}
                >
                  {day.isMonthStart && <span className="events__day-month">{day.monthShort}</span>}
                  <span className="events__day-week">{day.weekLabel}</span>
                  <span className="events__day-number">{day.day}</span>
                </button>
              ))}
              <button
                className="events__day-arrow"
                type="button"
                onClick={() =>
                  setDayWindowStart((prev) =>
                    Math.min(Math.max(0, calendarDays.length - visibleDayCount), prev + visibleDayCount),
                  )
                }
                disabled={!canSlideDaysRight}
                aria-label="Следующие даты"
              >
                ›
              </button>
            </div>
          </div>
        )}

        <div className="events__panel-title">События на выбранную дату</div>
        {(state.status === 'idle' || state.status === 'loading') && <div className="events__status">Загружаем афишу...</div>}
        {state.status === 'error' && <div className="events__status events__status--error">{state.error}</div>}
        {state.status === 'success' && filteredItems.length === 0 && <div className="events__status">Событий на эту дату нет.</div>}

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
