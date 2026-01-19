import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

type Props = {
  onClose: () => void
}

function AuthModal({ onClose }: Props) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('loading')
    setError(null)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка авторизации'
      setError(message)
      setStatus('error')
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__overlay" onClick={onClose} />
      <div className="modal__content" role="document">
        <div className="modal__header">
          <div>
            <p className="modal__eyebrow">Аккаунт</p>
            <h2 className="modal__title">
              {mode === 'login' ? 'Вход' : 'Регистрация'}
            </h2>
          </div>
          <button className="modal__close" type="button" onClick={onClose}>
            Закрыть
          </button>
        </div>

        <div className="modal__tabs">
          <button
            className={`modal__tab${mode === 'login' ? ' modal__tab--active' : ''}`}
            type="button"
            onClick={() => setMode('login')}
          >
            Вход
          </button>
          <button
            className={`modal__tab${mode === 'register' ? ' modal__tab--active' : ''}`}
            type="button"
            onClick={() => setMode('register')}
          >
            Регистрация
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <label className="modal__field">
            Почта
            <input
              className="modal__input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="modal__field">
            Пароль
            <input
              className="modal__input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>

          {error && <div className="modal__status modal__status--error">{error}</div>}

          <button className="modal__primary" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Подождите...' : 'Продолжить'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthModal
