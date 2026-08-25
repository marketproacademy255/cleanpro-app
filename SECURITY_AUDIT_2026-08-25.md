# CleanPro (Prime Standard & Co) — Xavfsizlik auditi

**Loyiha:** `primestandard-app` (brendi: CleanPro / Prime Standard & Co), Toshkentda uy-ofis tozalash xizmati platformasi
**Stack:** React + Vite + TypeScript, Firebase (Auth + Firestore), Netlify Functions (backend API), Payme/Click to'lov integratsiyasi, Telegram orqali ro'yxatdan o'tish/kirish, OpenRouter AI chat
**Audit sanasi:** 2026-08-25
**Ko'lam:** Butun repo — frontend (`src/`), backend (`netlify/functions/`), Firestore qoidalari, Telegram bot (`telegram-auth-bot/`), git tarixi, `package.json` bog'liqliklari

---

## Umumiy xulosa

Bu loyiha kutilganidan ancha yaxshi arxitektura qilingan. Asosiy xavfsizlik modeli to'g'ri qurilgan: **Firestore qoidalari deny-all** (mijoz brauzeri faqat ochiq katalog ma'lumotlarini o'qiy oladi), **barcha nozik amallar** (profil, buyurtma, to'lov) **Netlify Functions orqali**, Firebase Admin SDK bilan, har safar ID token tekshirilib. Narx har doim serverda qayta hisoblanadi (mijoz yubormaydi), `role` maydoni hech qachon clientdan qabul qilinmaydi (admin bo'lib olish imkonsiz), parollar bcrypt bilan xeshlanadi, Telegram xabarlarida foydalanuvchi matni to'g'ri escape qilinadi (HTML injection yo'q), va `.env` to'g'ri `.gitignore`'da.

Shu bilan birga, **bitta jiddiy (kritik) muammo** va bir nechta o'rta darajadagi kamchiliklar topildi — quyida ustuvorlik bo'yicha keltirilgan.

---

## 🔴 KRITIK: Git tarixida oshkor bo'lgan Telegram bot tokeni

`telegram-auth-bot/bot.js` faylining git tarixida (kamida 2 ta commitda) quyidagi shakldagi haqiqiy token oshkor holda saqlangan edi (bu yerda, va boshqa hech qanday hujjatda, real qiymat qasddan qoldirilmagan — token allaqachon @BotFather orqali revoke qilingan, lekin xavfsizlik odati sifatida real tokenlar hech qachon repo ichidagi fayllarga, hatto audit hujjatlariga ham, aynan holicha yozilmasligi kerak):

```
<BOT_ID>:<REVOKED_TOKEN>
```

Kod ichidagi joriy izohda buni o'zingiz ham qayd etib o'tibsiz: *"...repozitoriyda va suhbat tarixida oshkor bo'lgan... zaharlangan hisoblanadi"*. Bu to'g'ri kuzatuv, lekin **kodni tozalash tokenni bekor qilmaydi** — agar bu repo biror marta GitHub/GitLab kabi joyga push qilingan bo'lsa (hatto keyin private qilingan yoki o'chirilgan bo'lsa ham), token git tarixida abadiy qoladi va uni klonlagan yoki tarixni ko'rgan har kim foydalanishi mumkin. Bunday token bilan hujumchi sizning ro'yxatdan o'tish botingiz nomidan xabar yubora oladi, botni boshqara oladi, hatto `setWebhook` orqali botni butunlay o'ziniki qilib qo'yishi mumkin.

**Tavsiya (darhol bajarish kerak):**
1. Telegramda @BotFather'ga o'ting → shu botni tanlang → `/revoke` bilan tokenni bekor qiling, yangisini oling.
2. Yangi tokenni **faqat** serverdagi `.env` (yoki Netlify env, agar `TELEGRAM_AUTH_BOT_TOKEN` sifatida ham ishlatilsa) ga qo'ying — hech qachon kodga yozmang.
3. Agar repo qachondir public/shared bo'lgan bo'lsa, boshqa maxfiy ma'lumotlar (Firebase private key va h.k.) uchun ham git tarixini tekshirib chiqish tavsiya etiladi (men joriy tekshiruvda boshqa sirlarni tarixda topmadim — faqat shu token).
4. Ixtiyoriy, lekin foydali: `git filter-repo` yoki BFG Repo-Cleaner bilan tarixdan shu tokenni butunlay olib tashlash (token revoke qilingandan keyin ham, hujum yuzasini kamaytirish uchun).

---

## 🟠 YUQORI: Login endpointida brute-force cheklovi yo'q

`netlify/functions/telegram-login-request.ts` — telefon+parol tekshiruvi. Bu yerda:
- OTP kodni qayta yuborishga **60 soniyalik cheklov** bor (yaxshi).
- Lekin **parolni necha marta noto'g'ri kiritishga hech qanday cheklov yo'q**. Hujumchi bitta telefon raqamiga cheksiz `POST` yuborib, parolni "brute force" qila oladi. `bcrypt.compare` har bir urinishni sekinlashtiradi (~100ms), lekin bu parallel so'rovlar bilan chetlab o'tiladi va IP/raqam bo'yicha hech qanday bloklash yo'q.

Buning aksincha, ikkinchi bosqich (`telegram-login-verify.ts`) to'g'ri qilingan: `MAX_ATTEMPTS = 5`, muddati tugagan kodni o'chirish va h.k.

**Tavsiya:** `telegram-login-request.ts`ga ham xuddi shunday himoya qo'shing — masalan, `telegramAuth/{phone}` hujjatiga `failed_attempts` va `locked_until` maydonlarini qo'shib, 5-10 marta noto'g'ri urinishdan keyin 15-30 daqiqaga bloklash. IP darajasida ham cheklov (Netlify Edge/Upstash Redis kabi) qo'shsa yanada yaxshi bo'ladi.

---

## 🟡 O'RTA: Umumiy rate-limiting yo'q (spam / xarajat suiiste'moli xavfi)

Uchta public (autentifikatsiyasiz) endpoint hech qanday so'rov chastotasi cheklovisiz:

- **`ai-chat.ts`** — har bir so'rov OpenRouter API'ga (pullik) chaqiruv qiladi. Xabar uzunligi cheklangan (1000 belgi), lekin so'rovlar sonini hech kim cheklamaydi → skript bilan takrorlab yuborib, sizning OpenRouter hisobingizga katta hisob keltirib chiqarish mumkin (cost-based DoS).
- **`contact.ts`** — cheksiz spam xabarlarini to'g'ridan-to'g'ri admin Telegram chatingizga yubortirish mumkin.
- **`telegram-login-request.ts`** — yuqorida aytilgan brute-force muammosi bilan bir xil ildiz.

**Tavsiya:** Har bir public endpoint uchun IP (yoki telefon/session) bo'yicha oddiy rate-limit qo'shing. Netlify'da buni Upstash Redis/Ratelimit, yoki hatto Firestore'dagi oddiy "so'nggi so'rov vaqti" hujjati orqali soddalashtirib amalga oshirish mumkin. `ai-chat.ts` uchun captcha (masalan, Cloudflare Turnstile) ham ko'rib chiqing, chunki bu yerda real pul xavfi bor.

---

## 🟡 O'RTA: Bog'liqliklardagi (dependencies) ma'lum zaifliklar

`npm audit` natijasi (12 ta zaiflik: 11 o'rta, 1 yuqori):

- **`react-router` (6.x orqali `react-router-dom`)** — Open Redirect zaifligi (`<Link>`/`useNavigate` backslash orqali). O'rta darajali, lekin foydalanuvchini firibgar saytga yo'naltirish uchun ishlatilishi mumkin.
- **`undici`** (Firebase SDK orqali tranzitiv) — bir nechta CVE: DoS, HTTP request smuggling, cookie/`Set-Cookie` manipulyatsiyasi va h.k. Ko'pchiligi asosan Node.js muhitida (masalan, SSR yoki Admin SDK) xavfliroq, brauzerda kamroq ta'sir qiladi, lekin baribir yangilanishi kerak.

**Tavsiya:** `npm audit fix --force` sinab ko'ring (bu `react-router-dom`ni 7.x ga, `firebase`ni 12.x ga ko'taradi — breaking change bo'lishi mumkin, shuning uchun avval branch'da sinab, ilovani to'liq test qilib keyin production'ga chiqaring). Kamida navigatsiya kodini (`Link to=`, `navigate()`) tashqi/backslash bilan boshlanuvchi manzillarni qabul qilmasligini tekshiring.

---

## 🟡 O'RTA/PAST: HTTP xavfsizlik headerlari yo'q

`netlify.toml` yoki `index.html`da CSP (`Content-Security-Policy`), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security` kabi headerlar sozlanmagan. Hozircha inline skript/dangerouslySetInnerHTML ishlatilmagani (buni tekshirdim — topilmadi) XSS xavfini pasaytiradi, lekin headerlarning yo'qligi:
- Clickjacking'dan himoyasiz (sayt boshqa domenning `<iframe>` ichiga solinib, foydalanuvchi aldab bosishga majburlanishi mumkin — ayniqsa to'lov sahifalarida xavfli).
- Kelajakda tasodifan qo'shiladigan har qanday XSS zaifligiga qarshi qo'shimcha himoya qatlami yo'q.

**Tavsiya:** `netlify.toml`ga `[[headers]]` bo'limi qo'shing, masalan:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), camera=(), microphone=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://api.telegram.org https://openrouter.ai"
```
(CSP'ni ilovangizni sindirmasdan sozlash uchun avval `Content-Security-Policy-Report-Only` bilan sinab ko'ring.)

---

## 🟢 PAST: Payme/Click imzo tekshiruvi timing-safe emas

`payme.ts`dagi `checkAuth` va `click.ts`dagi `verifySign` oddiy `===` bilan solishtiradi (constant-time emas). Nazariy jihatdan timing-attack orqali kalitni asta-sekin "o'qib olish" mumkin, lekin bu tarmoq jitter'i tufayli amalda deyarli imkonsiz va Payme/Click'ning rasmiy misollarida ham odatda shu tarzda qilinadi. Past ustuvorlik, lekin xohlasangiz `crypto.timingSafeEqual` bilan almashtirish mumkin.

---

## ✅ Yaxshi qilingan narsalar (ishonch bilan aytish mumkin)

- **Firestore qoidalari** — `profiles`, `bookings`, `payments`, `telegramAuth`, `telegramLoginCodes` uchun `allow read, write: if false` — to'g'ri "deny by default, backend orqali" model.
- **Narx serverda qayta hisoblanadi** (`bookings.ts` → `calculatePrice`) — mijoz hech qachon narxni o'zi belgilay olmaydi.
- **`role` clientdan qabul qilinmaydi** (`profile.ts`) — admin bo'lib olish (privilege escalation) yo'li yopilgan.
- **Egalik tekshiruvi** (ownership check) har joyda bor — `bookings.ts`, `payments.ts` da `customer_id !== req.uid` bo'lsa `forbidden()`.
- **Payme/Click webhooklari** to'g'ri imzo/avtorizatsiya tekshiradi, summani serverdagi haqiqiy `booking.total_amount` bilan solishtiradi (mijoz yuborgan summaga ishonmaydi).
- **Parollar** bcrypt bilan xeshlanadi (`telegram-auth-bot/bot.js`, `telegram-login-request.ts`).
- **OTP kod**: 5 daqiqa muddat, 5 marta urinish chegarasi, kod ishlatilgach o'chiriladi.
- **Telegram xabarlarida** foydalanuvchi kiritgan matn `esc()` orqali HTML-escape qilinadi — Telegram HTML-injection yo'q.
- **`.env` `.gitignore`da**, va joriy git tarixida (bitta topilgan token bundan mustasno) boshqa hech qanday maxfiy kalit committed emas.
- **Xatoliklarga chidamlilik** — Firebase/backend sozlanmagan bo'lsa ham sayt qulamaydi (graceful degradation), bu ishonchlilik uchun yaxshi amaliyot.

---

## Ustuvorlik bo'yicha harakat rejasi

1. **Hoziroq**: Telegram bot tokenini @BotFather orqali revoke qiling, yangisini faqat serverga qo'ying.
2. **Bu hafta**: `telegram-login-request.ts`ga urinishlar sonini cheklash (lockout) qo'shing.
3. **Bu hafta**: `ai-chat.ts`, `contact.ts`, `telegram-login-request.ts`ga oddiy rate-limit qo'shing.
4. **Keyingi sprint**: `npm audit fix` bilan bog'liqliklarni yangilang (avval staging'da sinab).
5. **Keyingi sprint**: `netlify.toml`ga xavfsizlik headerlari (CSP va h.k.) qo'shing.
6. **Ixtiyoriy**: Payme/Click imzo solishtirishni `timingSafeEqual`ga o'tkazish.
