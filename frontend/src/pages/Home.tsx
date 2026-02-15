import { useEffect, useState } from 'react'

interface User {
  username: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me/', {
          method: 'GET',
          credentials: 'include',
        })

        if (res.ok) {
          const data = await res.json()
          setUser(data)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error(err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (loading) return <div>Načítám...</div>

  return (
    <div>
      <h1>Domovská stránka</h1>
      {user ? (
        <p>Vítej, {user.username}!</p>
      ) : (
        <p>Nejste přihlášen. <a href="/login">Přihlaste se</a></p>
      )}
    </div>
  )
}
