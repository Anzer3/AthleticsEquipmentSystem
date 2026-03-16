import { useEffect, useState } from 'react'
import { login, logout, me } from './api/auth'
import Footer from './components/Footer'
import Header from './components/Header'
import {
  EquipmentDetailPage,
  EquipmentPage,
  EventsPage,
  LoginPage,
  MeasurementDetailPage,
  MeasurementsPage,
} from './pages'

type StaticRoutePath = '/login' | '/equipment' | '/events' | '/measurements'

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
  '/measurements': {
    label: 'Měření',
    isProtected: true,
    showInNav: true,
  },
  '/events': {
    label: 'Soutěže',
    isProtected: true,
    showInNav: true,
  },
}

function isEquipmentDetailPath(value: string): boolean {
  return /^\/equipment\/[0-9a-fA-F-]{36}\/?$/.test(value)
}

function isMeasurementDetailPath(value: string): boolean {
  return /^\/measurements\/[0-9a-fA-F-]{36}\/?$/.test(value)
}

function getCurrentPath(): string {
  return window.location.pathname
}

function App() {
  const [path, setPath] = useState<string>(getCurrentPath())
  const [username, setUsername] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const navigate = (nextPath: string) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
    setPath(nextPath)
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
      navigate(username ? '/equipment' : '/login')
      return
    }

    if (path === '/login' && username) {
      navigate('/equipment')
      return
    }

    const isStaticProtectedRoute = path in ROUTES && ROUTES[path as StaticRoutePath].isProtected
    const isProtectedDetailRoute = isEquipmentDetailPath(path) || isMeasurementDetailPath(path)

    if ((isStaticProtectedRoute || isProtectedDetailRoute) && !username) {
      navigate('/login')
      return
    }

    if (!(path in ROUTES) && !isEquipmentDetailPath(path) && !isMeasurementDetailPath(path)) {
      navigate(username ? '/equipment' : '/login')
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

  const currentNavPath = isEquipmentDetailPath(path)
    ? '/equipment'
    : isMeasurementDetailPath(path)
      ? '/measurements'
      : path

  const renderPage = () => {
    if (loadingUser) {
      return (
        <div className="w-full flex justify-center">
          <section className="w-full max-w-2xl rounded-xl border border-[var(--light_red)] bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Nacitani</h1>
            <p>Zjistuji prihlaseni uzivatele...</p>
          </section>
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

    if (!username) {
      return null
    }

    if (path === '/equipment') {
      return <EquipmentPage onNavigateToDetail={(uuid) => navigate(`/equipment/${uuid}`)} />
    }

    if (isEquipmentDetailPath(path)) {
      const uuid = path.split('/')[2]
      return <EquipmentDetailPage equipmentUuid={uuid} onBack={() => navigate('/equipment')} />
    }

    if (path === '/events') {
      return <EventsPage />
    }

    if (path === '/measurements') {
      return <MeasurementsPage onNavigateToDetail={(uuid) => navigate(`/measurements/${uuid}`)} />
    }

    if (isMeasurementDetailPath(path)) {
      const uuid = path.split('/')[2]
      return <MeasurementDetailPage measurementUuid={uuid} onBack={() => navigate('/measurements')} />
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
        onNavigateLogin={() => navigate('/login')}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex items-start justify-center p-3 sm:p-4 md:p-6">{renderPage()}</main>

      <Footer />
    </div>
  )
}

export default App
