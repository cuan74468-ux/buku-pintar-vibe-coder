const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const home=read('index.html'),detail=read('buku-pintar-vibe-coder-edisi-1.html');
const css=read('css/site.css'),siteJS=read('js/site.js'),libraryJS=read('js/library.js');
const catalog=JSON.parse(read('data/books.json')),rss=read('feed.xml');

test('real first book, PDF EPUB and cover are intact',()=>{
  for(const name of ['Dapur_Vibe_Coder_Mockup.jpg','Dapur_Vibe_Coder.pdf','Dapur_Vibe_Coder.epub','css/site.css','js/site.js','js/library.js','data/books.json','feed.xml']){
    assert(fs.existsSync(path.join(root,name)),name+' should exist');
  }
  for(const name of ['Dapur_Vibe_Coder.pdf','Dapur_Vibe_Coder.epub']){
    assert(detail.split('href="https://github.com/cuan74468-ux/buku-pintar-vibe-coder/releases/download/dapur-vibe-coder/'+name+'" download').length-1>=2);
    assert(home.includes(name),'The homepage must offer real downloads even without JS');
  }
  assert(home.includes('Dapur_Vibe_Coder_Mockup.jpg')&&detail.includes('Dapur_Vibe_Coder_Mockup.jpg'));
  assert(home.includes('buku-pintar-vibe-coder-edisi-1.html'));
});

test('Dapur Vibe Coder editorial content is aligned on detail page',()=>{
  for(const phrase of [
    'Dapur Vibe Coder','Meracik Ide Menjadi Produk Digital Bersama AI','Menyiapkan Dapur','Meracik Resep','Mulai Memasak','Menguji Sebelum Menyajikan','Menyajikan Produk Nyata','Dipakai di lapangan','Contoh ilustrasi','Belum diuji',
    'Harga, kuota, dan ketentuan layanan'
  ])assert(detail.includes(phrase),'Original content must be in detail page: '+phrase);
  assert(detail.includes('href="./"')&&detail.includes('Pustaka eBook'));
});

test('catalog represents verified titles only and paths resolve',()=>{
  assert.equal(catalog.schemaVersion,1);
  assert.match(catalog.lastUpdated,/^\d{4}-\d{2}-\d{2}$/);
  assert.equal(catalog.books.length,1,'Future titles must not be invented');
  const ids=new Set();
  for(const book of catalog.books){
    assert(!ids.has(book.id),'Book IDs must be unique');
    ids.add(book.id);
    assert(['draft','scheduled','published'].includes(book.status));
    assert.match(book.publishedAt,/^\d{4}-\d{2}-\d{2}$/);
    if(book.status==='published'){
      for(const p of [book.cover,book.detailUrl,...Object.values(book.downloads)]){
        if(p)assert(fs.existsSync(path.join(root,p)),p+' must be present before publication');
      }
      assert(book.downloads.pdf||book.downloads.epub);
    }
  }
  assert.equal(catalog.books[0].publishedAt,'2026-11-04');
  assert.equal(catalog.books[0].status,'published');
  assert(rss.includes('Dapur Vibe Coder')&&rss.includes('Dapur_Vibe_Coder.pdf'));
});

