import pptxgen from 'pptxgenjs';

// All visual elements remain editable in PowerPoint. No image API is required.
const THEMES = {
  modern: { dark: '101C32', light: 'F4F7FC', accent: '30D5B5', secondary: '7695FF', card: '1D2D48', ink: '16243B', muted: '9FAFC6' },
  academic: { dark: '172F36', light: 'F8F5ED', accent: 'EBC779', secondary: '88C7BA', card: '25454C', ink: '19373C', muted: 'B0C6C7' },
  minimal: { dark: '242334', light: 'FAF9F6', accent: 'C6B8FF', secondary: 'EDAE8F', card: '343348', ink: '292736', muted: 'B8B4C9' },
};
const W = 13.333333, H = 7.5;
const text = value => String(value ?? '').replace(/[\x00-\x09\x0b-\x1f]/g, ' ').trim();

export function validateDeck(deck, expectedCount) {
  if (!deck || typeof deck.title !== 'string' || !deck.title.trim()) throw Error('Taqdimot sarlavhasi yo‘q.');
  if (!Array.isArray(deck.slides) || !deck.slides.length) throw Error('Slaydlar yaratilmagan.');
  if (expectedCount && deck.slides.length !== expectedCount) throw Error('AI so‘ralgan slaydlar sonini qaytarmadi.');
  for (const slide of deck.slides) {
    if (typeof slide.title !== 'string' || !slide.title.trim() || slide.title.length > 160) throw Error('Slayd sarlavhasi noto‘g‘ri yoki juda uzun.');
    if (!Array.isArray(slide.bullets) || !slide.bullets.length || slide.bullets.length > 6 || slide.bullets.some(b => typeof b !== 'string' || !b.trim() || b.length > 300)) throw Error('Slayd matni maketga mos emas.');
  }
  return deck;
}

