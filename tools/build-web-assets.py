"""Build web-only derivatives from immutable published assets. Never modify originals."""
from pathlib import Path
from hashlib import sha256
import zipfile
from PIL import Image
root=Path(__file__).resolve().parent.parent
out=root/'assets'/'web'
out.mkdir(parents=True,exist_ok=True)
for name,target,size,quality in [
    ('Dapur_Vibe_Coder_Mockup.jpg','mockup.webp',(480,720),76),
    ('Dapur_Vibe_Coder_Sampul.jpg','cover.webp',(560,792),78),
]:
    with Image.open(root/name) as im:
        im.convert('RGB').resize(size,Image.Resampling.LANCZOS).save(out/target,'WEBP',quality=quality,method=6)
original=root/'Dapur_Vibe_Coder.epub'
derived=out/'reader-content.zip'
skip='EPUB/media/cover.jpg'
with zipfile.ZipFile(original) as source, zipfile.ZipFile(derived,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as target:
    assert skip in source.namelist()
    for item in source.infolist():
        if item.filename==skip: continue
        entry=zipfile.ZipInfo(item.filename,date_time=(2026,11,28,0,0,0))
        entry.compress_type=zipfile.ZIP_DEFLATED
        target.writestr(entry,source.read(item.filename),compresslevel=9)
with zipfile.ZipFile(original) as source,zipfile.ZipFile(derived) as target:
    assert set(source.namelist())-{skip}==set(target.namelist())
    for name in target.namelist(): assert source.read(name)==target.read(name),name
    print('PASS all reader archive entries byte identical except externalized cover')
for p in sorted(out.iterdir()):
    data=p.read_bytes()
    print(p.name,len(data),sha256(data).hexdigest())
