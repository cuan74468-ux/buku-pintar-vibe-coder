/* Dapur Vibe Coder: consent-first GA4, production path only. */
(()=>{
'use strict';
const ID='G-FGBNWLRHS1', BASE='/buku-pintar-vibe-coder/', KEY='dvc.analytics.consent.v1';
const pages=new Map([[BASE,'home'],[BASE+'index.html','home'],[BASE+'baca.html','reader'],[BASE+'buku-pintar-vibe-coder-edisi-1.html','book']]);
if(location.protocol!=='https:'||location.hostname!=='cuan74468-ux.github.io'||!pages.has(location.pathname))return;
const page=pages.get(location.pathname), canonical=location.origin+(page==='home'?BASE:location.pathname);
let allowed=false, loaded=false, section=0, lastSection=0;
const read=()=>{try{return localStorage.getItem(KEY)}catch{return null}};
const save=v=>{try{localStorage.setItem(KEY,v);return localStorage.getItem(KEY)===v}catch{return false}};
const safeRef=()=>{try{const u=new URL(document.referrer);return /^https?:$/.test(u.protocol)?u.origin+'/':''}catch{return ''}};
const send=(name,params={})=>{if(allowed&&loaded)window.gtag('event',name,{project_id:'dapur-vibe-coder',environment:'production',page_type:page,page_location:canonical,page_referrer:safeRef(),...params})};
function chapter(n){if(page!=='reader'||!Number.isInteger(n)||n<1||n>150)return;section=n;if(allowed&&loaded&&lastSection!==n){lastSection=n;send('chapter_view',{section_index:n})}}
window.DVCAnalytics=Object.freeze({chapter});
function start(){
 if(loaded||!save('yes'))return;allowed=true;window['ga-disable-'+ID]=false;
 window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};
 window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 window.gtag('js',new Date());
 window.gtag('config',ID,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_prefix:'dvc',cookie_path:BASE,page_location:canonical,page_referrer:safeRef()});
 loaded=true;
 send('page_view');if(page==='reader'){send('reader_open');if(section)chapter(section)}
 const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+ID;script.referrerPolicy='no-referrer';document.head.append(script);
}
function stop(){allowed=false;window['ga-disable-'+ID]=true;if(loaded)window.gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});for(const part of document.cookie.split(';')){const name=part.split('=')[0].trim();if(/^dvc_ga(?:_|$)/.test(name))document.cookie=name+'=; Max-Age=0; Path='+BASE+'; Secure; SameSite=Lax';}}
window['ga-disable-'+ID]=true;
const panel=document.getElementById('analyticsPreferences'), status=document.getElementById('analyticsStatus');
function update(){status.textContent=allowed?'Analitik diizinkan.':'Analitik tidak diizinkan.'}
document.getElementById('analyticsAccept').addEventListener('click',()=>{save('yes');start();update()});
document.getElementById('analyticsReject').addEventListener('click',()=>{const persisted=save('no');stop();update();if(loaded&&persisted)location.reload()});
if(read()==='yes')start();update();
if(read()===null)panel.open=true;
document.addEventListener('click',e=>{
 if(!allowed)return;
 const a=e.target.closest?.('a[href]');if(!a)return;
 let u;try{u=new URL(a.href)}catch{return}
 const m=u.hostname==='github.com'&&u.pathname.match(/^\/cuan74468-ux\/buku-pintar-vibe-coder\/releases\/download\/dapur-vibe-coder\/Dapur_Vibe_Coder\.(pdf|epub)$/);
 if(m){send('ebook_download_click',{file_format:m[1]});return}
 const types={'classroom.google.com':'classroom','docs.google.com':'form','youtube.com':'youtube','www.youtube.com':'youtube'};
 if(types[u.hostname])send('learning_link_click',{destination_type:types[u.hostname]});
},true);
})();
