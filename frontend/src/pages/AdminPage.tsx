import { useEffect, useState } from 'react'
import { listEvents } from '../api/events'
import AdminPanel from '../components/AdminPanel'
import { useAuth } from '../context/AuthContext'
import type { Event } from '../types/event'

type LoadState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  items: Event[]
  error: string | null
}

const emptyState: LoadState = { status: 'idle', items: [], error: null }

type Props = {
  onRequireAuth: () => void
}

function AdminPage({ onRequireAuth }: Props) {
  const { user } = useAuth()
  const [state, setState] = useState<LoadState>(emptyState)

  const load = async () => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }))
    try {
      const items = await listEvents()
      setState({ status: 'ready', items, error: null })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось загрузить афишу.'
      setState({ status: 'error', items: [], error: message })
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
        <AdminPanel events={state.items} onSaved={load} />
      )}
    </section>
  )
}

export default AdminPage
