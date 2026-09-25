import os
import re
import logging
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
import telebot
from telebot import types

# Load .env file if present
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Load environment variables
BOT_TOKEN = os.getenv("BOT_TOKEN", "8862054310:AAEFj9CUYBGfAyvlL5yLGrDH8jYjWJzMMBE")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")

# Initialize Firebase Admin
if os.path.exists(FIREBASE_CREDENTIALS_PATH):
    cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)
    logging.info(f"Firebase Admin initialized using {FIREBASE_CREDENTIALS_PATH}")
else:
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
    private_key = (os.getenv("FIREBASE_PRIVATE_KEY") or "").replace("\\n", "\n")

    if project_id and client_email and private_key:
        cred_dict = {
            "type": "service_account",
            "project_id": project_id,
            "private_key": private_key,
            "client_email": client_email,
        }
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        logging.info("Firebase Admin initialized using environment variables.")
    else:
        logging.error("Firebase credentials not found! Place serviceAccountKey.json or set env vars.")

db = firestore.client()
bot = telebot.TeleBot(BOT_TOKEN, parse_mode="HTML")


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 9:
        return f"+998{digits}"
    if len(digits) == 12 and digits.startswith("998"):
        return f"+{digits}"
    return None


@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True)
    contact_btn = types.KeyboardButton("📱 Raqamni yuborish", request_contact=True)
    markup.add(contact_btn)

    text = (
        "<b>Assalomu alaykum! CleanPro rasmiy ro'yxatdan o'tish botiga xush kelibsiz.</b>\n\n"
        "Telefon raqamingizni tasdiqlash uchun pastdagi 📱 <b>Raqamni yuborish</b> tugmasini bosing."
    )
    bot.send_message(message.chat.id, text, reply_markup=markup)


@bot.message_handler(content_types=['contact'])
def handle_contact(message):
    if not message.contact:
        return

    raw_phone = message.contact.phone_number
    phone = normalize_phone(raw_phone)

    if not phone:
        bot.send_message(message.chat.id, "⚠️ Telefon raqamni aniqlab bo'lmadi. Qaytadan urinib ko'ring.")
        return

    logging.info(f"Received contact: {phone} from chat_id: {message.chat.id}")

    # Check Firestore phoneVerifications document
    doc_ref = db.collection("phoneVerifications").document(phone)
    doc_snap = doc_ref.get()

    if doc_snap.exists:
        data = doc_snap.to_dict()
        if data.get("status") == "pending":
            full_name = data.get("full_name") or message.from_user.first_name or "Foydalanuvchi"
            email = data.get("email")

            # Update Firestore profile and phoneVerifications
            uid = data.get("uid") or db.collection("profiles").document().id
            now = firestore.SERVER_TIMESTAMP

            profile_ref = db.collection("profiles").document(uid)
            profile_ref.set({
                "role": "customer",
                "full_name": full_name,
                "phone": phone,
                "email": email,
                "phone_verified": True,
                "created_at": now
            }, merge=True)

            doc_ref.update({
                "status": "verified",
                "uid": uid,
                "updated_at": now
            })

            success_text = (
                f"✅ <b>Telefon raqamingiz muvaffaqiyatli tasdiqlandi!</b>\n\n"
                f"Ism: <b>{full_name}</b>\n"
                f"Telefon: <code>{phone}</code>\n\n"
                f"Saytga qaytishingiz mumkin — akkauntingiz tasdiqlandi!"
            )
            bot.send_message(message.chat.id, success_text, reply_markup=types.ReplyKeyboardRemove())
            logging.info(f"Successfully verified phone: {phone}")
            return
        elif data.get("status") == "verified":
            bot.send_message(
                message.chat.id,
                "✅ Ushbu telefon raqam allaqachon tasdiqlangan. Saytga kiring.",
                reply_markup=types.ReplyKeyboardRemove(),
            )
            return

    # If no pending verification doc found
    no_req_text = (
        f"📱 <b>Raqamingiz qabul qilindi:</b> <code>{phone}</code>\n\n"
        f"⚠️ Lekin saytda ushbu raqam bo'yicha hali tasdiqlash so'rovi topilmadi.\n\n"
        f"Iltimos, avval saytga (<b>https://prime-standard.uz/register</b>) o'tib, ma'lumotlaringizni kiritib <b>'Tasdiqlash'</b> tugmasini bosing, so'ngra botga qaytib raqamni yuboring."
    )
    bot.send_message(message.chat.id, no_req_text, reply_markup=types.ReplyKeyboardRemove())


if __name__ == "__main__":
    logging.info("CleanPro Python Telegram Verification Bot starting...")
    bot.infinity_polling()
