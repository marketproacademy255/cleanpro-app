import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { apiFetch, ApiError } from '@/lib/api'
import type { Profile } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function firebaseErrorToUz(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return "Email manzili noto'g'ri."
    case 'auth/user-disabled':
      return 'Foydalanuvchi bloklangan.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return "Email yoki parol noto'g'ri."
    case 'auth/email-already-in-use':
      return "Bu email allaqachon ro'yxatdan o'tgan."
    case 'auth/weak-password':
      return "Parol kamida 6 belgidan iborat bo'lishi kerak."
    default:
      return "Xatolik yuz berdi. Qaytadan urinib ko'ring."
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile() {
    try {
      const data = await apiFetch<Profile>('profile')
      setProfile(data)
    } catch {
      setProfile(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await loadProfile()
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signUp(email: string, password: string, fullName: string, phone: string) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (fullName) {
        await updateFirebaseProfile(cred.user, { displayName: fullName })
      }
      // full_name/phone/role live in our DB, not in Firebase. Create that
      // row now using the fresh ID token from the just-created user.
      await apiFetch('profile', {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName, phone }),
      })
      await loadProfile()
      return { error: null }
    } catch (err) {
      if (err instanceof ApiError) return { error: err.message }
      const code = (err as { code?: string })?.code ?? ''
      return { error: firebaseErrorToUz(code) }
    }
  }

  async function signIn(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (err) {
      const code = (err as { code?: string })?.code ?? ''
      return { error: firebaseErrorToUz(code) }
    }
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  async function refreshProfile() {
    if (user) await loadProfile()
  }

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
