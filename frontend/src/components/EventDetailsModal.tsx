import { useEffect } from 'react'
import type { Event } from '../types/event'
import { cleanText } from '../utils/text'

type Props = {
  event: Event
  venueName: string
  venueAddress: string
  categoryName: string
  onClose: () => void
}

function EventDetailsModal({ event, venueName, venueAddress, categoryName, onClose }: Props) {
  const safeTitle = cleanText(event.title, 'Событие')
  const safeDescription = cleanText(event.description, 'Описание события скоро появится.')
  const safeVenueName = cleanText(venueName, 'Неизвестно')
  const safeVenueAddress = cleanText(venueAddress, 'Адрес не указан')
  const safeCategoryName = cleanText(categoryName, 'Без категории')

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
          <img className="modal__hero" src={event.imageUrl} alt={safeTitle} loading="lazy" />
        ) : (
          <div className="modal__hero modal__hero--placeholder" aria-hidden="true" />
        )}

        <div className="modal__header">
          <div>
            <p className="modal__eyebrow">Событие</p>
            <h2 className="modal__title">{safeTitle}</h2>
          </div>
          <button className="modal__close" type="button" onClick={onClose}>
            Закрыть
          </button>
        </div>

        <p className="modal__description">{safeDescription}</p>
        <div className="modal__meta">
          <span>Начало: {new Date(event.startAt).toLocaleString('ru-RU')}</span>
          <span>Окончание: {new Date(event.endAt).toLocaleString('ru-RU')}</span>
          <span>Категория: {safeCategoryName}</span>
          <span>Площадка: {safeVenueName}</span>
          <span>Адрес: {safeVenueAddress}</span>
        </div>
      </div>
    </div>
  )
}

export default EventDetailsModal
