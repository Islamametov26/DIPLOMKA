import { useMemo, useState } from 'react'
import { createEvent, deleteEvent, updateEvent } from '../api/events'
import type { Category } from '../types/category'
import type { Event } from '../types/event'
import type { Venue } from '../types/venue'
import { cleanText } from '../utils/text'

type Props = {
  events: Event[]
  venues: Venue[]
  categories: Category[]
  onSaved: () => void
}

const emptyForm = {
  title: '',
  description: '',
  imageUrl: '',
  trailerUrl: '',
  galleryUrls: '',
  startAt: '',
  endAt: '',
  venueId: '',
  categoryId: '',
  published: true,
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

function AdminPanel({ events, venues, categories, onSaved }: Props) {
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const selectedEvent = useMemo(
    () => events.find((item) => item.id === selectedId) || null,
    [events, selectedId],
  )

  const eventsByDate = useMemo(
    () => [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [events],
  )

  const venuesById = useMemo(
    () =>
      venues.reduce<Record<string, string>>((acc, venue) => {
        acc[venue.id] = cleanText(venue.name, 'Площадка')
        return acc
      }, {}),
    [venues],
  )

  const categoriesById = useMemo(
    () =>
      categories.reduce<Record<string, string>>((acc, category) => {
        acc[category.id] = cleanText(category.name, 'Категория')
        return acc
      }, {}),
    [categories],
  )

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setStatus('idle')
    setError(null)

    if (!id) {
      setForm(emptyForm)
      return
    }

    const event = events.find((item) => item.id === id)
    if (!event) {
      return
    }

    setForm({
      title: cleanText(event.title, ''),
      description: cleanText(event.description, ''),
      imageUrl: event.imageUrl || '',
      trailerUrl: event.trailerUrl || '',
      galleryUrls: Array.isArray(event.galleryUrls) ? event.galleryUrls.join('\n') : '',
      startAt: toDateTimeLocal(event.startAt),
      endAt: toDateTimeLocal(event.endAt),
      venueId: event.venueId,
      categoryId: event.categoryId || '',
      published: event.published,
    })
  }

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateNew = () => {
    setSelectedId('')
    setForm(emptyForm)
    setStatus('idle')
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.startAt || !form.endAt || !form.venueId || !form.categoryId) {
      setStatus('error')
      setError('Заполните дату, время, площадку и категорию.')
      return
    }

    setStatus('saving')
    setError(null)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      trailerUrl: form.trailerUrl.trim(),
      galleryUrls: form.galleryUrls
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      venueId: form.venueId.trim(),
      categoryId: form.categoryId.trim(),
      published: form.published,
    }

    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, payload)
      } else {
        await createEvent(payload)
        setForm(emptyForm)
      }
      setStatus('success')
      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить событие.'
      setError(cleanText(message, 'Не удалось сохранить событие.'))
      setStatus('error')
    }
  }

  const handleDeleteById = async (eventId: string) => {
    const confirmed = window.confirm('Удалить событие?')
    if (!confirmed) {
      return
    }

    setDeletingId(eventId)
    setError(null)

    try {
      await deleteEvent(eventId)
      if (selectedId === eventId) {
        setSelectedId('')
        setForm(emptyForm)
      }
      setStatus('success')
      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось удалить событие.'
      setError(cleanText(message, 'Не удалось удалить событие.'))
      setStatus('error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="admin">
      <div className="admin__header">
        <div>
          <p className="admin__eyebrow">События</p>
          <h2 className="admin__title">Редактирование афиши</h2>
        </div>
        <div className="admin__actions">
          <button className="admin__ghost" type="button" onClick={handleCreateNew}>
            Добавить событие
          </button>
        </div>
      </div>

      <div className="admin__note">
        Формат сайта информационный: у события обязательно должно быть описание, место проведения и корректное время.
      </div>

      <div className="admin__list">
        {eventsByDate.length === 0 && <div className="admin__note">Событий пока нет.</div>}
        {eventsByDate.map((item) => {
          const isSelected = selectedId === item.id
          const isDeleting = deletingId === item.id
          const safeTitle = cleanText(item.title, 'Событие')
          return (
            <article className={`admin-item${isSelected ? ' admin-item--selected' : ''}`} key={item.id}>
              <div className="admin-item__main">
                <div className="admin-item__title">{safeTitle}</div>
                <div className="admin-item__meta">
                  {new Date(item.startAt).toLocaleString('ru-RU')} · {venuesById[item.venueId] || 'Площадка не найдена'} ·{' '}
                  {categoriesById[item.categoryId] || 'Без категории'} · {item.published ? 'Опубликовано' : 'Скрыто'}
                </div>
              </div>
              <div className="admin-item__actions">
                <button className="admin__secondary" type="button" onClick={() => handleSelect(item.id)}>
                  Редактировать
                </button>
                <button
                  className="admin__danger"
                  type="button"
                  onClick={() => handleDeleteById(item.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <form className="admin__form" onSubmit={handleSubmit}>
        <h3 className="admin__form-title">
          {selectedEvent ? `Редактирование: ${cleanText(selectedEvent.title, 'Событие')}` : 'Создание события'}
        </h3>

        <label>
          Название
          <input type="text" value={form.title} onChange={(event) => handleChange('title', event.target.value)} required />
        </label>

        <label>
          Описание события
          <textarea
            value={form.description}
            onChange={(event) => handleChange('description', event.target.value)}
            rows={5}
            required
          />
        </label>

        <label>
          Картинка (URL)
          <input
            type="url"
            placeholder="https://..."
            value={form.imageUrl}
            onChange={(event) => handleChange('imageUrl', event.target.value)}
          />
        </label>

        {form.imageUrl && <img className="admin__preview" src={form.imageUrl} alt="Превью события" loading="lazy" />}

        <label>
          Ссылка на трейлер (URL)
          <input
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={form.trailerUrl}
            onChange={(event) => handleChange('trailerUrl', event.target.value)}
          />
        </label>

        <label>
          Доп. картинки (каждая ссылка с новой строки)
          <textarea
            value={form.galleryUrls}
            onChange={(event) => handleChange('galleryUrls', event.target.value)}
            rows={4}
            placeholder={`https://...\nhttps://...`}
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
          Площадка
          <select value={form.venueId} onChange={(event) => handleChange('venueId', event.target.value)} required>
            <option value="">Выберите площадку</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {cleanText(venue.name, 'Площадка')}
              </option>
            ))}
          </select>
        </label>

        <label>
          Категория
          <select value={form.categoryId} onChange={(event) => handleChange('categoryId', event.target.value)} required>
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {cleanText(category.name, 'Категория')}
              </option>
            ))}
          </select>
        </label>

        <label>
          Статус публикации
          <select
            value={form.published ? 'published' : 'hidden'}
            onChange={(event) => handleChange('published', event.target.value === 'published')}
          >
            <option value="published">Опубликовано</option>
            <option value="hidden">Скрыто</option>
          </select>
        </label>

        {error && <div className="admin__status admin__status--error">{error}</div>}
        {status === 'success' && <div className="admin__status">Сохранено.</div>}

        <button className="admin__primary" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </form>
    </section>
  )
}

export default AdminPanel
