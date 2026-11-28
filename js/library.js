/* Linggau eBook Library — catalog as data, no framework and no build.
   Only explicitly published titles become downloadable cards.
   The weekly status is computed from Jakarta dates and never invents a release. */
(()=>{
  'use strict';
  const $=selector=>document.querySelector(selector);
  const grid=$('#booksGrid');
  if(!grid)return;
  const search=$('#bookSearch');
  const toolbar=$('#catalogToolbar');
  const error=$('#catalogError');
  const allowedFile=/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/;
  const iso=/^\d{4}-\d{2}-\d{2}$/;
  function safeFile(value){
    const path=String(value||'').trim();
    return allowedFile.test(path)&&!path.includes('//')?path:'';
  }
  function localDay(date=new Date()){
    const parts=Intl.DateTimeFormat('en-US',{
      timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'
    }).formatToParts(date);
    const get=type=>parts.find(x=>x.type===type)?.value||'';
    return [get('year'),get('month'),get('day')].join('-');
  }
  function weeklyBounds(today){
    const day=new Date(today+'T00:00:00Z');
    if(!Number.isFinite(day.getTime()))throw Error('Tanggal pekan tidak valid.');
    const dow=day.getUTCDay()||7;
    const mon=new Date(day);
    mon.setUTCDate(mon.getUTCDate()-dow+1);
    const sun=new Date(mon);
    sun.setUTCDate(sun.getUTCDate()+6);
    return [mon.toISOString().slice(0,10),sun.toISOString().slice(0,10)];
  }
  function niceDate(value){
    const parsed=new Date(value+'T00:00:00Z');
    return Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(parsed);
  }
  function node(tag,className,text){
    const n=document.createElement(tag);
    if(className)n.className=className;
    if(text!==undefined)n.textContent=String(text);
    return n;
  }
  function anchor(href,text,className='',download=false){
    const a=node('a',className,text);
    a.href=download&&/^Dapur_Vibe_Coder\.(pdf|epub)$/.test(href)?'https://github.com/cuan74468-ux/buku-pintar-vibe-coder/releases/download/dapur-vibe-coder/'+href:href;
    if(download)a.setAttribute('download','');
    return a;
  }
  function bookCard(book){
    const article=node('article','library-book');
    article.dataset.bookId=book.id;
    const mainUrl=book.detailUrl||book.downloads.pdf||book.downloads.epub;
    const directDownload=!book.detailUrl&&!book.downloads.pdf;
    const cover=anchor(mainUrl,'','library-cover',directDownload);
    cover.setAttribute('aria-label',(directDownload?'Unduh ':'Lihat ')+book.title);
    const img=node('img');
    img.src=book.cover==='Dapur_Vibe_Coder_Mockup.jpg'?'assets/web/mockup.webp':book.cover;img.alt='Sampul '+book.title;if(book.cover==='Dapur_Vibe_Coder_Mockup.jpg'){img.width=480;img.height=720;}else img.loading='lazy';
    cover.append(img,node('span','book-cover-tag','Gratis'));
    const body=node('div','library-book-content');
    body.append(node('span','book-category',book.category));
    const h3=node('h3');
    h3.append(anchor(mainUrl,book.title,'',directDownload));
    body.append(h3,node('p','',book.subtitle));
    body.append(node('div','book-byline','Oleh '+book.author+' · '+niceDate(book.publishedAt)));
    const links=node('div','book-links');
    links.append(anchor(mainUrl,book.detailUrl?'Detail buku':book.downloads.pdf?'Baca PDF':'Unduh buku ↓',book.detailUrl?'text-link':'book-details',directDownload));
    if(book.downloads.pdf)links.append(anchor(book.downloads.pdf,'PDF ↓','',true));
    if(book.downloads.epub)links.append(anchor(book.downloads.epub,'EPUB ↓','',true));
    if(book.readerUrl)links.prepend(anchor(book.readerUrl,'Baca online','primary'));
    body.append(links);
    article.append(cover,body);
    return article;
  }
  function featuredBook(book){
    if(!book)return;
    const href=book.detailUrl||book.downloads.pdf||book.downloads.epub;
    const linked=['#featuredCoverLink','#featuredOpenLink'];
    for(const selector of linked){
      const a=$(selector);
      if(!a)continue;
      a.href=href;
      a.setAttribute('aria-label',(book.detailUrl?'Lihat buku ':'Unduh buku ')+book.title);
      if(book.detailUrl)a.removeAttribute('download');
      else a.setAttribute('download','');
    }
    const img=$('#featuredCover');
    if(img){img.src=book.cover;img.alt='Sampul '+book.title;}
    const title=$('#featuredTitle');
    if(title)title.textContent=book.title;
    const meta=$('#featuredMeta');
    if(meta)meta.textContent=book.author+' · Gratis';
    const edition=$('#featuredEdition');
    if(edition)edition.textContent=String(book.edition||'').toUpperCase();
    const kicker=$('#featuredKicker');
    if(kicker)kicker.textContent='BUKU TERBARU';
  }
  function upcomingNotice(books,today){
    const upcoming=books.filter(b=>b.status==='scheduled'&&b.publishedAt>=today)
      .sort((a,b)=>a.publishedAt.localeCompare(b.publishedAt))[0];
    const title=$('#comingTitle'),text=$('#comingText');
    if(upcoming){
      if(title)title.textContent=upcoming.title;
      if(text)text.textContent='Direncanakan terbit '+niceDate(upcoming.publishedAt)+'. Jadwal bisa berubah; tautan unduh hanya akan aktif setelah buku benar-benar dirilis.';
    }else{
      if(title)title.textContent='Rak ini belum selesai.';
      if(text)text.textContent='Judul berikutnya belum diumumkan. Ketika siap dibagikan, sampul, penjelasan, dan tautan unduhnya akan ditambahkan di sini.';
    }
  }
  function validate(data){
    if(!data||data.schemaVersion!==1||!Array.isArray(data.books))throw Error('Format katalog tidak sesuai.');
    const ids=new Set();
    const books=data.books.map(book=>{
      if(!book||typeof book!=='object'||typeof book.id!=='string'||!/^[-a-z0-9]{4,90}$/.test(book.id)||ids.has(book.id))throw Error('ID buku tidak valid atau duplikat.');
      ids.add(book.id);
      if(!['published','scheduled','draft'].includes(book.status))throw Error('Status buku tidak dikenal.');
      for(const key of ['title','subtitle','author','category']){
        if(typeof book[key]!=='string'||!book[key].trim())throw Error('Data '+key+' tidak lengkap.');
      }
      if(!iso.test(book.publishedAt)||!Number.isFinite(new Date(book.publishedAt+'T00:00:00Z').getTime()))throw Error('Tanggal terbit tidak valid.');
      const cover=safeFile(book.cover),detailUrl=book.detailUrl?safeFile(book.detailUrl):'',readerUrl=book.readerUrl?safeFile(book.readerUrl):'';
      if(book.readerUrl&&(!readerUrl||!readerUrl.endsWith('.html')))throw Error('Path pembaca tidak valid.');
      if(!cover||!/\.(?:png|jpg|jpeg|webp|svg)$/i.test(cover)||(book.detailUrl&&(!detailUrl||!detailUrl.endsWith('.html'))))throw Error('Path sampul atau halaman buku tidak valid.');
      if(!book.downloads||typeof book.downloads!=='object')throw Error('File unduhan belum ditetapkan.');
      const pdf=book.downloads.pdf?safeFile(book.downloads.pdf):'';
      const epub=book.downloads.epub?safeFile(book.downloads.epub):'';
      if((book.downloads.pdf&&!pdf)||(book.downloads.epub&&!epub))throw Error('Path unduhan tidak aman.');
      if(book.status==='published'&&!pdf&&!epub)throw Error('Buku terbit belum memiliki berkas unduhan.');
      return {...book,cover,detailUrl,readerUrl,downloads:{pdf,epub}};
    });
    const lastUpdated=String(data.lastUpdated||'');
    if(!iso.test(lastUpdated))throw Error('Tanggal pembaruan katalog tidak valid.');
    return {books,lastUpdated};
  }
  function weeklyAnnouncement(books,lastUpdated,today){
    const [monday,sunday]=weeklyBounds(today);
    const weekLabel=$('#weekLabel');
    if(weekLabel)weekLabel.textContent='· '+niceDate(monday)+' – '+niceDate(sunday);
    const released=books.filter(b=>b.status==='published'&&b.publishedAt>=monday&&b.publishedAt<=sunday&&b.publishedAt<=today);
    const announced=books.filter(b=>b.status==='scheduled'&&b.publishedAt>=today&&b.publishedAt<=sunday);
    const text=$('#weekStatus');
    if(text){
      if(released.length){
        const titles=released.map(b=>b.title).slice(0,3).join(', ');
        text.textContent='Ya! '+released.length+' eBook terbit pekan ini: '+titles+'. Buka katalog untuk melihatnya.';
      }else if(announced.length){
        text.textContent='Ada '+announced.length+' eBook yang dijadwalkan terbit pekan ini. Tunggu sampai berkasnya benar-benar tersedia.';
      }else{
        text.textContent='Belum ada eBook baru yang diumumkan untuk pekan ini. Buku yang sudah terbit tetap bisa diunduh di bawah.';
      }
    }
    const hint=$('#weekHint');
    if(hint)hint.textContent='Data katalog terakhir diperbarui '+niceDate(lastUpdated)+'. Pekan dihitung otomatis (WIB); rilis baru hanya muncul setelah pengelola menerbitkannya. Tidak ada jadwal terbit mingguan yang dijanjikan.';
  }
  function render(books,query=''){
    const value=query.trim().toLocaleLowerCase('id-ID');
    const visible=value?books.filter(b=>[b.title,b.subtitle,b.category,b.author,b.summary||''].some(x=>String(x).toLocaleLowerCase('id-ID').includes(value))):books;
    const fragment=document.createDocumentFragment();
    for(const book of visible)fragment.append(bookCard(book));
    if(!visible.length)fragment.append(node('p','catalog-empty','Tidak ada buku yang cocok dengan pencarian. Coba kata lain.'));
    grid.replaceChildren(fragment);
    const count=$('#catalogSearchCount');
    if(count)count.textContent=value?visible.length+' dari '+books.length+' buku':'';
  }
  const share=$('#shareLibrary');
  share?.addEventListener('click',async()=>{
    const link=window.location.origin+window.location.pathname;
    const feedback=$('#shareFeedback');
    try{
      if(navigator.share)await navigator.share({title:'Pustaka eBook Linggau AI Studio',text:'Jelajahi eBook gratis dan cek rilis baru.',url:link});
      else if(navigator.clipboard){await navigator.clipboard.writeText(link);if(feedback)feedback.textContent='Tautan pustaka disalin.';}
      else if(feedback)feedback.textContent='Salin tautan halaman dari bilah alamat browser.';
    }catch(err){
      if(err?.name!=='AbortError'&&feedback)feedback.textContent='Gunakan bilah alamat untuk menyalin tautan.';
    }
  });
  async function load(){
    try{
      const response=await fetch('data/books.json',{cache:'no-store'});
      if(!response.ok)throw Error('Katalog tidak dapat dimuat (HTTP '+response.status+').');
      const {books,lastUpdated}=validate(await response.json());
      const today=localDay();
      const published=books.filter(b=>b.status==='published'&&b.publishedAt<=today)
        .sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.title.localeCompare(b.title,'id'));
      render(published);
      featuredBook(published[0]);
      upcomingNotice(books,today);
      if(search){
        toolbar.hidden=published.length===0;
        search.addEventListener('input',()=>render(published,search.value));
      }
      const count=$('#catalogCount');
      if(count)count.textContent=String(published.length).padStart(2,'0')+' JUDUL TERSEDIA';
      const hero=$('#heroCounter');
      if(hero)hero.textContent=published.length+' buku tersedia untuk diunduh';
      weeklyAnnouncement(books,lastUpdated,today);
      if(error)error.hidden=true;
    }catch(e){
      if(error){error.hidden=false;error.textContent='Katalog terbaru belum dapat dimuat. Buku tetap dapat diunduh dari kartu yang tersedia. ('+String(e.message||'Gagal memuat data')+')';}
      const status=$('#weekStatus');
      if(status)status.textContent='Status rilis pekan ini belum dapat diverifikasi. Buka buku yang tersedia di katalog, lalu coba lagi nanti.';
    }
  }
  load();
  // Available for small isolated tests without opening the public site.
  window.LINGGAU_LIBRARY={localDay,weeklyBounds,niceDate,validate,weeklyAnnouncement};
})();
