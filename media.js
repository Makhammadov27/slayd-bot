// Optional Wikimedia Commons photographs. Failure never blocks presentation creation.
const headers = { 'User-Agent': 'Slaydly/1.0 (https://github.com/Makhammadov27/slayd-bot)' };
const plain = s => String(s || '').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').slice(0,1000);
async function boundedBytes(response) {
  if (!response.ok || !/^image\/(jpeg|png)\b/i.test(response.headers.get('content-type') || '')) return null;
  const reader = response.body.getReader(); const chunks=[]; let size=0;
  try { while (true) { const {done,value}=await reader.read(); if(done)break;size+=value.length;if(size>6_000_000){await reader.cancel();return null;}chunks.push(value); } }
  finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
export async function findPhoto(query, used = new Set()) {
  if (!query || typeof query !== 'string') return null;
  try {
    const signal=AbortSignal.timeout(12000);
    const params = new URLSearchParams({ action:'query', format:'json', generator:'search', gsrsearch:`${query.slice(0,100)} filetype:bitmap`, gsrnamespace:'6', gsrlimit:'6', prop:'imageinfo', iiprop:'url|size|extmetadata', iiurlwidth:'1400' });
    const res=await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString().replace(/\+/g,'%20')}`,{headers,signal});
    if(!res.ok)return null;
    const data=await res.json();
    const pages=Object.values(data.query?.pages || {}).sort((a,b)=>(a.index||0)-(b.index||0));
    for(const page of pages){
      const info=page.imageinfo?.[0], meta=info?.extmetadata;
      if(!info || !meta || info.width<600 || info.height<350)continue;
      const license=plain(meta.LicenseShortName?.value);
      if(!/^(CC BY(?:-SA)? [\d.]+|CC0(?: [\d.]+)?|Public domain)$/i.test(license))continue;
      const url=info.thumburl||info.url;
      const parsed=new URL(url);
      if(parsed.protocol!=='https:'||!['upload.wikimedia.org','thumb.wikimedia.org'].includes(parsed.hostname)||used.has(info.url))continue;
      const img=await fetch(url,{headers,signal,redirect:'error'});
      const bytes=await boundedBytes(img);if(!bytes)continue;
      used.add(info.url);
      const mime=img.headers.get('content-type').split(';')[0];
      return { data:`data:${mime};base64,${bytes.toString('base64')}`, width:info.width,height:info.height,
        title:plain(page.title), author:plain(meta.Artist?.value), license, source:info.descriptionurl, licenseUrl:plain(meta.LicenseUrl?.value) };
    }
  }catch{ /* Offline, unsupported license, or timeout: keep a complete text layout. */ }
  return null;
}
export async function enrichImages(deck, enabled = true) {
  if(!enabled)return deck;
  const used=new Set(); let attempts=0;
  for(let i=0;i<deck.slides.length;i++){
    const item=deck.slides[i];
    if(i!==0&&item.layout!=='photo')continue;
    if(attempts++>=3)break;
    item.photo=await findPhoto(i===0?deck.image_query:item.image_query,used);
  }
  return deck;
}
