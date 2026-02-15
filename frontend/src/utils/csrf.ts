// utils/csrf.ts
export function getCsrfToken(): string | null {
  const match = document.cookie.match(new RegExp('(^| )csrftoken=([^;]+)'))
  return match ? match[2] : null
}
