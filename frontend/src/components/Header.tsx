import { Link } from 'react-router-dom'
import { logout } from '../api/auth'
import { useAuth } from './AuthContext'

export default function Header() {
  const { user, setUser } = useAuth()

  const handleLogout = async () => {
    await logout()
    setUser(null)
  }

  return (
    <header>
      <Link to="/">Home</Link>
      {user ? (
        <>
          <span>Welcome, {user.username}</span>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </header>
  )
}
