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
  for(const name of ['sampul.png','Buku_Pintar_Vibe_Coder_Edisi1.pdf','Buku_Pintar_Vibe_Coder_Edisi1.epub','css/site.css','js/site.js','js/library.js','data/books.json','feed.xml']){
    assert(fs.existsSync(path.join(root,name)),name+' should exist');
  }
  for(const name of ['Buku_Pintar_Vibe_Coder_Edisi1.pdf','Buku_Pintar_Vibe_Coder_Edisi1.epub']){
    assert(detail.split('href="'+name+'" download').length-1>=2);
    assert(home.includes(name),'The homepage must offer real downloads even without JS');
  }
  assert(home.includes('sampul.png')&&detail.includes('sampul.png'));
  assert(home.includes('buku-pintar-vibe-coder-edisi-1.html'));
});

test('edition-one original editorial material is preserved on book detail page',()=>{
  for(const phrase of [
    'Buku Pintar','Vibe Coder','praktis, kritis, dan bertanggung jawab',
    'Buku ini adalah intisari jurnal belajar saya dari nol',
    'edisi pertama dan belum final',
    'Cara berpikir dan batas AI','Peta teknologi dan cara memilih',
    'Bekerja dengan AI secara terstruktur','Keamanan dasar, data pelanggan',
    'Biaya, proyek perdana, perawatan setelah rilis',
    'Dipakai di lapangan','Contoh ilustrasi','Belum diuji',
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
  assert(rss.includes('Buku Pintar Vibe Coder')&&rss.includes('Buku_Pintar_Vibe_Coder_Edisi1.pdf'));
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
  const valid=api.validate(catalog);
  assert.equal(valid.books.length,1);
  assert.throws(()=>api.validate({...catalog,books:[book,{...book}]}),/duplikat/);
});

test('design remains browser-only, accessible, mobile-ready and safe from injection',()=>{
  for(const token of ['--paper:#FAFAFC','--ink:#15161C','--sun:#FFD25E','--sky:#5EC4FF','--lilac:#B9A3FF','--ui:"Geist"','--display:"Plus Jakarta Sans"','--editorial:"Instrument Serif"'])
    assert(css.includes(token),'Linggau design token missing: '+token);
  assert(css.includes('prefers-reduced-motion:reduce'));
  assert(css.includes('reveal-ready.reveal-visible'));
  assert(css.includes('@media(max-width:520px)'));
  assert(css.includes('.library-hero')&&css.includes('.weekly-banner')&&css.includes('.books-grid'));
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
