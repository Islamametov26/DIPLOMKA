import { useMemo, useState } from 'react'
import { createVenue, deleteVenue, updateVenue } from '../api/venues'
import type { Venue } from '../types/venue'

type Props = {
  venues: Venue[]
  onSaved: () => void
}

const emptyVenue = {
  id: '',
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
    if (!id) {
      setForm(emptyVenue)
      return
    }
    const venue = venues.find((item) => item.id === id)
    if (!venue) {
      return
    }
    setForm({ id: venue.id, name: venue.name, address: venue.address })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    setError(null)

    const payload = {
      id: form.id || undefined,
      name: form.name.trim(),
      address: form.address.trim(),
    }

    try {
      if (selectedVenue) {
        await updateVenue(selectedVenue.id, payload)
      } else {
        await createVenue(payload)
      }
      setStatus('success')
      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить площадку.'
      setError(message)
      setStatus('error')
    }
  }

  const handleDelete = async () => {
    if (!selectedVenue) {
      return
    }
    const confirmed = window.confirm('Удалить площадку?')
    if (!confirmed) {
      return
    }
    setStatus('saving')
    setError(null)
    try {
      await deleteVenue(selectedVenue.id)
      setSelectedId('')
      setForm(emptyVenue)
      setStatus('success')
      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось удалить площадку.'
      setError(message)
      setStatus('error')
    }
  }

  return (
    <section className="admin">
      <div className="admin__header">
        <div>
          <p className="admin__eyebrow">Площадки</p>
          <h2 className="admin__title">Управление площадками</h2>
        </div>
        <div className="admin__select">
          <label htmlFor="venueSelect">Редактировать</label>
          <select
            id="venueSelect"
            value={selectedId}
            onChange={(event) => handleSelect(event.target.value)}
          >
            <option value="">Новая площадка</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form className="admin__form" onSubmit={handleSubmit}>
        <label>
          ID (опционально)
          <input
            type="text"
            value={form.id}
            onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))}
          />
        </label>
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
        {selectedVenue && (
          <button className="admin__danger" type="button" onClick={handleDelete}>
            Удалить площадку
          </button>
        )}
      </form>
    </section>
  )
}

export default VenueManager
