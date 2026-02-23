import { useEffect, useMemo, useState } from 'react'
import { createBooking } from '../api/bookings'
import { listCategories } from '../api/categories'
import { listEvents, listOccupiedSeats } from '../api/events'
import { listVenues } from '../api/venues'
import SeatPicker from '../components/SeatPicker'
import { useAuth } from '../context/AuthContext'
import type { Category } from '../types/category'
import type { Event } from '../types/event'
import type { Venue } from '../types/venue'
import { cleanText } from '../utils/text'

type Props = {
  eventId: string
  onBack: () => void
  onRequireAuth: () => void
}

type PageState = {
  status: 'loading' | 'success' | 'error'
  items: Event[]
  categories: Category[]
  venues: Venue[]
  error: string | null
}

const initialState: PageState = {
  status: 'loading',
  items: [],
  categories: [],
  venues: [],
  error: null,
}

function getYoutubeEmbedUrl(text: string) {
  const source = text || ''
  const directMatch = source.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i)
  if (!directMatch) {
    return ''
  }
  return `https://www.youtube-nocookie.com/embed/${directMatch[1]}`
}

function EventDetailsPage({ eventId, onBack, onRequireAuth }: Props) {
  const { user } = useAuth()
  const [state, setState] = useState<PageState>(initialState)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [reservedSeats, setReservedSeats] = useState<string[]>([])
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [bookingError, setBookingError] = useState<string | null>(null)
  const seatPrice = 2500

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
        const message = error instanceof Error ? error.message : 'Не удалось загрузить событие.'
        setState({ status: 'error', items: [], categories: [], venues: [], error: message })
      }
    }

    load()
    return () => controller.abort()
  }, [])

  const event = useMemo(() => state.items.find((item) => item.id === eventId) ?? null, [state.items, eventId])
  const venue = useMemo(() => state.venues.find((item) => item.id === event?.venueId), [state.venues, event?.venueId])
  const category = useMemo(() => state.categories.find((item) => item.id === event?.categoryId), [state.categories, event?.categoryId])

  useEffect(() => {
    if (!event) {
      setReservedSeats([])
      return
    }
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
  }, [event])

  const handleBooking = async () => {
    if (!event) {
      return
    }
    if (!user) {
      onRequireAuth()
      return
    }
    if (selectedSeats.length === 0) {
      setBookingStatus('error')
      setBookingError('Выберите хотя бы одно место.')
      return
    }
    setBookingStatus('loading')
    setBookingError(null)
    try {
      await createBooking(event.id, selectedSeats)
      setBookingStatus('success')
      const seats = await listOccupiedSeats(event.id)
      setReservedSeats(seats)
      setSelectedSeats([])
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('409') || message.includes('conflict') || message.includes('already booked')) {
        setBookingError('Эти места уже заняты или уже куплены вами.')
      } else {
        setBookingError('Не удалось оформить покупку билетов.')
      }
      setBookingStatus('error')
    }
  }

  const safeTitle = cleanText(event?.title, 'Событие')
  const safeDescription = cleanText(event?.description, 'Описание события скоро появится.')
  const safeVenueName = cleanText(venue?.name, 'Неизвестно')
  const safeVenueAddress = cleanText(venue?.address, 'Адрес не указан')
  const safeCategoryName = cleanText(category?.name, 'Без категории')
  const normalizedCategory = safeCategoryName.toLowerCase()
  const isMovie = normalizedCategory.includes('фильм') || normalizedCategory.includes('кино')
  const trailerEmbed = getYoutubeEmbedUrl(safeDescription)
  const total = selectedSeats.length * seatPrice

  return (
    <section className="event-page">
      <button className="event-page__back" type="button" onClick={onBack}>
        ← Назад к афише
      </button>

      {state.status === 'loading' && <div className="events__status">Загружаем полную информацию о событии...</div>}
      {state.status === 'error' && <div className="events__status events__status--error">{state.error || 'Ошибка загрузки'}</div>}
      {state.status === 'success' && !event && <div className="events__status events__status--error">Событие не найдено.</div>}

      {state.status === 'success' && event && (
        <div className="event-page__layout">
          <article className="event-page__main">
            {event.imageUrl ? (
              <img className="event-page__hero" src={event.imageUrl} alt={safeTitle} loading="lazy" />
            ) : (
              <div className="event-page__hero event-page__hero--placeholder" aria-hidden="true" />
            )}

            <p className="event-page__eyebrow">{safeCategoryName}</p>
            <h1 className="event-page__title">{safeTitle}</h1>
            <p className="event-page__description">{safeDescription}</p>

            <div className="event-page__meta">
              <span>Начало: {new Date(event.startAt).toLocaleString('ru-RU')}</span>
              <span>Окончание: {new Date(event.endAt).toLocaleString('ru-RU')}</span>
              <span>Площадка: {safeVenueName}</span>
              <span>Адрес: {safeVenueAddress}</span>
            </div>

            {isMovie && (
              <section className="event-page__media" aria-label="Медиа">
                <h2 className="event-page__section-title">Трейлер и кадры</h2>
                {trailerEmbed ? (
                  <div className="event-page__trailer-wrap">
                    <iframe
                      className="event-page__trailer"
                      src={trailerEmbed}
                      title={`Трейлер: ${safeTitle}`}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="event-page__trailer-placeholder">
                    <span>Трейлер не прикреплен. Откройте поиск трейлера:</span>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${safeTitle} трейлер`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Смотреть трейлер на YouTube
                    </a>
                  </div>
                )}

                {event.imageUrl && (
                  <div className="event-page__frames">
                    {[20, 38, 56, 74].map((position, index) => (
                      <img
                        className="event-page__frame"
                        key={`frame-${index}`}
                        src={event.imageUrl}
                        alt={`Кадр ${index + 1}: ${safeTitle}`}
                        style={{ objectPosition: `50% ${position}%` }}
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </article>

          <aside className="event-page__booking">
            <h2 className="event-page__section-title">Купить билет</h2>
            <SeatPicker selected={selectedSeats} reserved={reservedSeats} onChange={setSelectedSeats} />

            <div className="event-page__summary">
              <div>
                <div className="event-page__summary-label">Итого</div>
                <div className="event-page__summary-value">{total} KZT</div>
              </div>
              <button className="event-page__buy" type="button" onClick={handleBooking} disabled={bookingStatus === 'loading'}>
                {bookingStatus === 'loading' ? 'Покупаем...' : 'Купить билеты'}
              </button>
            </div>

            {bookingStatus === 'success' && <div className="events__status">Покупка успешна! Билеты оформлены.</div>}
            {bookingError && <div className="events__status events__status--error">{bookingError}</div>}
          </aside>
        </div>
      )}
    </section>
  )
}

export default EventDetailsPage
