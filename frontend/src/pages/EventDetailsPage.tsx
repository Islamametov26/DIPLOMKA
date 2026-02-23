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

function getYoutubeEmbedUrl(rawUrl: string) {
  const source = (rawUrl || '').trim()
  const match = source.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i)
  if (!match) {
    return ''
  }
  return `https://www.youtube-nocookie.com/embed/${match[1]}`
}

function EventDetailsPage({ eventId, onBack, onRequireAuth }: Props) {
  const { user } = useAuth()
  const [state, setState] = useState<PageState>(initialState)
  const [buyOpen, setBuyOpen] = useState(false)
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
    if (!buyOpen || !event) {
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
  }, [buyOpen, event])

  const openBuyPopup = () => {
    setBookingStatus('idle')
    setBookingError(null)
    setSelectedSeats([])
    setBuyOpen(true)
  }

  const closeBuyPopup = () => {
    if (bookingStatus === 'loading') {
      return
    }
    setBuyOpen(false)
  }

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
      const seats = await listOccupiedSeats(event.id)
      setReservedSeats(seats)
      setBookingStatus('success')
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
  const safeTrailerUrl = cleanText(event?.trailerUrl, '')
  const trailerEmbed = getYoutubeEmbedUrl(safeTrailerUrl)
  const galleryImages = useMemo(() => {
    if (!event) {
      return []
    }
    const extra = Array.isArray(event.galleryUrls) ? event.galleryUrls.filter(Boolean) : []
    return extra.slice(0, 8)
  }, [event])
  const total = selectedSeats.length * seatPrice

  return (
    <section className="event-page">
      <button className="event-page__back" type="button" onClick={onBack}>
        Назад к афише
      </button>

      {state.status === 'loading' && <div className="events__status">Загружаем полную информацию о событии...</div>}
      {state.status === 'error' && <div className="events__status events__status--error">{state.error || 'Ошибка загрузки'}</div>}
      {state.status === 'success' && !event && <div className="events__status events__status--error">Событие не найдено.</div>}

      {state.status === 'success' && event && (
        <>
          <div className="event-page__layout">
            <aside className="event-page__poster">
              {event.imageUrl ? (
                <img className="event-page__poster-image" src={event.imageUrl} alt={safeTitle} loading="lazy" />
              ) : (
                <div className="event-page__poster-image event-page__hero--placeholder" aria-hidden="true" />
              )}
              <button className="event-page__buy" type="button" onClick={openBuyPopup}>
                Купить билет
              </button>
            </aside>

            <article className="event-page__main">
              <p className="event-page__eyebrow">{safeCategoryName}</p>
              <h1 className="event-page__title">{safeTitle}</h1>
              <p className="event-page__description">{safeDescription}</p>

              <div className="event-page__meta">
                <span>Начало: {new Date(event.startAt).toLocaleString('ru-RU')}</span>
                <span>Окончание: {new Date(event.endAt).toLocaleString('ru-RU')}</span>
                <span>Площадка: {safeVenueName}</span>
                <span>Адрес: {safeVenueAddress}</span>
              </div>
            </article>
          </div>

          {isMovie && (
            <section className="event-page__media" aria-label="Трейлер и кадры">
              <h2 className="event-page__section-title">Трейлер и кадры из фильма</h2>
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
              ) : safeTrailerUrl ? (
                <div className="event-page__trailer-placeholder">
                  <span>Ссылка на трейлер указана, но не распознана как YouTube:</span>
                  <a href={safeTrailerUrl} target="_blank" rel="noreferrer">
                    Открыть трейлер
                  </a>
                </div>
              ) : (
                <div className="event-page__trailer-placeholder">Трейлер для этого фильма пока не добавлен.</div>
              )}

              {galleryImages.length > 0 ? (
                <div className="event-page__frames">
                  {galleryImages.map((imageUrl, index) => (
                    <img
                      className="event-page__frame"
                      key={`frame-${index}-${imageUrl}`}
                      src={imageUrl}
                      alt={`Кадр ${index + 1}: ${safeTitle}`}
                      loading="lazy"
                    />
                  ))}
                </div>
              ) : (
                <div className="event-page__trailer-placeholder">Кадры из фильма пока не добавлены.</div>
              )}
            </section>
          )}
        </>
      )}

      {buyOpen && event && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Выбор мест">
          <button className="modal__overlay" type="button" onClick={closeBuyPopup} />
          <div className="modal__content" role="document">
            <div className="modal__header">
              <div>
                <p className="modal__eyebrow">Покупка билетов</p>
                <h2 className="modal__title">{safeTitle}</h2>
              </div>
              <button className="modal__close" type="button" onClick={closeBuyPopup}>
                Закрыть
              </button>
            </div>

            <SeatPicker selected={selectedSeats} reserved={reservedSeats} onChange={setSelectedSeats} />

            <div className="modal__booking">
              <div>
                <div className="modal__booking-label">Итого</div>
                <div className="modal__booking-price">{total} KZT</div>
              </div>
              <button className="modal__primary" type="button" onClick={handleBooking} disabled={bookingStatus === 'loading'}>
                {bookingStatus === 'loading' ? 'Покупаем...' : 'Купить билеты'}
              </button>
            </div>

            {bookingStatus === 'success' && <div className="modal__status">Покупка успешна! Билеты оформлены.</div>}
            {bookingError && <div className="modal__status modal__status--error">{bookingError}</div>}
          </div>
        </div>
      )}
    </section>
  )
}

export default EventDetailsPage
