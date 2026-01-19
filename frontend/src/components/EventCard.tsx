import type { Event } from '../types/event'

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

function formatRange(event: Event) {
  const start = dateFormatter.format(new Date(event.startAt))
  const end = dateFormatter.format(new Date(event.endAt))
  return `${start} — ${end}`
}

type Props = {
  event: Event
  onDetails: (event: Event) => void
}

function EventCard({ event, onDetails }: Props) {
  return (
    <article className="event-card">
      <div className="event-card__header">
        <span className="event-card__tag">{event.published ? 'Опубликовано' : 'Черновик'}</span>
        <span className="event-card__time">{formatRange(event)}</span>
      </div>
      <h3 className="event-card__title">{event.title}</h3>
      <p className="event-card__description">{event.description}</p>
      <div className="event-card__footer">
        <span className="event-card__meta">Площадка: {event.venueId}</span>
        <button
          className="event-card__button"
          type="button"
          onClick={() => onDetails(event)}
        >
          Подробнее
        </button>
      </div>
    </article>
  )
}

export default EventCard
