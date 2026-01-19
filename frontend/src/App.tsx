import { useEffect, useState } from 'react'
import './App.css'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import { useAuth } from './context/AuthContext'
import EventsPage from './pages/EventsPage'

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

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">AFISHA</div>
        <nav className="app__nav" aria-label="Primary" />
        <div className="app__actions">
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
        <EventsPage onRequireAuth={() => setAuthOpen(true)} />
      </main>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {profileOpen && user && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  )
}

export default App
