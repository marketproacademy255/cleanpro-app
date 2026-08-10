import type { DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot } from 'firebase-admin/firestore'

/** Turns a Firestore doc snapshot into a plain object with `id` set, or null if it doesn't exist. */
export function docData<T>(snap: DocumentSnapshot): (T & { id: string }) | null {
  if (!snap.exists) return null
  return { id: snap.id, ...(snap.data() as T) }
}

/** Turns a Firestore query snapshot into an array of plain objects with `id` set. */
export function queryData<T>(snap: QuerySnapshot): (T & { id: string })[] {
  return snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...(d.data() as T) }))
}
