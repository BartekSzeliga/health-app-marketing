"""Package one revised dietitian film, its cover, copy and source notes."""
from pathlib import Path
import hashlib
import json
import zipfile

root=Path(__file__).resolve().parents[1]
stem='diecik-dietetyk-spacer-20s-story'
paths=['README.txt','kampanie/dietetyk.txt',f'filmy/{stem}.mp4',f'okladki/{stem}.jpg',
       'podglad/storyboard-dietetyk-360.jpg','qa/verification-dietetyk.json',
       'qa/opening-comparison.json','qa/creative-review.txt','qa/product-truth.txt',
       'qa/panel-composite/composite-review.json','assets/provenance.json',
       'assets/footage/sources.json','assets/footage/credits.txt','audio/LICENSE.txt']
report=json.loads((root/'qa/verification-dietetyk.json').read_text())
assert report['technical_status']=='PASS'
assert hashlib.sha256((root/f'filmy/{stem}.mp4').read_bytes()).hexdigest()==report['sha256']
archive=root/'diecik-dietetyk-spacer-v10-2026-10-01.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for name in paths:z.write(root/name,name)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert set(z.namelist())==set(paths)
    for name in paths:assert z.read(name)==(root/name).read_bytes(),name
result={'archive':archive.name,'files':len(paths),'size_bytes':archive.stat().st_size,
        'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),
        'crc_and_file_equality':'PASS','movie_count':1,'raw_stock_videos_included':False}
(root/'qa/package.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
