import { useAuth } from '../context/AuthContext'

type Props = {
  onClose: () => void
}

function ProfileModal({ onClose }: Props) {
  const { user, logout } = useAuth()

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__overlay" onClick={onClose} />
      <div className="modal__content" role="document">
        <div className="modal__header">
          <div>
            <p className="modal__eyebrow">Профиль</p>
            <h2 className="modal__title">{user?.username}</h2>
          </div>
          <div className="modal__actions">
            <button className="modal__close" type="button" onClick={onClose}>
              Закрыть
            </button>
            <button className="modal__secondary" type="button" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>

        <div className="modal__section">
          <h3 className="modal__section-title">Аккаунт</h3>
          <p className="modal__description">
            Сайт работает в формате информационной афиши: здесь можно смотреть события, площадки и расписание.
          </p>
          <div className="modal__meta">
            <span>Логин: {user?.username}</span>
            <span>Email (системный): {user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
