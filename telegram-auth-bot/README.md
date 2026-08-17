# CleanPro Telegram ro'yxatdan o'tish boti (Node.js)

Bu alohida, mustaqil Node.js bot - CleanPro saytining `cleanpro-app` loyihasidan
alohida ishga tushiriladi (o'z serveringizda, VPS'da yoki shunga o'xshash joyda).
[Telegraf](https://telegraf.js.org/) kutubxonasi va Firebase Admin SDK (Node) asosida yozilgan.

## Bu nima qiladi

- Foydalanuvchi botga `/start` yozadi -> "Ro'yxatdan o'tish" tugmasini bosadi
- Telefon raqamini Telegram'ning o'z tugmasi orqali ulashadi
- To'liq ismini yozadi
- Parol o'ylab topadi (xabar darhol o'chiriladi)
- Bot bu ma'lumotlarni Firebase Firestore'ga yozadi:
  - `profiles/{uid}` - saytdagi boshqa foydalanuvchi profillari bilan bir xil shaklda
  - `telegramAuth/{phone}` - telefon+parol+chat_id (faqat login uchun)

Saytning **Kirish** sahifasida "Telegram" bo'limi bor - u yerda foydalanuvchi
shu telefon+parolni kiritadi, sayt (`netlify/functions/telegram-login-request.ts`)
parolni tekshirib, tasdiqlash kodini shu bot orqali (yoki xohlasangiz alohida
bot orqali - `TELEGRAM_AUTH_BOT_TOKEN`) yuboradi, kodni tasdiqlagandan keyin
sayt Firebase orqali kirishni yakunlaydi.

## O'rnatish

Node.js 18+ kerak.

```bash
cd telegram-auth-bot
npm install
```

## Sozlash

`.env.example` faylidan nusxa oling:

```bash
cp .env.example .env
```

`.env` faylini oching va to'ldiring:

- `BOT_TOKEN` - @BotFather'dan olingan token (hozircha demo uchun `bot.js`
  ichiga ham yozib qo'yilgan, shu yerga qo'ysangiz shu ustunlik qiladi)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` -
  Firebase Console -> Project settings -> Service accounts -> Generate new
  private key orqali oling (bu `cleanpro-app/netlify/functions`dagi bilan
  BIR XIL service account bo'lishi kerak - loyiha bitta Firebase'ga yozadi)

## Ishga tushirish

```bash
npm start
# yoki
node bot.js
```

Bot ishga tushgach, Telegram'da botingizga `/start` yozib sinab ko'ring.

## Serverda doimiy ishlashi uchun (systemd misoli)

`/etc/systemd/system/cleanpro-auth-bot.service`:

```ini
[Unit]
Description=CleanPro Telegram auth bot
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/telegram-auth-bot
ExecStart=/usr/bin/node bot.js
EnvironmentFile=/path/to/telegram-auth-bot/.env
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cleanpro-auth-bot
sudo systemctl status cleanpro-auth-bot
```

Yoki [PM2](https://pm2.keymetrics.io/) bilan:

```bash
npm install -g pm2
pm2 start bot.js --name cleanpro-auth-bot
pm2 save
pm2 startup
```

## Botning username'ini saytga bog'lash

Bot yaratilgach (@BotFather'da) uning username'i (masalan `cleanpro_uz_bot`)
ma'lum bo'ladi. Shuni Netlify'da quyidagi muhit o'zgaruvchisiga qo'ying -
shunda saytdagi "Ro'yxatdan o'tish" va "Kirish" sahifalarida botga
o'tuvchi tugma/havola chiqadi:

```
VITE_TELEGRAM_BOT_USERNAME=cleanpro_uz_bot
```

## Muhim eslatmalar

- Bu bot faqat **ro'yxatdan o'tish** uchun. Kirish paytidagi tasdiqlash
  kodini yuborish saytning backend qismida (Netlify Functions,
  `TELEGRAM_AUTH_BOT_TOKEN` muhit o'zgaruvchisi orqali) amalga oshiriladi -
  eng sodda variant sifatida xuddi shu bot tokenidan foydalanishingiz mumkin.
- Sessiya holati (kim qaysi qadamda turgani) xotirada saqlanadi
  (`telegraf`ning ichki `session()` middleware'i) - bot qayta ishga tushsa,
  hozir ro'yxatdan o'tayotgan (lekin tugatmagan) foydalanuvchilarning holati
  yo'qoladi va ular `/start` dan qayta boshlashi kerak bo'ladi. Bu demo
  bosqichi uchun yetarli; katta yuklama bo'lsa Redis session storega o'tish
  mumkin (`telegraf-session-redis` kabi paketlar bilan).
- `bot.js` ichidagi hardcoded `BOT_TOKEN` faqat demo/tezkor ishga tushirish
  uchun. Productionga chiqishda uni koddan olib tashlab, faqat `.env`
  orqali berish tavsiya etiladi (token GitHub'ga tushib qolmasligi uchun).
