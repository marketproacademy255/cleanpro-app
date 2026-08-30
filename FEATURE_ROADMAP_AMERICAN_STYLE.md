# CleanPro — Qo'shimcha funksiyalar va "amerikacha" dizayn g'oyalari

Manba: Merry Maids/Molly Maid/MaidPro (tozalash), Angi/Thumbtack/HomeAdvisor (uy ta'mirlash/handyman platformalari), va o'ndan ortiq tozalash kompaniyasi saytlarini tahlil qilgan maqolalar (havolalar oxirida). Har bir taklif — nima uchun ishlashi va CleanPro'ning mavjud kod bazasiga qanday joylashishi bilan.

---

## 1. Narxlash modeliga qo'shimchalar

### 1a. Birinchi buyurtma / a'zolik chegirmasi (avtomatik, promo-kod emas)
Hozirgi `DiscountBanner.tsx` — qo'lda kod kiritishga asoslangan promo. Amerikalik kompaniyalarda eng ko'p ishlaydigan narsa: **muntazam (haftalik/ikki haftalik/oylik) buyurtmaga birinchi marta yozilganda avtomatik qo'shimcha chegirma** ("Birinchi tozalashga $50 chegirma" tipidagi).

**Qayerda:** `src/lib/pricing.ts`dagi `FREQUENCY_DISCOUNT` allaqachon bor (`weekly: 0.2` va h.k.) — bunga ustiga "birinchi buyurtma" bayrog'ini qo'shish mumkin: `calculatePrice()`ga `isFirstBooking?: boolean` parametri, backend (`bookings.ts`)da mijozning avvalgi buyurtmalari sonini tekshirib aniqlanadi (`customer_id` bo'yicha).

### 1b. Referral (do'stni taklif qilish) dasturi — YANGI, hozircha yo'q
Tadqiqotga ko'ra eng samarali struktura — **ikki tomonlama mukofot**: taklif qiluvchi ham, taklif qilingan ham chegirma oladi (masalan, ikkalasi ham 20% yoki bittasi bepul qo'shimcha xizmat). Ba'zilar bosqichli tizim ishlatadi (1 taklif = 25% off, 2 = 50%, 4 = butunlay bepul tozalash) — bu o'yin elementi qo'shib, qayta taklif qilishga undaydi.

**Qayerda (yangi):**
- Firestore: yangi `referrals/{code}` kolleksiyasi (referral kodi → taklif qiluvchi uid, holat).
- `profiles/{uid}`ga `referral_code` (avtomatik generatsiya qilinadigan qisqa kod) qo'shish.
- Yangi Netlify function: `netlify/functions/referrals.ts` — kod yaratish/tekshirish, ikkala tarafga chegirma yozish.
- Frontend: Dashboard'ga "Do'stingizni taklif qiling" kartasi (link ulashish tugmasi bilan) + Home sahifasida kichik banner/menyu tugmasi (tadqiqotda aytilganidek — "hero banner + header/footer tugmasi" eng ko'p ishlaydigan joylashuv).

### 1c. Remont (repair) uchun: rasm yuklab, aniqroq baho olish
Angi/Thumbtack'da katta loyihalar uchun mijoz avval rasm/tavsif yuklaydi, keyin aniqroq narx beriladi. Sizning `REPAIR_TIER_MULTIPLIER`dagi "Evroremont" (eng qimmat tier) kabi katta loyihalar uchun bu juda mos — sof kv.m formulasi katta ta'mirlash loyihalarida unchalik aniq bo'lmasligi mumkin.

**Qayerda:** `Booking.tsx`da repair kategoriyasi tanlanganda, ixtiyoriy "Loyiha rasmlari + tavsif" bosqichi qo'shish (`src/lib/receiptFile.ts`dagi mavjud rasm siqish logikasidan foydalanish mumkin — xuddi chek yuklashdagi kabi), buyurtma yaratilgandan keyin bu ma'lumot admin panelga (Telegram bildirishnomasi orqali ham) boradi, admin qo'lda narxni moslashtirishi mumkin bo'ladi (`payments.ts`dagi manual oqimga o'xshab).

---

## 2. Ishonch signallari (trust) — bu yerda eng katta bo'shliq bor

Tadqiqotdagi deyarli har bir yaxshi sayt uchta narsani albatta ko'rsatadi, CleanPro'da esa ulardan ikkitasi umuman yo'q:

### 2a. Umumiy mijoz reytingi (agregat) — YO'Q
Hozir `TeamPreview.tsx` faqat **xodimlar** reytingini ko'rsatadi. Amerikalik saytlarning deyarli barchasida hero qismida katta "★4.9 (500+ sharh)" ko'rinadi — bu birinchi bosqichdagi eng kuchli ishonch signali.

**Qayerda:** Yangi `reviews`/`testimonials` Firestore kolleksiyasi (mijoz sharhlari, admin panel orqali qo'shiladigan/tasdiqlanadigan) + o'rtacha reyting hisoblovchi kichik funksiya + `Home.tsx` hero qismiga (`TRUST_ICONS` qatoridan oldin) katta reyting belgisi.

### 2b. Sug'urta/tekshiruvdan o'tganlik belgisi — kuchsiz
Tadqiqotda: *"Pro Housekeepers bosh sahifada sug'urta ma'lumotini ochiq ko'rsatadi"* — bu AQSHda ishonchning kaliti. Sizda `TeamPreview`da "shaxsiy suhbatdan o'tgan" (`Проверенные клинеры`) degan trust point bor, lekin bu umumiy da'vo — real tafsilot (masalan "Har bir xizmatchi pasport tekshiruvidan o'tadi", "Zararlangan mulk uchun kafolat") yo'q.

**Qayerda:** `Home.tsx`dagi `trustPoints` tarjima matnlarini (`translations.ts`) kengaytirib, kamida bittasini aniq va tekshiriladigan qilish (masalan haqiqatan pasport/hujjat tekshiruvi bo'lsa, shuni yozish — soxta da'vo yozmaslik kerak, chunki bu ishonchni yo'qqa chiqaradi).

### 2c. Oldin/Keyin (Before/After) galereya — hozirgi galereya umumiy stock-fotolar
Tadqiqotda before/after eng "ishontiruvchi" element deb alohida ta'kidlangan — ayniqsa **remont** uchun bu hal qiluvchi (mijoz aynan shuni ko'rmoqchi: "xonaning oldin va keyingi holati").

**Qayerda:** Yangi komponent, masalan `src/components/BeforeAfterSlider.tsx` — ikkita rasm (oldin/keyin) ustiga tortiladigan chiziq bilan solishtirish (mashhur UI patterni). `Home.tsx`ga va ayniqsa repair xizmatlari sahifasiga (`Services.tsx`) qo'shish. Rasmlar admin panel orqali (`AdminServices.tsx`dagi mavjud `image` maydoniga o'xshab) yuklanadi — haqiqiy ishlaringiz fotosuratlari bilan, Unsplash stock emas.

---

## 3. Kichikroq, tez qo'shsa bo'ladigan g'oyalar

- **Xizmat hududi ko'rsatkichi** — "Toshkentning qaysi tumanlarida ishlaymiz" bo'limi (Home yoki Contact sahifasida) — amerikalik saytlarda "service area map" standart.
- **A'zolik sifatida ramkalash** — mavjud `FREQUENCY_DISCOUNT`ni oddiy "chegirma foizi" emas, balki nomlangan darajalar sifatida ko'rsatish (masalan "Kumush/Oltin/Platina a'zolik" — haftalik/ikki haftalik/oylikka mos), har biriga qo'shimcha perk (masalan ustuvor vaqt tanlash) qo'shib — bu psixologik jihatdan "chegirma"dan ko'ra "imtiyoz"ga o'xshab qabul qilinadi.
- **Real mijoz sharhlari + video** — TeamPreview'dagi kabi "haqiqiy bo'lmasa ko'rsatma" tamoyilini davom ettirib, agar hali sharh yo'q bo'lsa, birinchi 10-20 ta mijozdan qo'lda so'rab yig'ish va qo'shish (soxta sharh yozmaslik — bu qonuniy va ishonch masalasi ham).
- **"Bizning yo'lda" bildirishnomasi** — xizmatchi tayinlangandan keyin, tashrif kunida SMS/Telegram orqali "30 daqiqadan so'ng yetib boradi" xabari — Handy/on-demand ilovalarning mashhur xususiyati, `telegram.ts` infratuzilmangiz allaqachon bor, faqat yangi trigger kerak.

---

## 4. Frontend'ni yanayam "amerikacha" qilish (dizayn g'oyalari)

- Hero qismiga reyting belgisini qo'shish (2a bilan bog'liq) — Stripe/Linear kabi saytlarda "social proof" hero ostida darhol keladi.
- Sticky/scroll bilan birga yuruvchi mini-narx kalkulyatori (`PriceEstimator.tsx`ning qisqartirilgan versiyasi) — uzun sahifalarda foydalanuvchi narxni "yo'qotib qo'ymasligi" uchun.
- Before/After slider (3-band) — vizual jihatdan eng katta ta'sir beradigan qo'shimcha.
- Referral banner — Home hero pastida yoki alohida bo'limda, katta va rangdor (tadqiqotda alohida ta'kidlangan joylashuv).
- Reyting/sharh kartalari — TeamPreview'ga o'xshab, lekin mijozlar uchun, ismning bosh harfi o'rniga (agar ruxsat bersalar) haqiqiy fotosurat bilan.

---

## Manbalar

- [11 best cleaning company websites to inspire you in 2026 — GorillaDesk](https://gorilladesk.com/learn/top-cleaning-company-website-examples/)
- [2026 House Cleaning Services Prices | Cost Calculator & Hourly Rates — HomeGuide](https://homeguide.com/costs/house-cleaning-prices)
- [How to Start a Cleaning Service Referral Program — ReferralRock](https://referralrock.com/blog/cleaning-service-referral-program/)
- [Angi vs Thumbtack vs HomeAdvisor comparisons — Workiz](https://www.workiz.com/blog/featured/homeadvisor-vs-angies-list-vs-thumbtack-the-complete-comparison/)
