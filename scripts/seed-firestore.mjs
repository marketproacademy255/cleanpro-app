// One-time script to populate Firestore with starter data: service types,
// add-ons and cleaners (staff). Safe to re-run - it upserts by a stable
// `code` field (or name, for cleaners) so it won't create duplicates.
//
// Usage:
//   npm run seed:firestore
//
// Needs the same three server-side env vars as netlify/functions/*
// (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) -
// reads them from your local .env file via dotenv.

import 'dotenv/config'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY topilmadi. .env faylida to'ldiring (README'ga qarang).",
  )
  process.exit(1)
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
const db = getFirestore()

// Starter pricing (based on typical US cleaning-service pricing structure:
// Merry Maids, Molly Maid, MaidPro) adapted to the Uzbekistan market in UZS.
// Edit any time via the Admin panel -> "Xizmatlar va narxlar".
const serviceTypes = [
  {
    code: 'standard_home',
    name_uz: 'Standart tozalash',
    name_en: 'Standard Cleaning',
    name_ru: 'Стандартная уборка',
    description_uz:
      "Muntazam uy tozaligini saqlash uchun: chang artish, polni yuvish, sanuzel va oshxonani tozalash.",
    property_type: 'home',
    pricing_unit: 'per_room',
    base_price: 150000,
    extra_unit_price: 40000,
    min_price: 150000,
    multiplier: 1.0,
    is_active: true,
    sort_order: 1,
  },
  {
    code: 'deep_home',
    name_uz: 'Chuqur tozalash',
    name_en: 'Deep Cleaning',
    name_ru: 'Генеральная уборка',
    description_uz:
      "Har bir burchakni qamrab oluvchi mukammal tozalash: plintuslar, batareyalar, yorug'lik asboblari va boshqalar.",
    property_type: 'home',
    pricing_unit: 'per_room',
    base_price: 210000,
    extra_unit_price: 56000,
    min_price: 210000,
    multiplier: 1.4,
    is_active: true,
    sort_order: 2,
  },
  {
    code: 'move_home',
    name_uz: "Ko'chishdan oldin/keyin tozalash",
    name_en: 'Move In/Out Cleaning',
    name_ru: 'Уборка при переезде',
    description_uz: "Bo'sh xonadonni to'liq tozalash: shkaflar ichi, oynalar, chuqur yuvish.",
    property_type: 'home',
    pricing_unit: 'per_room',
    base_price: 240000,
    extra_unit_price: 64000,
    min_price: 240000,
    multiplier: 1.6,
    is_active: true,
    sort_order: 3,
  },
  {
    code: 'office_clean',
    name_uz: 'Ofis tozalash',
    name_en: 'Office Cleaning',
    name_ru: 'Уборка офисов',
    description_uz: "Ish joyingiz uchun professional tozalash xizmati, kv.m bo'yicha hisoblanadi.",
    property_type: 'office',
    pricing_unit: 'per_sqm',
    base_price: 0,
    extra_unit_price: 8000,
    min_price: 300000,
    multiplier: 1.0,
    is_active: true,
    sort_order: 4,
  },
  {
    // New service (added per business request): full post-renovation
    // cleaning for newly built multi-story residential buildings and
    // offices - construction dust, adhesive residue, paint splatter etc.,
    // which needs a heavier pass than a normal deep clean. Priced per sqm
    // like office cleaning, but at a higher rate given the extra labor.
    code: 'post_construction',
    name_uz: 'Qurilishdan keyingi tozalash',
    name_en: 'Post-Construction Cleaning',
    name_ru: 'Уборка после строительства',
    description_uz:
      "Yangi qurilgan ko'p qavatli uylar va ofislar uchun to'liq remontdan keyingi tozalash: qurilish changi, " +
      "bo'yoq va yelim izlari, derazalar va pollarning chuqur tozalanishi.",
    property_type: 'home',
    pricing_unit: 'per_sqm',
    base_price: 0,
    extra_unit_price: 12000,
    min_price: 400000,
    multiplier: 1.0,
    is_active: true,
    sort_order: 5,
  },
]

const addons = [
  { code: 'fridge_inside', name_uz: 'Muzlatgich ichkarisi', price: 30000, is_active: true, sort_order: 1 },
  { code: 'oven_inside', name_uz: 'Duxovka ichkarisi', price: 30000, is_active: true, sort_order: 2 },
  { code: 'cabinets_inside', name_uz: 'Shkaflar ichkarisi', price: 40000, is_active: true, sort_order: 3 },
  { code: 'windows_inside', name_uz: 'Oynalar (ichki tomondan)', price: 50000, is_active: true, sort_order: 4 },
  { code: 'balcony', name_uz: 'Balkon/loggiya', price: 40000, is_active: true, sort_order: 5 },
  { code: 'ironing', name_uz: 'Kir dazmollash', price: 35000, is_active: true, sort_order: 6 },
]

const cleaners = [
  {
    full_name: 'Madina Yusupova',
    phone: '+998901112233',
    bio: "Uy va ofislarni tozalashda 5 yillik tajribaga ega, ekologik vositalar bilan ishlaydi.",
    years_experience: 5,
    rating: 4.9,
  },
  {
    full_name: 'Aziz Rahimov',
    phone: '+998901112244',
    bio: "Chuqur tozalash va ko'chish oldidan tozalash bo'yicha mutaxassis.",
    years_experience: 4,
    rating: 4.8,
  },
  {
    full_name: 'Nilufar Karimova',
    phone: '+998901112255',
    bio: "Ofis va tijorat maydonlarini tozalashda ixtisoslashgan jamoa boshlig'i.",
    years_experience: 6,
    rating: 5.0,
  },
  {
    full_name: 'Bekzod Tursunov',
    phone: '+998901112266',
    bio: "Tez va sifatli xizmat, mijozlar tomonidan yuqori baholangan.",
    years_experience: 3,
    rating: 4.7,
  },
]

async function upsertByField(collectionName, field, rows, extra = {}) {
  for (const row of rows) {
    const existing = await db.collection(collectionName).where(field, '==', row[field]).limit(1).get()
    const data = { ...row, ...extra, created_at: extra.created_at ?? new Date().toISOString() }
    if (existing.empty) {
      await db.collection(collectionName).add(data)
      console.log(`+ ${collectionName}: ${row[field]}`)
    } else {
      await existing.docs[0].ref.set(data, { merge: true })
      console.log(`= ${collectionName}: ${row[field]} (already exists, updated)`)
    }
  }
}

async function main() {
  await upsertByField('serviceTypes', 'code', serviceTypes)
  await upsertByField('addons', 'code', addons)
  await upsertByField('cleaners', 'full_name', cleaners, {
    profile_id: null,
    photo_url: null,
    is_active: true,
  })
  console.log('Tayyor.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
