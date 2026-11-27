const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root='https://cuan74468-ux.github.io/buku-pintar-vibe-coder/';
const files=['Buku_Pintar_Vibe_Coder_Edisi1.pdf','Buku_Pintar_Vibe_Coder_Edisi1.epub','sampul.png','css/site.css','js/site.js','js/library.js','data/books.json','feed.xml'];
let fails=0;
async function check(name,fn){try{await fn();console.log('PASS '+name);}catch(e){fails++;console.log('FAIL '+name+' '+String(e.message).slice(0,180));}}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const ctx=await browser.newContext({acceptDownloads:true});
 for(const name of files)await check('published bytes '+name,async()=>{const r=await ctx.request.get(root+name,{timeout:30000});assert.equal(r.status(),200);const b=await r.body();assert.equal(crypto.createHash('sha256').update(b).digest('hex'),crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex'));console.log('HTTP 200 '+name+' bytes='+b.length+' type='+r.headers()['content-type']);});
 for(const width of [1440,360]){
 for(const path of ['', 'buku-pintar-vibe-coder-edisi-1.html']){
 const page=await ctx.newPage({viewport:{width,height:900}});await page.setViewportSize({width,height:900});
 const errors=[],bad=[];page.on('pageerror',e=>errors.push(e.name));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,160));});page.on('requestfailed',r=>bad.push(new URL(r.url()).hostname+' '+r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)bad.push(new URL(r.url()).hostname+' HTTP '+r.status());});
 const label=width+' '+(path||'home');
 await check('navigate '+label,async()=>{const r=await page.goto(root+path,{waitUntil:'networkidle',timeout:45000});assert.equal(r.status(),200);await page.evaluate(()=>document.fonts.ready);});
 if(!path)await check('dynamic catalog '+width,async()=>{await page.waitForFunction(()=>document.querySelector('#booksGrid [data-book-id="buku-pintar-vibe-coder-edisi-1"]'),undefined,{timeout:20000});assert.equal(await page.locator('#catalogError').isHidden(),true);assert.match(await page.locator('#catalogCount').innerText(),/01/);});
 await check('layout assets anchors '+label,async()=>{
 const d=await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=Math.max(200,innerHeight-100)){scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}scrollTo(0,0);return {width:innerWidth,scroll:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src')),anchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>a.hash.length>1&&!document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a=>a.hash),clipped:[...document.querySelectorAll('a.button,button')].filter(a=>{let r=a.getBoundingClientRect();return r.width&& (r.left< -1||r.right>innerWidth+1)}).length,font:[...document.fonts].map(f=>f.status),chapters:document.querySelectorAll('.chapters li').length}});
 console.log('LAYOUT '+label+' '+JSON.stringify(d));assert.ok(d.scroll<=d.width+1);assert.equal(d.broken.length,0);assert.equal(d.anchors.length,0);assert.equal(d.clipped,0);assert.ok(d.font.includes('loaded'),'web font not loaded');});
 await check('theme toggle '+label,async()=>{const t=page.locator('#themeToggle');let before=await t.getAttribute('aria-pressed');await t.click();assert.notEqual(await t.getAttribute('aria-pressed'),before);});
 if(path)for(const ext of ['pdf','epub'])await check('actual download '+ext+' '+width,async()=>{const filename=files.find(x=>x.endsWith('.'+ext));const dl=page.waitForEvent('download',{timeout:20000});await page.locator('a[download][href="'+filename+'"]').first().click();const d=await dl;assert.equal(d.suggestedFilename(),filename);assert.equal(await d.failure(),null);});
 if(!path)await check('search visible '+width,async()=>{assert.equal(await page.locator('#bookSearch').isVisible(),true);await page.locator('#bookSearch').fill('vibe');assert.equal(await page.locator('#booksGrid [data-book-id]').count(),1);await page.locator('#bookSearch').fill('zzzznonexistent');assert.equal(await page.locator('#booksGrid [data-book-id]').count(),0);});
 await check('console and network '+label,async()=>{console.log('NETWORK '+label+' errors='+JSON.stringify(errors)+' failed='+JSON.stringify(bad));assert.equal(errors.length,0);assert.equal(bad.length,0);});await page.close();
 }}
 const links={Classroom:'https://classroom.google.com/c/ODk4MzQ4OTEwMjc5?cjc=ozzbygx3',Form:'https://docs.google.com/forms/d/e/1FAIpQLSfzESJyEBbfKCbc8-xBmmF4muhKqjSzf9E40__3sTAUe01NOA/viewform',YouTube:'https://youtube.com/playlist?list=PLcs3Kh8r8dmw&si=dyqSEDlvtVQv7zWj',Portfolio:'https://cuan74468-ux.github.io/',Ngulik:'https://cuan74468-ux.github.io/ngulik-digital-member/'};
 await Promise.all(Object.entries(links).map(async ([name,url])=>{const p=await ctx.newPage();try{const r=await p.goto(url,{waitUntil:'domcontentloaded',timeout:40000});await p.waitForTimeout(1500);const d=await p.evaluate(()=>{const s=(document.body?.innerText||'').slice(0,20000);return {title:document.title.slice(0,180),signIn:location.hostname==='accounts.google.com'||/sign in to continue|masuk untuk melanjutkan|you need access|anda memerlukan akses/i.test(s),closed:/no longer accepting responses|tidak lagi menerima tanggapan|formulir ini tidak menerima/i.test(s),missing:/playlist does not exist|playlist is unavailable|this playlist is private|page not found|file you have requested does not exist|halaman tidak ditemukan/i.test(s),consent:location.hostname.startsWith('consent.'),formQuestions:document.querySelectorAll('[role=listitem]').length,playlistItems:document.querySelectorAll('ytd-playlist-video-renderer').length}});console.log('EXTERNAL '+name+' HTTP '+r.status()+' host='+new URL(p.url()).hostname+' '+JSON.stringify(d));if(r.status()>=400||d.closed||d.missing){fails++;console.log('FAIL external '+name);}else console.log('REVIEW external '+name+' reachable; authentication and actual access may require owner validation');}catch(e){fails++;console.log('FAIL external '+name+' '+e.name);}finally{await p.close();}}));
 }finally{await browser.close()}
 console.log('AUDIT browser failures='+fails);if(fails)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1});
