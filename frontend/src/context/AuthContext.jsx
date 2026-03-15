import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const saved = localStorage.getItem('user')
    if (token && saved) {
      try {
        setUser(JSON.parse(saved))
        api.get('/auth/me').then(res => {
          const u = res.data.user
          setUser({ ...u, ...u.profile })
          localStorage.setItem('user', JSON.stringify({ ...u, ...u.profile }))
        }).catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }).finally(() => setLoading(false))
      } catch {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = (userData, token) => {

    const merged = { ...userData, ...(userData.profile || {}) }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(merged))
    setUser(merged)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)