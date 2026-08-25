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
    category: 'cleaning',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80',
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
    category: 'cleaning',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
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
    category: 'cleaning',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
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
    category: 'cleaning',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
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
    category: 'cleaning',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  },
  {
    // Repair/renovation category (added per business request): newly built
    // multi-story residential buildings need interior finishing work, not
    // just cleaning. These services use floor_multiplier since higher
    // floors cost more to service (material/equipment lifting, logistics).
    code: 'repair_painting',
    name_uz: "Bo'yash ishlari",
    name_en: 'Painting Services',
    name_ru: 'Малярные работы',
    description_uz:
      "Devor va shift bo'yash: shpaklash, primer va yakuniy bo'yoq qatlami. Yangi qurilgan xonadonlar uchun ideal.",
    property_type: 'home',
    pricing_unit: 'per_sqm',
    base_price: 0,
    extra_unit_price: 25000,
    min_price: 500000,
    multiplier: 1.0,
    is_active: true,
    sort_order: 6,
    category: 'repair',
    floor_multiplier: 0.03,
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
  },
  {
    code: 'repair_furniture',
    name_uz: 'Mebel yig\'ish va o\'rnatish',
    name_en: 'Furniture Assembly & Installation',
    name_ru: 'Сборка и установка мебели',
    description_uz:
      "Oshxona va shkaf garniturasi, karavot, stol-stul yig'ish hamda o'rnatish. Tajribali ustalar jamoasi.",
    property_type: 'home',
    pricing_unit: 'flat',
    base_price: 400000,
    extra_unit_price: 0,
    min_price: 400000,
    multiplier: 1.0,
    is_active: true,
    sort_order: 7,
    category: 'repair',
    floor_multiplier: 0.03,
    image: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=800&q=80',
  },
  {
    code: 'repair_renovation',
    name_uz: "To'liq remont",
    name_en: 'Full Renovation',
    name_ru: 'Полный ремонт',
    description_uz:
      "Yangi qavatli uylar uchun to'liq ichki remont: elektr, santexnika, gips karton, pol qoplamasi va bo'yash ishlari birgalikda.",
    property_type: 'home',
    pricing_unit: 'per_sqm',
    base_price: 0,
    extra_unit_price: 180000,
    min_price: 3000000,
    multiplier: 1.0,
    is_active: true,
    sort_order: 8,
    category: 'repair',
    floor_multiplier: 0.04,
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
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
