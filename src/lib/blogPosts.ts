// Original, in-house articles (not copied from any source). Kept as plain
// data instead of a CMS so the blog works with zero backend configuration
// - same "renders fine with no .env" principle as the rest of the site.
// Each post carries its own uz/en/ru copy so the Blog/BlogPost pages can
// render fully in whichever language the visitor has selected.

import type { Lang } from '@/i18n/translations'

interface LocalizedPostContent {
  title: string
  excerpt: string
  paragraphs: string[]
}

export interface BlogPost {
  slug: string
  date: string
  readMinutes: number
  image: string
  uz: LocalizedPostContent
  en: LocalizedPostContent
  ru: LocalizedPostContent
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'uy-tozalashda-kop-uchraydigan-xatolar',
    date: '2026-06-02',
    readMinutes: 4,
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=1200&q=80',
    uz: {
      title: "Uy tozalashda ko'p uchraydigan 7 ta xato",
      excerpt: "Tozalashga sarflagan vaqtingiz behuda ketmasligi uchun odamlar ko'p qiladigan xatolardan saqlaning.",
      paragraphs: [
        "Ko'pchilik uy tozalashni tez va oson ish deb o'ylaydi, lekin noto'g'ri tartib yoki vosita tanlash natijani sezilarli pasaytirishi mumkin. Quyida eng ko'p uchraydigan xatolar keltirilgan.",
        "1. Yuqoridan pastga tozalamaslik. Chang va kir har doim pastga tushadi — shuning uchun avval shift va javonlarni, keyin polni tozalash kerak. Aks holda allaqachon tozalangan polni qayta changlashga to'g'ri keladi.",
        "2. Bitta latta bilan hamma joyni artish. Oshxona va sanuzel uchun alohida lattalar ishlatilmasa, bakteriyalar bir joydan ikkinchisiga tarqaladi.",
        "3. Tozalash vositalarini aralashtirish. Ba'zi kimyoviy vositalar birga ishlatilganda zararli gaz chiqarishi mumkin — har doim yorliqni o'qing.",
        "4. Changyutgichni kamdan-kam tozalash. To'lib qolgan filtr changyutgich samaradorligini pasaytiradi.",
        "5. Deraza va oynalarni quyoshli kunda artish. Quyosh nurida tozalash vositasi tez qurib, dog' qoldiradi — bulutli kunni tanlang.",
        "6. Faqat ko'zga tashlanadigan joylarni tozalash. Eshik tutqichlari, o'chirgichlar, pult kabi ko'p qo'l tegadigan joylar ko'pincha e'tibordan chetda qoladi.",
        "Agar vaqtingiz cheklangan bo'lsa yoki chuqur tozalashga ehtiyoj sezsangiz, Prime Standard & Co jamoasi sizga yordam berishga tayyor.",
      ],
    },
    en: {
      title: '7 Common Mistakes People Make When Cleaning Their Home',
      excerpt: "Avoid the mistakes that waste the time you spend cleaning.",
      paragraphs: [
        "Most people think cleaning a home is quick and simple, but the wrong order or the wrong tools can noticeably weaken the result. Here are the most common mistakes.",
        "1. Not cleaning top to bottom. Dust and dirt always fall downward — so clean the ceiling and shelves first, then the floor. Otherwise you'll end up re-dusting a floor you already cleaned.",
        "2. Using one cloth for everything. If you don't use separate cloths for the kitchen and bathroom, bacteria spreads from one surface to another.",
        "3. Mixing cleaning products. Some chemicals release harmful gases when combined — always read the label.",
        "4. Rarely cleaning the vacuum cleaner. A clogged filter reduces the vacuum's effectiveness.",
        "5. Cleaning windows on a sunny day. Sunlight dries cleaning solution too fast and leaves streaks — pick a cloudy day instead.",
        "6. Only cleaning visible surfaces. High-touch spots like door handles, light switches and remote controls are often overlooked.",
        "If your time is limited or you feel you need a deep clean, the Prime Standard & Co team is ready to help.",
      ],
    },
    ru: {
      title: '7 частых ошибок при уборке дома',
      excerpt: 'Избегайте ошибок, из-за которых время, потраченное на уборку, проходит впустую.',
      paragraphs: [
        'Многие считают уборку дома быстрым и простым делом, но неправильный порядок действий или выбор средств может заметно ухудшить результат. Ниже — самые частые ошибки.',
        '1. Уборка не сверху вниз. Пыль и грязь всегда оседают вниз — сначала нужно протирать потолок и полки, затем пол. Иначе придётся заново убирать уже вымытый пол.',
        '2. Использование одной тряпки для всего. Если не использовать отдельные тряпки для кухни и санузла, бактерии переносятся с одной поверхности на другую.',
        '3. Смешивание чистящих средств. Некоторые химические вещества при смешивании выделяют вредный газ — всегда читайте этикетку.',
        '4. Редкая чистка пылесоса. Забитый фильтр снижает эффективность пылесоса.',
        '5. Мытьё окон в солнечный день. На солнце чистящее средство быстро высыхает и оставляет разводы — выбирайте пасмурный день.',
        '6. Уборка только заметных мест. Дверные ручки, выключатели, пульты — места, до которых часто дотрагиваются руками, — нередко остаются без внимания.',
        'Если у вас мало времени или нужна генеральная уборка, команда Prime Standard & Co готова помочь.',
      ],
    },
  },
  {
    slug: 'chuqur-tozalashni-qachon-buyurtma-qilish-kerak',
    date: '2026-06-18',
    readMinutes: 3,
    image: 'https://images.unsplash.com/photo-1742483359033-13315b247c74?auto=format&fit=crop&w=1200&q=80',
    uz: {
      title: 'Chuqur tozalashni qachon buyurtma qilish kerak?',
      excerpt: 'Oddiy tozalash va chuqur tozalash orasidagi farq hamda qaysi holatlarda qaysi birini tanlash kerakligi.',
      paragraphs: [
        "Standart tozalash kundalik tartibni saqlash uchun yetarli — chang artish, pol tozalash, sanuzel va oshxonani asosiy tozalash. Ammo ba'zi holatlarda bundan ko'proq narsa kerak bo'ladi.",
        "Ko'chib kirish yoki ko'chib chiqishdan oldin — yangi uy sotib olganda yoki ijaraga topshirishdan oldin, barcha yuzalar, shkaflar ichi va texnika chuqur tozalanishi tavsiya etiladi.",
        "Mavsumiy tozalash — yiliga 1-2 marta, mebel ostlari, derazalar, radiatorlar kabi kundalik e'tibordan chetda qoladigan joylarni tozalash foydali.",
        "Uzoq vaqt tozalanmagan xonadon — agar bir necha oydan beri professional tozalash bo'lmagan bo'lsa, chuqur tozalash bilan boshlash tavsiya etiladi, keyin standart tozalashga o'tish mumkin.",
        'Mehmon kutishdan oldin yoki katta tadbirdan keyin ham chuqur tozalash yaxshi tanlov bo\'ladi.',
        "Qaysi xizmat kerakligiga aniq ishonch hosil qilolmasangiz, Xizmatlar sahifasidagi tavsiflarni ko'ring yoki band qilishdan oldin biz bilan bog'laning.",
      ],
    },
    en: {
      title: 'When Should You Book a Deep Clean?',
      excerpt: 'The difference between standard and deep cleaning, and when to choose which one.',
      paragraphs: [
        "Standard cleaning is enough to maintain everyday tidiness — dusting, floors, and a basic pass of the bathroom and kitchen. But some situations call for more.",
        "Before moving in or out — when buying a new home or handing over a rental, it's recommended to deep clean all surfaces, inside cabinets and appliances.",
        "Seasonal cleaning — once or twice a year, it's worth cleaning spots that get overlooked day to day, like under furniture, windows and radiators.",
        "A home that hasn't been cleaned in a while — if there's been no professional cleaning for several months, starting with a deep clean and switching to standard cleaning afterward is recommended.",
        "A deep clean is also a good choice before hosting guests or after a big event.",
        "If you're not sure which service you need, check the descriptions on the Services page or contact us before booking.",
      ],
    },
    ru: {
      title: 'Когда стоит заказывать генеральную уборку?',
      excerpt: 'В чём разница между стандартной и генеральной уборкой и когда выбирать ту или иную.',
      paragraphs: [
        'Стандартной уборки достаточно для поддержания повседневной чистоты — протирание пыли, мытьё полов, базовая уборка санузла и кухни. Но иногда нужно больше.',
        'Перед переездом — при покупке нового жилья или перед сдачей в аренду рекомендуется тщательно очистить все поверхности, внутренние части шкафов и техники.',
        'Сезонная уборка — 1-2 раза в год полезно очищать места, которые обычно остаются без внимания: под мебелью, окна, радиаторы.',
        'Квартира, которую давно не убирали — если профессиональной уборки не было несколько месяцев, рекомендуется начать с генеральной уборки, а затем перейти на стандартную.',
        'Генеральная уборка также хороший выбор перед приёмом гостей или после крупного мероприятия.',
        'Если не уверены, какая услуга вам нужна, посмотрите описания на странице услуг или свяжитесь с нами перед бронированием.',
      ],
    },
  },
  {
    slug: 'ofisni-muntazam-tozalash-nima-uchun-muhim',
    date: '2026-07-05',
    readMinutes: 3,
    image: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1200&q=80',
    uz: {
      title: 'Ofisni muntazam tozalash nima uchun muhim?',
      excerpt: "Toza ish joyi nafaqat estetik, balki xodimlar salomatligi va samaradorligiga ham bevosita ta'sir qiladi.",
      paragraphs: [
        "Ofis — kuniga bir necha soat vaqt o'tkaziladigan joy, shuning uchun uning tozaligi ko'rinishdan ko'ra ko'proq narsaga ta'sir qiladi.",
        "Kasallik tarqalishining kamayishi. Klaviatura, sichqoncha, stol yuzalari va umumiy foydalanishdagi joylar ko'p bakteriya to'playdi. Muntazam tozalash kasallik ta'tillari sonini kamaytirishga yordam beradi.",
        "Xodimlar samaradorligi. Tartibsiz va chang bosgan muhit diqqatni tarqatadi, toza va tartibli ish joyi esa fokuslanishga yordam beradi.",
        "Mijozlar taassuroti. Ofisga tashrif buyuruvchi mijoz yoki hamkor uchun tozalik — kompaniyaning jiddiyligi haqidagi birinchi signal.",
        "Texnika umrining uzayishi. Chang kompyuter va boshqa texnikaning qizib ketishiga sabab bo'lishi mumkin — muntazam tozalash bu xavfni kamaytiradi.",
        "Ofis hajmi va ish tartibiga qarab, haftalik yoki oylik muntazam tozalash rejasini tanlash mumkin — bu bir martalik buyurtmaga qaraganda ham qulayroq, ham arzonroq.",
      ],
    },
    en: {
      title: 'Why Is Regular Office Cleaning Important?',
      excerpt: 'A clean workplace isn\'t just about appearance — it directly affects employee health and productivity.',
      paragraphs: [
        "An office is a place where people spend several hours a day, so its cleanliness affects more than just appearances.",
        "Fewer illnesses spreading. Keyboards, mice, desk surfaces and shared areas collect a lot of bacteria. Regular cleaning helps reduce sick days.",
        "Employee productivity. A cluttered, dusty environment is distracting, while a clean, tidy workspace helps people focus.",
        "Client impressions. For a visiting client or partner, cleanliness is one of the first signals of how seriously a company takes itself.",
        "Longer equipment lifespan. Dust can cause computers and other equipment to overheat — regular cleaning reduces this risk.",
        "Depending on office size and schedule, you can choose a weekly or monthly recurring cleaning plan — more convenient and more affordable than a one-off booking.",
      ],
    },
    ru: {
      title: 'Почему важна регулярная уборка офиса?',
      excerpt: 'Чистое рабочее место — это не только эстетика, но и прямое влияние на здоровье и продуктивность сотрудников.',
      paragraphs: [
        'Офис — место, где люди проводят несколько часов в день, поэтому его чистота влияет на гораздо большее, чем просто внешний вид.',
        'Снижение распространения болезней. Клавиатура, мышь, поверхности столов и места общего пользования накапливают много бактерий. Регулярная уборка помогает сократить число больничных.',
        'Продуктивность сотрудников. Захламлённая и пыльная обстановка рассеивает внимание, а чистое и аккуратное рабочее место помогает сосредоточиться.',
        'Впечатление клиентов. Для клиента или партнёра, посещающего офис, чистота — один из первых сигналов о серьёзности компании.',
        'Продление срока службы техники. Пыль может привести к перегреву компьютеров и другой техники — регулярная уборка снижает этот риск.',
        'В зависимости от размера офиса и графика работы можно выбрать еженедельный или ежемесячный план регулярной уборки — это удобнее и дешевле разового заказа.',
      ],
    },
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}

export function getPostContent(post: BlogPost, lang: Lang): LocalizedPostContent {
  return post[lang] ?? post.uz
}
