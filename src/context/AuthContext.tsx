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
import { useLanguage } from '@/context/LanguageContext'
import type { Lang } from '@/i18n/translations'
import type { Profile } from '@/lib/types'

const VALID_LANGS: Lang[] = ['uz', 'en', 'ru']

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
  const { lang, setLang } = useLanguage()

  async function loadProfile() {
    try {
      const data = await apiFetch<Profile>('profile')
      setProfile(data)
      // Restore the language the user last used, on any device - see also
      // the push effect below, and the POST handling in
      // netlify/functions/profile.ts.
      if (data.language && VALID_LANGS.includes(data.language as Lang)) {
        setLang(data.language as Lang)
      }
    } catch {
      setProfile(null)
    }
  }

  // Whenever the active UI language changes (user picked a new one, or we
  // just pulled a saved one from the profile above), keep the profile doc
  // in sync so it follows the user back on their next login/device. The
  // `profile.language === lang` check makes this a no-op right after the
  // pull in loadProfile(), so it never loops.
  useEffect(() => {
    if (!user || !profile) return
    if (profile.language === lang) return
    apiFetch('profile', { method: 'POST', body: JSON.stringify({ language: lang }) })
      .then(() => setProfile((p) => (p ? { ...p, language: lang } : p)))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, user, profile])

  useEffect(() => {
    if (!auth) {
      // No Firebase config - nothing to subscribe to, but the rest of the
      // app (Home, About, Contact, Services, Booking form) should still
      // render normally with user/profile left as null.
      setLoading(false)
      return
    }
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
    if (!auth) return { error: "Xizmat hozircha mavjud emas. Birozdan so'ng qayta urinib ko'ring." }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (fullName) {
        await updateFirebaseProfile(cred.user, { displayName: fullName })
      }
      // full_name/phone/role live in our DB, not in Firebase. Create that
      // row now using the fresh ID token from the just-created user.
      await apiFetch('profile', {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName, phone, language: lang }),
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
    if (!auth) return { error: "Xizmat hozircha mavjud emas. Birozdan so'ng qayta urinib ko'ring." }
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (err) {
      const code = (err as { code?: string })?.code ?? ''
      return { error: firebaseErrorToUz(code) }
    }
  }

  async function signOut() {
    if (!auth) return
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
