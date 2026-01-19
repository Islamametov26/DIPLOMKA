import { useEffect, useState } from 'react'
import { listEvents } from '../api/events'
import { listVenues } from '../api/venues'
import AdminPanel from '../components/AdminPanel'
import VenueManager from '../components/VenueManager'
import { useAuth } from '../context/AuthContext'
import type { Event } from '../types/event'
import type { Venue } from '../types/venue'

type LoadState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  items: Event[]
  error: string | null
}

const emptyState: LoadState = { status: 'idle', items: [], error: null }
const emptyVenues: Venue[] = []

type Props = {
  onRequireAuth: () => void
}

function AdminPage({ onRequireAuth }: Props) {
  const { user } = useAuth()
  const [state, setState] = useState<LoadState>(emptyState)
  const [venues, setVenues] = useState<Venue[]>(emptyVenues)

  const load = async () => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }))
    try {
      const [items, venueItems] = await Promise.all([listEvents(), listVenues()])
      setState({ status: 'ready', items, error: null })
      setVenues(venueItems)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось загрузить афишу.'
      setState({ status: 'error', items: [], error: message })
    }
  }

  const reloadVenues = async () => {
    try {
      const venueItems = await listVenues()
      setVenues(venueItems)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (user) {
      load()
    }
  }, [user])

  if (!user) {
    return (
      <section className="admin">
        <div className="admin__header">
          <div>
            <p className="admin__eyebrow">Админка</p>
            <h2 className="admin__title">Требуется авторизация</h2>
          </div>
          <button className="admin__primary" type="button" onClick={onRequireAuth}>
            Войти
          </button>
        </div>
        <p className="admin__note">
          Для управления афишей войдите в аккаунт администратора.
        </p>
      </section>
    )
  }

  return (
    <section className="admin">
      {state.status === 'error' && (
        <div className="admin__status admin__status--error">{state.error}</div>
      )}
      {state.status === 'loading' && <div className="admin__status">Загрузка...</div>}
      {state.status === 'ready' && (
        <div className="admin__stack">
          <AdminPanel events={state.items} venues={venues} onSaved={load} />
          <VenueManager venues={venues} onSaved={reloadVenues} />
        </div>
      )}
    </section>
  )
}

export default AdminPage
