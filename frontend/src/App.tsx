import { useEffect, useState } from 'react'
import { login, logout, me } from './api/auth'
import Footer from './components/Footer'
import Header from './components/Header'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ModulePage from './pages/ModulePage'

type RoutePath =
  | '/'
  | '/login'
  | '/dashboard'
  | '/equipment'
  | '/events'
  | '/measurements'
  | '/logs'

type RouteInfo = {
  label: string
  isProtected: boolean
  showInNav: boolean
}

const ROUTES: Record<RoutePath, RouteInfo> = {
  '/': {
    label: 'Home',
    isProtected: false,
    showInNav: false,
  },
  '/login': {
    label: 'Login',
    isProtected: false,
    showInNav: false,
  },
  '/dashboard': {
    label: 'Dashboard',
    isProtected: true,
    showInNav: true,
  },
  '/equipment': {
    label: 'Prehled nacini',
    isProtected: true,
    showInNav: true,
  },
  '/events': {
    label: 'Priprava soutezi',
    isProtected: true,
    showInNav: true,
  },
  '/measurements': {
    label: 'Mereni',
    isProtected: true,
    showInNav: true,
  },
  '/logs': {
    label: 'Logs',
    isProtected: true,
    showInNav: true,
  },
}

function isRoutePath(value: string): value is RoutePath {
  return value in ROUTES
}

function getCurrentPath(): RoutePath {
  return isRoutePath(window.location.pathname) ? window.location.pathname : '/'
}

function App() {
  const [path, setPath] = useState<RoutePath>(getCurrentPath())
  const [username, setUsername] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const navigate = (nextPath: RoutePath) => {
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

    if (ROUTES[path].isProtected && !username) {
      navigate('/login')
    }
  }, [loadingUser, path, username])

  const handleLogin = async (submittedUsername: string, password: string) => {
    const result = await login(submittedUsername, password)

    if (!result.success) {
      return result.error ?? 'Prihlaseni se nezdarilo.'
    }

    setUsername(result.username ?? submittedUsername)
    navigate('/dashboard')
    return null
  }

  const handleLogout = async () => {
    await logout()
    setUsername(null)
    navigate('/login')
  }

  const navItems = (Object.entries(ROUTES) as Array<[RoutePath, RouteInfo]>)
    .filter(([, routeInfo]) => routeInfo.showInNav)
    .map(([routePath, routeInfo]) => ({
      path: routePath,
      label: routeInfo.label,
      isProtected: routeInfo.isProtected,
    }))

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

    if (path === '/') {
      return (
        <div className="w-full flex justify-center">
          <HomePage username={username} onGoToLogin={() => navigate('/login')} />
        </div>
      )
    }

    if (!username) {
      return null
    }

    if (path === '/dashboard') {
      return <DashboardPage username={username} />
    }

    if (path === '/equipment') {
      return (
        <ModulePage
          title="Prehled nacini"
          description="Evidence nacini a jejich aktualni stav v systemu."
          listEndpoint="/api/equipments/"
          detailEndpointBase="/api/equipments/"
          fields={[
            { key: 'athlete_number', label: 'Cislo atleta' },
            { key: 'category', label: 'Kategorie' },
            { key: 'equipment_type', label: 'Typ nacini' },
            { key: 'measured', label: 'Zmereno' },
            { key: 'status', label: 'Stav' },
          ]}
          filterKeys={['category', 'equipment_type', 'status', 'measured']}
        />
      )
    }

    if (path === '/events') {
      return (
        <ModulePage
          title="Priprava soutezi"
          description="Prehled a planovani souteznich udalosti."
          listEndpoint="/api/events/"
          detailEndpointBase="/api/events/"
          fields={[
            { key: 'name', label: 'Nazev' },
            { key: 'category', label: 'Kategorie' },
            { key: 'status', label: 'Stav' },
            { key: 'start_time', label: 'Zacatek' },
            { key: 'location', label: 'Lokace' },
          ]}
          filterKeys={['category', 'status', 'location']}
        />
      )
    }

    if (path === '/measurements') {
      return (
        <ModulePage
          title="Mereni"
          description="Zaznamy mereni atletickeho nacini."
          listEndpoint="/api/measurements/"
          detailEndpointBase="/api/measurements/"
          fields={[
            { key: 'equipment', label: 'Nacini' },
            { key: 'status', label: 'Stav mereni' },
            { key: 'property', label: 'Vlastnost' },
            { key: 'value', label: 'Hodnota' },
            { key: 'unit', label: 'Jednotka' },
          ]}
          filterKeys={['status', 'property', 'unit']}
        />
      )
    }

    return (
      <ModulePage
        title="Logs"
        description="Auditni log operaci v systemu."
        listEndpoint="/api/logs/"
        detailEndpointBase="/api/logs/"
        fields={[
          { key: 'action', label: 'Akce' },
          { key: 'user', label: 'Uzivatel' },
          { key: 'detail', label: 'Detail' },
          { key: 'timestamp', label: 'Cas' },
        ]}
        filterKeys={['action', 'user']}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--white_color)]">
      <Header
        isLoggedIn={Boolean(username)}
        username={username}
        currentPath={path}
        navItems={navItems}
        onNavigate={navigate}
        onNavigateLogin={() => navigate('/login')}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex items-start justify-center p-4 md:p-6">{renderPage()}</main>

      <Footer />
    </div>
  )
}

export default App
