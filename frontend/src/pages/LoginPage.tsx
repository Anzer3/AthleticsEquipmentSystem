import { useState } from 'react'

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
    <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--light_red)] bg-white shadow-sm">
      <div className="bg-gradient-to-r from-red-50 via-white to-red-50 px-6 py-5">
        <h1 className="text-2xl font-black text-gray-900">Přihlášení</h1>
        <p className="mt-1 text-sm text-gray-600">Přihlaste se do správy náčiní a soutěží.</p>
      </div>

      <form className="flex flex-col gap-3 px-6 py-5" onSubmit={handleSubmit}>
        <label htmlFor="username" className="text-sm font-bold text-gray-700">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--dark-red-btn)] focus:ring-2 focus:ring-[var(--light_red)]"
          required
        />

        <label htmlFor="password" className="text-sm font-bold text-gray-700">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--dark-red-btn)] focus:ring-2 focus:ring-[var(--light_red)]"
          required
        />

        {error ? <p className="m-0 text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          className="mt-2 inline-flex w-fit rounded-md border border-[var(--dark-red-btn)] bg-[var(--dark-red-btn)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-95 disabled:cursor-default disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Přihlašování...' : 'Přihlásit se'}
        </button>
      </form>
    </section>
  )
}
