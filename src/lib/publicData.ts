import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './firestoreClient'
import type { Addon, Cleaner, Review, ServiceType } from './types'

/**
 * Public, non-sensitive catalog reads straight from Firestore (allowed by
 * firestore.rules for documents where is_active == true). No auth needed -
 * anyone browsing the site can see active services/addons/cleaners.
 *
 * `db` is null when Firebase isn't configured - return an empty list
 * instead of throwing so pages that show a catalog (Services, Booking)
 * still render normally (just with an empty/loading state) instead of
 * crashing when there's no backend available.
 */
async function fetchActive<T>(collectionName: string): Promise<(T & { id: string })[]> {
  if (!db) return []
  const snap = await getDocs(query(collection(db, collectionName), where('is_active', '==', true)))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }))
}

export async function fetchActiveServiceTypes(): Promise<ServiceType[]> {
  const rows = await fetchActive<ServiceType>('serviceTypes')
  return rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

export async function fetchActiveAddons(): Promise<Addon[]> {
  const rows = await fetchActive<Addon>('addons')
  return rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

export async function fetchActiveCleaners(): Promise<Cleaner[]> {
  const rows = await fetchActive<Cleaner>('cleaners')
  return rows.sort((a, b) => b.rating - a.rating)
}

/**
 * Approved customer reviews (Admin > Sharhlar) for the Home page's
 * aggregate rating badge + quote cards. Returns [] if there's no backend
 * or simply no reviews yet - callers should render nothing rather than a
 * placeholder, same principle as TeamPreview.tsx.
 */
export async function fetchApprovedReviews(): Promise<Review[]> {
  if (!db) return []
  const snap = await getDocs(query(collection(db, 'reviews'), where('is_approved', '==', true)))
  const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }))
  return rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}
