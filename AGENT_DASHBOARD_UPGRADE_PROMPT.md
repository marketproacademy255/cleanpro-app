# Prompt: CleanPro (primestandard-app) — "Kabinet" (post-login) tajribasini kengaytirish

Quyidagini kodlash agentiga to'g'ridan-to'g'ri nusxalab bering.

---

## Kontekst

`Home.tsx` va umuman marketing sahifalari (rasmlar, `Reveal` scroll-animatsiyasi, hover effektlar, trust bar, gallery) yuqori sifatda qilingan. Muammo: foydalanuvchi ro'yxatdan o'tib/kirib `kabinet`ga (`src/pages/Dashboard.tsx`) tushganda, bu energiya butunlay yo'qoladi — bo'sh, hissiz sahifa ko'radi. Maqsad: login qilingandan keyin sayt "kamroq" emas, "ko'proq" his qilinishi — xuddi endi ko'proq narsaga kirish huquqi ochilgandek.

**Muhim qoida:** yangi dizayn uslubi o'ylab topmang — mavjudlaridan foydalaning:
- `src/components/Reveal.tsx` — scroll-in animatsiya (Home'dagi kabi `<Reveal delayMs={i * 100}>` bilan o'rab qo'ying).
- `.card`, `.tag`, `.btn-primary`, `.btn-secondary` (index.css) — mavjud klasslar.
- `TRUST_ICONS` naqshi (Home.tsx) — `ShieldCheck`/`CreditCard`/`Zap`/`Sparkles` (lucide-react) ikonkali doiralar.
- `TeamPreview.tsx`dagi avatar naqshi — ismning bosh harfi bilan doira (`grid h-16 w-16 place-items-center rounded-full bg-brand-100 ...`) + `StarRating` komponenti.
- Rang tizimi: `brand-*` (yashil), kichik border-radius (`rounded-md`/`rounded-lg`), dark mode uchun mavjud `html.dark` qoidalari avtomatik ishlaydi (agar standart Tailwind gray/white/brand klasslaridan foydalansangiz).
- `src/i18n/translations.ts` — 3 tilli (`uz`, `en`, `ru`, mos ravishda ~442, ~914, ~1386-qatorlar atrofida `dashboard:` bloki). Yangi matn qo'shsangiz, **uchala tilga ham** qo'shing (mavjud `dashboard.*` kalitlari bilan bir xil uslubda).

---

## 1. [Muhim] `Dashboard.tsx` — bo'sh holatni to'liq qayta loyihalash

Hozirgi holat: `bookings.length === 0` bo'lganda faqat `<div className="card mt-6 text-center text-gray-500">{t('dashboard.noBookings')}</div>`.

**Nima qilish kerak:**
- Bo'sh holatni to'liq "empty state" patterniga aylantiring:
  - Markazda doira ichida ikonka (masalan `Calendar` yoki `Sparkles` lucide-react'dan, `bg-brand-50 text-brand-700` fonida, Home'dagi TRUST_ICONS doiralari o'lchamidan kattaroq — masalan `h-16 w-16`).
  - Aniq sarlavha (masalan: "Birinchi buyurtmangizni bering" — yangi `dashboard.emptyTitle` kaliti) + qisqa qo'llab-quvvatlovchi matn (`dashboard.emptyDesc`).
  - Katta, aniq `btn-primary` CTA tugmasi ("Xizmat band qilish" — `/band-qilish`ga).
  - Ixtiyoriy, lekin tavsiya etiladi: fonda juda xira (opacity-5/10) katta ikonka yoki Home'da ishlatilgan Unsplash fotosuratlaridan biri (allaqachon loyihada bor URL'lardan foydalaning, yangi tashqi rasm qidirmang) yumshoq gradient bilan qoplangan holda — Home hero'dagi kabi.
- Bo'sh holat kartasidan darhol keyin (yoki uning yonida, kengroq ekranda 2 ustunli grid'da) kichik "ishonch qatorini" qo'shing: Home'dagi `TRUST_ICONS` naqshidan foydalanib, 2-3 ta qisqa ishonch signali (masalan "Xavfsiz to'lov", "Tasdiqlangan xizmatchilar", "24/7 qo'llab-quvvatlash") — login qilgan foydalanuvchi ham kirmagan mehmon kabi ishonch belgilarini ko'rishi kerak, aks holda kirgach "kamroq" ko'rinadi.

