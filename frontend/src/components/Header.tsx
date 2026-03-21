import type { ComponentType } from 'react'
import {
  CubeIcon,
  TrophyIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline'
import ActionButton from './ActionButton'
import logo from '../assets/WPA_icon.webp'

type NavItem = {
  path: string
  label: string
  isProtected: boolean
}

type HeaderProps = {
  username: string | null
  currentPath: string
  navItems: NavItem[]
  isLoggedIn: boolean
  onNavigate: (path: string) => void
  onLogout: () => void
}

const iconByPath: Record<string, ComponentType<{ className?: string }>> = {
  '/login': UserCircleIcon,
  '/equipment': CubeIcon,
  '/events': TrophyIcon,
  '/completion': WrenchScrewdriverIcon,
  '/new-measurement': ClipboardDocumentIcon,
}

export default function Header({
  username,
  currentPath,
  navItems,
  isLoggedIn,
  onNavigate,
  onLogout,
}: HeaderProps) {
  const visibleItems = navItems.filter((item) => isLoggedIn || !item.isProtected)

  return (
    <header className="border-b-[10px] border-[#ececec] bg-[var(--dark-red-header)]">
      <div className="flex flex-col items-start justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={logo}
            alt="WPA logo"
            className="h-10 w-10 rounded-full border-2 border-white object-cover sm:h-12 sm:w-12"
          />

          <div className="flex min-w-0 flex-col gap-0.5">
            <button
              type="button"
              className="truncate border-none bg-transparent text-left text-lg leading-tight font-bold text-white sm:text-xl md:text-2xl"
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
              <ActionButton onClick={onLogout} className="bg-white text-red-600 border-2">
                Odhlásit se
              </ActionButton>
            </>
          ) : null}
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 px-4 md:px-6">
        {visibleItems.map((item) => {
          const Icon = iconByPath[item.path] || CubeIcon

          return (
            <ActionButton
              key={item.path}
              variant={currentPath === item.path ? 'tab-active' : 'tab'}
              onClick={() => onNavigate(item.path)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </ActionButton>
          )
        })}
      </nav>
    </header>
  )
}
