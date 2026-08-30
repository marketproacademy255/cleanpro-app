# Prompt: CleanPro — Mobil versiyada gorizontal scroll bagini tuzatish

Muammoni real build (`dist/`) ustida Playwright bilan 390px kenglikdagi mobil viewport'da o'lchab, aniq tasdiqladim. Ikkita alohida sabab bor — ikkalasini ham tuzatish kerak.

## Sabab #1 (asosiy, ~130px overflow): `src/components/Navbar.tsx`

Header'dagi brend blok (logo + "Prime Standard & Co" + "CLEANING SERVICES" yozuvi) `shrink-0` va `whitespace-nowrap` bilan belgilangan — bu ataylab qilingan (desktop keng monitorlarda nav linklar 2 qatorga bo'linib ketmasligi uchun, kod izohida yozilgan). Lekin xuddi shu qoida mobil ekranda (390px) ham ishlaydi: brend blok yolg'iz o'zi ~324px joy egallaydi, undan keyin til almashtirgich + tema tugmasi + burger menyu uchun yana ~158px kerak — jami ~482px, lekin ekran atigi 390px. Hech narsa siqilmagani (`shrink-0`) va hech qayerda `overflow-hidden` yo'qligi uchun butun sahifa gorizontal aylantiriladigan bo'lib qoladi.

**Fix:** Brend blokka faqat `lg:` ekranlarda (desktop) `shrink-0`/`whitespace-nowrap` qoldiring, mobil uchun siqilish/qisqarishga ruxsat bering:

```tsx
// Hozir (Navbar.tsx, ~68-qator atrofida):
<Link to="/" className="flex shrink-0 items-center gap-3 whitespace-nowrap leading-none tracking-tight text-brand-700 dark:text-brand-400">
  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-600 text-lg font-extrabold text-white">
    {t('brand.initials')}
  </span>
  <span className="flex flex-col justify-center gap-0.5">
    <span className="text-lg font-extrabold leading-tight sm:text-xl">{t('brand.name')}</span>
    <span className="text-[11px] font-semibold uppercase leading-none tracking-wide text-gray-400 dark:text-gray-500">
      {t('brand.tagline')}
    </span>
  </span>
  ...
</Link>

// O'rniga:
<Link to="/" className="flex min-w-0 items-center gap-3 leading-none tracking-tight text-brand-700 dark:text-brand-400 lg:shrink-0 lg:whitespace-nowrap">
  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-600 text-lg font-extrabold text-white">
    {t('brand.initials')}
  </span>
  <span className="flex min-w-0 flex-col justify-center gap-0.5">
    <span className="truncate text-lg font-extrabold leading-tight sm:text-xl">{t('brand.name')}</span>
    {/* Tagline mayda ekranlarda joy tejash uchun yashirilsin - brend nomi
        o'zi kifoya, "CLEANING SERVICES" faqat sm+ ekranlarda ko'rinsin. */}
    <span className="hidden truncate text-[11px] font-semibold uppercase leading-none tracking-wide text-gray-400 dark:text-gray-500 sm:block">
      {t('brand.tagline')}
    </span>
  </span>
  ...
</Link>
```

Bu o'zgarish `flex-shrink: 1` (default) + `min-w-0` (flex item matn bilan cheksiz kengayishini to'xtatadi) + `truncate` (sig'masa "...") kombinatsiyasi orqali brend blokni mobilda siqiladigan qiladi, lekin `lg:shrink-0 lg:whitespace-nowrap` orqali desktopdagi joriy (to'g'ri ishlayotgan) ko'rinishni saqlab qoladi.

Buni Playwright bilan sinab ko'rdim: shu o'zgarish yolg'iz o'zi overflow'ni 522px'dan → 414px'ga tushiradi (390px kerak) — qolgan ~24px quyidagi ikkinchi sababdan.

## Sabab #2 (kichik, ~24px overflow): `src/components/Reveal.tsx`

`direction="left"`/`"right"` uchun element ko'rinishga kirmaguncha `-translate-x-10`/`translate-x-10` (40px) siljitilgan holda turadi. Bu `transform` orqali qilingani uchun elementning layout o'lchamiga ta'sir qilmaydi, lekin sahifaning umumiy "scrollable" kengligiga qo'shiladi — chunki hech qayerda `overflow-x: hidden` yo'q. `Home.tsx`da bu 3 joyda ishlatiladi ("Nega biz" bo'limi + Galereya bo'limidagi 6 surat) — ular sahifaning pastida, hali scroll qilinmagan bo'lsa ham, brauzer ularni sahifa kengligini hisoblashda hisobga oladi. Shuning uchun sahifa yuklangan zahoti, hatto hero qismida turganda ham, butun sahifa ~24-40px gorizontal aylantirilishi mumkin bo'lib qoladi.

**Fix (global xavfsizlik chorasi ham bo'ladi):** `src/index.css`ga qo'shing:

```css
html {
  scroll-behavior: smooth;
  overflow-x: hidden; /* + */
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  color: #1a2e22;
  background-color: #fafdfb;
  transition: background-color 0.2s ease, color 0.2s ease;
  overflow-x: hidden; /* + */
}
```

Bu ikkalasi (`html` va `body`) ham kerak — ba'zi brauzerlar faqat bittasiga qarab ishlaydi. Bu qoida loyihadagi hech qanday funksiyaga (jumladan `AdminBookings.tsx`dagi jadval uchun ishlatilgan `overflow-x-auto`ga ham) salbiy ta'sir qilmaydi, chunki u alohida, ichki konteynerda ishlaydi.

Ikkala fix'ni birga Playwright orqali sinab ko'rdim: `scrollWidth` aniq `390px` (= `clientWidth`) ga tushdi, ya'ni gorizontal scroll butunlay yo'qoldi.

## Tekshirish

- `npm run build` xatosiz o'tishi kerak.
- Chrome DevTools'da mobil emulyatsiya (390×844, masalan iPhone 12/13) bilan bosh sahifani oching, chapdan o'ngga tortib ko'ring — endi hech narsa siljimasligi kerak.
- Brend nomi mobilda to'liq ko'rinishini yoki chiroyli kesilganini (`...`) tekshiring — juda tor ekranlarda (masalan 360px) `truncate` ishlab, matn kesilishi mumkin, bu normal.
- Desktop (≥1024px, `lg` breakpoint)da header hech narsa o'zgarmaganini tasdiqlang — u yerda hali ham `shrink-0`/`whitespace-nowrap` ishlaydi.
- Boshqa sahifalarni (Services, Booking, Dashboard, Admin) ham mobilda tez ko'zdan kechiring — global `overflow-x: hidden` boshqa yashirin overflow xatolarini ham "yopib" yuboradi, lekin ular hali ham mavjud bo'lishi mumkin (faqat ko'rinmay qoladi) — vaqti bo'lganda shunga o'xshash Playwright tekshiruvini boshqa sahifalarda ham qaytarish tavsiya etiladi.
