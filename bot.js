import 'dotenv/config';
import { Bot, Keyboard, InputFile, session } from 'grammy';
import { GoogleGenAI } from '@google/genai';
import pptxgen from 'pptxgenjs';
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
 if (s.step === 'style') { const e=Object.entries(styles).find(([,v])=>v===text);if(!e)return ctx.reply('Uslubni tugmalardan tanlang:',{reply_markup:styleKeys()});const data={...s.data,style:e[0]};ctx.session={step:'idle',data:{}};await ctx.reply('⏳ Taqdimotni tayyorlayapman…',{reply_markup:{remove_keyboard:true}});let dir;try{const deck=await makeDeck(data);dir=await mkdtemp(join(tmpdir(),'taqdimot-'));const file=join(dir,'taqdimot.pptx');await makePptx(deck,data.style,file);await ctx.replyWithDocument(new InputFile(file),{caption:`✅ ${clean(deck.title)}\n${deck.slides.length} ta slayd · ${langs[data.language]}`});}catch(err){console.error('Generation error:',err?.message||err);await ctx.reply('Taqdimot yaratishda xatolik yuz berdi. /start bilan qayta urinib ko‘ring.');}finally{if(dir)await rm(dir,{recursive:true,force:true});} }
});
async function makeDeck(d){
 const request={model,contents:`Create a clear fact-conscious presentation in ${langs[d.language]}. Topic: ${d.topic}. Audience: ${d.audience}. Exactly ${d.count} slides. Style: ${styles[d.style]}. Concise slide text, opening and conclusion. Do not invent citations or precise statistics. Each slide has title, 2-5 short bullets, optional speaker_notes.`,config:{responseMimeType:'application/json',responseSchema:{type:'OBJECT',properties:{title:{type:'STRING'},slides:{type:'ARRAY',items:{type:'OBJECT',properties:{title:{type:'STRING'},bullets:{type:'ARRAY',items:{type:'STRING'}},speaker_notes:{type:'STRING'}},required:['title','bullets']}}},required:['title','slides']},temperature:0.55}};
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
 const deck=JSON.parse(r?.text||'{}');if(!Array.isArray(deck.slides)||!deck.slides.length)throw Error('Gemini slayd yaratmadi');deck.slides=deck.slides.slice(0,d.count);while(deck.slides.length<d.count)deck.slides.push({title:'Xulosa',bullets:['Asosiy fikrlarni takrorlang.']});return deck;
}
async function makePptx(deck,style,file){const p=new pptxgen();p.layout='LAYOUT_WIDE';p.author='Taqdimotchi bot';p.title=clean(deck.title);const pal={modern:{bg:'0F172A',accent:'22D3EE',fg:'F1F5F9'},academic:{bg:'FAF8F2',accent:'1E4064',fg:'1F2937'},minimal:{bg:'FFFFFF',accent:'4F46E5',fg:'18181B'}}[style];deck.slides.forEach((item,i)=>{const s=p.addSlide();s.background={color:pal.bg};s.addShape(p.ShapeType.rect,{x:.55,y:.55,w:.75,h:.07,line:{color:pal.accent,transparency:100},fill:{color:pal.accent}});s.addText(clean(item.title),{x:.6,y:.9,w:12,h:1.1,fontFace:'Aptos Display',fontSize:29,bold:true,color:pal.fg,fit:'shrink'});const bullets=(item.bullets||[]).slice(0,6).map(t=>({text:clean(t),options:{bullet:{indent:18},hanging:4,breakLine:true,paraSpaceAfterPt:14}}));s.addText(bullets,{x:.85,y:2.25,w:11.4,h:4.2,fontFace:'Aptos',fontSize:21,color:pal.fg,valign:'mid',fit:'shrink',margin:.08});s.addText(`${clean(deck.title)} · ${String(i+1).padStart(2,'0')} / ${String(deck.slides.length).padStart(2,'0')}`,{x:.6,y:7.08,w:12,h:.18,fontSize:9,color:pal.accent,margin:0});if(item.speaker_notes)s.addNotes(clean(item.speaker_notes));});await p.writeFile({fileName:file});}
bot.catch(err=>console.error('Telegram xatoligi:',err.message));bot.start({onStart:info=>console.log(`Bot ishga tushdi: @${info.username}`)});
