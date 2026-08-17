# CleanPro — Tozalash xizmatlari platformasi

Uy va ofislarni tozalash xizmatini onlayn band qilish, narxni avtomatik hisoblash va **Payme** /
**Click** orqali to'lov qabul qilish uchun to'liq stack veb-ilova.

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS (frontend) · **Firebase** — Auth +
Firestore (autentifikatsiya va ma'lumotlar bazasi) · **Netlify Functions** — autentifikatsiyalangan
backend API + Payme/Click to'lov webhooklari · Telegram bot (buyurtma/to'lov bildirishnomalari).
Loyihada Supabase **ishlatilmaydi**.

## Loyihada nima bor

- **Ommaviy sayt**: bosh sahifa, xizmatlar/narxlar, jamoa, aloqa
- **Onlayn band qilish**: xizmat turi, xona/maydon, sana-vaqt, chastota (bir martalik/haftalik/oylik),
  qo'shimcha xizmatlar — narx real vaqtda hisoblanadi (va backend'da qayta hisoblanib tekshiriladi)
- **Mijoz kabineti**: ro'yxatdan o'tish/kirish (**Firebase Auth**), buyurtmalar tarixi, to'lov holati
- **To'lov**: Payme va Click uchun checkout havolalari + ularning server tomonidagi webhook
  protokollarini bajaruvchi Netlify Functions (`netlify/functions/payme.ts`,
  `netlify/functions/click.ts`)
- **Telegram bildirishnomalari**: har bir yangi buyurtma va har bir tasdiqlangan to'lov haqida
  admin Telegram chatiga avtomatik xabar boradi
- **Admin panel**: buyurtmalarni ko'rish/holatini o'zgartirish, xizmatchi tayinlash, xizmatchilar
  ro'yxatini boshqarish, narxlarni istalgan vaqtda tahrirlash
