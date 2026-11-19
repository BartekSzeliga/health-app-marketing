from pathlib import Path
import hashlib, json, subprocess, zipfile

root = Path(__file__).resolve().parent.parent
media = root / 'DO_WGRANIA'
probe = root.parent / 'meta-start-aplikacji/.tooling/node_modules/@ffprobe-installer/darwin-arm64/ffprobe'
files = sorted(media.iterdir())
assert len(files) == 14 and all(p.is_file() for p in files)
assert sum(p.suffix == '.mp4' for p in files) == 4
assert sum(p.name.startswith('Grafika-') for p in files) == 6
assert sum(p.name.startswith('Karuzela-') for p in files) == 4
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
manifest = {'package': 'Diecik — instalacje aplikacji', 'date': '2026-10-18', 'revision':2,
            'counts': {'videos':4, 'staticImages':6, 'carouselCards':4},
            'published':False, 'files':[]}
for p in files:
    meta = json.loads(subprocess.check_output([str(probe), '-v','error','-show_streams','-show_format','-of','json',str(p)]))
    video = next(s for s in meta['streams'] if s['codec_type'] == 'video')
    row = {'file': p.name, 'bytes':p.stat().st_size, 'sha256':sha(p),
           'width':video['width'], 'height':video['height'], 'codec':video['codec_name']}
    if p.suffix == '.mp4':
        original = 'ulubione-posilki' in p.name
        assert (video['width'],video['height']) == ((1080,1920) if original else (1440,2560))
        assert video['r_frame_rate'] == '30/1' and video['codec_name'] == 'h264'
        audio = next(s for s in meta['streams'] if s['codec_type'] == 'audio')
        assert audio['codec_name'] == 'aac' and audio['channels'] == 2
        row.update(duration=float(meta['format']['duration']),fps=30,audio='AAC stereo',
                   use='Reels / Stories',preservedOriginal=original)
        assert abs(row['duration']-20) < .05
        if original: assert row['sha256'] == 'b918d0b558b94893af6f3bd6ec30375668c0ed4b144b0e2fa8b3007370549b36'
    else:
        assert (video['width'],video['height']) == ((1440,1800) if '4x5' in p.stem else (1440,1440))
        assert p.stat().st_size < 30_000_000
        row['use'] = 'Carousel card' if p.name.startswith('Karuzela-') else 'Feed image'
    manifest['files'].append(row)
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
archive = root/'Diecik-materialy-do-wgrania.zip'
docs = ['README.md','TEKSTY-REKLAM.txt','ZRODLA.txt','manifest.json','qa/specs-sources.md','qa/claims-review.md']
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:z.write(p,Path('DO_WGRANIA')/p.name)
    for name in docs:z.write(root/name,name)
    for p in sorted((root/'podglad/okladki').glob('*.jpg')):z.write(p,p.relative_to(root))
    # Offline viewer uses the same relative media paths. Reference videos belong
    # to the local QA session and are intentionally absent from this archive.
    viewer=(root/'podglad/index.html').read_text()
    import re
    viewer=re.sub(r'<details class="references">.*?</details>','',viewer,flags=re.S)
    viewer=viewer.replace('<a class="download" href="../Diecik-materialy-do-wgrania.zip" download>Pobierz cały zestaw ↓</a>', '<span class="tag">Wszystkie materiały w DO_WGRANIA</span>')
    z.writestr('podglad/index.html',viewer)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for p in files:assert hashlib.sha256(z.read('DO_WGRANIA/'+p.name)).hexdigest()==sha(p)
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'files':len(files),'sha256':sha(archive),'zipCRC':'PASS','mediaHashes':'PASS'},ensure_ascii=False))
