import { useEffect, useState } from 'react'
import { cancelBooking, listBookings } from '../api/bookings'
import { useAuth } from '../context/AuthContext'
import type { Booking } from '../types/booking'

type Props = {
  onClose: () => void
}

type LoadState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  items: Booking[]
  error: string | null
}

const emptyState: LoadState = { status: 'idle', items: [], error: null }

function ProfileModal({ onClose }: Props) {
  const { user, logout } = useAuth()
  const [state, setState] = useState<LoadState>(emptyState)

  const loadBookings = async () => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }))
    try {
      const items = await listBookings()
      setState({ status: 'ready', items, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить брони.'
      setState({ status: 'error', items: [], error: message })
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking(id)
      await loadBookings()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось отменить бронь.'
      setState((prev) => ({ ...prev, error: message, status: 'error' }))
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__overlay" onClick={onClose} />
      <div className="modal__content" role="document">
        <div className="modal__header">
          <div>
            <p className="modal__eyebrow">Профиль</p>
            <h2 className="modal__title">{user?.email}</h2>
          </div>
          <div className="modal__actions">
            <button className="modal__close" type="button" onClick={onClose}>
              Закрыть
            </button>
            <button className="modal__secondary" type="button" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>

        <div className="modal__section">
          <h3 className="modal__section-title">Мои бронирования</h3>
          {state.status === 'loading' && <div className="modal__status">Загрузка...</div>}
          {state.error && <div className="modal__status modal__status--error">{state.error}</div>}
          {state.status === 'ready' && state.items.length === 0 && (
            <div className="modal__status">Бронирований пока нет.</div>
          )}
          <div className="modal__list">
            {state.items.map((booking) => (
              <div className="modal__card" key={booking.id}>
                <div>
                  <div className="modal__card-title">Бронь #{booking.id.slice(0, 6)}</div>
                  <div className="modal__card-meta">
                    {booking.seats.join(', ')} · {booking.totalPrice} {booking.currency}
                  </div>
                  <div className="modal__card-status">Статус: {booking.status}</div>
                </div>
                {booking.status === 'active' && (
                  <button
                    className="modal__secondary"
                    type="button"
                    onClick={() => handleCancel(booking.id)}
                  >
                    Отменить
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
