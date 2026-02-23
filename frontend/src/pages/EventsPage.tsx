import { useEffect, useMemo, useRef, useState } from 'react'
import { listCategories } from '../api/categories'
import { listEvents } from '../api/events'
import { listVenues } from '../api/venues'
import EventCard from '../components/EventCard'
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
  onOpenEvent: (eventId: string) => void
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

function toHumanDate(key: string) {
  return parseKey(key).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function EventsPage({ onOpenEvent }: Props) {
  const PAGE_SIZE = 9
  const [state, setState] = useState<EventsState>(emptyState)
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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const popularRef = useRef<HTMLDivElement | null>(null)

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

    if (selectedDateKey && !calendarDays.some((day) => day.key === selectedDateKey)) {
      setSelectedDateKey('')
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
    const normalizedQuery = query.trim().toLowerCase()

    return safeItems.filter((event) => {
      if (selectedDateKey && toDateKey(event.startAt) !== selectedDateKey) {
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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, selectedCategoryId, selectedDateKey])

  const visibleItems = useMemo(() => filteredItems.slice(0, visibleCount), [filteredItems, visibleCount])
  const canShowMore = visibleCount < filteredItems.length

  const popularItems = useMemo(() => {
    const published = safeItems.filter((item) => item.published)
    const source = published.length > 0 ? published : safeItems
    return [...source]
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 12)
  }, [safeItems])

  const venueById = useMemo(
    () =>
      safeVenues.reduce<Record<string, Venue>>((acc, venue) => {
        acc[venue.id] = venue
        return acc
      }, {}),
    [safeVenues],
  )

  const slidePopular = (direction: 'left' | 'right') => {
    const node = popularRef.current
    if (!node) {
      return
    }
    const firstCard = node.querySelector('.events__popular-card') as HTMLElement | null
    const gap = Number.parseInt(getComputedStyle(node).columnGap || '14', 10) || 14
    const step = firstCard ? firstCard.offsetWidth + gap : Math.max(280, Math.floor(node.clientWidth * 0.75))
    const delta = direction === 'right' ? step : -step
    node.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <section className="events">
      <div className="events__hero">
        <p className="events__eyebrow">Городской портал</p>
        {safeCategories.length > 0 && (
          <div className="events__filters events__filters--hero">
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
            <input
              className="events__search-input events__search-input--hero"
              type="search"
              placeholder="Поиск..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Поиск событий"
            />
          </div>
        )}
        <h1 className="events__title">Афиша мероприятий</h1>
        <p className="events__subtitle">
          События города на ближайшие недели: выставки, лекции, концерты и спектакли. Выбирайте формат и планируйте
          вечер заранее.
        </p>
      </div>

      {popularItems.length > 0 && (
        <section className="events__popular" aria-label="Популярное">
          <div className="events__popular-header">
            <h2 className="events__popular-title">Популярное</h2>
            <div className="events__popular-actions">
              <button className="events__popular-arrow" type="button" onClick={() => slidePopular('left')} aria-label="Назад">
                ‹
              </button>
              <button className="events__popular-arrow" type="button" onClick={() => slidePopular('right')} aria-label="Вперед">
                ›
              </button>
            </div>
          </div>
          <div className="events__popular-track" ref={popularRef}>
            {popularItems.map((event) => (
              <article
                className="events__popular-card"
                key={`popular-${event.id}`}
                role="button"
                tabIndex={0}
                onClick={() => onOpenEvent(event.id)}
                onKeyDown={(keyEvent) => {
                  if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                    keyEvent.preventDefault()
                    onOpenEvent(event.id)
                  }
                }}
              >
                {event.imageUrl ? (
                  <img className="events__popular-image" src={event.imageUrl} alt={event.title} loading="lazy" />
                ) : (
                  <div className="events__popular-image events__popular-image--placeholder" aria-hidden="true" />
                )}
                <div className="events__popular-meta">{new Date(event.startAt).toLocaleString('ru-RU')}</div>
                <h3 className="events__popular-name">{event.title}</h3>
                <p className="events__popular-description">{event.description}</p>
                <div className="events__popular-footer">
                  <span className="events__popular-venue">Площадка: {venueById[event.venueId]?.name || 'Неизвестно'}</span>
                </div>
                <div className="events__popular-actions-wrap">
                  <button
                    className="events__popular-hover-action"
                    type="button"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation()
                      onOpenEvent(event.id)
                    }}
                  >
                    Купить билет
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="events__panel">
        {calendarDays.length > 0 && (
          <div className="events__datebar">
            <div className="events__month-caption">{currentMonthCaption}</div>
            {selectedDateKey && (
              <div className="events__date-active">
                Выбрано: {toHumanDate(selectedDateKey)}
                <button className="events__date-reset" type="button" onClick={() => setSelectedDateKey('')}>
                  Сбросить дату
                </button>
              </div>
            )}
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
                  onClick={() => setSelectedDateKey((prev) => (prev === day.key ? '' : day.key))}
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
                  setDayWindowStart((prev) => Math.min(Math.max(0, calendarDays.length - visibleDayCount), prev + visibleDayCount))
                }
                disabled={!canSlideDaysRight}
                aria-label="Следующие даты"
              >
                ›
              </button>
            </div>
          </div>
        )}

        <div className="events__panel-title">События</div>
        {(state.status === 'idle' || state.status === 'loading') && <div className="events__status">Загружаем афишу...</div>}
        {state.status === 'error' && <div className="events__status events__status--error">{state.error}</div>}
        {state.status === 'success' && filteredItems.length === 0 && (
          <div className="events__status">{selectedDateKey ? 'Событий на эту дату нет.' : 'Событий по текущему фильтру нет.'}</div>
        )}

        <div className={`events__grid${visibleItems.length === 1 ? ' events__grid--compact' : ''}`}>
          {visibleItems.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              venueName={venueById[event.venueId]?.name}
              onDetails={(selected) => onOpenEvent(selected.id)}
            />
          ))}
        </div>

        {canShowMore && (
          <div className="events__more-wrap">
            <button className="events__more" type="button" onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}>
              Показать еще
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default EventsPage
