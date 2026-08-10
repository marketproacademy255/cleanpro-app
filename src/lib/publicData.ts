import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './firestoreClient'
import type { Addon, Cleaner, ServiceType } from './types'

/**
 * Public, non-sensitive catalog reads straight from Firestore (allowed by
 * firestore.rules for documents where is_active == true). No auth needed -
 * anyone browsing the site can see active services/addons/cleaners.
 */
async function fetchActive<T>(collectionName: string): Promise<(T & { id: string })[]> {
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
