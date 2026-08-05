# CleanPro — Tozalash xizmatlari platformasi

Uy va ofislarni tozalash xizmatini onlayn band qilish, narxni avtomatik hisoblash va **Payme** /
**Click** orqali to'lov qabul qilish uchun to'liq stack veb-ilova.

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS (frontend) · Supabase — Postgres, Auth, RLS,
Edge Functions (backend) — barchasi xavfsiz, tur-tekshiruvli (type-safe) tilda yozilgan.

## Loyihada nima bor

- **Ommaviy sayt**: bosh sahifa, xizmatlar/narxlar, jamoa, aloqa
- **Onlayn band qilish**: xizmat turi, xona/maydon, sana-vaqt, chastota (bir martalik/haftalik/oylik),
  qo'shimcha xizmatlar — narx real vaqtda hisoblanadi
- **Mijoz kabineti**: ro'yxatdan o'tish/kirish (Supabase Auth), buyurtmalar tarixi, to'lov holati
- **To'lov**: Payme va Click uchun checkout havolalari + ularning server tomonidagi webhook
  protokollarini bajaruvchi Supabase Edge Functions (`supabase/functions/payme`,
  `supabase/functions/click`)
- **Admin panel**: buyurtmalarni ko'rish/holatini o'zgartirish, xizmatchi tayinlash, xizmatchilar
  ro'yxatini boshqarish, narxlarni istalgan vaqtda tahrirlash
- **Ma'lumotlar bazasi**: to'liq RLS (Row Level Security) siyosatlari bilan himoyalangan —
  mijozlar faqat o'z buyurtmalarini, adminlar esa barchasini ko'radi

## Narxlash asosi

Narxlar AQSHdagi yetakchi tozalash platformalari (Merry Maids, Molly Maid, MaidPro — o'rtacha
$75–150/tashrif, xona soniga qarab ortib boradigan tuzilma) asosida shakllantirilib,
O'zbekiston bozoriga moslashtirilgan boshlang'ich narxlar sifatida kiritilgan (`supabase/seed.sql`).
Buni **Admin panel → "Xizmatlar va narxlar"** orqali istalgan vaqtda o'zgartirishingiz mumkin —
kod o'zgartirish shart emas.

| Xizmat | Boshlang'ich narx | Qo'shimcha |
|---|---|---|
| Standart tozalash | 150,000 so'm (1 xona) | +40,000 so'm/xona |
| Chuqur tozalash | 210,000 so'm (1 xona) | +56,000 so'm/xona |
| Ko'chishdan oldin/keyin | 240,000 so'm (1 xona) | +64,000 so'm/xona |
| Ofis tozalash | m² bo'yicha | 8,000 so'm/m² (min 300,000) |

Chastota chegirmalari: har hafta −20%, ikki haftada bir −15%, oyiga bir marta −10%.

## Backend — Supabase loyihasi tayyor

Loyiha uchun Supabase backend allaqachon yaratilgan va sozlangan (jadvallar, RLS, boshlang'ich
ma'lumotlar, edge functionlar — barchasi joylashtirilgan). `.env.example` faylida kerakli
`VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` allaqachon to'ldirilgan — shunchaki uni `.env`
nomiga ko'chiring:

```bash
cp .env.example .env
```

Agar o'zingizning Supabase loyihangizni ishlatmoqchi bo'lsangiz: `supabase/migrations/` dagi SQL
fayllarni yangi loyihangizda ishga tushiring, so'ng `supabase/seed.sql` ni bajaring.

## Ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda `http://localhost:5173` ochiladi.

## Payme va Click — real to'lovlarni yoqish

Hozircha to'lov integratsiyasi **to'g'ri arxitektura bilan tayyor, lekin test/demo rejimda** —
merchant kalitlari hali yo'q. Real to'lovlarni yoqish uchun:

### 1. Payme
1. https://business.payme.uz — ro'yxatdan o'ting, Merchant ID va Kassa kalitini (key) oling.
2. `.env` faylga qo'shing: `VITE_PAYME_MERCHANT_ID=...`
3. Edge function uchun maxfiy kalitni Supabase’ga saqlang:
   ```bash
   supabase secrets set PAYME_MERCHANT_KEY=xxxxx --project-ref lnuyulxrgreqhzmzdnpu
   ```
4. Payme kabinetida "Payment URL" sifatida quyidagini kiriting:
   `https://lnuyulxrgreqhzmzdnpu.supabase.co/functions/v1/payme`

### 2. Click
1. https://merchant.click.uz — ro'yxatdan o'ting, Merchant ID, Service ID va Secret Key oling.
2. `.env` faylga qo'shing: `VITE_CLICK_MERCHANT_ID=...`, `VITE_CLICK_SERVICE_ID=...`
3. Maxfiy kalitni saqlang:
   ```bash
   supabase secrets set CLICK_SECRET_KEY=xxxxx --project-ref lnuyulxrgreqhzmzdnpu
   ```
4. Click kabinetida "Webhook URL" sifatida quyidagini kiriting:
   `https://lnuyulxrgreqhzmzdnpu.supabase.co/functions/v1/click`

> Ikkala edge function ham allaqachon Supabase’ga joylashtirilgan (deploy qilingan) va JSON-RPC
> (Payme) / Prepare-Complete (Click) protokollarini to'liq amalga oshiradi. Ishga tushirishdan oldin
> ularni Payme/Click sandbox muhitida sinab ko'rishni tavsiya qilamiz — bu tayyor boshlang'ich nuqta,
> lekin sertifikatlangan integratsiya emas, shuning uchun rasmiy hujjatlar bilan solishtirib chiqing:
> - Payme: https://developer.help.paycom.uz
> - Click: https://docs.click.uz

## Birinchi admin foydalanuvchini yaratish

1. Saytda oddiy mijoz sifatida ro'yxatdan o'ting.
2. Supabase SQL Editor’da uni admin qiling:
   ```sql
   update public.profiles set role = 'admin' where id = (
     select id from auth.users where email = 'sizning-emailingiz@example.com'
   );
   ```
3. Qayta login qiling — endi navbar’da "Admin panel" havolasi ko'rinadi.

## Loyihani joylashtirish (production)

- **Frontend**: Vercel yoki Netlify’ga `npm run build` natijasi (`dist/`) bilan joylashtiring;
  muhit o'zgaruvchilarini (`.env`) hosting sozlamalarida kiriting.
- **Backend**: Supabase loyihasi allaqachon bulutda ishlamoqda — qo'shimcha server kerak emas.

## Papka tuzilishi

```
src/
  components/     Navbar, Footer, ProtectedRoute va h.k.
  context/        AuthContext (Supabase Auth)
  lib/            supabaseClient, pricing.ts (narx hisoblash), payments.ts (Payme/Click URL)
  pages/          Ommaviy va mijoz sahifalari
  pages/admin/    Admin panel sahifalari
supabase/
  migrations/     Bazaviy sxema (jadvallar, RLS)
  functions/      payme/ va click/ edge functionlar
  seed.sql        Boshlang'ich narxlar, qo'shimcha xizmatlar, xizmatchilar
```
