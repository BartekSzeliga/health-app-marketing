from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'manifest.json').read_text())
validation = json.loads((root / 'qa/validation.json').read_text())
if validation['result'] != 'PASS':
    raise RuntimeError('Final validation must pass before packaging')
visual_review = json.loads((root / 'qa/creative-review-result.json').read_text())
if visual_review['result'] != 'PASS':
    raise RuntimeError('Independent creative review must pass before packaging')

files = [item['file'] for item in manifest['exports']] + ['manifest.json']
if len(files) != len(set(files)):
    raise RuntimeError('Duplicate package paths')
for item in manifest['exports']:
    p = root / item['file']
    if hashlib.sha256(p.read_bytes()).hexdigest() != item['sha256']:
        raise RuntimeError('Export changed after validation: ' + item['file'])
for rel in files:
    p = Path(rel)
    if p.is_absolute() or '..' in p.parts or any(s in p.parts for s in ['qa', '.tooling', 'node_modules', '.work']):
        raise RuntimeError('Forbidden package path: ' + rel)
    if p.name.startswith('.') or p.suffix in ['.env', '.mov']:
        raise RuntimeError('Non-deliverable source: ' + rel)

archive = root / 'diecik-marketing-gotowe-2026-09-30.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for rel in sorted(files):
        z.write(root / rel, arcname=rel)
with zipfile.ZipFile(archive) as z:
    bad = z.testzip()
    if bad:
        raise RuntimeError('ZIP integrity failure: ' + bad)
    if set(z.namelist()) != set(files):
        raise RuntimeError('ZIP inventory mismatch')

result = {'result': 'PASS', 'archive': archive.name, 'files': len(files),
          'bytes': archive.stat().st_size,
          'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
          'crc_test': True, 'raw_recordings_and_private_fixtures_excluded': True,
          'publication': 'NOT_PUBLISHED'}
(root / 'qa/package-validation.json').write_text(json.dumps(result, indent=2))
print(json.dumps(result, indent=2))
