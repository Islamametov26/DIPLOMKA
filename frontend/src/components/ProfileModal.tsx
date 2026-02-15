import { useEffect, useMemo, useState } from 'react'
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

const emptyState: LoadState = { status: 'loading', items: [], error: null }

const moneyFormatter = new Intl.NumberFormat('ru-RU')

function formatRange(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleString('ru-RU')} - ${endDate.toLocaleString('ru-RU')}`
}

function ProfileModal({ onClose }: Props) {
  const { user, logout } = useAuth()
  const [state, setState] = useState<LoadState>(emptyState)
  const [filter, setFilter] = useState<'all' | 'active' | 'history'>('all')

  const loadBookings = async () => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }))
    try {
      const items = await listBookings()
      setState({ status: 'ready', items, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить билеты.'
      setState({ status: 'error', items: [], error: message })
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const summary = useMemo(() => {
    const items = state.items
    const active = items.filter((item) => item.status === 'active').length
    const history = items.filter((item) => item.status !== 'active').length
    const totalSpent = items.reduce((acc, item) => acc + item.totalPrice, 0)
    return { total: items.length, active, history, totalSpent }
  }, [state.items])

  const visibleItems = useMemo(() => {
    if (filter === 'active') {
      return state.items.filter((item) => item.status === 'active')
    }
    if (filter === 'history') {
      return state.items.filter((item) => item.status !== 'active')
    }
    return state.items
  }, [filter, state.items])

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

        <div className="profile-summary">
          <div className="profile-summary__item">
            <div className="profile-summary__label">Всего билетов</div>
            <div className="profile-summary__value">{summary.total}</div>
          </div>
          <div className="profile-summary__item">
            <div className="profile-summary__label">Активные</div>
            <div className="profile-summary__value">{summary.active}</div>
          </div>
          <div className="profile-summary__item">
            <div className="profile-summary__label">История</div>
            <div className="profile-summary__value">{summary.history}</div>
          </div>
          <div className="profile-summary__item">
            <div className="profile-summary__label">Потрачено</div>
            <div className="profile-summary__value">{moneyFormatter.format(summary.totalSpent)} KZT</div>
          </div>
        </div>

        <div className="modal__tabs">
          <button
            className={`modal__tab${filter === 'all' ? ' modal__tab--active' : ''}`}
            type="button"
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button
            className={`modal__tab${filter === 'active' ? ' modal__tab--active' : ''}`}
            type="button"
            onClick={() => setFilter('active')}
          >
            Активные
          </button>
          <button
            className={`modal__tab${filter === 'history' ? ' modal__tab--active' : ''}`}
            type="button"
            onClick={() => setFilter('history')}
          >
            История
          </button>
        </div>

        <div className="modal__section">
          <h3 className="modal__section-title">Мои билеты</h3>
          {(state.status === 'idle' || state.status === 'loading') && (
            <div className="modal__status">Загрузка...</div>
          )}
          {state.error && <div className="modal__status modal__status--error">{state.error}</div>}
          {state.status === 'ready' && visibleItems.length === 0 && (
            <div className="modal__status">Билетов пока нет.</div>
          )}

          <div className="modal__list">
            {visibleItems.map((booking) => {
              const safeSeats = Array.isArray(booking.seats) ? booking.seats : []

              return (
                <div className="ticket" key={booking.id}>
                  {booking.eventImage ? (
                    <img className="ticket__image" src={booking.eventImage} alt={booking.eventTitle} loading="lazy" />
                  ) : (
                    <div className="ticket__image ticket__image--placeholder" aria-hidden="true" />
                  )}

                  <div className="ticket__main">
                    <div className="ticket__top">
                      <div className="ticket__title">{booking.eventTitle}</div>
                      <div className={`ticket__status ticket__status--${booking.status}`}>
                        {booking.status === 'active' ? 'Активен' : 'Отменен'}
                      </div>
                    </div>

                    <div className="ticket__meta">{booking.venueName}</div>
                    <div className="ticket__meta">{formatRange(booking.eventStart, booking.eventEnd)}</div>
                    <div className="ticket__meta">Места: {safeSeats.length > 0 ? safeSeats.join(', ') : 'не указаны'}</div>

                    <div className="ticket__footer">
                      <div className="ticket__price">{moneyFormatter.format(booking.totalPrice)} {booking.currency}</div>
                      {booking.status === 'active' && (
                        <button className="modal__secondary" type="button" onClick={() => handleCancel(booking.id)}>
                          Отменить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
