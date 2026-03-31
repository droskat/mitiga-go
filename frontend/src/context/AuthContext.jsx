import { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch } from '../hooks/useApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [ready, setReady] = useState(false)

  // On mount, if logged in but approved status is missing/false, re-check from server
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (user && token && !user.approved) {
      apiFetch('/profile')
        .then(profile => {
          if (profile.approved) {
            const updated = { ...user, approved: true }
            localStorage.setItem('user', JSON.stringify(updated))
            setUser(updated)
          }
        })
        .catch(() => {})
        .finally(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const updateApproval = (approved) => {
    const updated = { ...user, approved }
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (!ready) return null

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateApproval,
      isAuthenticated: !!user,
      isApproved: !!user?.approved,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
