/* Reader-friendly interactions only: theme, scroll progress, subtle reveals.
   Pure vanilla JS; downloads and content stay usable with JavaScript disabled. */
(()=>{
  'use strict';
  const root=document.documentElement;
  const toggle=document.getElementById('themeToggle');
  const progress=document.getElementById('scrollProgress');

  let preference='';
  try { preference=localStorage.getItem('buku-pintar-theme')||''; } catch (_) {}
  if(preference==='dark'||preference==='light')root.dataset.theme=preference;

  function updateToggle(){
    if(!toggle)return;
    const isDark=root.dataset.theme==='dark';
    toggle.setAttribute('aria-label',isDark?'Gunakan tema terang':'Gunakan tema gelap');
    toggle.setAttribute('title',isDark?'Tema terang':'Tema gelap');
    toggle.setAttribute('aria-pressed',String(isDark));
  }
  updateToggle();
  toggle?.addEventListener('click',()=>{
    const next=root.dataset.theme==='dark'?'light':'dark';
    root.dataset.theme=next;
    try{localStorage.setItem('buku-pintar-theme',next);}catch(_){}
    updateToggle();
  });

  let ticking=false;
  function renderProgress(){
    const total=document.documentElement.scrollHeight-window.innerHeight;
    const value=total>0?Math.min(1,Math.max(0,window.scrollY/total)):0;
    if(progress)progress.style.transform='scaleX('+value.toFixed(4)+')';
    ticking=false;
  }
  function updateProgress(){
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(renderProgress);
  }
  renderProgress();
  window.addEventListener('scroll',updateProgress,{passive:true});
  window.addEventListener('resize',updateProgress,{passive:true});

  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion&&'IntersectionObserver' in window){
    const nodes=[...document.querySelectorAll('[data-reveal]')];
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.isIntersecting){
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      }
    },{threshold:0.09,rootMargin:'0px 0px -25px 0px'});
    for(const node of nodes){
      node.classList.add('reveal-ready');
      observer.observe(node);
    }
  }
})();
