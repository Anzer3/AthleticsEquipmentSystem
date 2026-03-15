import { getCsrfToken } from '../utils/csrf'

type LoginResponse = {
  success: boolean
  username?: string
  error?: string
}

type MeResponse = {
  username: string | null
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  await fetch('/api/auth/csrf/', {
    method: 'GET',
    credentials: 'include',
  })

  const csrfToken = getCsrfToken()

  const response = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  })

  const data = (await response.json()) as LoginResponse
  if (!response.ok) {
    return {
      success: false,
      error: data.error ?? 'Login failed',
    }
  }

  return data
}

export async function logout(): Promise<void> {
  const csrfToken = getCsrfToken()

  await fetch('/api/auth/logout/', {
    method: 'POST',
    headers: {
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
    credentials: 'include',
  })
}

export async function me(): Promise<MeResponse> {
  const response = await fetch('/api/auth/me/', {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    return { username: null }
  }

  return (await response.json()) as MeResponse
}
