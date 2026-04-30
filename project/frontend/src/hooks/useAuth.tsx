import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Perfil } from '../types'
import { clearSessionProfile, getSessionProfile, isActive, isAdmin, isOfficialOrAdmin, refreshSessionProfile } from '../lib/supabase'

interface AuthContextType {
  user: { id: string } | null
  profile: Perfil | null
  loading: boolean
  isAdmin: boolean
  isOfficialOrAdmin: boolean
  isActive: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    try {
      const refreshed = await refreshSessionProfile()
      if (refreshed) {
        setProfile(refreshed)
        setUser({ id: refreshed.id })
      } else {
        setProfile(null)
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const localProfile = getSessionProfile()
    if (localProfile) {
      setProfile(localProfile)
      setUser({ id: localProfile.id })
    }
    refreshProfile()
  }, [])

  const signOut = async () => {
    clearSessionProfile()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: isAdmin(profile),
        isOfficialOrAdmin: isOfficialOrAdmin(profile),
        isActive: isActive(profile),
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
