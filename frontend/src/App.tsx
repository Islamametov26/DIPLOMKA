import { useEffect, useState } from 'react'
import './App.css'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import { useAuth } from './context/AuthContext'
import { useLocale } from './context/LocaleContext'
import AdminPage from './pages/AdminPage'
import EventDetailsPage from './pages/EventDetailsPage'
import EventsPage from './pages/EventsPage'
import VenuesPage from './pages/VenuesPage'

function App() {
  const { user } = useAuth()
  const { locale, setLocale, t } = useLocale()
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
  const [aboutOpen, setAboutOpen] = useState(false)
  const [route, setRoute] = useState(window.location.pathname)
  const isAdmin = route.startsWith('/admin')
  const isVenues = route.startsWith('/venues')
  const eventMatch = route.match(/^\/events\/([^/]+)$/)
  const eventId = eventMatch ? eventMatch[1] : ''
  const isEventDetails = Boolean(eventId)

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

  return (
    <div className="app">
      <header className="app__header">
        <a className="app__brand" href="/" onClick={handleNavLink('/')}>
          afisha aia
        </a>
        <nav className="app__nav" aria-label="Primary" />
        <div className="app__actions">
          <div className="app__nav">
            <a
              className={`app__link${!isAdmin && !isVenues ? ' app__link--active' : ''}`}
              href="/"
              onClick={handleNavLink('/')}
            >
              {t('nav.events')}
            </a>
            <a
              className={`app__link${isVenues ? ' app__link--active' : ''}`}
              href="/venues"
              onClick={handleNavLink('/venues')}
            >
              {t('nav.venues')}
            </a>
            <button className="app__link" type="button" onClick={() => setAboutOpen(true)}>
              {t('nav.about')}
            </button>
          </div>
          <div className="app__lang">
            {(['ru', 'kk', 'en'] as const).map((item) => (
              <button
                key={item}
                className={`app__lang-button${locale === item ? ' app__lang-button--active' : ''}`}
                type="button"
                onClick={() => setLocale(item)}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
          {user ? (
            <button className="app__profile" type="button" onClick={() => setProfileOpen(true)}>
              {user.username}
            </button>
          ) : (
            <button className="app__profile" type="button" onClick={() => setAuthOpen(true)}>
              {t('auth.login')}
            </button>
          )}
          <button className="theme-toggle" type="button" onClick={toggleTheme}>
            {theme === 'light' ? t('theme.dark') : t('theme.light')}
          </button>
        </div>
      </header>
      <main className="app__main">
        {isAdmin ? (
          <AdminPage onRequireAuth={() => setAuthOpen(true)} />
        ) : isVenues ? (
          <VenuesPage />
        ) : isEventDetails ? (
          <EventDetailsPage eventId={eventId} onBack={() => navigate('/')} onRequireAuth={() => setAuthOpen(true)} />
        ) : (
          <EventsPage onOpenEvent={(id) => navigate(`/events/${id}`)} />
        )}
      </main>
      <footer className="site-footer">
        <div className="site-footer__top">
          <div className="site-footer__column">
            <p className="site-footer__title">Поддержка</p>
            <a
              className="site-footer__link"
              href="https://t.me/jukephis"
              target="_blank"
              rel="noreferrer"
            >
              Telegram: @jukephis
            </a>
          </div>
          <div className="site-footer__column">
            <p className="site-footer__title">Навигация</p>
            <a className="site-footer__link" href="/" onClick={handleNavLink('/')}>
              Афиша
            </a>
            <a className="site-footer__link" href="/venues" onClick={handleNavLink('/venues')}>
              Площадки
            </a>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} afisha aia</span>
          <span>Все права защищены</span>
        </div>
      </footer>
      {aboutOpen && (
        <div className="about-drawer" role="dialog" aria-modal="true" aria-label="О нас и контакты">
          <button className="about-drawer__overlay" type="button" onClick={() => setAboutOpen(false)} />
          <aside className="about-drawer__panel">
            <button className="about-drawer__close" type="button" onClick={() => setAboutOpen(false)}>
              {t('drawer.close')}
            </button>
            <p className="about-drawer__eyebrow">{t('drawer.about')}</p>
            <h2 className="about-drawer__title">afisha aia</h2>
            <p className="about-drawer__text">{t('drawer.aboutText')}</p>
            <p className="about-drawer__eyebrow">{t('drawer.contacts')}</p>
            <div className="about-drawer__contacts">
              <a href="tel:+77780089866">+7 778 008 98 66</a>
              <a href="https://t.me/ametov180" target="_blank" rel="noreferrer">
                Telegram: @ametov180
              </a>
            </div>
          </aside>
        </div>
      )}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {profileOpen && user && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  )
}

export default App
