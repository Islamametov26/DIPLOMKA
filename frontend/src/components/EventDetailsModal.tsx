import { useEffect } from 'react'
import type { Event } from '../types/event'

type Props = {
  event: Event
  venueName: string
  venueAddress: string
  categoryName: string
  onClose: () => void
}

function EventDetailsModal({ event, venueName, venueAddress, categoryName, onClose }: Props) {
  useEffect(() => {
    const handleKey = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__overlay" onClick={onClose} />
      <div className="modal__content" role="document">
        {event.imageUrl ? (
          <img className="modal__hero" src={event.imageUrl} alt={event.title} loading="lazy" />
        ) : (
          <div className="modal__hero modal__hero--placeholder" aria-hidden="true" />
        )}

        <div className="modal__header">
          <div>
            <p className="modal__eyebrow">Событие</p>
            <h2 className="modal__title">{event.title}</h2>
          </div>
          <button className="modal__close" type="button" onClick={onClose}>
            Закрыть
          </button>
        </div>

        <p className="modal__description">{event.description}</p>
        <div className="modal__meta">
          <span>Начало: {new Date(event.startAt).toLocaleString('ru-RU')}</span>
          <span>Окончание: {new Date(event.endAt).toLocaleString('ru-RU')}</span>
          <span>Категория: {categoryName}</span>
          <span>Площадка: {venueName}</span>
          <span>Адрес: {venueAddress}</span>
        </div>
      </div>
    </div>
  )
}

export default EventDetailsModal
