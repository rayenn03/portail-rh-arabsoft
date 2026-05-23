import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser && token) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // /login renvoie maintenant { token, user } en une seule réponse
    // → -1 round-trip HTTP, -1 requête DB
    const res = await api.post('/login', { email, password })
    const { token: jwt, user: userData } = res.data

    localStorage.setItem('token', jwt)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(jwt)
    setUser(userData)

    return userData
  }

  const refreshUser = async () => {
    try {
      const res  = await api.get('/me')
      const data = res.data
      localStorage.setItem('user', JSON.stringify(data))
      setUser(data)
      return data
    } catch (e) {
      console.error('Refresh user failed', e)
    }
  }

  const logout = async () => {
    try { await api.post('/logout') } catch (e) {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)