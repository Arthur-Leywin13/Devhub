import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    authApi
      .getCurrentUser()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser } = await authApi.login(credentials)
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const loginWithProvider = useCallback(async (provider, redirectTo) => {
    const result = await authApi.loginWithProvider(provider, redirectTo)
    // En mode live, loginWithProvider redirige la page entière : il n'y a
    // rien à faire ici, le retour sur l'app relance getCurrentUser() au montage.
    if (result?.user) setUser(result.user)
    return result?.user
  }, [])

  const register = useCallback(async (data) => {
    const { user: newUser } = await authApi.register(data)
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const u = await authApi.getCurrentUser()
    setUser(u)
    return u
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, loginWithProvider, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext doit être utilisé à l\'intérieur de <AuthProvider>.')
  return ctx
}
