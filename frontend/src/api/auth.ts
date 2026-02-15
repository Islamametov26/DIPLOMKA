import { request } from './client'
import type { User } from '../types/user'

type AuthResponse = {
  token: string
  user: User
}

export async function register(username: string, password: string) {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
}

export async function login(username: string, password: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
}

export async function fetchProfile() {
  return request<User>('/api/profile')
}
