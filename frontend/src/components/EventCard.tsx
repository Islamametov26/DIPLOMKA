import type { Event } from '../types/event'
import { useLocale } from '../context/LocaleContext'
import { cleanText } from '../utils/text'

function formatRange(event: Event, localeTag: string) {
  const dateFormatter = new Intl.DateTimeFormat(localeTag, {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
  const start = dateFormatter.format(new Date(event.startAt))
  const end = dateFormatter.format(new Date(event.endAt))
  return `${start} - ${end}`
}

type Props = {
  event: Event
  venueName?: string
  onDetails: (event: Event) => void
}

function EventCard({ event, venueName, onDetails }: Props) {
  const { t, localeTag } = useLocale()
  const safeTitle = cleanText(event.title, 'Событие')
  const safeDescription = cleanText(event.description, 'Описание скоро появится.')
  const safeVenue = cleanText(venueName, 'Неизвестно')

  return (
    <article className="event-card">
      {event.imageUrl ? (
        <img className="event-card__image" src={event.imageUrl} alt={safeTitle} loading="lazy" />
      ) : (
        <div className="event-card__image event-card__image--placeholder" aria-hidden="true" />
      )}
      <div className="event-card__header">
        <span className="event-card__time">{formatRange(event, localeTag)}</span>
      </div>
      <h3 className="event-card__title">{safeTitle}</h3>
      <p className="event-card__description">{safeDescription}</p>
      <div className="event-card__footer">
        <span className="event-card__meta">
          {t('events.venue')}: {safeVenue}
        </span>
      </div>
      <div className="event-card__actions">
        <button className="event-card__hover-action" type="button" onClick={() => onDetails(event)}>
          {t('events.buyTicket')}
        </button>
      </div>
    </article>
  )
}

export default EventCard

