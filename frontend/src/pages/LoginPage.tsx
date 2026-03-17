import { useState } from 'react'
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/outline'

type LoginPageProps = {
  onSubmit: (username: string, password: string) => Promise<string | null>
}

export default function LoginPage({ onSubmit }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const loginError = await onSubmit(username.trim(), password)

    if (loginError) {
      setError(loginError)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-4">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-red-50 to-white px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
            <LockClosedIcon className="h-8 w-8 text-[var(--dark-red-btn)]" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Přihlášení</h1>
          <p className="mt-2 text-sm text-gray-500">Zadejte své údaje pro přístup do správy náčiní a soutěží.</p>
        </div>

        <form className="flex flex-col gap-5 px-8 pb-10" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-bold text-gray-700">Uživatelské jméno</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-3 text-sm text-gray-900 transition-all outline-none focus:border-[var(--dark-red-btn)] focus:bg-white focus:ring-2 focus:ring-red-100"
                placeholder="Např. admin"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-gray-700">Heslo</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-3 text-sm text-gray-900 transition-all outline-none focus:border-[var(--dark-red-btn)] focus:bg-white focus:ring-2 focus:ring-red-100"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 shadow-inner">
              <p className="font-semibold">{error}</p>
            </div>
          ) : null}

          <button
            type="submit"
            className="mt-4 flex w-full justify-center rounded-xl bg-[var(--dark-red-btn)] px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Ověřování...' : 'Přihlásit se do systému'}
          </button>
        </form>
      </section>
    </div>
  )
}
