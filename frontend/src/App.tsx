import { useEffect, useState } from 'react'
import './App.css'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import { useAuth } from './context/AuthContext'
import AdminPage from './pages/AdminPage'
import EventsPage from './pages/EventsPage'
import VenuesPage from './pages/VenuesPage'

function App() {
  const { user } = useAuth()
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }
    const stored = window.localStorage.getItem('theme')
    return stored === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  const [authOpen, setAuthOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [route, setRoute] = useState(window.location.pathname)
  const isAdmin = route.startsWith('/admin')
  const isVenues = route.startsWith('/venues')

  useEffect(() => {
    const handlePop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const navigate = (path: string) => {
    if (window.location.pathname === path) {
      return
    }
    window.history.pushState({}, '', path)
    setRoute(path)
  }

  const goToAdmin = () => navigate('/admin')
  const goToHome = () => navigate('/')
  const goToVenues = () => navigate('/venues')

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">AFISHA</div>
        <nav className="app__nav" aria-label="Primary" />
        <div className="app__actions">
          <div className="app__nav">
            <button
              className={`app__link${!isAdmin && !isVenues ? ' app__link--active' : ''}`}
              type="button"
              onClick={goToHome}
            >
              Афиша
            </button>
            <button
              className={`app__link${isVenues ? ' app__link--active' : ''}`}
              type="button"
              onClick={goToVenues}
            >
              Площадки
            </button>
          </div>
          <button
            className="app__profile"
            type="button"
            onClick={isAdmin ? goToHome : goToAdmin}
          >
            {isAdmin ? 'На сайт' : 'Админка'}
          </button>
          {user ? (
            <button
              className="app__profile"
              type="button"
              onClick={() => setProfileOpen(true)}
            >
              {user.email}
            </button>
          ) : (
            <button
              className="app__profile"
              type="button"
              onClick={() => setAuthOpen(true)}
            >
              Войти
            </button>
          )}
          <button className="theme-toggle" type="button" onClick={toggleTheme}>
            {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
          </button>
        </div>
      </header>
      <main className="app__main">
        {isAdmin ? (
          <AdminPage onRequireAuth={() => setAuthOpen(true)} />
        ) : isVenues ? (
          <VenuesPage onRequireAuth={() => setAuthOpen(true)} />
        ) : (
          <EventsPage onRequireAuth={() => setAuthOpen(true)} />
        )}
      </main>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {profileOpen && user && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  )
}

export default App
