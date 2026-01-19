import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchProfile, login, register } from '../api/auth'
import type { User } from '../types/user'

type AuthState = {
  user: User | null
  token: string | null
}

type AuthContextValue = {
  user: User | null
  token: string | null
  status: 'idle' | 'loading' | 'ready'
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_TOKEN = 'token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: window.localStorage.getItem(STORAGE_TOKEN),
  })
  const [status, setStatus] = useState<AuthContextValue['status']>('idle')

  const setToken = useCallback((token: string | null) => {
    if (token) {
      window.localStorage.setItem(STORAGE_TOKEN, token)
    } else {
      window.localStorage.removeItem(STORAGE_TOKEN)
    }
    setState((prev) => ({ ...prev, token }))
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!state.token) {
      setState((prev) => ({ ...prev, user: null }))
      return
    }
    setStatus('loading')
    try {
      const profile = await fetchProfile()
      setState((prev) => ({ ...prev, user: profile }))
    } catch {
      setToken(null)
      setState({ user: null, token: null })
    } finally {
      setStatus('ready')
    }
  }, [setToken, state.token])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  const handleLogin = useCallback(async (email: string, password: string) => {
    const response = await login(email, password)
    setToken(response.token)
    setState({ token: response.token, user: response.user })
  }, [setToken])

  const handleRegister = useCallback(async (email: string, password: string) => {
    const response = await register(email, password)
    setToken(response.token)
    setState({ token: response.token, user: response.user })
  }, [setToken])

  const handleLogout = useCallback(() => {
    setToken(null)
    setState({ token: null, user: null })
  }, [setToken])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      token: state.token,
      status,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      refreshProfile,
    }),
    [handleLogin, handleLogout, handleRegister, refreshProfile, state.token, state.user, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
