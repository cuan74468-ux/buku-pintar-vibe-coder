const fs=require('node:fs');const assert=require('node:assert/strict');
const categories=['performance','accessibility','best-practices','seo'];
const pages=['index','buku-pintar-vibe-coder-edisi-1','baca'];
let below=[];
for(const page of pages){
 const report=JSON.parse(fs.readFileSync('lighthouse-reports/'+page+'.json','utf8'));
 assert(!report.runtimeError,JSON.stringify(report.runtimeError));
 for(const category of categories){
  const score=report.categories[category]?.score;
  assert(Number.isFinite(score),page+' '+category+' missing');
  console.log('LIGHTHOUSE MOBILE '+page+' '+category+' '+Math.round(score*100));
  if(score<0.9)below.push(page+' '+category+' '+Math.round(score*100));
 }
 for(const [id,a] of Object.entries(report.audits))if(a.score!==null&&a.score<0.9&&a.scoreDisplayMode!=='informative')console.log('REVIEW '+page+' '+id+' '+a.score);
}
assert.equal(below.length,0,'Below target 90: '+below.join('; '));
console.log('PASS mobile Lighthouse 90+ all four categories on all three candidate pages (local lab, not production)');
