/**
 * Compresses repair/renovation "project photos" (uploaded on the Booking
 * page when the repair category is selected - see Booking.tsx) into small
 * data: URLs, same approach as fileToReceiptDataUrl() in receiptFile.ts
 * (no Firebase Storage bucket on this project - see that file's comment).
 *
 * Tighter limits than a single receipt because up to MAX_PROJECT_PHOTOS of
 * these land on the *same* booking document alongside everything else -
 * Firestore's 1 MiB per-document cap has to cover all of them combined.
 */

export const MAX_PROJECT_PHOTOS = 2

const MAX_DATA_URL_LENGTH = 300_000
const MAX_IMAGE_DIMENSION = 1000
const JPEG_QUALITY_STEPS = [0.7, 0.55, 0.4, 0.25]

export class ProjectPhotoTooLargeError extends Error {}

export async function fileToProjectPhotoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Faqat rasm fayl yuklang (JPEG/PNG).')
  }

  const img = await loadImage(file)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("Brauzeringiz rasmni siqishni qo'llab-quvvatlamaydi.")
  ctx.drawImage(img, 0, 0, width, height)

  for (const quality of JPEG_QUALITY_STEPS) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl
  }

  throw new ProjectPhotoTooLargeError(
    "Rasmni yetarlicha siqib bo'lmadi. Iltimos, boshqa (aniqroq/kichikroq) rasm tanlang.",
  )
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error("Faylni o'qib bo'lmadi."))
    reader.readAsDataURL(file)
  })
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const dataUrl = await readAsDataUrl(file)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi."))
    img.src = dataUrl
  })
}
