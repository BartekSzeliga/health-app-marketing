from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
qa = json.loads((root/'qa/media-verification.json').read_text())
if qa['technicalResult'] != 'PASS' or len(qa['files']) != 10:
    raise SystemExit('Expected ten technically verified final media files')
for p in qa['files']:
    if hashlib.sha256((root/p['file']).read_bytes()).hexdigest() != p['sha256']:
        raise SystemExit('Media changed after verification: '+p['file'])
manifest = {
    'createdAt':datetime.now(timezone.utc).isoformat(),
    'package':'Diecik — cel kalorii i generator diety',
    'date':'2026-10-21',
    'status':'DO_AKCEPTACJI_BARTOSZA',
    'uploadedToMeta':False,
    'published':False,
    'files':qa['files'],
    'count':{'videos':2,'statics':4,'carouselCards':4},
    'copy':'TEKSTY-REKLAM.txt',
    'carouselOrder':['Karuzela-01-Cel-1x1.jpg','Karuzela-02-Ustawienia-1x1.jpg','Karuzela-03-Podglad-1x1.jpg','Karuzela-04-Zapis-1x1.jpg'],
    'authenticNativeUI':True,
    'syntheticDemoData':True,
    'nativePixelsRetouched':False,
    'simulatedClicks':False,
    'audio':'Original locally synthesized instrumental music; no external samples or voiceover',
    'sourceReview':'qa/acceptance-review.json',
    'previousPackagePreserved':'../diecik-instalacje-2026-10-18',
}
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
archive=root/'Diecik-materialy-do-akceptacji-2026-10-21.zip'
files=sorted((root/'DO_WGRANIA').glob('*'))+[root/n for n in ['README.md','TEKSTY-REKLAM.txt','ZRODLA.txt','manifest.json']]
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:z.write(p,p.relative_to(root))
with zipfile.ZipFile(archive) as z:
    if z.testzip() is not None or len(z.namelist()) != 14:raise SystemExit('ZIP integrity failed')
report={'file':archive.name,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'entries':14,'media':10,'crcErrors':0}
(root/'qa/archive-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
