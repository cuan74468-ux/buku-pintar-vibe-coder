/* Read the original EPUB 3 container; no third-party code or remote content execution. */
(()=>{
'use strict';
const $=id=>document.getElementById(id), content=$('readerContent'), toc=$('readerToc'), select=$('chapterSelect'), search=$('readerSearch'), results=$('searchResults');
const decoder=new TextDecoder('utf-8'), parser=new DOMParser();
const MAX=8*1024*1024, allowed=new Set('h1 h2 h3 h4 h5 h6 p div section article main aside span strong b em i u s del ins small sub sup br hr ul ol li dl dt dd blockquote pre code table caption thead tbody tfoot tr th td figure figcaption a img'.split(' '));
const xml=s=>{const d=parser.parseFromString(s,'application/xml');if(d.querySelector('parsererror'))throw Error('Dokumen EPUB tidak valid.');return d;};
const resolve=(from,href)=>{try{const u=new URL(href,'https://epub.invalid/'+from);if(u.origin!=='https://epub.invalid')return null;const path=decodeURIComponent(u.pathname.slice(1));if(!path||path.includes('..')||path.includes('\\'))return null;return {path,hash:decodeURIComponent(u.hash.slice(1))};}catch{return null;}};
function zip(buffer){
 const b=new Uint8Array(buffer),v=new DataView(buffer),entries=new Map();let end=b.length-22;
 if(b.length>MAX||b.length<22)throw Error('Ukuran EPUB tidak valid.');
 while(end>=Math.max(0,b.length-65557)&&v.getUint32(end,true)!==0x06054b50)end--;
 if(end<0||v.getUint32(end,true)!==0x06054b50)throw Error('Arsip EPUB tidak valid.');
 let p=v.getUint32(end+16,true),n=v.getUint16(end+10,true),total=0;
 if(n>300)throw Error('Arsip terlalu besar.');
 for(let i=0;i<n;i++){
  if(p+46>b.length||v.getUint32(p,true)!==0x02014b50)throw Error('Direktori EPUB rusak.');
  const flags=v.getUint16(p+8,true),method=v.getUint16(p+10,true),compressed=v.getUint32(p+20,true),size=v.getUint32(p+24,true),nl=v.getUint16(p+28,true),ex=v.getUint16(p+30,true),co=v.getUint16(p+32,true),local=v.getUint32(p+42,true);
  const name=decoder.decode(b.subarray(p+46,p+46+nl));total+=size;
  if(flags&1||size>MAX||total>MAX||entries.has(name)||name.startsWith('/')||name.split('/').includes('..')||local+30>b.length)throw Error('Arsip EPUB tidak aman.');
  entries.set(name,{method,compressed,size,local});p+=46+nl+ex+co;
 }
 return {async read(name){const e=entries.get(name);if(!e)throw Error('Bagian buku tidak ditemukan.');let p=e.local;if(v.getUint32(p,true)!==0x04034b50)throw Error('Header EPUB rusak.');p+=30+v.getUint16(p+26,true)+v.getUint16(p+28,true);if(p+e.compressed>b.length)throw Error('Bagian EPUB terpotong.');let data=b.slice(p,p+e.compressed);
  if(e.method===8){const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));const reader=stream.getReader(),chunks=[];let length=0;try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>e.size||length>MAX)throw Error('Ukuran bagian tidak sesuai.');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}data=new Uint8Array(length);let off=0;for(const c of chunks){data.set(c,off);off+=c.length;}}
  else if(e.method!==0)throw Error('Kompresi EPUB tidak didukung.');
  if(data.length!==e.size)throw Error('Bagian EPUB tidak utuh.');return decoder.decode(data);}};
}
let chapters=[],current=0,readingSize=18;
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
function clean(n,from){
 if(n.nodeType===3)return document.createTextNode(n.nodeValue||'');
 if(n.nodeType!==1)return document.createDocumentFragment();
 const tag=n.localName.toLowerCase();
 if(tag==='svg'){
  const embedded=[...n.getElementsByTagNameNS('*','image')].find(img=>resolve(from,img.getAttribute('href')||img.getAttributeNS('http://www.w3.org/1999/xlink','href')||'')?.path==='EPUB/media/cover.jpg');
  if(embedded){const cover=el('img');cover.src='Dapur_Vibe_Coder_Sampul.jpg';cover.alt='Sampul Dapur Vibe Coder';return cover;}
  return document.createDocumentFragment();
 }
 if(['script','style','iframe','object','embed','form','input','button','svg','math','audio','video','link'].includes(tag))return document.createDocumentFragment();
 const out=allowed.has(tag)?el(tag):document.createDocumentFragment();
 if(out.nodeType===1){
  const id=n.getAttribute('id');if(id)out.id='book-'+id;
  if(tag==='img'){
   const source=resolve(from,n.getAttribute('src')||'');if(source?.path==='EPUB/media/cover.jpg'){out.src='Dapur_Vibe_Coder_Sampul.jpg';out.alt=n.getAttribute('alt')||'Sampul Dapur Vibe Coder';return out;}
   return document.createTextNode(n.getAttribute('alt')||'');
  }
  if(tag==='a'){
   const href=n.getAttribute('href')||'',target=resolve(from,href);
   if(target&&chapters.some(c=>c.path===target.path)){out.href='#bagian-'+(chapters.findIndex(c=>c.path===target.path)+1);out.dataset.chapter=String(chapters.findIndex(c=>c.path===target.path));out.dataset.anchor=target.hash;}
   else if(/^https:\/\/[^\s<>"'\\]+$/i.test(href)){out.href=href;out.target='_blank';out.rel='noopener noreferrer';}
  }
  for(const key of ['colspan','rowspan','start']){const value=n.getAttribute(key);if(value&&/^\d{1,3}$/.test(value))out.setAttribute(key,value);}
 }
 for(const child of n.childNodes)out.append(clean(child,from));return out;
}
function show(index,anchor='',move=false){
 if(!Number.isInteger(index)||index<0||index>=chapters.length)return;
 current=index;const c=chapters[index];content.replaceChildren();
 for(const n of c.body.childNodes)content.append(clean(n,c.path));
 content.setAttribute('aria-busy','false');select.value=String(index);
 $('readerPosition').textContent='Bagian '+(index+1)+' dari '+chapters.length;
 $('prevChapter').disabled=index===0;$('nextChapter').disabled=index===chapters.length-1;
 for(const btn of toc.querySelectorAll('button'))btn.setAttribute('aria-current',String(btn.dataset.index===String(index)));
 history.replaceState(null,'','#bagian-'+(index+1));
 if(move){const target=anchor?document.getElementById('book-'+anchor):content;(target||content).scrollIntoView({block:'start'});}
}
function doSearch(){
 const q=search.value.trim().toLocaleLowerCase('id-ID');results.replaceChildren();if(!q)return;
 const matches=chapters.map((c,i)=>({c,i})).filter(x=>x.c.text.toLocaleLowerCase('id-ID').includes(q)||x.c.title.toLocaleLowerCase('id-ID').includes(q));
 results.append(el('p',matches.length+' bagian ditemukan'));
 for(const {c,i} of matches){const b=el('button',c.title);b.type='button';b.addEventListener('click',()=>show(i,'',true));results.append(b);}
}
async function load(){
 const r=await fetch('Dapur_Vibe_Coder.epub');if(!r.ok)throw Error('File buku tidak dapat dimuat.');
 const archive=zip(await r.arrayBuffer()),container=xml(await archive.read('META-INF/container.xml')),packagePath=[...container.getElementsByTagNameNS('*','rootfile')][0]?.getAttribute('full-path');
 if(!packagePath)throw Error('Paket EPUB tidak ditemukan.');
 const packageDoc=xml(await archive.read(packagePath)),manifest=new Map([...packageDoc.getElementsByTagNameNS('*','item')].map(n=>[n.getAttribute('id'),n.getAttribute('href')]));
 const refs=[...packageDoc.getElementsByTagNameNS('*','itemref')].map(n=>n.getAttribute('idref'));
 if(!refs.length||refs.length>150)throw Error('Daftar isi tidak valid.');
 const built=await Promise.all(refs.map(async(id,i)=>{const path=resolve(packagePath,manifest.get(id)||'')?.path;if(!path)throw Error('Path EPUB tidak valid.');
 const doc=xml(await archive.read(path)),body=[...doc.getElementsByTagNameNS('*','body')][0];if(!body)throw Error('Isi bagian tidak ditemukan.');
 const heading=body.querySelector('h1,h2,h3,h4,h5,h6'),title=heading?.textContent?.trim()||doc.querySelector('title')?.textContent?.trim()||'Bagian '+(i+1);
 return {path,body,title,text:body.textContent||''};}));
 chapters=built;select.replaceChildren();
 chapters.forEach((c,i)=>{const option=el('option',(i+1)+'. '+c.title);option.value=String(i);select.append(option);const b=el('button',c.title);b.type='button';b.dataset.index=String(i);b.addEventListener('click',()=>show(i,'',true));toc.append(b);});
 select.disabled=false;search.disabled=false;const hash=location.hash.match(/^#bagian-(\d+)$/);show(hash?Math.max(0,Math.min(chapters.length-1,Number(hash[1])-1)):0);
}
select.addEventListener('change',()=>show(Number(select.value),'',true));search.addEventListener('input',doSearch);
$('prevChapter').addEventListener('click',()=>show(current-1,'',true));$('nextChapter').addEventListener('click',()=>show(current+1,'',true));
content.addEventListener('click',e=>{const a=e.target.closest('a[data-chapter]');if(!a)return;e.preventDefault();show(Number(a.dataset.chapter),a.dataset.anchor,true);});
for(const [id,delta] of [['fontMinus',-1],['fontPlus',1]])$(id).addEventListener('click',()=>{readingSize=Math.max(15,Math.min(26,readingSize+delta));document.documentElement.style.setProperty('--read-size',readingSize+'px');});
load().catch(()=>{content.setAttribute('aria-busy','false');$('readerPosition').textContent='Pembaca tidak tersedia';content.replaceChildren(el('p','Pembaca online tidak dapat memuat buku pada perangkat ini. Gunakan file asli di bawah.'));const p=el('a','Buka PDF');p.href='Dapur_Vibe_Coder.pdf';const e=el('a','Unduh EPUB');e.href='Dapur_Vibe_Coder.epub';e.download='';content.append(p,el('p','atau'),e);});
})();
