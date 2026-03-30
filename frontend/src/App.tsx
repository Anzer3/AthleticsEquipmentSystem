import { useEffect, useState } from 'react'
import { login, logout, me } from './api/auth'
import Footer from './components/Footer'
import Header from './components/Header'
import {
  CompletionPage,
  EquipmentDetailPage,
  EquipmentPage,
  EventsPage,
  LocationsPage,
  LoginPage,
  NotFoundPage,
  NewMeasurementPage,
  NewEquipmentPage,
} from './pages'

type StaticRoutePath =
  | '/login'
  | '/equipment'
  | '/events'
  | '/locations'
  | '/completion'
  | '/new-measurement'
  | '/new-equipment'

type RouteInfo = {
  label: string
  isProtected: boolean
  showInNav: boolean
}

const ROUTES: Record<StaticRoutePath, RouteInfo> = {
  '/login': {
    label: 'Přihlášení',
    isProtected: false,
    showInNav: false,
  },
  '/equipment': {
    label: 'Náčiní',
    isProtected: true,
    showInNav: true,
  },
  '/events': {
    label: 'Soutěže',
    isProtected: true,
    showInNav: true,
  },
  '/locations': {
    label: 'Lokace',
    isProtected: true,
    showInNav: true,
  },
  '/completion': {
    label: 'Kompletace',
    isProtected: true,
    showInNav: true,
  },
  '/new-measurement': {
    label: 'Nové měření',
    isProtected: true,
    showInNav: false,
  },
  '/new-equipment': {
    label: 'Nové náčiní',
    isProtected: true,
    showInNav: false,
  },
}

function isEquipmentDetailPath(value: string): boolean {
  return /^\/equipment\/[0-9a-fA-F-]{36}\/?$/.test(value)
}

function getCurrentPath(): string {
  return window.location.pathname
}

function isKnownPath(path: string): boolean {
  return path in ROUTES || isEquipmentDetailPath(path) || path === '/'
}

function App() {
  const [path, setPath] = useState<string>(getCurrentPath())
  const [username, setUsername] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const navigate = (nextPath: string) => {
    // nextPath can contain a query string.
    const url = new URL(nextPath, window.location.origin)
    if (window.location.pathname !== url.pathname || window.location.search !== url.search) {
      window.history.pushState({}, '', nextPath)
    }
    setPath(url.pathname)
  }

  useEffect(() => {
    const onPopState = () => {
      setPath(getCurrentPath())
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    const loadCurrentUser = async () => {
      const data = await me()
      setUsername(data.username)
      setLoadingUser(false)
    }

    void loadCurrentUser()
  }, [])

  useEffect(() => {
    if (loadingUser) {
      return
    }

    if (path === '/') {
      setTimeout(() => navigate(username ? '/equipment' : '/login'), 0)
      return
    }

    if (path === '/login' && username) {
      setTimeout(() => navigate('/equipment'), 0)
      return
    }

    const isStaticProtectedRoute = path in ROUTES && ROUTES[path as StaticRoutePath].isProtected
    const isProtectedDetailRoute = isEquipmentDetailPath(path)

    if ((isStaticProtectedRoute || isProtectedDetailRoute) && !username) {
      setTimeout(() => navigate('/login'), 0)
      return
    }

    if (!isKnownPath(path)) {
      return
    }
  }, [loadingUser, path, username])

  const handleLogin = async (submittedUsername: string, password: string) => {
    const result = await login(submittedUsername, password)

    if (!result.success) {
      return result.error ?? 'Prihlaseni se nezdarilo.'
    }

    setUsername(result.username ?? submittedUsername)
    navigate('/equipment')
    return null
  }

  const handleLogout = async () => {
    await logout()
    setUsername(null)
    navigate('/login')
  }

  const navItems = (Object.entries(ROUTES) as Array<[StaticRoutePath, RouteInfo]>)
    .filter(([, routeInfo]) => routeInfo.showInNav)
    .map(([routePath, routeInfo]) => ({
      path: routePath,
      label: routeInfo.label,
      isProtected: routeInfo.isProtected,
    }))

  const currentNavPath = isEquipmentDetailPath(path) ? '/equipment' : path

  const renderPage = () => {
    if (loadingUser) {
      return (
        <div className="w-full flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
            <span className="h-12 w-12 animate-spin rounded-full border-4 border-red-100 border-t-[var(--dark-red-btn)]" aria-hidden="true" />
            <p className="text-sm font-semibold text-gray-700">Načítám aplikaci...</p>
          </div>
        </div>
      )
    }

    if (path === '/login') {
      return (
        <div className="w-full flex justify-center">
          <LoginPage onSubmit={handleLogin} />
        </div>
      )
    }

    if (!isKnownPath(path)) {
      return <NotFoundPage onGoHome={() => navigate(username ? '/equipment' : '/login')} />
    }

    if (!username) {
      return null
    }

    if (path === '/equipment') {
      return <EquipmentPage onNavigateToDetail={(uuid) => navigate(`/equipment/${uuid}`)} onNavigate={navigate} />
    }

    if (isEquipmentDetailPath(path)) {
      const uuid = path.split('/')[2]
      return <EquipmentDetailPage equipmentUuid={uuid} onBack={() => navigate('/equipment')} onNavigate={navigate} />
    }

    if (path === '/events') {
      return <EventsPage />
    }

    if (path === '/locations') {
      return <LocationsPage />
    }

    if (path === '/completion') {
      return <CompletionPage />
    }

    if (path === '/new-measurement') {
      return <NewMeasurementPage onBack={() => window.history.back()} />
    }

    if (path === '/new-equipment') {
      return (
        <NewEquipmentPage
          onBack={() => window.history.back()}
          onSuccess={(uuid) => navigate(`/equipment/${uuid}`)}
        />
      )
    }

    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--white_color)]">
      <Header
        isLoggedIn={Boolean(username)}
        username={username}
        currentPath={currentNavPath}
        navItems={navItems}
        onNavigate={navigate}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex items-start justify-center p-3 sm:p-4 md:p-6">{renderPage()}</main>

      <Footer />
    </div>
  )
}

export default App
