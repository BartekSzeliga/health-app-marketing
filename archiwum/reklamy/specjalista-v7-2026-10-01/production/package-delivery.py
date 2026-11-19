"""Package only the new finished spot; never redistribute raw stock clips."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
movie = 'diecik-specjalista-dieta-poza-gabinetem-20s-story'
paths = [
    'README.txt',
    f'filmy/{movie}.mp4',
    f'okladki/{movie}.jpg',
    'kampanie/tekst-reklamy.txt',
    'podglad/storyboard-360.jpg',
    'qa/verification.json',
    'qa/creative-review.txt',
    'assets/footage/sources.json',
    'assets/footage/credits.md',
    'audio/LICENSE.txt',
]
archive = root / 'diecik-specjalista-nowy-spot-v7-2026-10-01.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for name in paths:
        z.write(root / name, name)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert set(z.namelist()) == set(paths)
    for name in paths:
        assert z.read(name) == (root / name).read_bytes(), name
report = {'archive': archive.name, 'files': len(paths), 'size_bytes': archive.stat().st_size,
          'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
          'crc_and_file_equality': 'PASS', 'raw_stock_videos_included': False}
(root / 'qa/package.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
