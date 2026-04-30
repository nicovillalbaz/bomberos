import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Perfil } from '../types'
import { supabase, getCurrentUser, getCurrentProfile, isAdmin, isOfficialOrAdmin, isActive } from '../lib/supabase'

interface AuthContextType {
  user: User | null
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
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      if (currentUser) {
        const prof = await getCurrentProfile()
        setProfile(prof)
      } else {
        setProfile(null)
      }
    } catch {
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshProfile()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshProfile()
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
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
