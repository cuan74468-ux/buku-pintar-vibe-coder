const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const root='https://cuan74468-ux.github.io/buku-pintar-vibe-coder/';
const id='G-FGBNWLRHS1',probe='dvc_audit_nonpersonal_20261128';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const google=u=>{const h=new URL(u).hostname;return h==='www.googletagmanager.com'||h.endsWith('.google-analytics.com')||h==='analytics.google.com'||h.endsWith('.analytics.google.com')};
const collect=u=>google(u)&&new URL(u).pathname.endsWith('/collect');
async function waitFor(fn,ms=25000){for(let i=0;i<ms/250;i++){if(fn())return;await new Promise(r=>setTimeout(r,250))}throw Error('Timed out waiting for GA collect response')}
(async()=>{
 for(const file of ['index.html','baca.html','buku-pintar-vibe-coder-edisi-1.html','js/analytics.js','js/reader.js']){
  const res=await fetch(root+file+'?audit='+probe,{cache:'no-store'});assert.equal(res.status,200,file);
  assert.equal(hash(Buffer.from(await res.arrayBuffer())),hash(fs.readFileSync(file)),file+' differs from approved source');
  console.log('PASS production bytes '+file);
 }
 const browser=await chromium.launch();
 try{
  const p=await browser.newPage({viewport:{width:360,height:900}});
  const requests=[],responses=[],errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('request',r=>{if(google(r.url()))requests.push(r.url())});
  p.on('response',r=>{if(collect(r.url())){const req=r.request();const raw=new URL(req.url()).search.slice(1)+'\n'+(req.postData()||'');const lines=raw.split('\n');const common=new URLSearchParams(lines[0]);for(const line of (lines.length>1&&lines[1]?lines.slice(1):[lines[0]])){const data=new URLSearchParams(line);responses.push({status:r.status(),event:data.get('en')||common.get('en'),id:data.get('tid')||common.get('tid'),probe:raw.includes(probe)})}}});
  await p.goto(root+'baca.html?qa='+probe+'#bagian-2',{waitUntil:'networkidle'});
  await p.waitForFunction(()=>!document.querySelector('#chapterSelect').disabled);
  assert.equal(requests.length,0,'Google request before consent');
  await p.locator('#analyticsReject').click();await p.reload({waitUntil:'networkidle'});
  assert.equal(requests.length,0,'Google request after refusal');
  console.log('PASS production no GA request before consent or after refusal');
  await p.locator('#analyticsPreferences summary').click();await p.locator('#analyticsAccept').click();
  await p.waitForFunction(()=>typeof window.gtag==='function');
  await p.waitForFunction(()=>!!document.querySelector('script[src*="googletagmanager.com/gtag/js"]'));
  await p.locator('#chapterSelect').selectOption('2');
  const required=['page_view','reader_open','chapter_view'];
  await waitFor(()=>required.every(e=>responses.some(x=>x.event===e&&x.id===id&&x.status>=200&&x.status<300)));
  assert(!responses.some(x=>x.probe),'audit query leaked into collect request');
  for(const e of required)console.log('PASS Google collect HTTP 2xx '+e);
  console.log('PASS query canary absent in captured collect payloads');
  await p.locator('#analyticsReject').click();await p.waitForLoadState('networkidle');
  assert.equal(await p.evaluate(()=>localStorage.getItem('dvc.analytics.consent.v1')),'no');
  assert.equal(await p.locator('script[src*="googletagmanager.com/gtag/js"]').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS production consent revoked and no GA script after reload');
  console.log('NOTE transport accepted; GA4 report ingestion requires Owner verification. Test events included in analytics.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
