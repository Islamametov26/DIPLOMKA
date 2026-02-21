const DEFAULT_BASE_URL =
  typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:8080'

const envBaseUrl = import.meta.env.VITE_API_BASE_URL
const baseUrl =
  typeof envBaseUrl === 'string' && envBaseUrl.trim().length > 0 ? envBaseUrl.trim() : DEFAULT_BASE_URL

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = new URL(path, baseUrl).toString()
  const token = window.localStorage.getItem('token')
  const headers = new Headers(init?.headers ?? {})
  headers.set('Accept', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
    headers.set('X-Auth-Token', token)
  }

  const response = await fetch(url, {
    ...init,
    headers,
  })

  if (!response.ok) {
    throw new Error(`Запрос не удался: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
