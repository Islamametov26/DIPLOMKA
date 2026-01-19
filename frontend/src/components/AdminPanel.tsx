import { useMemo, useState } from 'react'
import { createEvent, updateEvent } from '../api/events'
import type { Event } from '../types/event'

type Props = {
  events: Event[]
  onSaved: () => void
}

const emptyForm = {
  title: '',
  description: '',
  startAt: '',
  endAt: '',
  venueId: '',
  published: false,
}

type FormState = typeof emptyForm

type Status = 'idle' | 'saving' | 'success' | 'error'

function toDateTimeLocal(value: string) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function AdminPanel({ events, onSaved }: Props) {
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const selectedEvent = useMemo(
    () => events.find((item) => item.id === selectedId) || null,
    [events, selectedId],
  )

  const handleSelect = (id: string) => {
    setSelectedId(id)
    if (!id) {
      setForm(emptyForm)
      return
    }
    const event = events.find((item) => item.id === id)
    if (!event) {
      return
    }
    setForm({
      title: event.title,
      description: event.description,
      startAt: toDateTimeLocal(event.startAt),
      endAt: toDateTimeLocal(event.endAt),
      venueId: event.venueId,
      published: event.published,
    })
  }

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const generateVenueId = () => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    setForm((prev) => ({ ...prev, venueId: id }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    setError(null)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      venueId: form.venueId.trim(),
      published: form.published,
    }

    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, payload)
      } else {
        await createEvent(payload)
      }
      setStatus('success')
      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить событие.'
      setError(message)
      setStatus('error')
    }
  }

  return (
    <section className="admin">
      <div className="admin__header">
        <div>
          <p className="admin__eyebrow">Админка</p>
          <h2 className="admin__title">Управление афишей</h2>
        </div>
        <div className="admin__select">
          <label htmlFor="eventSelect">Редактировать</label>
          <select
            id="eventSelect"
            value={selectedId}
            onChange={(event) => handleSelect(event.target.value)}
          >
            <option value="">Новое событие</option>
            {events.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form className="admin__form" onSubmit={handleSubmit}>
        <label>
          Название
          <input
            type="text"
            value={form.title}
            onChange={(event) => handleChange('title', event.target.value)}
            required
          />
        </label>
        <label>
          Описание
          <textarea
            value={form.description}
            onChange={(event) => handleChange('description', event.target.value)}
            rows={4}
            required
          />
        </label>
        <div className="admin__grid">
          <label>
            Начало
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(event) => handleChange('startAt', event.target.value)}
              required
            />
          </label>
          <label>
            Окончание
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(event) => handleChange('endAt', event.target.value)}
              required
            />
          </label>
        </div>
        <label>
          ID площадки
          <div className="admin__inline">
            <input
              type="text"
              value={form.venueId}
              onChange={(event) => handleChange('venueId', event.target.value)}
              required
            />
            <button className="admin__ghost" type="button" onClick={generateVenueId}>
              Сгенерировать
            </button>
          </div>
        </label>
        <label className="admin__checkbox">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) => handleChange('published', event.target.checked)}
          />
          Публиковать событие
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

export default AdminPanel