test('home uses unique landmarks, readable week status, and no fake subscribe form',()=>{
  for(const document of [home,detail]){
    assert(document.includes('<html lang="id">'));
    for(const name of ['main','nav','footer','h1'])assert(new RegExp('<'+name+'(?:\\s|>)').test(document),'Missing '+name);
    assert(/class="skip-link"/.test(document));
    assert(/id="themeToggle"/.test(document));
    const ids=[...document.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
    assert.equal(new Set(ids).size,ids.length);
    const anchors=[...document.matchAll(/href="#([a-z][a-z-]*)"/g)].map(x=>x[1]);
    for(const id of anchors)assert(ids.includes(id),'Broken anchor: '+id);
  }
  for(const id of ['weekLabel','weekStatus','weekHint','booksGrid','catalogCount','shareLibrary'])
    assert(home.includes('id="'+id+'"'));
  assert(home.includes('Tidak ada jadwal terbit rutin yang dijanjikan'));
  assert(!home.includes('type="email"')&&!home.includes('Daftar untuk notifikasi'));
  assert(home.includes('feed.xml')&&home.includes('data/books.json')===false);
  assert(home.includes('id="chapter-1"') && home.includes('id="bookSearch"'));

});

test('weekly date boundaries follow Monday to Sunday, Jakarta local dates',()=>{
  const nodes=new Map([['#booksGrid',{replaceChildren(){}}]]);
  const sandbox={
    window:{location:{origin:'https://cuan74468-ux.github.io',pathname:'/buku-pintar-vibe-coder/'}},
    document:{querySelector:key=>nodes.get(key)||null},
    fetch:async()=>{throw Error('offline test');},
    console,Intl
  };
  vm.runInNewContext(libraryJS,sandbox,{filename:'js/library.js'});
  const api=sandbox.window.LINGGAU_LIBRARY;
  assert.deepEqual([...api.weeklyBounds('2026-11-12')],['2026-11-09','2026-11-15']);
  assert.deepEqual([...api.weeklyBounds('2027-01-01')],['2026-12-28','2027-01-03']);
  const weeklyNodes=['#weekLabel','#weekStatus','#weekHint'].map(key=>[key,{textContent:''}]);
  for(const [key,value] of weeklyNodes)nodes.set(key,value);
  const book=catalog.books[0];
  api.weeklyAnnouncement([book],catalog.lastUpdated,'2026-11-12');
  assert.match(nodes.get('#weekLabel').textContent,/November 2026/);
  assert.match(nodes.get('#weekStatus').textContent,/Belum ada eBook baru/);
  const thisWeek={...book,id:'edisi-mendatang',publishedAt:'2026-11-12',status:'published'};
  api.weeklyAnnouncement([book,thisWeek],catalog.lastUpdated,'2026-11-12');
  assert.match(nodes.get('#weekStatus').textContent,/Ya! 1 eBook/);
  const drafted={...thisWeek,id:'draft-buku',status:'draft'};
  api.weeklyAnnouncement([book,drafted],catalog.lastUpdated,'2026-11-12');
  assert.match(nodes.get('#weekStatus').textContent,/Belum ada eBook baru/);
  const scheduled={...thisWeek,id:'scheduled-buku',publishedAt:'2026-11-14',status:'scheduled'};
  api.weeklyAnnouncement([book,scheduled],catalog.lastUpdated,'2026-11-12');
  assert.match(nodes.get('#weekStatus').textContent,/dijadwalkan terbit pekan ini/);
  const valid=api.validate(catalog);
  assert.equal(valid.books.length,1);
  assert.throws(()=>api.validate({...catalog,books:[book,{...book}]}),/duplikat/);
});

test('design remains browser-only, accessible, mobile-ready and safe from injection',()=>{
  for(const token of ['--paper:#F7F7F5','--ink:#20211F','--accent:#a44913','.reader-layout','.books-grid','.education-grid','@media(max-width:520px)','prefers-reduced-motion:reduce'])assert(css.includes(token),token);
  assert(siteJS.includes('IntersectionObserver')&&siteJS.includes('localStorage.setItem'));
  for(const source of [siteJS,libraryJS])new vm.Script(source);
  assert(libraryJS.includes("document.createElement(tag)")&&!libraryJS.includes('innerHTML'));
  assert(libraryJS.includes("fetch('data/books.json'"));
  assert(libraryJS.includes("timeZone:'Asia/Jakarta'"));
  for(const document of [home,detail]){
    assert(!document.includes('node_modules/'));
    assert(!document.includes('cdn.tailwindcss.com'));
    assert(!document.includes('<script src="https://'));
    assert(!document.includes('onclick='));
  }
  const braces=[];
  for(const c of css){if(c==='{')braces.push('{');if(c==='}')assert(braces.pop(),'Unexpected CSS closing brace');}
  assert.equal(braces.length,0,'CSS braces must match');
});

test('free Chapter 1 and reader contracts',()=>{const reader=read('baca.html'),js=read('js/reader.js');new vm.Script(js);for(const s of [home,detail]){assert(s.includes('Gratis Rp0'));assert(s.includes('ozzbygx3'));assert(s.includes('1FAIpQLSfzESJyEBbfKCbc8-xBmmF4muhKqjSzf9E40__3sTAUe01NOA'));assert(s.includes('PLcs3Kh8r8dmw'));assert(s.includes('baca.html'));}assert(libraryJS.includes('toolbar.hidden=published.length===0'));for(const id of ['readerSearch','readerToc','chapterSelect','readerContent','prevChapter','nextChapter','fontMinus','fontPlus'])assert(reader.includes('id="'+id+'"'));assert(js.includes("DecompressionStream('deflate-raw')")&&js.includes('createTextNode')&&!js.includes('innerHTML'));assert(read('sitemap.xml').includes('baca.html'));});

 test('approved book identity and public version policy',()=>{const book=catalog.books[0];assert.equal(book.title,'Dapur Vibe Coder');assert.equal(book.cover,'Dapur_Vibe_Coder_Mockup.jpg');for(const doc of [home,detail,read('baca.html')]){assert(!/Versi 4\.0|Buku Pintar Vibe Coder/.test(doc));}for(const name of ['Dapur_Vibe_Coder_Sampul.jpg','Dapur_Vibe_Coder_Mockup.jpg','Dapur_Vibe_Coder.pdf','Dapur_Vibe_Coder.epub'])assert(fs.existsSync(path.join(root,name)),name);for(const ext of ['pdf','epub'])assert.deepEqual(fs.readFileSync(path.join(root,'Dapur_Vibe_Coder.'+ext)),fs.readFileSync(path.join(root,'Buku_Pintar_Vibe_Coder_Edisi1.'+ext)));assert(rss.includes('length="'+fs.statSync(path.join(root,'Dapur_Vibe_Coder.pdf')).size+'"'));});

test('all visible ebook downloads route to verified release; offline reader files preserved',()=>{const release='https://github.com/cuan74468-ux/buku-pintar-vibe-coder/releases/download/dapur-vibe-coder/';for(const doc of [home,detail,read('baca.html')]){assert(!/href="Dapur_Vibe_Coder\.(pdf|epub)" download/.test(doc));assert(doc.includes(release+'Dapur_Vibe_Coder.pdf'));}assert(libraryJS.includes(release));assert(read('js/reader.js').includes('Dapur_Vibe_Coder.epub'));});

test('GA4 consent pilot: no load before consent, canonical params, path gate, chapter dedupe',()=>{
 const src=read('js/analytics.js');
 const boot=(pathname='/buku-pintar-vibe-coder/baca.html',choice=null,referrer='https://example.com/',search='?private=secret',hash='#bagian-1')=>{
  const handlers={},scripts=[],nodes={};for(const id of ['analyticsPreferences','analyticsStatus','analyticsAccept','analyticsReject'])nodes[id]={addEventListener:(n,f)=>handlers[id]=f};
  const win={},doc={referrer,cookie:'',getElementById:id=>nodes[id],createElement:()=>({}),head:{append:s=>scripts.push(s)},addEventListener:(n,f)=>handlers[n]=f};
  let stored=choice;const location={protocol:'https:',hostname:'cuan74468-ux.github.io',origin:'https://cuan74468-ux.github.io',pathname,search,hash,reload(){}};const history={state:null,replaceState:(s,t,v)=>{const u=new URL(v,location.origin);location.search=u.search;location.hash=u.hash}};const context={window:win,document:doc,location,history,localStorage:{getItem:()=>stored,setItem:(k,v)=>{stored=v}},URL,Date};
  vm.runInNewContext(src,context);return {win,handlers,scripts,nodes,location};
 };
 const t=boot();assert.equal(t.scripts.length,0);t.win.DVCAnalytics.chapter(1);t.handlers.analyticsAccept();assert.equal(t.scripts.length,1);assert.equal(t.location.search,'');assert.equal(t.location.hash,'#bagian-1');
 t.win.DVCAnalytics.chapter(1);t.win.DVCAnalytics.chapter(2);const events=t.win.dataLayer.filter(a=>a[0]==='event');assert.deepEqual(Array.from(events,a=>a[1]),['page_view','reader_open','chapter_view','chapter_view']);assert.equal(events[0][2].page_referrer,'https://example.com/');assert(!JSON.stringify(events).includes('secret'));
 t.handlers.analyticsReject();t.win.DVCAnalytics.chapter(3);assert.equal(t.win.dataLayer.filter(a=>a[0]==='event').length,4);assert.equal(boot('/other/','yes').scripts.length,0);assert.equal(boot('/buku-pintar-vibe-coder/baca.html','yes','https://example.com/private?secret=abc').scripts.length,0);assert.equal(boot('/buku-pintar-vibe-coder/baca.html','yes','https://example.com/private').scripts.length,0);
 for(const p of ['index.html','baca.html','buku-pintar-vibe-coder-edisi-1.html']){const s=read(p);assert.equal((s.match(/js\/analytics\.js/g)||[]).length,1);assert(s.includes('analyticsReject'));}
});

test('SEO canonical metadata, public FAQ, Book schema and sitemap are consistent',()=>{
 const base='https://cuan74468-ux.github.io/buku-pintar-vibe-coder/';
 const pages=['index.html','buku-pintar-vibe-coder-edisi-1.html','baca.html'];
 const titles=new Set();
 for(const p of pages){const s=read(p),url=p==='index.html'?base:base+p;
  const title=s.match(/<title>([^<]+)<\/title>/)[1];assert(title.length<=60);assert(!titles.has(title));titles.add(title);
  assert.equal((s.match(/<h1(?:\s|>)/g)||[]).length,1);
  assert.equal((s.match(/rel="canonical"/g)||[]).length,1);assert(s.includes('rel="canonical" href="'+url+'"'));assert(s.includes('property="og:url" content="'+url+'"'));
  for(const key of ['og:locale','og:site_name','og:image:alt','twitter:card','twitter:title','twitter:description','twitter:image'])assert(s.includes(key),key);
  assert(!/name="robots" content="[^"]*noindex/.test(s));assert(read('sitemap.xml').includes('<loc>'+url+'</loc>'));
 }
 const schemas=JSON.parse(detail.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1])['@graph'];
 const book=schemas.find(x=>x['@type']==='Book'),faq=schemas.find(x=>x['@type']==='FAQPage');
 assert.equal(book.name,catalog.books[0].title);assert.equal(book.datePublished,catalog.books[0].publishedAt);assert.equal(book.isAccessibleForFree,true);
 assert.equal(faq.mainEntity.length,5);for(const q of faq.mainEntity){assert(detail.includes('<summary>'+q.name+'</summary>'));assert(detail.includes(q.acceptedAnswer.text));}
 assert(read('robots.txt').includes('Sitemap: '+base+'sitemap.xml'));
 assert.equal([...read('sitemap.xml').matchAll(/<loc>/g)].length,3);
 assert(detail.includes('https://cuan74468-ux.github.io/bakso-len-1-menu/'));
});

test('local relevance is visible and truthful; national book access preserved',()=>{assert(home.includes('eBook AI Gratis dari Lubuklinggau'));assert(home.includes('Linggau AI Studio di Lubuklinggau'));assert(detail.includes('Lubuklinggau, Sumatera Selatan'));assert(detail.includes('maupun seluruh Indonesia'));assert(detail.includes('Gratis Rp0'));const schema=JSON.parse(detail.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);assert(!schema['@graph'].some(x=>x['@type']==='LocalBusiness'||x['@type']==='Restaurant'));});
