import type { ComponentType } from 'react'
import {
  Cog6ToothIcon,
  CubeIcon,
  DocumentChartBarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import logo from '../assets/WPA_icon.webp'

type RoutePath = '/login' | '/equipment' | '/events' | '/measurements'

type NavItem = {
  path: RoutePath
  label: string
  isProtected: boolean
}

type HeaderProps = {
  username: string | null
  currentPath: string
  navItems: NavItem[]
  isLoggedIn: boolean
  onNavigate: (path: string) => void
  onNavigateLogin: () => void
  onLogout: () => void
}

const iconByPath: Record<RoutePath, ComponentType<{ className?: string }>> = {
  '/login': UserCircleIcon,
  '/equipment': CubeIcon,
  '/events': Cog6ToothIcon,
  '/measurements': DocumentChartBarIcon,
}

export default function Header({
  username,
  currentPath,
  navItems,
  isLoggedIn,
  onNavigate,
  onNavigateLogin,
  onLogout,
}: HeaderProps) {
  const visibleItems = navItems.filter((item) => isLoggedIn || !item.isProtected)

  return (
    <header className="border-b-[10px] border-[#ececec] bg-[var(--dark-red-header)]">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={logo}
            alt="WPA logo"
            className="h-12 w-12 rounded-full border-2 border-white object-cover"
          />

          <div className="flex min-w-0 flex-col gap-0.5">
            <button
              type="button"
              className="truncate border-none bg-transparent text-left text-xl leading-tight font-bold text-white md:text-2xl"
              onClick={() => onNavigate(isLoggedIn ? '/equipment' : '/login')}
            >
              Para atletika - Správa náčiní
            </button>
            <p className="m-0 truncate text-sm text-white/90 md:text-base">
              Olomouc WPA Women's Grand Prix - July 2-4, 2026
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {isLoggedIn ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white md:text-base">
                <UserCircleIcon className="h-5 w-5" />
                {username}
              </span>
              <button
                type="button"
                className="rounded-md border border-white bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                onClick={onLogout}
              >
                Odhlásit se
              </button>
            </>
          ) : (
            <button
              type="button"
              className="rounded-md border border-white bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100"
              onClick={onNavigateLogin}
            >
              Přihlásit se
            </button>
          )}
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto whitespace-nowrap px-4 md:px-6">
        {visibleItems.map((item) => {
          const Icon = iconByPath[item.path as RoutePath]

          return (
            <button
              key={item.path}
              type="button"
              className={`inline-flex items-center gap-2 rounded-t-md px-4 py-2 text-base font-semibold transition-colors md:text-lg ${
                currentPath === item.path
                  ? 'bg-[var(--dark-red-btn)] text-white'
                  : 'text-white/90 hover:bg-[var(--dark-red-btn)]/70 hover:text-white'
              }`}
              onClick={() => onNavigate(item.path)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
