// Original, in-house articles (not copied from any source). Kept as plain
// data instead of a CMS so the blog works with zero backend configuration
// - same "renders fine with no .env" principle as the rest of the site.

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  readMinutes: number
  image: string
  paragraphs: string[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'uy-tozalashda-kop-uchraydigan-xatolar',
    title: 'Uy tozalashda ko\'p uchraydigan 7 ta xato',
    excerpt: "Tozalashga sarflagan vaqtingiz behuda ketmasligi uchun odamlar ko'p qiladigan xatolardan saqlaning.",
    date: '2026-06-02',
    readMinutes: 4,
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=1200&q=80',
    paragraphs: [
      "Ko'pchilik uy tozalashni tez va oson ish deb o'ylaydi, lekin noto'g'ri tartib yoki vosita tanlash natijani sezilarli pasaytirishi mumkin. Quyida eng ko'p uchraydigan xatolar keltirilgan.",
      "1. Yuqoridan pastga tozalamaslik. Chang va kir har doim pastga tushadi — shuning uchun avval shift va javonlarni, keyin polni tozalash kerak. Aks holda allaqachon tozalangan polni qayta changlashga to'g'ri keladi.",
      "2. Bitta latta bilan hamma joyni artish. Oshxona va sanuzel uchun alohida lattalar ishlatilmasa, bakteriyalar bir joydan ikkinchisiga tarqaladi.",
      "3. Tozalash vositalarini aralashtirish. Ba'zi kimyoviy vositalar birga ishlatilganda zararli gaz chiqarishi mumkin — har doim yorliqni o'qing.",
      "4. Changyutgichni kamdan-kam tozalash. To'lib qolgan filtr changyutgich samaradorligini pasaytiradi.",
      "5. Deraza va oynalarni quyoshli kunda artish. Quyosh nurida tozalash vositasi tez qurib, dog' qoldiradi — bulutli kunni tanlang.",
      "6. Faqat ko'zga tashlanadigan joylarni tozalash. Eshik tutqichlari, o'chirgichlar, pult kabi ko'p qo'l tegadigan joylar ko'pincha e'tibordan chetda qoladi.",
      "Agar vaqtingiz cheklangan bo'lsa yoki chuqur tozalashga ehtiyoj sezsangiz, CleanPro jamoasi sizga yordam berishga tayyor.",
    ],
  },
  {
    slug: 'chuqur-tozalashni-qachon-buyurtma-qilish-kerak',
    title: "Chuqur tozalashni qachon buyurtma qilish kerak?",
    excerpt: "Oddiy tozalash va chuqur tozalash orasidagi farq hamda qaysi holatlarda qaysi birini tanlash kerakligi.",
    date: '2026-06-18',
    readMinutes: 3,
    image: 'https://images.unsplash.com/photo-1742483359033-13315b247c74?auto=format&fit=crop&w=1200&q=80',
    paragraphs: [
      "Standart tozalash kundalik tartibni saqlash uchun yetarli — chang artish, pol tozalash, sanuzel va oshxonani asosiy tozalash. Ammo ba'zi holatlarda bundan ko'proq narsa kerak bo'ladi.",
      "Ko'chib kirish yoki ko'chib chiqishdan oldin — yangi uy sotib olganda yoki ijaraga topshirishdan oldin, barcha yuzalar, shkaflar ichi va texnika chuqur tozalanishi tavsiya etiladi.",
      "Mavsumiy tozalash — yiliga 1-2 marta, mebel ostlari, derazalar, radiatorlar kabi kundalik e'tibordan chetda qoladigan joylarni tozalash foydali.",
      "Uzoq vaqt tozalanmagan xonadon — agar bir necha oydan beri professional tozalash bo'lmagan bo'lsa, chuqur tozalash bilan boshlash tavsiya etiladi, keyin standart tozalashga o'tish mumkin.",
      "Mehmon kutishdan oldin yoki katta tadbirdan keyin ham chuqur tozalash yaxshi tanlov bo'ladi.",
      "Qaysi xizmat kerakligiga aniq ishonch hosil qilolmasangiz, Xizmatlar sahifasidagi tavsiflarni ko'ring yoki band qilishdan oldin biz bilan bog'laning.",
    ],
  },
  {
    slug: 'ofisni-muntazam-tozalash-nima-uchun-muhim',
    title: 'Ofisni muntazam tozalash nima uchun muhim?',
    excerpt: "Toza ish joyi nafaqat estetik, balki xodimlar salomatligi va samaradorligiga ham bevosita ta'sir qiladi.",
    date: '2026-07-05',
    readMinutes: 3,
    image: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1200&q=80',
    paragraphs: [
      "Ofis — kuniga bir necha soat vaqt o'tkaziladigan joy, shuning uchun uning tozaligi ko'rinishdan ko'ra ko'proq narsaga ta'sir qiladi.",
      "Kasallik tarqalishining kamayishi. Klaviatura, sichqoncha, stol yuzalari va umumiy foydalanishdagi joylar ko'p bakteriya to'playdi. Muntazam tozalash kasallik ta'tillari sonini kamaytirishga yordam beradi.",
      "Xodimlar samaradorligi. Tartibsiz va chang bosgan muhit diqqatni tarqatadi, toza va tartibli ish joyi esa fokuslanishga yordam beradi.",
      "Mijozlar taassuroti. Ofisga tashrif buyuruvchi mijoz yoki hamkor uchun tozalik — kompaniyaning jiddiyligi haqidagi birinchi signal.",
      "Texnika umrining uzayishi. Chang kompyuter va boshqa texnikaning qizib ketishiga sabab bo'lishi mumkin — muntazam tozalash bu xavfni kamaytiradi.",
      "Ofis hajmi va ish tartibiga qarab, haftalik yoki oylik muntazam tozalash rejasini tanlash mumkin — bu bir martalik buyurtmaga qaraganda ham qulayroq, ham arzonroq.",
    ],
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}
