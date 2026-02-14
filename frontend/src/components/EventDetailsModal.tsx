import { useEffect, useState } from 'react'
import { createBooking } from '../api/bookings'
import { listOccupiedSeats } from '../api/events'
import { useAuth } from '../context/AuthContext'
import type { Event } from '../types/event'
import SeatPicker from './SeatPicker'

type Props = {
  event: Event
  onClose: () => void
  onRequireAuth: () => void
  onDelete?: (eventId: string) => Promise<void>
}

function EventDetailsModal({ event, onClose, onRequireAuth, onDelete }: Props) {
  const { user } = useAuth()
  const seatPrice = 2500
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [reservedSeats, setReservedSeats] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const handleKey = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    let active = true
    const loadSeats = async () => {
      try {
        const seats = await listOccupiedSeats(event.id)
        if (active) {
          setReservedSeats(seats)
        }
      } catch {
        if (active) {
          setReservedSeats([])
        }
      }
    }
    loadSeats()
    return () => {
      active = false
    }
  }, [event.id])

  const handleBooking = async () => {
    if (!user) {
      onRequireAuth()
      return
    }
    if (selectedSeats.length === 0) {
      setError('Выберите хотя бы одно место.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      await createBooking(event.id, selectedSeats)
      setStatus('success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось оформить бронь.'
      setError(message)
      setStatus('error')
    }
  }

  const handleDelete = async () => {
    if (!onDelete) {
      setError('Удаление события сейчас недоступно.')
      return
    }
    if (!user) {
      onRequireAuth()
      return
    }
    const confirmed = window.confirm('Удалить событие?')
    if (!confirmed) {
      return
    }
    setIsDeleting(true)
    setError(null)
    try {
      await onDelete(event.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось удалить событие.'
      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const isPastEvent = new Date(event.endAt).getTime() < Date.now()
  const total = selectedSeats.length * seatPrice

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__overlay" onClick={onClose} />
      <div className="modal__content" role="document">
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
          <span>Площадка: {event.venueId}</span>
        </div>

        <SeatPicker selected={selectedSeats} reserved={reservedSeats} onChange={setSelectedSeats} />

        <div className="modal__booking">
          <div>
            <div className="modal__booking-label">Итого</div>
            <div className="modal__booking-price">{total} KZT</div>
          </div>
          <button className="modal__primary" type="button" onClick={handleBooking}>
            Забронировать
          </button>
          {isPastEvent && onDelete && (
            <button
              className="modal__danger"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить событие'}
            </button>
          )}
        </div>
        {status === 'success' && <div className="modal__status">Бронь оформлена! Проверьте профиль.</div>}
        {error && <div className="modal__status modal__status--error">{error}</div>}
      </div>
    </div>
  )
}

export default EventDetailsModal
