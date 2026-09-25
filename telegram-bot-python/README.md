# CleanPro Python Telegram Verification Bot

Ushbu Python bot saytdagi (`/register`) ro'yxatdan o'tish vaqtida foydalanuvchilarning telefon raqamini Telegram orqali real-vaqtda tasdiqlab beruvchi **mustaqil bot** hisoblanadi.

---

## 🛠️ Serverda ishga tushirish yo'riqnomasi (Linux / VPS):

### 1. Fayllarni yuklab olish va papkaga o'tish:
```bash
cd telegram-bot-python
```

### 2. Bog'liqliklar va Python kutubxonalarini o'rnatish:
```bash
pip install -r requirements.txt
```

### 3. Firebase kalitini joylashtirish:
Firebase Console -> **Project Settings** -> **Service Accounts** -> **Generate new private key** bo'limidan yuklab olingan `.json` faylini shu papkaga **`serviceAccountKey.json`** nomi bilan saqlang.

*(Yoki `.env` fayliga token va firebase ma'lumotlarini kiritishingiz mumkin)*

### 4. Botni ishga tushirish:
```bash
python3 bot.py
```

---

## ⚙️ Background (Orqa fonda doimiy 24/7) ishlatish (Systemd Service):

`/etc/systemd/system/cleanpro-bot.service` faylini yarating:

```ini
[Unit]
Description=CleanPro Telegram Verification Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/telegram-bot-python
ExecStart=/usr/bin/python3 /path/to/telegram-bot-python/bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Servisni yoqish:
```bash
systemctl daemon-reload
systemctl enable cleanpro-bot
systemctl start cleanpro-bot
```
