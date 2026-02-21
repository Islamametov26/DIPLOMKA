import { useMemo, useState } from 'react'
import { createVenue, updateVenue } from '../api/venues'
import type { Venue } from '../types/venue'

type Props = {
  venues: Venue[]
  onSaved: () => void
}

const emptyVenue = {
  name: '',
  address: '',
}

type Status = 'idle' | 'saving' | 'success' | 'error'

function VenueManager({ venues, onSaved }: Props) {
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState(emptyVenue)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const selectedVenue = useMemo(
    () => venues.find((item) => item.id === selectedId) || null,
    [selectedId, venues],
  )

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setStatus('idle')
    setError(null)
    if (!id) {
      setForm(emptyVenue)
      return
    }
    const venue = venues.find((item) => item.id === id)
    if (!venue) {
      return
    }
    setForm({ name: venue.name, address: venue.address })
  }

  const handleCreateNew = () => {
    setSelectedId('')
    setForm(emptyVenue)
    setStatus('idle')
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    setError(null)

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
    }

    try {
      if (selectedVenue) {
        await updateVenue(selectedVenue.id, payload)
      } else {
        await createVenue(payload)
        setForm(emptyVenue)
      }
      setStatus('success')
      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить площадку.'
      setError(message)
      setStatus('error')
    }
  }

  return (
    <section className="admin">
      <div className="admin__header">
        <div>
          <p className="admin__eyebrow">Площадки</p>
          <h2 className="admin__title">Редактирование площадок</h2>
        </div>
        <div className="admin__actions">
          <button className="admin__ghost" type="button" onClick={handleCreateNew}>
            Новая площадка
          </button>
        </div>
      </div>

      <div className="admin__note">Удаление площадок отключено. Изменяйте название и адрес существующих площадок.</div>

      <div className="admin__list">
        {venues.length === 0 && <div className="admin__note">Площадок пока нет.</div>}
        {venues.map((venue) => {
          const isSelected = selectedId === venue.id
          return (
            <article className={`admin-item${isSelected ? ' admin-item--selected' : ''}`} key={venue.id}>
              <div className="admin-item__main">
                <div className="admin-item__title">{venue.name}</div>
                <div className="admin-item__meta">{venue.address}</div>
              </div>
              <div className="admin-item__actions">
                <button className="admin__secondary" type="button" onClick={() => handleSelect(venue.id)}>
                  Редактировать
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <form className="admin__form" onSubmit={handleSubmit}>
        <h3 className="admin__form-title">
          {selectedVenue ? `Редактирование: ${selectedVenue.name}` : 'Создание площадки'}
        </h3>
        <label>
          Название
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        </label>
        <label>
          Адрес
          <input
            type="text"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            required
          />
        </label>
        {error && <div className="admin__status admin__status--error">{error}</div>}
        {status === 'success' && <div className="admin__status">Сохранено.</div>}
        <button className="admin__primary" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </section>
  )
}

export default VenueManager
