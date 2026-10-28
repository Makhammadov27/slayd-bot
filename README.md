# Taqdimotchi — Telegram bot MVP (Node.js)

Bot mavzu va parametrlarni so‘raydi, Gemini orqali slayd matnlarini tuzadi va `.pptx` yuboradi.

## Taqdimot dizayni

Zamonaviy, akademik va minimal rang uslublari mavjud. `presentation.js` katta sarlavhali muqova, kartochkalar, jarayon bosqichlari va asosiy fikrni ajratib ko‘rsatuvchi maketlarni yaratadi. Slayd matni qisqa, batafsil tushuntirishlar ma’ruzachi eslatmalarida saqlanadi. Matn va shakllar PowerPoint ichida tahrirlanadi. AI qaytargan slaydlar soni va matn tuzilishi tekshiriladi; yetishmagan slaydlar sun’iy xulosalar bilan to‘ldirilmaydi.

Kod yangilangach, ishlayotgan botni Ctrl+C bilan to‘xtatib, `npm start` orqali qayta ishga tushiring. Dizayn yangilanishi yangi yaratilgan taqdimotlarga qo‘llanadi.

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
