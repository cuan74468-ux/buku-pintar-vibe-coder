const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('index.html'),css=read('css/site.css'),js=read('js/site.js');

test('core ebook files and download links remain available',()=>{
  for(const name of ['sampul.png','Buku_Pintar_Vibe_Coder_Edisi1.pdf','Buku_Pintar_Vibe_Coder_Edisi1.epub','css/site.css','js/site.js']){
    assert(fs.existsSync(path.join(root,name)),name+' should exist');
    assert(html.includes(name),name+' should be referenced in index.html');
  }
  assert(html.match(/Buku_Pintar_Vibe_Coder_Edisi1\.pdf" download/g).length>=2);
  assert(html.match(/Buku_Pintar_Vibe_Coder_Edisi1\.epub" download/g).length>=2);
});

test('factual editorial content from original landing is preserved',()=>{
  for(const phrase of [
    'Buku Pintar','Vibe Coder','praktis, kritis, dan bertanggung jawab',
    'Buku ini adalah intisari jurnal belajar saya dari nol',
    'edisi pertama dan belum final',
    'Cara berpikir dan batas AI',
    'Peta teknologi dan cara memilih',
    'Bekerja dengan AI secara terstruktur',
    'Keamanan dasar, data pelanggan',
    'Biaya, proyek perdana, perawatan setelah rilis',
    'Dipakai di lapangan','Contoh ilustrasi','Belum diuji',
    'Harga, kuota, dan ketentuan layanan'
  ])assert(html.includes(phrase),'Missing source claim: '+phrase);
});

test('page has landmarks, accessible navigation and unique IDs',()=>{
  assert(html.includes('<html lang="id">'));
  for(const name of ['main','nav','footer','h1'])assert(new RegExp('<'+name+'(?:\\s|>)').test(html),'Missing '+name);
  assert(/class="skip-link"/.test(html));
  assert(/id="themeToggle"/.test(html));
  assert(/aria-label="Buku Pintar Vibe Coder, kembali ke awal"/.test(html));
  assert(/alt="Sampul Buku Pintar Vibe Coder, Edisi 1"/.test(html));
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length,'IDs must be unique');
  const anchors=[...html.matchAll(/href="#([a-z][a-z-]*)"/g)].map(x=>x[1]);
  for(const id of anchors)assert(ids.includes(id),'Broken in-page anchor '+id);
});

test('linggau visual tokens and progressive motion safeguard exist',()=>{
  for(const token of ['--paper:#FAFAFC','--ink:#15161C','--sun:#FFD25E','--sky:#5EC4FF','--lilac:#B9A3FF','--ui:"Geist"','--display:"Plus Jakarta Sans"','--editorial:"Instrument Serif"']){
    assert(css.includes(token),'Missing Linggau token '+token);
  }
  assert(css.includes('prefers-reduced-motion:reduce'));
  assert(css.includes('reveal-ready.reveal-visible'));
  assert(css.includes('@media(max-width:520px)'));
  assert(js.includes('IntersectionObserver'));
  assert(js.includes('localStorage.setItem'));
  new vm.Script(js,{filename:'js/site.js'});
});

test('no script injection or unnecessary runtime build dependency',()=>{
  assert(!html.includes('node_modules/'));
  assert(!html.includes('cdn.tailwindcss.com'));
  assert(!html.includes('<script src="https://'));
  assert(!html.includes('onclick='));
  const stack=[];
  for(const char of css){if(char==='{')stack.push(char);if(char==='}')assert(stack.pop(),'Unexpected CSS closing brace');}
  assert.equal(stack.length,0,'Unbalanced CSS braces');
});
