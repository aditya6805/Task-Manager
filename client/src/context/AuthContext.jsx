// Auth context for managing authentication state
// Usage: wrap your app with AuthProvider and use useAuthContext hook

import React, { createContext, useContext, useState, useEffect } from 'react'
import { onAuthChange, logout as firebaseLogout } from '../services/firebaseService'
import { syncUser } from '../services/userService'
import apiClient from '../services/api'

const AuthContext = createContext()

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      const syncAuthenticatedUser = async () => {
        try {
          if (authUser) {
            const token = await authUser.getIdToken()
            localStorage.setItem('authToken', token)

            await syncUser({
              name: authUser.displayName || authUser.email?.split('@')[0] || 'User',
              email: authUser.email,
            })

            const profileResponse = await apiClient.get('/users/profile')
            setProfile(profileResponse.data.data)
          } else {
            localStorage.removeItem('authToken')
            setProfile(null)
          }

          setUser(authUser)
        } catch (err) {
          setError(err.message)
          setUser(authUser)
        } finally {
          setLoading(false)
        }
      }

      syncAuthenticatedUser()
    })

    return unsubscribe
  }, [])
  
  useEffect(() => {
    const refreshToken = async () => {
      if (user) {
        try {
          const token = await user.getIdToken(true)
          localStorage.setItem('authToken', token)
        } catch (err) {
          console.error('Token refresh failed:', err)
        }
      }
    }
    
    refreshToken()
  }, [user])

  const logout = async () => {
    try {
      setError(null)
      await firebaseLogout()
      setUser(null)
      setProfile(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const value = {
    user,
    profile,
    role: profile?.role || 'user',
    loading,
    error,
    isAuthenticated: !!user,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
