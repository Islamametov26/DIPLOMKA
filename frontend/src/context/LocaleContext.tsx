import { createContext, useContext, useMemo, useState } from 'react'

export type Locale = 'ru' | 'kk' | 'en'

type LocaleContextValue = {
  locale: Locale
  localeTag: string
  setLocale: (next: Locale) => void
  t: (key: string, fallback?: string) => string
}

const STORAGE_LOCALE = 'locale'

const dictionaries: Record<Locale, Record<string, string>> = {
  ru: {
    'nav.events': 'Афиша',
    'nav.venues': 'Площадки',
    'nav.about': 'О нас',
    'auth.login': 'Войти',
    'theme.dark': 'Темная тема',
    'theme.light': 'Светлая тема',
    'drawer.close': 'Закрыть',
    'drawer.about': 'О НАС',
    'drawer.contacts': 'КОНТАКТЫ',
    'drawer.aboutText':
      'Я сделал этот сайт как удобную городскую афишу, чтобы быстро находить события и площадки в одном месте. Основную логику и структуру я продумал сам, а ИИ помог ускорить часть реализации и улучшить интерфейс.',
    'events.cityPortal': 'Городской портал',
    'events.all': 'Все',
    'events.searchPlaceholder': 'Поиск...',
    'events.searchAria': 'Поиск событий',
    'events.title': 'Афиша мероприятий',
    'events.subtitle':
      'События города на ближайшие недели: выставки, лекции, концерты и спектакли. Выбирайте формат и планируйте вечер заранее.',
    'events.popular': 'Популярное',
    'events.back': 'Назад',
    'events.forward': 'Вперед',
    'events.venue': 'Площадка',
    'events.buyTicket': 'Купить билет',
    'events.selected': 'Выбрано',
    'events.resetDate': 'Сбросить дату',
    'events.panelTitle': 'События',
    'events.loading': 'Загружаем афишу...',
    'events.emptyDate': 'Событий на эту дату нет.',
    'events.emptyFilter': 'Событий по текущему фильтру нет.',
    'events.showMore': 'Показать еще',
    'event.backToEvents': 'Назад к афише',
    'event.loading': 'Загружаем полную информацию о событии...',
    'event.loadError': 'Ошибка загрузки',
    'event.notFound': 'Событие не найдено.',
    'event.start': 'Начало',
    'event.end': 'Окончание',
    'event.address': 'Адрес',
    'event.trailerFrames': 'Трейлер и кадры из фильма',
    'event.trailerBad': 'Ссылка на трейлер указана, но не распознана как YouTube:',
    'event.trailerOpen': 'Открыть трейлер',
    'event.trailerMissing': 'Трейлер для этого фильма пока не добавлен.',
    'event.framesMissing': 'Кадры из фильма пока не добавлены.',
    'event.buyDialogAria': 'Выбор мест',
    'event.purchase': 'Покупка билетов',
    'event.close': 'Закрыть',
    'event.total': 'Итого',
    'event.buying': 'Покупаем...',
    'event.buyTickets': 'Купить билеты',
    'event.success': 'Покупка успешна! Билеты оформлены.',
    'event.seatSelectError': 'Выберите хотя бы одно место.',
    'event.seatConflict': 'Эти места уже заняты или уже куплены вами.',
    'event.purchaseError': 'Не удалось оформить покупку билетов.',
  },
  kk: {
    'nav.events': 'Афиша',
    'nav.venues': 'Алаңдар',
    'nav.about': 'Біз туралы',
    'auth.login': 'Кіру',
    'theme.dark': 'Қараңғы тақырып',
    'theme.light': 'Жарық тақырып',
    'drawer.close': 'Жабу',
    'drawer.about': 'БІЗ ТУРАЛЫ',
    'drawer.contacts': 'БАЙЛАНЫС',
    'drawer.aboutText':
      'Бұл сайтты мен қалалық афиша ретінде жасадым: іс-шаралар мен алаңдарды бір жерден тез табу үшін. Негізгі логика мен құрылымды өзім ойластырдым, ал ЖИ кейбір бөліктерді жылдам іске асыруға көмектесті.',
    'events.cityPortal': 'Қалалық портал',
    'events.all': 'Барлығы',
    'events.searchPlaceholder': 'Іздеу...',
    'events.searchAria': 'Оқиғаларды іздеу',
    'events.title': 'Іс-шаралар афишасы',
    'events.subtitle':
      'Алдағы апталардағы қала оқиғалары: көрмелер, лекциялар, концерттер мен спектакльдер. Форматты таңдап, кешті алдын ала жоспарлаңыз.',
    'events.popular': 'Танымал',
    'events.back': 'Артқа',
    'events.forward': 'Алға',
    'events.venue': 'Алаң',
    'events.buyTicket': 'Билет сатып алу',
    'events.selected': 'Таңдалды',
    'events.resetDate': 'Күнді тазалау',
    'events.panelTitle': 'Оқиғалар',
    'events.loading': 'Афиша жүктелуде...',
    'events.emptyDate': 'Бұл күнге оқиға жоқ.',
    'events.emptyFilter': 'Ағымдағы сүзгі бойынша оқиға жоқ.',
    'events.showMore': 'Тағы көрсету',
    'event.backToEvents': 'Афишаға оралу',
    'event.loading': 'Оқиға туралы толық ақпарат жүктелуде...',
    'event.loadError': 'Жүктеу қатесі',
    'event.notFound': 'Оқиға табылмады.',
    'event.start': 'Басталуы',
    'event.end': 'Аяқталуы',
    'event.address': 'Мекенжай',
    'event.trailerFrames': 'Трейлер және фильм кадрлары',
    'event.trailerBad': 'Трейлер сілтемесі берілген, бірақ YouTube ретінде танылмады:',
    'event.trailerOpen': 'Трейлерді ашу',
    'event.trailerMissing': 'Бұл фильмге трейлер әлі қосылмаған.',
    'event.framesMissing': 'Фильм кадрлары әлі қосылмаған.',
    'event.buyDialogAria': 'Орын таңдау',
    'event.purchase': 'Билет сатып алу',
    'event.close': 'Жабу',
    'event.total': 'Жалпы',
    'event.buying': 'Сатып алу...',
    'event.buyTickets': 'Билеттерді сатып алу',
    'event.success': 'Сатып алу сәтті аяқталды!',
    'event.seatSelectError': 'Кемінде бір орынды таңдаңыз.',
    'event.seatConflict': 'Бұл орындар бос емес немесе сіз бұрын сатып алғансыз.',
    'event.purchaseError': 'Билетті рәсімдеу мүмкін болмады.',
  },
  en: {
    'nav.events': 'Events',
    'nav.venues': 'Venues',
    'nav.about': 'About',
    'auth.login': 'Sign in',
    'theme.dark': 'Dark theme',
    'theme.light': 'Light theme',
    'drawer.close': 'Close',
    'drawer.about': 'ABOUT',
    'drawer.contacts': 'CONTACTS',
    'drawer.aboutText':
      'I built this site as a convenient city events board to quickly find events and venues in one place. I designed the core logic and structure myself, and AI helped speed up parts of implementation.',
    'events.cityPortal': 'City portal',
    'events.all': 'All',
    'events.searchPlaceholder': 'Search...',
    'events.searchAria': 'Search events',
    'events.title': 'Events Guide',
    'events.subtitle':
      'City events for upcoming weeks: exhibitions, lectures, concerts, and theater shows. Choose a format and plan your evening in advance.',
    'events.popular': 'Popular',
    'events.back': 'Back',
    'events.forward': 'Next',
    'events.venue': 'Venue',
    'events.buyTicket': 'Buy ticket',
    'events.selected': 'Selected',
    'events.resetDate': 'Reset date',
    'events.panelTitle': 'Events',
    'events.loading': 'Loading events...',
    'events.emptyDate': 'No events for this date.',
    'events.emptyFilter': 'No events for current filters.',
    'events.showMore': 'Show more',
    'event.backToEvents': 'Back to events',
    'event.loading': 'Loading full event details...',
    'event.loadError': 'Loading error',
    'event.notFound': 'Event not found.',
    'event.start': 'Start',
    'event.end': 'End',
    'event.address': 'Address',
    'event.trailerFrames': 'Trailer and movie frames',
    'event.trailerBad': 'Trailer URL is set, but not recognized as YouTube:',
    'event.trailerOpen': 'Open trailer',
    'event.trailerMissing': 'Trailer has not been added yet.',
    'event.framesMissing': 'Movie frames have not been added yet.',
    'event.buyDialogAria': 'Seat selection',
    'event.purchase': 'Ticket purchase',
    'event.close': 'Close',
    'event.total': 'Total',
    'event.buying': 'Processing...',
    'event.buyTickets': 'Buy tickets',
    'event.success': 'Purchase completed successfully!',
    'event.seatSelectError': 'Select at least one seat.',
    'event.seatConflict': 'These seats are already reserved or already bought by you.',
    'event.purchaseError': 'Could not complete ticket purchase.',
  },
}

const localeTagByLocale: Record<Locale, string> = {
  ru: 'ru-RU',
  kk: 'kk-KZ',
  en: 'en-US',
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === 'undefined') {
      return 'ru'
    }
    const raw = window.localStorage.getItem(STORAGE_LOCALE)
    return raw === 'kk' || raw === 'en' ? raw : 'ru'
  })

  const value = useMemo<LocaleContextValue>(() => {
    const t = (key: string, fallback?: string) => dictionaries[locale][key] ?? fallback ?? key
    const setLocaleSafe = (next: Locale) => {
      window.localStorage.setItem(STORAGE_LOCALE, next)
      setLocale(next)
    }
    return {
      locale,
      localeTag: localeTagByLocale[locale],
      setLocale: setLocaleSafe,
      t,
    }
  }, [locale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return context
}
