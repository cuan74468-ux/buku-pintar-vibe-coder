import pathlib, zipfile, subprocess, re, json, xml.etree.ElementTree as ET, posixpath
root=pathlib.Path('.')
pdf=root/'Dapur_Vibe_Coder.pdf'
info=subprocess.check_output(['pdfinfo',str(pdf)],text=True)
print('PDF',*[l for l in info.splitlines() if l.startswith(('Pages:','Encrypted:','File size:','PDF version:'))],sep=' | ')
raw=subprocess.check_output(['pdftotext','-layout',str(pdf),'-'],text=True)
pages=raw.split('\f')
if pages and not pages[-1].strip(): pages.pop()
print('PDF pages with extractable text',sum(bool(p.strip()) for p in pages),'/',len(pages))
assert len(pages)==int(re.search(r'^Pages:\s+(\d+)',info,re.M).group(1))
assert len(pages)==63 and all(p.strip() for p in pages[1:])
with zipfile.ZipFile(root/'Dapur_Vibe_Coder.epub') as z:
 assert z.testzip() is None
 assert z.read('mimetype')==b'application/epub+zip'
 c=ET.fromstring(z.read('META-INF/container.xml'))
 opf=next(e.attrib['full-path'] for e in c.iter() if e.tag.endswith('rootfile'))
 package=ET.fromstring(z.read(opf))
 manifest={e.attrib['id']:e.attrib['href'] for e in package.iter() if e.tag.endswith('}item')}
 spine=[e.attrib['idref'] for e in package.iter() if e.tag.endswith('itemref')]
 from urllib.parse import unquote
 for ref in spine:
  p=posixpath.normpath(posixpath.join(posixpath.dirname(opf),unquote(manifest[ref])))
  html=ET.fromstring(z.read(p))
  assert ''.join(html.itertext()).strip() or any(e.tag.endswith('}img') or e.tag.endswith('}image') for e in html.iter())
 assert len(spine)==36
 print('EPUB spine documents parseable',len(spine),'/',len(spine))
 print('EPUB TOC',any(e.attrib.get('properties','')=='nav' or e.attrib.get('media-type')=='application/x-dtbncx+xml' for e in package.iter()))
cat=json.loads((root/'data/books.json').read_text())
rss=ET.parse(root/'feed.xml').getroot()
book=cat['books'][0]; item=rss.find('channel/item'); enc=item.find('enclosure')
assert item.findtext('link').endswith(book['detailUrl'])
assert int(enc.attrib['length'])==pdf.stat().st_size
print('PASS catalog and RSS integrity')
# Scan original main's tracked text and history for recognizable credential formats; do not output matched values.
rev='1887a84f8ec98a090ecdb6485eda7ef25198bba5'
patterns=[rb'gh[pousr]_[A-Za-z0-9]{30,}',rb'github_pat_[A-Za-z0-9_]{50,}',rb'AIza[0-9A-Za-z_-]{35}',rb'sk-(?:proj-)?[A-Za-z0-9_-]{30,}',rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',rb'AKIA[0-9A-Z]{16}',rb'xox[baprs]-[A-Za-z0-9-]{15,}']
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',rev],text=True).splitlines()
hits=[]
for p in paths:
 if p.endswith(('.pdf','.epub','.png','.jpg')): continue
 b=subprocess.check_output(['git','show',rev+':'+p])
 if any(re.search(rx,b) for rx in patterns):hits.append(p)
print('SECRET scan tracked text files',len(paths),'matching files',len(hits))
for p in hits:print('REVIEW secret pattern in',p)
assert not hits
history=subprocess.check_output(['git','log','--format=','-p',rev,'--','.',' :(exclude)*.pdf'.strip(),':(exclude)*.epub',':(exclude)*.png',':(exclude)*.jpg'])
count=sum(len(re.findall(rx,history)) for rx in patterns)
print('SECRET history recognizable pattern matches',count)
assert count==0
