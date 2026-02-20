import { useState, useCallback } from 'react'
import type { AuthUser } from '../types'

const STORAGE_KEY = 'pos_user'

/**
 * useAuth — manages login state for the POS app
 *
 * WHY separate from STOCKER's auth:
 * Both apps share the same backend /auth/login endpoint,
 * but store tokens independently so a cashier can be logged
 * into POS while an admin is logged into STOCKER on another tab.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  })

  const login = useCallback((userData: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return { user, login, logout, isAuthenticated: !!user }
}
