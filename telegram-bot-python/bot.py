"""
CleanPro Telegram phone-verification bot (long polling).

Implements the same protocol as netlify/functions/_lib/phoneVerification.ts
(the webhook variant) - keep the two in sync:

  1. The signed-in site user presses "Tasdiqlash" -> the site creates
     phoneVerifications/{uid} {phone, nonce, status:'pending', expires_at}
     and gives them the link https://t.me/<bot>?start=<nonce>
  2. "/start <nonce>" here binds this chat to that request (chat_id).
  3. The user shares their OWN contact -> the phone must equal the
     requested one and not be verified on another account ->
     profiles/{uid}.phone_verified = True.

No passwords or auth tokens are ever handled here.
"""

import html
import logging
import os
import re
import sys
from datetime import datetime, timezone

import firebase_admin
import telebot
from dotenv import load_dotenv
from firebase_admin import credentials, firestore
from telebot import types

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Token comes ONLY from the environment (.env). Never hardcode it here -
# this file is in git.
BOT_TOKEN = os.getenv("BOT_TOKEN")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
SITE_URL = os.getenv("SITE_URL", "https://prime-standard.uz")

if not BOT_TOKEN:
    logging.error("BOT_TOKEN topilmadi. .env faylida ko'rsating (.env.example ga qarang).")
    sys.exit(1)


def init_firebase() -> None:
    if os.path.exists(FIREBASE_CREDENTIALS_PATH):
        firebase_admin.initialize_app(credentials.Certificate(FIREBASE_CREDENTIALS_PATH))
        logging.info("Firebase Admin initialized from %s", FIREBASE_CREDENTIALS_PATH)
        return

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
    private_key = (os.getenv("FIREBASE_PRIVATE_KEY") or "").replace("\\n", "\n")
    if not (project_id and client_email and private_key):
        logging.error("Firebase credentials topilmadi: serviceAccountKey.json yoki FIREBASE_* env kerak.")
        sys.exit(1)

    firebase_admin.initialize_app(
        credentials.Certificate(
            {
                "type": "service_account",
                "project_id": project_id,
                "private_key": private_key,
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )
    )
    logging.info("Firebase Admin initialized from environment variables.")


init_firebase()
db = firestore.client()
bot = telebot.TeleBot(BOT_TOKEN, parse_mode="HTML")


def normalize_phone(raw):
    """Must match normalizeUzPhone() in netlify/functions/_lib/phone.ts."""
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 9:
        return f"+998{digits}"
    if len(digits) == 12 and digits.startswith("998"):
        return f"+{digits}"
    return None


def now_iso() -> str:
    # Same format as JS Date#toISOString() so string comparisons line up.
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def is_expired(data: dict) -> bool:
    return (data.get("expires_at") or "") < now_iso()


def contact_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True)
    markup.add(types.KeyboardButton("📱 Raqamni yuborish", request_contact=True))
    return markup


def other_verified_owner(phone: str, uid: str):
    for doc in db.collection("profiles").where("phone", "==", phone).stream():
        if doc.id != uid and doc.to_dict().get("phone_verified") is True:
            return doc.id
    return None


@bot.message_handler(commands=["start"])
def handle_start(message):
    parts = (message.text or "").split(maxsplit=1)
    nonce = parts[1].strip() if len(parts) > 1 else ""

    if not nonce:
        bot.send_message(
            message.chat.id,
            "Assalomu alaykum! Bu CleanPro'ning telefon raqamni tasdiqlash boti.\n\n"
            f"Saytda ({html.escape(SITE_URL)}) <b>\"Tasdiqlash\"</b> tugmasini bosing va "
            "chiqqan havola orqali shu yerga qayting.",
            reply_markup=types.ReplyKeyboardRemove(),
        )
        return

    docs = list(db.collection("phoneVerifications").where("nonce", "==", nonce).limit(1).stream())
    if not docs:
        bot.send_message(message.chat.id, "⚠️ Havola yaroqsiz. Saytda qaytadan <b>\"Tasdiqlash\"</b> tugmasini bosing.")
        return

    data = docs[0].to_dict()
    if data.get("status") == "verified":
        bot.send_message(message.chat.id, "✅ Bu so'rov allaqachon tasdiqlangan. Saytga qaytishingiz mumkin.")
        return
    if is_expired(data):
        bot.send_message(message.chat.id, "⌛ Havolaning muddati tugagan. Saytda qaytadan <b>\"Tasdiqlash\"</b> tugmasini bosing.")
        return

    docs[0].reference.update({"chat_id": message.chat.id, "updated_at": now_iso()})
    bot.send_message(
        message.chat.id,
        "Raqamingizni tasdiqlash uchun pastdagi 📱 <b>Raqamni yuborish</b> tugmasini bosing.",
        reply_markup=contact_keyboard(),
    )


