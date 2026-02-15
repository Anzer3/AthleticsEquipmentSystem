import { getCsrfToken } from '../utils/csrf'

export async function login(username: string, password: string) {
  const res = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken() || '',
    },
    body: JSON.stringify({ username, password }),
    credentials: 'include', // musí být, aby šla session cookie
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.detail || 'Login failed')
  }

  return res.json()
}

export async function logout() {
  const res = await fetch('/api/auth/logout/', {
    method: 'POST',
    headers: { 'X-CSRFToken': getCsrfToken() || '' },
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Logout failed')
  return res.json()
}

export async function me() {
  const res = await fetch('/api/auth/me/', {
    credentials: 'include',
  })
  if (!res.ok) return null
  return res.json()
}