---

## 2. [Muhim] "Yana xizmat kerakmi?" (showcase) blokini Home darajasiga ko'tarish

Hozirgi holat: oddiy statik kartalar, animatsiya yo'q.

**Nima qilish kerak:**
- Har bir kartani `<Reveal delayMs={i * 100}>` bilan o'rab qo'ying (Home.tsx'dagi Service tiles bo'limidan nusxa oling).
- Rasmga hover effektini qo'shing: `className="h-full w-full object-cover transition duration-300 group-hover:scale-105"` + tashqi elementga `group` klassi (Home'dagi Service tiles bilan bir xil).
- Karta chegarasiga hover effekt: `hover:border-brand-300 hover:shadow-md` (Home'dagi bilan bir xil).

---

## 3. [O'rta-yuqori] `BookingDetail.tsx` — mavjud backend ma'lumotidan foydalanish

Backend (`netlify/functions/bookings.ts` → `enrichBooking`) allaqachon `booking.cleaners` (tayinlangan xizmatchi: ism, reyting, tajriba) va `booking.status` ni frontendga yuboradi, lekin `BookingDetail.tsx` ikkalasini ham ko'rsatmaydi. Bu — qo'shimcha backend ishi kerak bo'lmagan, faqat frontendda ochilishi kerak bo'lgan imkoniyat.

**Nima qilish kerak:**

a) **Status ko'rsatish** — hozir sahifada umuman `booking.status` ko'rinmaydi (faqat to'lov holati). Buyurtma tafsilotlari kartasi tepasiga (yoki alohida kartada) 5 bosqichli gorizontal progress-stepper qo'shing:
   `pending → confirmed → assigned → in_progress → completed` (Dashboard.tsx'dagi `STATUS_LABEL` obyektini shared joyga chiqarib, ikkala faylda ham ishlatish mumkin — masalan `src/lib/bookingStatus.ts`ga ko'chiring). `cancelled` holati alohida, stepper o'rniga oddiy qizil/kulrang banner sifatida ko'rsatilsin.

b) **Tayinlangan xizmatchi kartasi** — agar `booking.cleaners` mavjud bo'lsa (xizmatchi tayinlangan bo'lsa), `TeamPreview.tsx`dagi bilan bir xil vizual naqshda kichik karta qo'shing: ism bosh harfi bilan doira avatar (`rounded-full bg-brand-100 text-brand-700`), to'liq ism, `StarRating` komponenti (reyting), tajriba yillari. Agar xizmatchi hali tayinlanmagan bo'lsa (`cleaner_id` yo'q), bu blokni butunlay yashiring (TeamPreview'dagi "agar ma'lumot yo'q bo'lsa hech narsa ko'rsatma" tamoyiliga mos).

---

## 4. [Past, ixtiyoriy] `AdminOverview.tsx` — vizual jozibani oshirish

Bu ichki panel bo'lgani uchun ustuvorlik past, lekin xohlasangiz: har bir statistik kartaga mos ikonka qo'shing (masalan `CreditCard`/`Clock`/`TrendingUp` lucide-react'dan), Home'dagi TRUST_ICONS doira naqshiga o'xshab.

---

## Tekshirish

- `npm run lint` va `npm run build` xatosiz o'tishi kerak.
- Yangi i18n kalitlari **uchala tilda** (`uz`, `en`, `ru`) mavjudligini tekshiring — bittasi yetishmasa, `useTranslation` runtime'da xato berishi yoki bo'sh matn qaytarishi mumkin.
- Dark mode'da (tema tugmasi orqali) barcha yangi elementlarni tekshiring — yangi ranglar uchun standart Tailwind gray/white/brand klasslaridan foydalaning (masalan `bg-brand-50`, `text-gray-500`), maxsus hex ranglar yozmang — chunki `index.css`dagi `html.dark .bg-brand-50 { ... }` kabi qoidalar avtomatik ishlaydi faqat shu klasslar uchun.
- Bo'sh holat (yangi ro'yxatdan o'tgan foydalanuvchi) va to'liq holat (buyurtmalari bor foydalanuvchi) ikkalasini ham qo'lda sinab ko'ring.
- `BookingDetail`ni tayinlangan xizmatchisi bor va yo'q buyurtmalar bilan sinab ko'ring (admin panelda bitta buyurtmaga xizmatchi tayinlab, keyin mijoz sifatida ochib ko'ring).
