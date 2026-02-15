import { useEffect, useMemo, useState } from 'react'
import { listCategories } from '../api/categories'
import { listEvents } from '../api/events'
import EventCard from '../components/EventCard'
import EventDetailsModal from '../components/EventDetailsModal'
import type { Category } from '../types/category'
import type { Event } from '../types/event'

const emptyState = {
  status: 'loading' as const,
  items: [] as Event[],
  categories: [] as Category[],
  error: '' as string | null,
}

type EventsState = typeof emptyState

type Props = {
  onRequireAuth: () => void
}

function EventsPage({ onRequireAuth }: Props) {
  const [state, setState] = useState<EventsState>(emptyState)
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const safeItems = Array.isArray(state.items) ? state.items : []
  const safeCategories = Array.isArray(state.categories) ? state.categories : []

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setState((prev) => ({ ...prev, status: 'loading', error: null }))
      try {
        const [items, categories] = await Promise.all([
          listEvents(controller.signal),
          listCategories(controller.signal),
        ])
        setState({ status: 'success', items, categories, error: null })
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        const message = error instanceof Error ? error.message : 'Не удалось загрузить афишу.'
        setState({ status: 'error', items: [], categories: [], error: message })
      }
    }

    load()

    return () => controller.abort()
  }, [])

  const filteredItems = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return safeItems
    }
    return safeItems.filter((event) => event.categoryId === selectedCategoryId)
  }, [safeItems, selectedCategoryId])

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
        <div className="events__panel-title">Ближайшие события</div>
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
        {(state.status === 'idle' || state.status === 'loading') && (
          <div className="events__status">Загружаем афишу...</div>
        )}
        {state.status === 'error' && <div className="events__status events__status--error">{state.error}</div>}
        {state.status === 'success' && filteredItems.length === 0 && (
          <div className="events__status">Событий в выбранной категории пока нет.</div>
        )}
        <div className="events__grid">
          {filteredItems.map((event) => (
            <EventCard key={event.id} event={event} onDetails={(selected) => setActiveEvent(selected)} />
          ))}
        </div>
      </div>

      {activeEvent && (
        <EventDetailsModal
          event={activeEvent}
          onClose={() => setActiveEvent(null)}
          onRequireAuth={onRequireAuth}
        />
      )}
    </section>
  )
}

export default EventsPage
