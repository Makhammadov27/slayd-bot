import 'dotenv/config';
import { Bot, Keyboard, InputFile, session } from 'grammy';
import { GoogleGenAI } from '@google/genai';
import { makePptx, validateDeck } from './presentation.js';
import { buildPrompt, deckSchema } from './content.js';
import { enrichImages } from './media.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const apiKey = process.env.GOOGLE_API_KEY?.trim();
const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
if (!token || !apiKey) { console.error('TELEGRAM_BOT_TOKEN va GOOGLE_API_KEY .env faylida bo‘lishi kerak.'); process.exit(1); }
const bot = new Bot(token);
const ai = new GoogleGenAI({ apiKey });
const langs = { uz: 'O‘zbekcha', ru: 'Русский', en: 'English' };
const styles = { modern: 'Zamonaviy', academic: 'Akademik', minimal: 'Minimal' };
bot.use(session({ initial: () => ({ step: 'topic', data: {} }) }));
const clean = (s = '') => s.replace(/[\x00-\x1f<>]/g, ' ').trim();
const langKeys = () => new Keyboard().text('O‘zbekcha').text('Русский').text('English').resized().oneTime();
const styleKeys = () => new Keyboard().text('Zamonaviy').text('Akademik').text('Minimal').resized().oneTime();
bot.command('start', async ctx => { ctx.session = { step: 'topic', data: {} }; await ctx.reply('👋 Salom! Men mavzudan PowerPoint taqdimot tayyorlayman.\n\nMavzuni yuboring. Masalan: Quyosh energiyasining kelajagi'); });
bot.command('cancel', async ctx => { ctx.session = { step: 'idle', data: {} }; await ctx.reply('Bekor qilindi. Yangidan boshlash uchun /start bosing.'); });
bot.on('message:text', async ctx => {
 const text = clean(ctx.message.text), s = ctx.session;
 if (text.startsWith('/')) return;
 if (s.step === 'topic') { if (text.length < 3 || text.length > 300) return ctx.reply('Mavzu 3–300 belgi bo‘lsin.'); s.data.topic=text; s.step='language'; return ctx.reply('Taqdimot tilini tanlang:',{reply_markup:langKeys()}); }
 if (s.step === 'language') { const e=Object.entries(langs).find(([,v])=>v===text); if(!e)return ctx.reply('Tilni tugmalardan tanlang:',{reply_markup:langKeys()}); s.data.language=e[0]; s.step='audience'; return ctx.reply('Auditoriya kimlar? Masalan: o‘quvchilar, talabalar yoki mutaxassislar.',{reply_markup:{remove_keyboard:true}}); }
 if (s.step === 'audience') { if(!text||text.length>160)return ctx.reply('Auditoriyani 1–160 belgi oralig‘ida yozing.'); s.data.audience=text;s.step='count';return ctx.reply('Nechta slayd kerak? 5 dan 15 gacha son kiriting.'); }
 if (s.step === 'count') { const n=Number(text);if(!Number.isInteger(n)||n<5||n>15)return ctx.reply('5 dan 15 gacha butun son yuboring.');s.data.count=n;s.step='style';return ctx.reply('Dizayn uslubini tanlang:',{reply_markup:styleKeys()}); }
 if (s.step === 'style') { const e=Object.entries(styles).find(([,v])=>v===text);if(!e)return ctx.reply('Uslubni tugmalardan tanlang:',{reply_markup:styleKeys()});const data={...s.data,style:e[0]};ctx.session={step:'idle',data:{}};await ctx.reply('⏳ Taqdimotni tayyorlayapman…',{reply_markup:{remove_keyboard:true}});let dir;try{const deck=await makeDeck(data);await enrichImages(deck,process.env.ENABLE_IMAGES!=='false');dir=await mkdtemp(join(tmpdir(),'taqdimot-'));const file=join(dir,'taqdimot.pptx');await makePptx(deck,data.style,file);await ctx.replyWithDocument(new InputFile(file),{caption:`✅ ${clean(deck.title)}\n${deck.slides.length} ta slayd · ${langs[data.language]}`});}catch(err){console.error('Generation error:',err?.message||err);await ctx.reply('Taqdimot yaratishda xatolik yuz berdi. /start bilan qayta urinib ko‘ring.');}finally{if(dir)await rm(dir,{recursive:true,force:true});} }
});
async function makeDeck(d){
 const request={model,contents:buildPrompt(d,langs[d.language],styles[d.style]),config:{responseMimeType:'application/json',responseSchema:deckSchema,temperature:0.55}};
 let r,lastError;
 const candidates=[...new Set([model,'gemini-3.8-flash','gemini-3.6-flash','gemini-3.5-flash-lite'])];
 for(const candidate of candidates){
  for(let attempt=0;attempt<2;attempt++){
   try{r=await ai.models.generateContent({...request,model:candidate});lastError=null;console.log(`Taqdimot uchun ${candidate} modeli javob berdi.`);break;}
   catch(err){lastError=err;const rawStatus=err?.status??err?.code??err?.error?.code??err?.response?.status;const status=Number(rawStatus);const detail=String(err?.message||err);const hardQuota=status===429&&(detail.includes('limit: 0')||detail.includes('retry in')||detail.includes('RESOURCE_EXHAUSTED'));const retryable=[429,500,502,503,504].includes(status);console.error(`Gemini ${candidate} xatosi (${status||'noma’lum'})${hardQuota?' — model kvotasi tugagan':''}.`);if(!retryable)throw err;if(hardQuota)break;if(attempt===0)await new Promise(resolve=>setTimeout(resolve,500));}
  }
  if(r)break;
 }
 if(lastError){const detail=String(lastError?.message||lastError);if(detail.includes('RESOURCE_EXHAUSTED')||detail.includes('limit: 0'))throw new Error('Gemini API kvotasi tugagan yoki model bepul tarifda mavjud emas. Google AI Studio’da billing/limitlarni tekshiring yoki bepul tarifda ishlaydigan modelni tanlang.');throw new Error(`Gemini modellariga hozir ulanish bo‘lmadi (${candidates.join(', ')}). Birozdan so‘ng qayta urinib ko‘ring.`);}
 const deck=JSON.parse(r?.text||'{}');return validateDeck(deck,d.count);
}
bot.catch(err=>console.error('Telegram xatoligi:',err.message));bot.start({onStart:info=>console.log(`Bot ishga tushdi: @${info.username}`)});
