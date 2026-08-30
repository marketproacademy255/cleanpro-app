import type { Lang } from '@/i18n/translations'
import type { ServiceType } from './types'

/**
 * Picks the right localized name for a Firestore-backed ServiceType.
 * Service data (unlike the static site copy) lives in the database and is
 * edited via the Admin panel, which currently only has a single "name_uz"
 * field - so name_en/name_ru are optional and may be missing on older
 * records. Falls back gracefully: uz -> name_uz, en -> name_en or name_uz,
 * ru -> name_ru or name_en or name_uz.
 */
export function getServiceName(service: ServiceType, lang: Lang): string {
  if (lang === 'en') return service.name_en || service.name_uz
  if (lang === 'ru') return service.name_ru || service.name_en || service.name_uz
  return service.name_uz
}

/**
 * Picks the right localized description for a ServiceType. Only
 * description_uz is guaranteed to exist (it's the single field the Admin
 * panel edits), so ru falls back to it when no translation was written.
 */
export function getServiceDescription(service: ServiceType, lang: Lang): string | null {
  if (lang === 'ru') return service.description_ru || service.description_uz
  return service.description_uz
}