- **Xavfsizlik arxitekturasi**: brauzer to'g'ridan-to'g'ri faqat ommaviy ma'lumotlarni
  (xizmatlar/narxlar/xizmatchilar ro'yxati) Firestore'dan o'qiydi. Profil, buyurtma va to'lovlarga
  oid HAMMA narsa `netlify/functions/*` orqali o'tadi — u yerda Firebase ID token tekshiriladi va
  Firestore'ga Firebase Admin SDK bilan, kod ichida ruxsat tekshirilgandan keyin murojaat qilinadi
  (pastdagi "Arxitektura" bo'limiga qarang).

## Narxlash asosi

Narxlar AQSHdagi yetakchi tozalash platformalari (Merry Maids, Molly Maid, MaidPro — o'rtacha
$75–150/tashrif, xona soniga qarab ortib boradigan tuzilma) asosida shakllantirilib,
O'zbekiston bozoriga moslashtirilgan boshlang'ich narxlar sifatida kiritilgan
(`scripts/seed-firestore.mjs`). Buni **Admin panel → "Xizmatlar va narxlar"** orqali istalgan
vaqtda o'zgartirishingiz mumkin — kod o'zgartirish shart emas.

| Xizmat | Boshlang'ich narx | Qo'shimcha |
|---|---|---|
| Standart tozalash | 150,000 so'm (1 xona) | +40,000 so'm/xona |
| Chuqur tozalash | 210,000 so'm (1 xona) | +56,000 so'm/xona |
| Ko'chishdan oldin/keyin | 240,000 so'm (1 xona) | +64,000 so'm/xona |
| Ofis tozalash | m² bo'yicha | 8,000 so'm/m² (min 300,000) |

Chastota chegirmalari: har hafta −20%, ikki haftada bir −15%, oyiga bir marta −10%.

## Arxitektura

Ma'lumotlar bazasi **Firestore** (Firebase). Xavfsizlik ikki qatlamda:

1. **Firestore Security Rules** (`firestore.rules`) — brauzer to'g'ridan-to'g'ri faqat
   `serviceTypes` / `addons` / `cleaners` kolleksiyalaridan, faqat `is_active == true` bo'lgan
   hujjatlarni o'qiy oladi. `profiles` / `bookings` / `payments` uchun qoidalar **hamma narsani
   taqiqlaydi** (`allow read, write: if false`) — bularga faqat backend kira oladi.
2. **Netlify Functions** (`netlify/functions/*`) — Firebase Admin SDK bilan ishlaydi, bu esa
   yuqoridagi qoidalarni chetlab o'tadi. Har bir funksiya avval `Authorization: Bearer <Firebase ID
   token>` sarlavhasini tekshiradi (`_lib/auth.ts`), so'ng kimning nima ko'rishi/o'zgartirishi
   mumkinligini **kod ichida** hal qiladi (o'z buyurtmasi / admin bo'lsa — hammasi).

Ya'ni: brauzer hech qachon o'zining yoki boshqa birovning buyurtma/profil/to'lov ma'lumotiga
to'g'ridan-to'g'ri kira olmaydi — faqat autentifikatsiyalangan backend orqali.

## Ishga tushirish (lokal)

```bash
npm install
cp .env.example .env   # qiymatlarni to'ldiring, pastga qarang
npm run dev
```

Brauzerda `http://localhost:5173` ochiladi. **Diqqat:** `npm run dev` faqat frontendni ishga
tushiradi — `netlify/functions/*` backend funksiyalarini (shu jumladan Payme/Click webhooklarini)
sinab ko'rish uchun [Netlify CLI](https://docs.netlify.com/cli/get-started/) o'rnatib `netlify dev`
bilan ishga tushiring (u `.env` faylini ham, `netlify/functions/*` ni ham birga ko'taradi).

### Firestore'ni boshlang'ich ma'lumotlar bilan to'ldirish

```bash
npm run seed:firestore
```

Bu xizmat turlari, qo'shimcha xizmatlar va 4 ta namunaviy xizmatchini yaratadi (yuqoridagi jadval).
Qayta ishga tushirish xavfsiz — mavjud yozuvlarni dublikat qilmaydi, faqat yangilaydi.

## Netlify muhit o'zgaruvchilari (production uchun majburiy)

Netlify: **Site settings → Environment variables** bo'limiga quyidagilarni kiriting. `.env.example`
faylida ham hammasi izohlangan.

**Brauzerga tushadi (VITE_ prefiksi — bular sir emas, loyihani ochuvchi ID'lar xolos):**

| O'zgaruvchi | Qayerdan olinadi |
|---|---|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Firebase Console → Project settings → General → "Your apps" |
| `VITE_PAYME_MERCHANT_ID` | business.payme.uz |
| `VITE_CLICK_MERCHANT_ID`, `VITE_CLICK_SERVICE_ID` | merchant.click.uz |
| `VITE_APP_URL` | production domeningiz, masalan `https://cleanpro.uz` |
| `VITE_TELEGRAM_BOT_USERNAME` | Telegram ro'yxatdan o'tish botining username'i (`@` siz), masalan `cleanpro_uz_bot` — `telegram-auth-bot/` papkasiga qarang |

**Faqat serverga (Netlify Functions) — HECH QACHON `VITE_` prefiksi bilan yozmang, aks holda
brauzer bundle'iga tushib, hamma ko'radi:**

| O'zgaruvchi | Qayerdan olinadi |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase Console → Project settings → Service accounts → "Generate new private key" (yuklab olingan JSON'dagi `project_id`) |
| `FIREBASE_CLIENT_EMAIL` | xuddi shu JSON'dagi `client_email` |
| `FIREBASE_PRIVATE_KEY` | xuddi shu JSON'dagi `private_key` (ichidagi `\n` larni o'zgartirmasdan, tirnoq bilan qo'ying) |
| `PAYME_MERCHANT_KEY` | business.payme.uz kabinetidagi Kassa kaliti |
| `CLICK_SECRET_KEY` | merchant.click.uz kabinetidagi Secret Key |
| `TELEGRAM_BOT_TOKEN` | @BotFather |
| `TELEGRAM_CHAT_ID` | pastga qarang |
| `TELEGRAM_AUTH_BOT_TOKEN` | Telegram orqali telefon+parol bilan kirish/ro'yxatdan o'tish tizimi uchun bot tokeni — `telegram-auth-bot/` papkasidagi standalone bot bilan bir xil token (yoki alohida bot yaratsangiz, o'shaning tokeni) |

### Telegram bot va chat ID qanday olinadi

1. @BotFather bilan gaplashib yangi bot yarating (`/newbot`) — token oling.
2. Botga o'zingiz yozing (yoki uni guruhga qo'shing), keyin brauzerda oching:
   `https://api.telegram.org/bot<TOKEN>/getUpdates` — javobdagi `chat.id` maydoni sizning
   `TELEGRAM_CHAT_ID` qiymatingiz.
3. Ikkalasini ham Netlify env'ga kiriting.

> ⚠️ **Xavfsizlik eslatmasi:** agar bot tokeningiz biror joyda (chat, skrinshot, kod repozitoriysi)
> oshkor bo'lgan bo'lsa, uni @BotFather orqali `/revoke` qilib darhol yangilang — eski token
> zaharlangan hisoblanadi va uni kim topsa, o'sha nomdan xabar yubora oladi.

## Telegram orqali ro'yxatdan o'tish va kirish (SMS o'rniga)

SMS orqali tasdiqlash kodi yuborish pullik va murakkab bo'lgani uchun, saytda SMS o'rniga
Telegram orqali ishlaydigan alohida tizim qo'shildi:

1. **Ro'yxatdan o'tish** — foydalanuvchi standalone Node.js botga (`telegram-auth-bot/` papkasiga
   qarang, alohida serveringizda ishga tushirasiz) o'tib, telefon raqami + to'liq ism + parol
   bilan "hisob" yaratadi. Bot bu ma'lumotni to'g'ridan-to'g'ri Firestore'ga yozadi
   (`telegramAuth/{telefon}` va `profiles/{uid}` collection'lariga).
2. **Kirish** — sayt (`/kirish`, "Telegram" tab) shu telefon+parolni
   `netlify/functions/telegram-login-request.ts` orqali tekshiradi, to'g'ri bo'lsa foydalanuvchining
   Telegram chatiga 6 xonali kod yuboradi (`TELEGRAM_AUTH_BOT_TOKEN` orqali). Foydalanuvchi kodni
   kiritgach, `netlify/functions/telegram-login-verify.ts` uni tekshirib, Firebase custom token
   qaytaradi — sayt shu token bilan oddiy Firebase Auth sessiyasini ochadi.

Ishga tushirish uchun:
- `telegram-auth-bot/README.md` bo'yicha botni serveringizda ishga tushiring.
- Netlify env'ga `TELEGRAM_AUTH_BOT_TOKEN` qo'shing (bot bilan bir xil token bo'lishi mumkin).
- Bot username'ini `VITE_TELEGRAM_BOT_USERNAME` sifatida Netlify env'ga qo'shing — shunda sayt
  "Ro'yxatdan o'tish"/"Kirish" sahifalarida botga o'tuvchi tugma ko'rsatadi.

> ⚠️ Hozircha berilgan bot tokeni (`8862054310:...`) demo tezkorligi uchun `telegram-auth-bot/bot.js`
> ichiga ham yozib qo'yilgan. Production'ga chiqishda uni koddan olib tashlab, faqat muhit
> o'zgaruvchilari orqali berish tavsiya etiladi.

## Payme va Click — real to'lovlarni yoqish

Hozircha to'lov integratsiyasi **to'g'ri arxitektura bilan tayyor, lekin test/demo rejimda** —
merchant kalitlari hali yo'q. Real to'lovlarni yoqish uchun:

### 1. Payme
1. https://business.payme.uz — ro'yxatdan o'ting, Merchant ID va Kassa kalitini (key) oling.
2. Netlify env'ga qo'shing: `VITE_PAYME_MERCHANT_ID=...` va `PAYME_MERCHANT_KEY=...`
3. Payme kabinetida "Payment URL" sifatida quyidagini kiriting:
   `https://<sizning-netlify-saytingiz>.netlify.app/.netlify/functions/payme`

### 2. Click
1. https://merchant.click.uz — ro'yxatdan o'ting, Merchant ID, Service ID va Secret Key oling.
2. Netlify env'ga qo'shing: `VITE_CLICK_MERCHANT_ID=...`, `VITE_CLICK_SERVICE_ID=...`,
   `CLICK_SECRET_KEY=...`
3. Click kabinetida "Webhook URL" sifatida quyidagini kiriting:
   `https://<sizning-netlify-saytingiz>.netlify.app/.netlify/functions/click`

> Ikkala funksiya ham to'lov tasdiqlanganda avtomatik ravishda Telegram'ga xabar yuboradi
> (`netlify/functions/_lib/telegram.ts`). Ishga tushirishdan oldin ularni Payme/Click sandbox
> muhitida sinab ko'rishni tavsiya qilamiz — bu tayyor boshlang'ich nuqta, lekin sertifikatlangan
> integratsiya emas, shuning uchun rasmiy hujjatlar bilan solishtirib chiqing:
> - Payme: https://developer.help.paycom.uz
> - Click: https://docs.click.uz

## Birinchi admin foydalanuvchini yaratish

1. Saytda oddiy mijoz sifatida ro'yxatdan o'ting.
2. Firebase Console → Authentication → Users bo'limida shu foydalanuvchining **User UID**'ini
   nusxalang.
3. Firebase Console → Firestore Database → `profiles` kolleksiyasida shu UID nomli hujjatni toping
   va `role` maydonini `"customer"` dan `"admin"` ga o'zgartiring.
4. Qayta login qiling — endi navbar’da "Admin panel" havolasi ko'rinadi.

## Loyihani joylashtirish (production)

- **Frontend + backend API**: bittasi — Netlify'ga deploy qiling. `netlify.toml` allaqachon
  build buyrug'ini (`npm run build`), statik papkani (`dist`), `netlify/functions/*` papkasini va
  SPA marshrutlash uchun redirectni sozlab qo'ygan. Yuqoridagi barcha muhit o'zgaruvchilarini
  Netlify dashboard'da kiritishni unutmang.
- **Auth**: Firebase loyihangizda Authentication → Sign-in method → **Email/Password**'ni
  yoqishni unutmang (aks holda ro'yxatdan o'tish/kirish ishlamaydi).
- **Firestore**: Firebase Console'da Firestore Database'ni yarating (agar hali yaratmagan
  bo'lsangiz), so'ng xavfsizlik qoidalarini joylashtiring:
  ```bash
  npm install -g firebase-tools
  firebase login
  firebase deploy --only firestore:rules,firestore:indexes --project <sizning-firebase-project-id>
  ```

## Papka tuzilishi

```
src/
  components/     Navbar, Footer, ProtectedRoute va h.k.
  context/        AuthContext (Firebase Auth)
  lib/            firebaseClient (auth), firestoreClient + publicData.ts (faqat ommaviy o'qish),
                   api.ts (backend'ga autentifikatsiyalangan so'rovlar),
                   pricing.ts (narx hisoblash), payments.ts (Payme/Click URL)
  pages/          Ommaviy va mijoz sahifalari
  pages/admin/    Admin panel sahifalari
netlify/
  functions/      Autentifikatsiyalangan backend API (profile, bookings, payments,
                   admin-services, admin-staff) + payme.ts / click.ts (to'lov webhooklari)
                   + _lib/ (firebase-admin, Firestore util, Telegram helper, auth)
scripts/
  seed-firestore.mjs   Boshlang'ich narxlar, qo'shimcha xizmatlar, xizmatchilar
firestore.rules         Firestore xavfsizlik qoidalari
firestore.indexes.json  Kerakli composite index(lar)
```
