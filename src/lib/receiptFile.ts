/**
 * Converts a payment receipt file into a data: URL that's small enough to
 * store directly on a Firestore document (payments.receipt_url). Firestore
 * caps a document at 1 MiB total, so images are downscaled/recompressed
 * client-side before encoding; PDFs can't be compressed so they're capped
 * at a smaller raw size instead.
 *
 * There's no Firebase Storage bucket on this project (Cloud Storage now
 * requires the paid Blaze plan even for a single small bucket), so this is
 * the pragmatic alternative for a low-volume manual-payment flow: receipts
 * are viewed by opening the data: URL directly (works as a normal <a href>
 * target, the browser renders/downloads it) - nothing is ever "hosted".
 */

const MAX_DATA_URL_LENGTH = 900_000 // leaves headroom under Firestore's 1 MiB document cap
const MAX_PDF_BYTES = 650_000
const MAX_IMAGE_DIMENSION = 1400
const JPEG_QUALITY_STEPS = [0.75, 0.6, 0.45, 0.3]

export class ReceiptTooLargeError extends Error {}

export async function fileToReceiptDataUrl(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    if (file.size > MAX_PDF_BYTES) {
      throw new ReceiptTooLargeError(
        "PDF fayl juda katta (maks. 650 KB). Iltimos, chekni rasm (JPEG/PNG) sifatida yuklang.",
      )
    }
    return await readAsDataUrl(file)
  }

  if (file.type.startsWith('image/')) {
    return await compressImage(file)
  }

  throw new Error("Faqat rasm yoki PDF fayl yuklang.")
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

async function compressImage(file: File): Promise<string> {
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

  throw new ReceiptTooLargeError(
    "Rasmni yetarlicha siqib bo'lmadi. Iltimos, aniqroq/kichikroq skrinshot yoki rasm yuklang.",
  )
}
