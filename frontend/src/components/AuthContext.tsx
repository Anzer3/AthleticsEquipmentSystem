import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { me } from '../api/auth'

type AuthContextType = {
  user: { username: string } | null
  setUser: (user: { username: string } | null) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ username: string } | null>(null)

  const refreshUser = useCallback(async () => {
    const data = await me()
    setUser(data)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