@bot.message_handler(content_types=["contact"])
def handle_contact(message):
    contact = message.contact
    # Only the sender's OWN contact counts - a forwarded/shared contact card
    # of someone else has a different (or no) user_id.
    if not contact or contact.user_id != message.from_user.id:
        bot.send_message(
            message.chat.id,
            "Faqat o'zingizning raqamingizni pastdagi tugma orqali yuborishingiz mumkin.",
            reply_markup=contact_keyboard(),
        )
        return

    phone = normalize_phone(contact.phone_number)
    if not phone:
        bot.send_message(message.chat.id, "Faqat O'zbekiston (+998) raqamlari qabul qilinadi.",
                         reply_markup=types.ReplyKeyboardRemove())
        return

    pending = [
        d for d in db.collection("phoneVerifications").where("chat_id", "==", message.chat.id).stream()
        if d.to_dict().get("status") == "pending"
    ]
    pending.sort(key=lambda d: d.to_dict().get("created_at") or "", reverse=True)
    remove_kb = types.ReplyKeyboardRemove()

    if not pending:
        bot.send_message(
            message.chat.id,
            "⚠️ Bu chat uchun faol tasdiqlash so'rovi topilmadi.\n\n"
            f"Saytga kiring ({html.escape(SITE_URL)}), <b>\"Tasdiqlash\"</b> tugmasini bosing va "
            "chiqqan <b>\"Telegram botni ochish\"</b> havolasi orqali qayta keling.",
            reply_markup=remove_kb,
        )
        return

    doc = pending[0]
    data = doc.to_dict()
    if is_expired(data):
        bot.send_message(message.chat.id, "⌛ Tasdiqlash havolasining muddati tugagan. Saytda qaytadan <b>\"Tasdiqlash\"</b> tugmasini bosing.",
                         reply_markup=remove_kb)
        return

    if data.get("phone") != phone:
        bot.send_message(
            message.chat.id,
            "❌ Telegram raqamingiz saytda kiritilgan raqamga mos kelmadi.\n\n"
            f"Saytda: <code>{html.escape(str(data.get('phone')))}</code>\n"
            f"Telegram: <code>{html.escape(phone)}</code>\n\n"
            "Saytda Telegram hisobingizga ulangan raqamni kiriting va qaytadan urinib ko'ring.",
            reply_markup=remove_kb,
        )
        return

    uid = data["uid"]
    if other_verified_owner(phone, uid):
        bot.send_message(
            message.chat.id,
            "❌ Bu raqam boshqa akkauntda allaqachon tasdiqlangan. Agar bu xato bo'lsa, "
            "qo'llab-quvvatlash xizmatiga murojaat qiling.",
            reply_markup=remove_kb,
        )
        return

    ts = now_iso()
    batch = db.batch()
    batch.set(
        db.collection("profiles").document(uid),
        {"phone": phone, "phone_verified": True, "phone_verified_at": ts},
        merge=True,
    )
    batch.update(doc.reference, {"status": "verified", "updated_at": ts})
    batch.commit()

    logging.info("Verified phone %s for uid %s", phone, uid)
    bot.send_message(
        message.chat.id,
        "✅ <b>Telefon raqamingiz tasdiqlandi!</b>\n\n"
        f"Telefon: <code>{html.escape(phone)}</code>\n\n"
        "Saytga qayting - sahifa avtomatik yangilanadi.",
        reply_markup=remove_kb,
    )


@bot.message_handler(func=lambda m: True)
def handle_other(message):
    bot.send_message(message.chat.id, f"Raqamni tasdiqlash uchun saytda ({html.escape(SITE_URL)}) \"Tasdiqlash\" tugmasini bosing.")


if __name__ == "__main__":
    logging.info("CleanPro Telegram verification bot starting...")
    try:
        # Polling and a webhook can't both be active for the same bot.
        bot.remove_webhook()
    except Exception as e:  # noqa: BLE001
        logging.warning("Could not remove webhook: %s", e)
    bot.infinity_polling()
