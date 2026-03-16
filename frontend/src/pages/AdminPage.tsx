import { useEffect, useState } from 'react'
import { listCategories } from '../api/categories'
import { listEvents } from '../api/events'
import { listVenues } from '../api/venues'
import AdminPanel from '../components/AdminPanel'
import VenueManager from '../components/VenueManager'
import { useAuth } from '../context/AuthContext'
import type { Category } from '../types/category'
import type { Event } from '../types/event'
import type { Venue } from '../types/venue'

type LoadState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  items: Event[]
  error: string | null
}

const emptyState: LoadState = { status: 'loading', items: [], error: null }
const emptyVenues: Venue[] = []
const emptyCategories: Category[] = []

type Props = {
  onRequireAuth: () => void
}

function AdminPage({ onRequireAuth }: Props) {
  const { user } = useAuth()
  const [state, setState] = useState<LoadState>(emptyState)
  const [venues, setVenues] = useState<Venue[]>(emptyVenues)
  const [categories, setCategories] = useState<Category[]>(emptyCategories)
  const safeEvents = Array.isArray(state.items) ? state.items : []
  const safeVenues = Array.isArray(venues) ? venues : []
  const safeCategories = Array.isArray(categories) ? categories : []

  const load = async () => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }))
    try {
      const [items, venueItems, categoryItems] = await Promise.all([listEvents(), listVenues(), listCategories()])
      setState({ status: 'ready', items, error: null })
      setVenues(venueItems)
      setCategories(categoryItems)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить афишу.'
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
      <section className="admin-page">
        <div className="admin admin--standalone">
          <div className="admin__header">
            <div>
              <p className="admin__eyebrow">Админка</p>
              <h2 className="admin__title">Требуется авторизация</h2>
            </div>
            <button className="admin__primary" type="button" onClick={onRequireAuth}>
              Войти
            </button>
          </div>
          <p className="admin__note">Для управления афишей войдите в аккаунт администратора.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="admin-page">
      {state.status === 'error' && <div className="admin__status admin__status--error">{state.error}</div>}
      {(state.status === 'idle' || state.status === 'loading') && <div className="admin__status">Загрузка...</div>}
      {state.status === 'ready' && (
        <div className="admin-page__stack">
          <AdminPanel events={safeEvents} venues={safeVenues} categories={safeCategories} onSaved={load} />
          <VenueManager venues={safeVenues} onSaved={reloadVenues} />
        </div>
      )}
    </section>
  )
}

export default AdminPage
