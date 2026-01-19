import { useEffect, useState } from 'react'
import { listEvents } from '../api/events'
import EventCard from '../components/EventCard'
import EventDetailsModal from '../components/EventDetailsModal'
import type { Event } from '../types/event'

const emptyState = {
  status: 'idle' as const,
  items: [] as Event[],
  error: '' as string | null,
}

type EventsState = typeof emptyState

type Props = {
  onRequireAuth: () => void
}

function EventsPage({ onRequireAuth }: Props) {
  const [state, setState] = useState<EventsState>(emptyState)
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setState((prev) => ({ ...prev, status: 'loading', error: null }))
      try {
        const items = await listEvents(controller.signal)
        setState({ status: 'success', items, error: null })
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        const message =
          error instanceof Error ? error.message : 'Не удалось загрузить афишу.'
        setState({ status: 'error', items: [], error: message })
      }
    }

    load()

    return () => controller.abort()
  }, [])


  return (
    <section className="events">
      <div className="events__hero">
        <p className="events__eyebrow">Городской портал</p>
        <h1 className="events__title">Афиша мероприятий</h1>
        <p className="events__subtitle">
          События города на ближайшие недели: выставки, лекции, концерты и
          спектакли. Выбирайте формат и планируйте вечер заранее.
        </p>
      </div>

      <div className="events__panel">
        <div className="events__panel-title">Ближайшие события</div>
        {state.status === 'loading' && (
          <div className="events__status">Загружаем афишу...</div>
        )}
        {state.status === 'error' && (
          <div className="events__status events__status--error">
            {state.error}
          </div>
        )}
        {state.status === 'success' && state.items.length === 0 && (
          <div className="events__status">Событий пока нет.</div>
        )}
        <div className="events__grid">
          {state.items.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDetails={(selected) => setActiveEvent(selected)}
            />
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
