"""Package the two finished ads, covers and copy; no standalone stock movies."""
from pathlib import Path
import hashlib
import json
import zipfile

root=Path(__file__).resolve().parents[1]
stems=['diecik-dietetyk-dieta-i-ruch-20s-story','diecik-trener-trening-i-jadlospis-20s-story']
paths=['README.txt','kampanie/dietetyk.txt','kampanie/trener-personalny.txt',
       'qa/verification-dietetyk.json','qa/verification-trener.json',
       'qa/creative-review.txt','qa/product-truth.txt',
       'qa/panel-composite/composite-review.json',
       'assets/provenance.json','assets/footage/sources.json',
       'assets/footage/credits.txt','audio/LICENSE.txt']
for stem in stems:
    paths.extend([f'filmy/{stem}.mp4',f'okladki/{stem}.jpg'])
paths.extend(['podglad/storyboard-dietetyk-360.jpg','podglad/storyboard-trener-360.jpg'])
for audience,stem in zip(['dietetyk','trener'],stems):
    report=json.loads((root/f'qa/verification-{audience}.json').read_text())
    assert report['technical_status']=='PASS'
    assert hashlib.sha256((root/f'filmy/{stem}.mp4').read_bytes()).hexdigest()==report['sha256']
archive=root/'diecik-dietetyk-i-trener-v9-2026-10-01.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for name in paths:z.write(root/name,name)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert set(z.namelist())==set(paths)
    for name in paths:assert z.read(name)==(root/name).read_bytes(),name
report={'archive':archive.name,'files':len(paths),'size_bytes':archive.stat().st_size,
        'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),
        'crc_and_file_equality':'PASS','movie_count':2,'raw_stock_videos_included':False}
(root/'qa/package.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