export async function makePptx(deck, style, file) {
  validateDeck(deck);
  const p = new pptxgen();
  p.layout = 'LAYOUT_WIDE';
  p.author = 'Slaydly';
  p.title = text(deck.title);
  p.subject = 'Slaydly taqdimoti';
  p.theme = { headFontFace: 'Aptos Display', bodyFontFace: 'Aptos', lang: 'uz-Latn-UZ' };
  const t = THEMES[style] || THEMES.modern;
  const shape = (s, kind, x, y, w, h, color, extra = {}) => s.addShape(p.ShapeType[kind], { x, y, w, h, line: { color, transparency: 100 }, fill: { color }, ...extra });
  const box = (s, value, x, y, w, h, size, color, extra = {}) => s.addText(text(value), {
    x, y, w, h, fontFace: 'Aptos', fontSize: size, color,
    margin: 0, breakLine: false, valign: 'mid', fit: 'shrink', ...extra,
  });
  const number = n => String(n).padStart(2, '0');

  function footer(s, index, dark) {
    const muted = dark ? t.muted : '67758A';
    shape(s, 'rect', .6, 6.96, 12.13, .012, dark ? t.card : 'DCE1E9');
    shape(s, 'rect', .6, 6.96, 12.13 * (index + 1) / deck.slides.length, .025, dark ? t.accent : t.ink);
    box(s, 'SLAYDLY', .6, 7.11, 1.1, .17, 9, muted, { bold: true, charSpacing: 2 });
    box(s, deck.title, 2, 7.08, 8.8, .23, 9, muted);
    box(s, `${number(index + 1)} / ${number(deck.slides.length)}`, 11.5, 7.08, 1.23, .23, 10, muted, { align: 'right' });
  }
  function heading(s, item, index, dark) {
    const fg = dark ? 'FFFFFF' : t.ink;
    box(s, item.kicker || number(index + 1), .65, .49, 10.8, .27, 11, dark ? t.accent : t.ink, { bold: true, charSpacing: 1.8 });
    box(s, item.title, .65, 1.02, 11.95, 1.12, item.title.length > 80 ? 30 : 35, fg, { bold: true, fontFace: 'Aptos Display' });
    shape(s, 'rect', .65, 2.29, .65, .045, dark ? t.accent : t.ink);
  }
  function card(s, value, index, x, y, w, h, dark) {
    shape(s, 'roundRect', x, y, w, h, dark ? t.card : 'FFFFFF', { radius: .16, rectRadius: .16 });
    box(s, number(index + 1), x + .24, y + .22, .65, .4, 23, dark ? t.accent : t.ink, { bold: true });
    shape(s, 'rect', x + .25, y + .79, .35, .035, dark ? t.secondary : t.accent);
    box(s, value, x + .24, y + 1.02, w - .48, h - 1.23, value.length > 150 ? 17 : 21, dark ? 'F3F7FF' : t.ink, { valign: 'top', paraSpaceAfterPt: 6 });
  }
  function cards(s, item, dark) {
    const n = item.bullets.length;
    const cols = n <= 3 ? n : (n === 4 ? 2 : 3);
    const rows = Math.ceil(n / cols);
    const gap = .22, w = (12.03 - gap * (cols - 1)) / cols;
    const h = rows === 1 ? 3.75 : 1.79;
    item.bullets.forEach((b, i) => {
      const x = .65 + (i % cols) * (w + gap), y = 2.67 + Math.floor(i / cols) * (h + gap);
      if (rows === 1) card(s, b, i, x, y, w, h, dark);
      else {
        shape(s, 'roundRect', x, y, w, h, dark ? t.card : 'FFFFFF', { radius: .14 });
        box(s, number(i + 1), x + .18, y + .2, .55, .35, 19, dark ? t.accent : t.ink, { bold: true });
        box(s, b, x + .85, y + .2, w - 1.05, h - .4, 18, dark ? 'F3F7FF' : t.ink, { valign: 'top' });
      }
    });
  }
  function process(s, item, dark) {
    const n = item.bullets.length, rowH = 3.95 / n;
    shape(s, 'rect', .92, 2.88, .025, rowH * (n - 1), dark ? t.secondary : t.ink);
    item.bullets.forEach((b, i) => {
      const y = 2.6 + rowH * i;
      shape(s, 'ellipse', .65, y + .05, .55, .55, dark ? t.accent : t.ink);
      box(s, number(i + 1), .65, y + .05, .55, .55, 13, dark ? t.ink : 'FFFFFF', { bold: true, align: 'center' });
      box(s, b, 1.5, y, 10.5, rowH - .13, n > 4 ? 19 : 23, dark ? 'FFFFFF' : t.ink);
    });
  }
  function spotlight(s, item, dark) {
    // A featured idea plus supporting statements; no invented metrics or chart values.
    shape(s, 'roundRect', .65, 2.65, 4.1, 3.85, t.accent, { radius: .2 });
    box(s, '01', .95, 2.94, 1.3, .64, 36, t.ink, { bold: true });
    box(s, item.bullets[0], .95, 3.83, 3.5, 2.27, 27, t.ink, { bold: true, valign: 'top' });
    const rest = item.bullets.slice(1), rowH = 3.85 / Math.max(1, rest.length);
    rest.forEach((b, i) => {
      const y = 2.65 + i * rowH;
      box(s, number(i + 2), 5.15, y + .06, .55, .4, 17, dark ? t.accent : t.ink, { bold: true });
      box(s, b, 5.95, y + .05, 6.45, rowH - .2, 22, dark ? 'FFFFFF' : t.ink, { valign: 'top' });
      if (i < rest.length - 1) shape(s, 'rect', 5.95, y + rowH - .08, 6.45, .014, dark ? t.card : 'DCE1E9');
    });
  }
  function supporting(s, bullets, x, y, w, h, dark) {
    const row = h / bullets.length;
    bullets.forEach((b,i) => {
      shape(s,'rect',x,y+i*row+.07,.045,.32,t.secondary);
      box(s,b,x+.22,y+i*row,w-.22,row-.16,19,dark?'FFFFFF':t.ink,{valign:'top'});
    });
  }
  function timeline(s,item,dark) {
    const n=item.bullets.length, step=12.03/n;
    shape(s,'rect',.9,3.65,11.4,.035,dark?t.secondary:t.ink);
    item.bullets.forEach((b,i)=>{
      const x=.65+i*step;
      box(s,item.labels[i],x,2.8,step-.2,.55,29,dark?t.accent:t.ink,{bold:true});
      shape(s,'ellipse',x+.08,3.55,.24,.24,dark?t.accent:t.ink);
      box(s,b,x,4.08,step-.32,2.23,20,dark?'FFFFFF':t.ink,{valign:'top'});
    });
  }
  function metrics(s,item,dark) {
    const n=item.bullets.length, step=12.03/n;
    item.bullets.forEach((b,i)=>{
      const x=.65+i*step;
      box(s,item.labels[i],x,2.8,step-.3,1.25,54,dark?t.accent:t.ink,{bold:true});
      shape(s,'rect',x,4.35,step-.4,.035,t.secondary);
      box(s,b,x,4.7,step-.4,1.63,22,dark?'FFFFFF':t.ink,{valign:'top'});
    });
  }
  function comparison(s,item,dark) {
    const fg=dark?'FFFFFF':t.ink;
    shape(s,'rect',.65,2.6,12.03,.6,t.ink);
    box(s,item.comparison_headers[0],4.0,2.66,4.0,.45,20,'FFFFFF',{bold:true});
    box(s,item.comparison_headers[1],8.45,2.66,3.98,.45,20,'FFFFFF',{bold:true});
    const rowH=2.6/item.comparison_rows.length;
    item.comparison_rows.forEach((r,i)=>{
      const y=3.2+i*rowH;
      shape(s,'rect',.65,y,12.03,rowH,i%2?(dark?t.dark:t.light):(dark?t.card:'FFFFFF'));
      box(s,r.label,.83,y+.1,2.9,rowH-.2,17,fg,{bold:true});
      box(s,r.left,4,y+.1,4.0,rowH-.2,18,fg);
      box(s,r.right,8.45,y+.1,3.98,rowH-.2,18,fg);
    });
    box(s,item.bullets.join('\n'),.7,6.0,11.9,.7,15,fg,{valign:'top'});
  }
  function football(s,item,dark) {
    const x=.65,y=2.65,w=7.15,h=3.95;
    shape(s,'rect',x,y,w,h,'145846');
    for(let stripe=0;stripe<8;stripe+=2)shape(s,'rect',x+stripe*w/8,y,w/8,h,'19634E');
    const outline=(kind,xx,yy,ww,hh)=>shape(s,kind,xx,yy,ww,hh,'FFFFFF',{fill:{color:'FFFFFF',transparency:100},line:{color:'FFFFFF',width:1,transparency:35}});
    outline('rect',x+.12,y+.12,w-.24,h-.24);
    shape(s,'line',x+w/2,y+.12,0,h-.24,'FFFFFF',{line:{color:'FFFFFF',width:1,transparency:35}});
    outline('ellipse',x+w/2-.52,y+h/2-.52,1.04,1.04);
    outline('rect',x+.12,y+h/2-.9,.85,1.8);outline('rect',x+w-.97,y+h/2-.9,.85,1.8);
    const lines=[1,...item.formation.split('-').map(Number)], points=[];
    lines.forEach((count,col)=>{
      for(let j=0;j<count;j++)points.push({x:x+.6+col*(w-1.2)/3,y:y+.25+(j+1)*(h-.5)/(count+1)});
    });
    // Illustrative pass routes, not measured match data.
    const path=[points[1],points[1+lines[1]],points[points.length-1]];
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i];
      if(b.y>=a.y)shape(s,'line',a.x,a.y,b.x-a.x,b.y-a.y,t.accent,{line:{color:t.accent,width:2,dashType:'dash',endArrowType:'triangle'}});
    }
    points.forEach((pt,i)=>{shape(s,'ellipse',pt.x-.15,pt.y-.15,.3,.3,i===0?t.secondary:t.accent);box(s,String(i+1),pt.x-.15,pt.y-.15,.3,.3,10,t.ink,{bold:true,align:'center'});});
    box(s,item.formation,8.2,2.65,4.35,.7,38,dark?t.accent:t.ink,{bold:true});
    supporting(s,item.bullets,8.2,3.68,4.35,2.8,dark);
  }
  function photo(s,item,dark) {
    s.addImage({data:item.photo.data,x:.65,y:2.65,w:item.photo.width/96,h:item.photo.height/96,sizing:{type:'cover',w:6.7,h:3.9}});
    supporting(s,item.bullets,7.8,2.8,4.75,3.65,dark);
  }
  deck.slides.forEach((item, i) => {
    const s = p.addSlide();
    const cover = i === 0, ending = i === deck.slides.length - 1;
    const dark = cover || ending || i % 3 === 0;
    s.background = { color: dark ? t.dark : t.light };
    if (cover) {
      if(item.photo){
        s.addImage({data:item.photo.data,x:8.55,y:0,w:item.photo.width/96,h:item.photo.height/96,sizing:{type:'cover',w:W-8.55,h:6.85}});
      } else {
      shape(s, 'rect', 8.55, 0, W - 8.55, 6.85, t.card);
      shape(s, 'ellipse', 9.22, .85, 3.2, 3.2, t.accent);
      shape(s, 'ellipse', 9.8, 1.43, 2.04, 2.04, t.dark);
      shape(s, 'rect', 8.95, 4.65, 1.45, 1.45, t.secondary, { rotate: 12 });
      }
      box(s, 'SLAYDLY / ' + number(deck.slides.length), .7, .65, 7, .35, 12, t.accent, { charSpacing: 2, bold: true });
      box(s, item.title, .7, 1.6, 7.35, 2.55, 43, 'FFFFFF', { bold: true, fontFace: 'Aptos Display', valign: 'top' });
      const coverSize = item.bullets.length <= 3 ? 18 : 14;
      box(s, item.bullets.join('\n'), .74, 4.45, 7.15, 1.98, coverSize, t.muted, { valign: 'top', paraSpaceAfterPt: 8 });
    } else {
      heading(s, item, i, dark);
      const layout = ending ? 'spotlight' : item.layout || (i % 2 ? 'cards' : 'spotlight');
      const hasLabels=Array.isArray(item.labels)&&item.labels.length===item.bullets.length&&item.labels.every(l=>typeof l==='string'&&l.length<=30);
      const hasComparison=Array.isArray(item.comparison_headers)&&item.comparison_headers.length===2&&item.comparison_headers.every(h=>typeof h==='string'&&h.length<=50)&&Array.isArray(item.comparison_rows)&&item.comparison_rows.length>=2&&item.comparison_rows.length<=4&&item.comparison_rows.every(r=>r&&['label','left','right'].every(k=>typeof r[k]==='string'&&r[k].length<=100));
      if(layout==='timeline'&&hasLabels&&item.bullets.length>=3&&item.bullets.length<=5)timeline(s,item,dark);
      else if(layout==='metrics'&&hasLabels&&item.bullets.length>=2&&item.bullets.length<=4)metrics(s,item,dark);
      else if(layout==='comparison'&&hasComparison&&item.bullets.length<=2)comparison(s,item,dark);
      else if(layout==='football'&&['4-3-3','4-4-2','3-5-2'].includes(item.formation)&&item.bullets.length<=3)football(s,item,dark);
      else if(layout==='photo'&&item.photo)photo(s,item,dark);
      else if (layout === 'process') process(s, item, dark);
      else if (layout === 'spotlight' && item.bullets.length > 1) spotlight(s, item, dark);
      else cards(s, item, dark);
    }
    footer(s, i, dark);
    const credit=item.photo?`${item.photo.author} | ${item.photo.license} | Wikimedia Commons`:'';
    if(item.photo)box(s,credit,.7,6.65,11.9,.23,8,dark?t.muted:'67758A');
    const visualDetails=[...(item.labels||[]),...(item.comparison_rows||[]).map(r=>`${r.label}: ${r.left} / ${r.right}`)];
    s.addNotes([item.speaker_notes || '', ...item.bullets,...visualDetails,credit,item.photo?.title,item.photo?.source,item.photo?.licenseUrl,item.photo?'Photo cropped to fit layout.':''].filter(Boolean).join('\n\n'));
  });
  await p.writeFile({ fileName: file });
}
