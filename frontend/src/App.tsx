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

  const handleNavLink =
    (path: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented) {
        return
      }
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }
      event.preventDefault()
      navigate(path)
    }

  const goToAdmin = () => navigate('/admin')

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">AFISHA</div>
        <nav className="app__nav" aria-label="Primary" />
        <div className="app__actions">
          <div className="app__nav">
            <a className={`app__link${!isAdmin && !isVenues ? ' app__link--active' : ''}`} href="/" onClick={handleNavLink('/')}>
              Афиша
            </a>
            <a
              className={`app__link${isVenues ? ' app__link--active' : ''}`}
              href="/venues"
              onClick={handleNavLink('/venues')}
            >
              Площадки
            </a>
          </div>
          {user ? (
            <button className="app__profile" type="button" onClick={() => setProfileOpen(true)}>
              {user.email}
            </button>
          ) : (
            <button className="app__profile" type="button" onClick={() => setAuthOpen(true)}>
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
          <VenuesPage onRequireAuth={() => setAuthOpen(true)} onAddEvent={goToAdmin} />
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

