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

function dayWeekLabel(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).toLocaleDateString('ru-RU', { weekday: 'short' })
}

function EventsPage({ onRequireAuth }: Props) {
  const [state, setState] = useState<EventsState>(emptyState)
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<number>(1)
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

  const visibleDays = useMemo(
    () => days.slice(dayWindowStart, dayWindowStart + visibleDayCount),
    [dayWindowStart, days],
  )
  const canSlideDaysLeft = dayWindowStart > 0
  const canSlideDaysRight = dayWindowStart + visibleDayCount < days.length

  const monthEventDays = useMemo(() => {
    if (!selectedMonth) {
      return new Set<number>()
    }
    const set = new Set<number>()
    for (const event of safeItems) {
      const parts = toLocalParts(event.startAt)
      if (parts.year === selectedMonth.year && parts.month === selectedMonth.month) {
        set.add(parts.day)
      }
    }
    return set
  }, [safeItems, selectedMonth])

  useEffect(() => {
    if (days.length === 0) {
      setDayWindowStart(0)
      return
    }
    const selectedIndex = Math.max(0, days.indexOf(selectedDay))
    if (selectedIndex < dayWindowStart) {
      setDayWindowStart(selectedIndex)
      return
    }
    if (selectedIndex >= dayWindowStart + visibleDayCount) {
      setDayWindowStart(Math.max(0, selectedIndex - visibleDayCount + 1))
      return
    }
    const maxStart = Math.max(0, days.length - visibleDayCount)
    if (dayWindowStart > maxStart) {
      setDayWindowStart(maxStart)
    }
  }, [dayWindowStart, days, selectedDay, visibleDayCount])

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

        {monthOptions.length > 0 && (
          <div className="events__datebar">
            <div className="events__month-select">
              <span>Месяц:</span>
              <select
                value={selectedMonthKey}
                onChange={(event) => {
                  const nextKey = event.target.value
                  setSelectedMonthKey(nextKey)
                  const month = monthOptions.find((item) => item.key === nextKey)
                  if (!month) {
                    return
                  }
                  const firstEventDay = safeItems
                    .map((item) => toLocalParts(item.startAt))
                    .find((parts) => parts.year === month.year && parts.month === month.month)?.day
                  setSelectedDay(firstEventDay || 1)
                  setDayWindowStart(0)
                }}
              >
                {monthOptions.map((month) => (
                  <option key={month.key} value={month.key}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

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
              {visibleDays.map((day) => {
                const hasEvents = monthEventDays.has(day)
                return (
                  <button
                    className={`events__day${selectedDay === day ? ' events__day--active' : ''}${!hasEvents ? ' events__day--empty' : ''}`}
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                  >
                    <span className="events__day-week">{dayWeekLabel(selectedMonth!.year, selectedMonth!.month, day)}</span>
                    <span className="events__day-number">{day}</span>
                  </button>
                )
              })}
              <button
                className="events__day-arrow"
                type="button"
                onClick={() =>
                  setDayWindowStart((prev) =>
                    Math.min(Math.max(0, days.length - visibleDayCount), prev + visibleDayCount),
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
