from pathlib import Path
import json
import hashlib
import zipfile
from datetime import datetime, timezone

root = Path(__file__).resolve().parent.parent
output = root / 'diecik-reklamy-v2-gotowe-2026-10-01.zip'
report = json.loads((root / 'qa/delivery-validation.json').read_text())
if report['status'] != 'PASS':
    raise SystemExit('Final media validation must pass before packaging.')
if report['movies'] != 10:
    raise SystemExit('Expected the complete revised set of 10 movies.')
for video in report['videos']:
    actual = hashlib.sha256((root / video['file']).read_bytes()).hexdigest()
    if actual != video['sha256']:
        raise SystemExit(f'Movie changed since validation: {video["file"]}')
specialist = json.loads((root / 'qa/b2b-render/technical-validation.json').read_text())
if specialist['status'] != 'TECHNICAL_PASS' or len(specialist['reports']) != 5:
    raise SystemExit('All five specialist variants must be validated before packaging.')
for video in specialist['reports']:
    if hashlib.sha256((root / video['file']).read_bytes()).hexdigest() != video['sha256']:
        raise SystemExit(f'Specialist movie changed since review: {video["file"]}')

folders = ['filmy', 'okladki', 'kampanie', 'plan', 'assets', 'audio', 'production']
files = [root / 'README.md']
for folder in folders:
    files.extend(p for p in (root / folder).rglob('*')
                 if p.is_file() and p.name != '.DS_Store')
for folder in ['qa']:
    files.extend(p for p in (root / folder).rglob('*')
                 if p.is_file() and p.suffix in {'.json', '.md', '.txt'}
                 and 'local-audio-inventory' not in p.name
                 and 'archive-first-draft' not in p.parts
                 and p.name != 'pre-tap-shift-hashes.json')
for name in ['hero-context-review-board.png', 'phone-size-hero-final.png']:
    file = root / 'podglad' / name
    if file.exists():
        files.append(file)
files = sorted(set(files))
manifest = {
    'created_at': datetime.now(timezone.utc).isoformat(),
    'movie_count': report['movies'],
    'media_validation': 'qa/delivery-validation.json',
    'campaign_state': 'local specification only / PAUSED',
    'campaign_account_created': False,
    'user_feedback': 'New direction described as much better; full-screen context added following user feedback. No advertising performance claim.',
    'files': [{
        'path': str(p.relative_to(root)), 'bytes': p.stat().st_size,
        'sha256': hashlib.sha256(p.read_bytes()).hexdigest()
    } for p in files]
}
(root / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
files.append(root / 'manifest.json')
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for p in files:
        archive.write(p, str(p.relative_to(root)))
with zipfile.ZipFile(output) as archive:
    bad = archive.testzip()
    if bad:
        raise SystemExit(f'ZIP CRC failed: {bad}')
    for file in manifest['files']:
        stored = archive.read(file['path'])
        if hashlib.sha256(stored).hexdigest() != file['sha256']:
            raise SystemExit(f'ZIP hash mismatch: {file["path"]}')
print(json.dumps({'archive': str(output), 'files': len(files),
                  'bytes': output.stat().st_size, 'crc_and_hashes': 'PASS'}, indent=2))
