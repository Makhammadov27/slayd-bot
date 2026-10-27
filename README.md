# Taqdimotchi — Telegram bot MVP (Node.js)

Bot mavzu va parametrlarni so‘raydi, Gemini orqali slayd matnlarini tuzadi va `.pptx` yuboradi.

## Ishga tushirish (PowerShell)

Node.js 20+ kerak. Loyiha papkasida:

```powershell
npm install
Copy-Item .env.example .env
notepad .env
npm start
```

`.env` fayliga BotFather’dan yangi `TELEGRAM_BOT_TOKEN` va Google AI Studio’dan yangi `GOOGLE_API_KEY` kiriting. Chatda oshkor bo‘lgan credentiallarni bekor qiling; bularni chatga yoki GitHub’ga yubormang. Standart model `gemini-3.8-flash`; hisobingizda mavjud boshqa modelga `GEMINI_MODEL` orqali alмаштириш mumkin.

Bot shu kompyuter yoqilgan paytda ishlaydi. Doimiy ish uchun hostingga joylash mumkin.
