import datetime
import hashlib
import json
from pathlib import Path
import shutil
import zipfile

root = Path(__file__).resolve().parent.parent
prior = root.parent / 'paczka-3-filmy-2026-10-01/pakiet'
package = root / 'pakiet'
package.mkdir(exist_ok=True)
docs = package / 'dokumentacja'
docs.mkdir(exist_ok=True)

def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()

selection = [
    ('trener', '01-trener', 'Diecik-trener-Reels-Stories-20s', root / 'qa/verification-trener.json'),
    ('dietetyk', '02-dietetyk', 'Diecik-dietetyk-Reels-Stories-20s', root / 'qa/verification-dietetyk.json'),
    ('ulubione-posilki', '03-ulubione-posilki', 'Diecik-ulubione-posilki-Reels-Stories-20s', root / 'qa/ulubione/verification-ulubione.json'),
]
movies = []
for audience, folder, stem, qa in selection:
    current = json.loads(qa.read_text())
    movie = root / 'filmy' / (stem + '.mp4')
    cover = root / 'okladki' / (stem + '.jpg')
    assert current.get('technical_status', current.get('status')) == 'PASS', (audience, current)
    assert current['sha256'] == sha(movie), (audience, 'Stale QA report')
    target = package / folder
    target.mkdir(exist_ok=True)
    shutil.copyfile(movie, target / movie.name)
    shutil.copyfile(cover, target / 'okladka.jpg')
    copy = (prior / folder / 'tekst-reklamy.txt').read_text()
    copy = copy.replace(' — v9', ' — v11').replace(' — v10', ' — v11')
    copy = copy.replace('https://diecik.com', 'https://Diecik.com')
    for old in ['diecik-trener-20s.mp4', 'diecik-dietetyk-20s.mp4', 'diecik-ulubione-posilki-20s.mp4']:
        copy = copy.replace(old, movie.name)
    copy += '\nFormat: Reels i Stories — wspólny plik 9:16, 20 s.\n'
    (target / 'tekst-reklamy.txt').write_text(copy)
    assert (target / movie.name).read_bytes() == movie.read_bytes()
    movies.append({'audience': audience, 'movie': str(Path(folder) / movie.name),
                   'sha256': sha(movie), 'cover': str(Path(folder) / 'okladka.jpg'),
                   'current_v11_bytes_identical': True, 'verification': current})

for original in (prior / 'dokumentacja').iterdir():
    if original.name != 'weryfikacja-filmow.json':
        shutil.copyfile(original, docs / original.name)
shutil.copyfile(root / 'audio/LICENSE.txt', docs / 'audio-trener-i-dietetyk.txt')

for relative in [
    'qa/b2b-source-preservation.json', 'qa/layout-dietetyk.json', 'qa/layout-trener.json',
    'qa/placement-notes.json', 'qa/creative-review.json',
    'qa/ulubione/source-manifest.json', 'qa/ulubione/brand-safe-zone-review.json',
]:
    file = root / relative
    assert file.exists(), relative
    shutil.copyfile(file, docs / file.name)

(docs / 'weryfikacja-filmow.json').write_text(json.dumps({
    'scope': 'Three newly rendered v11 films; new full A/V decoding, current hashes and frame review. Source-provenance files retain the approved v3/v9/v10 history.',
    'movies': movies,
}, indent=2, ensure_ascii=False) + '\n')
(package / 'README.txt').write_text('''Diecik — 3 filmy do Reels i Stories — 02.10.2026 — v11

01-trener/: trening i jadłospis; „Więcej niż trening.”.
02-dietetyk/: zaakceptowane otwarcie z panelem, dieta dla podopiecznego,
spokojny spacer; „Zalecaj ruch podopiecznym. Wyróżnij swoją ofertę.”.
03-ulubione-posilki/: „Jeszcze raz?” — zapis i ponowne dodanie posiłku.

W każdym folderze: jeden film MP4, aktualna okładka JPG i tekst reklamy TXT.
Wszystkie filmy: 20 sekund, pion 9:16, 1080×1920, 30 fps, H.264/AAC stereo.
Jeden plik danej reklamy jest przeznaczony zarówno do Reels, jak i Stories.
W nazwach plików wskazano oba miejsca emisji; nie trzeba dwóch identycznych kopii.
Osobny układ 4:5 przydaje się do Facebook Feed; ten ZIP zawiera trzy pionowe filmy.

Poprawiono marketingowe wordmarki i napisy na „Diecik”, a widoczne domeny na
„Diecik.com”. Podniesiono napisy marketingowe B2B oraz finałowe logotypy,
adresy i CTA do wspólnej strefy Reels/Stories. W finale ulubionych dopasowano
do niej także miskę posiłku. Dotychczasowe etykiety akcji B2C „Zapisane”
i „Ponownie dodane” zachowano; audyt strefy B2C dotyczy głównego finału.
Sceny, montaż, czasy, autentyczne źródła UI i dotychczasowe audio zachowano.
Źródłowe pliki poprzednich wersji pozostają dostępne w lokalnym workspace.

manifest.json zawiera aktualne pliki i ich SHA256. Dokumentacja obejmuje nowe
kontrole A/V, ocenę klatek, zasady placementów i zachowane pochodzenie/licencje.
Historyczne v3/v9/v10 w dokumentach źródeł opisują materiał wejściowy, nie hash
nowego MP4. Ścieżki źródłowe dotyczą lokalnego workspace. Oględziny klatek
i dekodowanie A/V nie stanowią pełnego odsłuchu ani testu skuteczności reklamy.
''')
files = [{'file': str(f.relative_to(package)), 'bytes': f.stat().st_size, 'sha256': sha(f)}
         for f in sorted(package.rglob('*')) if f.is_file() and f.name != 'manifest.json']
manifest = {'created_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'brand': 'Diecik', 'version': 'v11', 'movie_count': 3,
            'placements': ['Reels', 'Stories'], 'aspect_ratio': '9:16',
            'duration_each_s': 20, 'width': 1080, 'height': 1920,
            'movie_selection': [{k:v for k,v in movie.items() if k != 'verification'} for movie in movies],
            'files': files}
(package / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
archive = root / 'Diecik-3-filmy-Reels-Stories-2026-10-02.zip'
temporary = archive.with_suffix('.tmp.zip')
with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zipped:
    for file in sorted(package.rglob('*')):
        if file.is_file():
            zipped.write(file, str(file.relative_to(package)))
with zipfile.ZipFile(temporary) as zipped:
    assert zipped.testzip() is None
    entries = zipped.namelist()
    assert sum(name.endswith('.mp4') for name in entries) == 3
    for name in entries:
        assert zipped.read(name) == (package / name).read_bytes(), name
temporary.replace(archive)
result = {'status': 'PASS', 'archive': archive.name, 'files': len(entries), 'movies': 3,
          'bytes': archive.stat().st_size, 'sha256': sha(archive),
          'all_zip_entries_byte_identical': True, 'crc_verified': True}
(root / 'package-verification.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
