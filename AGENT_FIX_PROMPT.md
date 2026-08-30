# Prompt: CleanPro (primestandard-app) — Xavfsizlik tuzatishlari

Quyidagini kodlash agentiga (Claude Code yoki boshqa) to'g'ridan-to'g'ri nusxalab bering.

---

## Kontekst

Bu `primestandard-app` (CleanPro / Prime Standard & Co) loyihasi — React+Vite frontend, Firebase (Auth+Firestore), Netlify Functions backend, Payme/Click to'lov integratsiyasi, Telegram orqali ro'yxatdan o'tish/kirish. Loyihaga xavfsizlik auditi o'tkazildi. Git tarixida oshkor bo'lgan Telegram bot tokeni allaqachon @BotFather orqali revoke qilindi va yangisi olindi — bu masala hal qilindi, alohida ishlov berish shart emas, faqat quyidagini tekshiring: repo bo'ylab (kod, README, .env.example, comment'lar) hech qayerda eski yoki yangi tokenning ochiq (hardcoded) nusxasi qolmaganini tasdiqlang.

Quyida qolgan muammolar ustuvorlik tartibida keltirilgan. Har birini alohida commit qilib, kodni sindirmasdan, mavjud kod uslubi (TypeScript, mavjud `_lib/*` yordamchi funksiyalar, xatolik xabarlari o'zbek tilida) bilan mos qilib bajaring.

---

## 1. [Muhim, ~1-2 soat] Login endpointida brute-force himoyasi yo'q

**Fayl:** `netlify/functions/telegram-login-request.ts`

**Muammo:** Parolni tekshirishda (`bcrypt.compare`) hech qanday urinishlar chegarasi yo'q. Hujumchi bitta telefon raqamiga cheksiz so'rov yuborib, parolni brute-force qila oladi.

**Nima qilish kerak:**
- `telegramAuth/{phone}` hujjatiga `failed_login_attempts` (number) va `locked_until` (ISO string yoki null) maydonlarini qo'shing.
- Parol tekshirishdan OLDIN: agar `locked_until` mavjud va hali o'tmagan bo'lsa — `badRequest("Juda ko'p noto'g'ri urinish. N daqiqadan so'ng qayta urinib ko'ring.")` qaytaring.
- Parol noto'g'ri bo'lsa: `failed_login_attempts`ni oshiring; agar u >= 5 ga yetsa, `locked_until = now + 15 daqiqa` qilib qo'ying.
- Parol to'g'ri bo'lsa (OTP muvaffaqiyatli yuborilgandan keyin): `failed_login_attempts = 0`, `locked_until = null` qilib tozalang.
- `telegram-login-verify.ts`dagi mavjud `MAX_ATTEMPTS = 5` naqshiga o'xshash uslubda yozing (izchillik uchun).

---

## 2. [Muhim, ~2-4 soat] Ochiq endpointlarda rate-limiting yo'q

**Fayllar:** `netlify/functions/ai-chat.ts`, `netlify/functions/contact.ts`, `netlify/functions/telegram-login-request.ts`

**Muammo:** Bu uchtasi autentifikatsiyasiz (public) va so'rovlar sonini hech kim cheklamaydi:
- `ai-chat.ts` — har bir so'rov pullik OpenRouter API chaqiruvi qiladi -> skript bilan spam qilib, hisobga katta xarajat keltirib chiqarish mumkin.
- `contact.ts` — admin Telegram chatiga cheksiz spam yuborish mumkin.
- `telegram-login-request.ts` — OTP SMS/xabar floodi (60s cooldown bor, lekin turli telefon raqamlari bilan aylanib o'tish mumkin).

**Nima qilish kerak:**
- Netlify Functions statik/serverless bo'lgani uchun oddiy in-memory counter ishlamaydi (har bir chaqiruv yangi instance bo'lishi mumkin). Shuning uchun:
  - Eng sodda variant: Firestore'da `rateLimits/{key}` kolleksiyasi orqali "sliding window" hisoblagich (key = IP yoki IP+endpoint nomi). Har so'rovda eski yozuvlarni tozalab, yangi timestamp qo'shing; agar oxirgi N daqiqada limit sonidan ko'p bo'lsa — 429 qaytaring.
  - Yaxshiroq variant (agar loyiha buyudjeti ruxsat bersa): Upstash Redis + `@upstash/ratelimit` kutubxonasi (Netlify bilan yaxshi ishlaydi, sekundlarga aniq, tez).
- Taxminiy limitlar (kerak bo'lsa moslashtiring):
  - `ai-chat.ts`: IP boshiga 10 so'rov / daqiqa.
  - `contact.ts`: IP boshiga 3 so'rov / soat.
  - `telegram-login-request.ts`: IP+telefon kombinatsiyasi boshiga 5 so'rov / soat (bu #1-band bilan birga ishlaydi, ikkalasi ham kerak).
- Limitdan oshganda `429` status va o'zbekcha xabar qaytaring (`respond.ts`dagi `json()` yordamchisidan foydalaning, kerak bo'lsa yangi `tooManyRequests()` funksiyasini shu faylga qo'shing).
- IP manzilni Netlify Functions'da `event.headers['x-nf-client-connection-ip']` orqali oling (Netlify'ning haqiqiy client IP headeri; `x-forwarded-for`ga to'liq ishonmang, chunki spoof qilinishi mumkin).

---

## 3. [O'rta, ~1 soat, lekin diqqat bilan] Bog'liqliklardagi zaifliklar

**Fayl:** `package.json` / `package-lock.json`

**Muammo:** `npm audit` 12 ta zaiflikni ko'rsatadi:
- `react-router-dom` (6.x) — Open Redirect zaifligi.
- `undici` (Firebase SDK orqali tranzitiv) — bir nechta DoS/request-smuggling CVE.

**Nima qilish kerak:**
- Alohida branch'da `npm audit fix --force` ishga tushiring (bu `react-router-dom`ni 7.x ga, `firebase`ni 12.x ga ko'taradi — BREAKING CHANGE).
- Ko'tarilgandan keyin BUTUN ilovani qo'lda sinab ko'ring: routing (`react-router-dom` 7.x API'da ba'zi hook/komponent nomlari o'zgargan bo'lishi mumkin), Firebase Auth/Firestore chaqiruvlari (`firebase` 12.x).
- Agar breaking change'lar juda ko'p bo'lsa, kamida `undici`ni to'g'ridan-to'g'ri `overrides` (package.json) orqali xavfsiz versiyaga majburlashni ko'rib chiqing, `firebase`ni darhol ko'tarmasdan.
- Muvaffaqiyatli bo'lsa, `npm audit` qayta ishga tushirib, 0 ta yuqori/kritik zaiflik qolganini tasdiqlang.

---

## 4. [O'rta, ~30 daqiqa] HTTP xavfsizlik headerlari yo'q

**Fayl:** `netlify.toml`

**Muammo:** CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy sozlanmagan — clickjacking va boshqa hujumlardan qo'shimcha himoya yo'q.

**Nima qilish kerak:** `netlify.toml`ga quyidagi `[[headers]]` blokini qo'shing:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), camera=(), microphone=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com https://api.telegram.org https://openrouter.ai"
```

- Avval `Content-Security-Policy-Report-Only` sifatida qo'shib, brauzer konsolida qaysi resurslar bloklanayotganini tekshiring (Firebase, Google Fonts, rasm domenlari — masalan `images.unsplash.com` — kabilarni `connect-src`/`img-src`ga qo'shishga to'g'ri kelishi mumkin), keyin `Content-Security-Policy`ga o'zgartiring.
- Sayt to'liq ishlashini (login, booking, to'lov, AI chat, admin panel) tekshirib chiqing — CSP noto'g'ri sozlansa sahifa yoki funksiyalarni sindirishi mumkin.

---

## 5. [Past, ~20 daqiqa] Payme/Click imzo solishtirishi timing-safe emas

**Fayllar:** `netlify/functions/payme.ts` (`checkAuth`), `netlify/functions/click.ts` (`verifySign`)

**Muammo:** Ikkalasi ham oddiy `===` bilan solishtiradi — nazariy timing-attack imkoniyati (amaliyotda past xavf).

**Nima qilish kerak:**
- `node:crypto`dan `timingSafeEqual` ishlatib solishtiring. Diqqat: `timingSafeEqual` ikkala bufer BIR XIL uzunlikda bo'lishini talab qiladi — solishtirishdan oldin uzunlikni tekshirib, mos kelmasa darhol `false` qaytaring (bu o'zi ham vaqt oqizib bermaydi, chunki uzunlik solishtirish arzon operatsiya).
- Misol:
  ```ts
  import { timingSafeEqual } from 'node:crypto'
  function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  }
  ```

---

## Tekshirish (har bir band uchun)

- Har bir o'zgarishdan keyin `npm run lint` va `npm run build` xatosiz o'tishini tasdiqlang.
- #1 va #2 uchun: qo'lda (yoki oddiy skript bilan) limitdan oshib so'rov yuborib, to'g'ri bloklanishini tekshiring, keyin muddat/oyna tugagach yana ishlashini tasdiqlang.
- #3 uchun: to'liq regressiya — login, ro'yxatdan o'tish, booking yaratish, admin panel, to'lov oqimi.
- #4 uchun: barcha sahifalarni brauzer konsolida CSP xatolarisiz ochib chiqing.
- Hech biri mavjud `firestore.rules` yoki auth/ownership tekshiruvlarini zaiflashtirmasligiga ishonch hosil qiling.
