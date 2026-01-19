import { useEffect, useState } from 'react'
import { listVenues } from '../api/venues'
import type { Venue } from '../types/venue'

type LoadState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  items: Venue[]
  error: string | null
}

const emptyState: LoadState = { status: 'idle', items: [], error: null }

type Props = {
  onRequireAuth: () => void
}

function VenuesPage({ onRequireAuth }: Props) {
  const [state, setState] = useState<LoadState>(emptyState)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setState((prev) => ({ ...prev, status: 'loading', error: null }))
      try {
        const items = await listVenues()
        setState({ status: 'ready', items, error: null })
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        const message =
          error instanceof Error ? error.message : 'Не удалось загрузить площадки.'
        setState({ status: 'error', items: [], error: message })
      }
    }

    load()

    return () => controller.abort()
  }, [])

  return (
    <section className="venues">
      <div className="events__hero">
        <p className="events__eyebrow">Площадки города</p>
        <h1 className="events__title">Места проведения</h1>
        <p className="events__subtitle">
          Галереи, кинотеатры, лектории и креативные пространства — выбирайте
          место, куда хочется попасть.
        </p>
      </div>

      <div className="events__panel">
        <div className="events__panel-title">Список площадок</div>
        {state.status === 'loading' && (
          <div className="events__status">Загружаем площадки...</div>
        )}
        {state.status === 'error' && (
          <div className="events__status events__status--error">{state.error}</div>
        )}
        {state.status === 'ready' && state.items.length === 0 && (
          <div className="events__status">Площадок пока нет.</div>
        )}
        <div className="venues__grid">
          {state.items.map((venue) => (
            <article className="venue-card" key={venue.id}>
              <div className="venue-card__name">{venue.name}</div>
              <div className="venue-card__address">{venue.address}</div>
              <button className="venue-card__button" type="button" onClick={onRequireAuth}>
                Добавить событие
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default VenuesPage
