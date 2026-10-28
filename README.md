# Taqdimotchi — Telegram bot MVP (Node.js)

Bot mavzu va parametrlarni so‘raydi, Gemini orqali slayd matnlarini tuzadi va `.pptx` yuboradi.

## Taqdimot dizayni

Zamonaviy, akademik va minimal rang uslublari mavjud. `presentation.js` katta sarlavhali muqova, kartochkalar, jarayon bosqichlari va asosiy fikrni ajratib ko‘rsatuvchi maketlarni yaratadi. Slayd matni qisqa, batafsil tushuntirishlar ma’ruzachi eslatmalarida saqlanadi. Matn va shakllar PowerPoint ichida tahrirlanadi. AI qaytargan slaydlar soni va matn tuzilishi tekshiriladi; yetishmagan slaydlar sun’iy xulosalar bilan to‘ldirilmaydi.

Kod yangilangach, ishlayotgan botni Ctrl+C bilan to‘xtatib, `npm start` orqali qayta ishga tushiring. Dizayn yangilanishi yangi yaratilgan taqdimotlarga qo‘llanadi.

## Mavzuga mos vizuallar

AI tarix uchun sanali vaqt chizig‘i, sonli faktlar uchun yirik raqamlar, ikki variant uchun taqqoslash jadvali va jarayon uchun bosqichli sxema tanlaydi. Futbol taktikasi uchun 4–3–3, 4–4–2 yoki 3–5–2 joylashuvida 11 o‘yinchili tahrirlanadigan maydon chiziladi. Pas strelkalari o‘quv misoli bo‘lib, haqiqiy uchrashuv statistikasi emas. Boshqa mavzularga futbol sxemasi majburan qo‘llanmaydi.

`media.js` Wikimedia Commons’dan mavzuga mos CC BY, CC BY-SA, CC0 yoki public domain suratlarni qidiradi. Muallif va litsenziya slaydda, to‘liq manba va litsenziya havolasi ma’ruzachi eslatmalarida beriladi. Qirqib joylashtirilgan suratlar haqida eslatma ham saqlanadi. Bir taqdimot uchun ko‘pi bilan uchta qidiruv bajariladi; har biri 12 soniyagacha. Mos surat topilmasa yoki tarmoq ishlamasa, bot matnli maket bilan davom etadi. Suratlarning mavzuga mosligi va AI faktlari muhim taqdimotdan oldin ko‘rib chiqilishi lozim.

Surat yuklashni o‘chirish uchun `.env` fayliga `ENABLE_IMAGES=false` kiriting. Alohida rasm API kaliti talab qilinmaydi. Slaydlar orasidagi satr ajratish saqlanadi; muqovadagi izohlar bitta uzun satrga qo‘shilib ketmaydi.

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
