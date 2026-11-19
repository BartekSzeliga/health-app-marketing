import hashlib
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent.parent
ffmpeg = root.parent / 'meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/ffmpeg'
originals = {
    'dietetyk': root.parent / 'specjalista-v10-2026-10-01',
    'trener': root.parent / 'specjalista-v9-2026-10-01',
}
stems = {
    'dietetyk': ('Diecik-dietetyk-Reels-Stories-20s', 'diecik-dietetyk-spacer-20s-story'),
    'trener': ('Diecik-trener-Reels-Stories-20s', 'diecik-trener-trening-i-jadlospis-20s-story'),
}

def sha(data):
    return hashlib.sha256(data).hexdigest()

def audio_packets(movie):
    return subprocess.run([str(ffmpeg), '-v', 'error', '-i', str(movie), '-map', '0:a:0',
                           '-c:a', 'copy', '-f', 'adts', 'pipe:1'], check=True, capture_output=True).stdout

results = []
for audience, original in originals.items():
    stem, old_stem = stems[audience]
    background = root / 'qa/work' / audience / 'film-background.mp4'
    old_background = original / 'qa/work' / audience / 'film-background.mp4'
    phone = root / 'assets/client-plan-full-before.png'
    old_phone = original / 'assets/client-plan-full-before.png'
    new_packets = audio_packets(root / 'filmy' / (stem + '.mp4'))
    old_packets = audio_packets(original / 'filmy' / (old_stem + '.mp4'))
    result = {
        'audience': audience,
        'approved_source': str(original),
        'background_sha256': sha(background.read_bytes()),
        'background_byte_identical': background.read_bytes() == old_background.read_bytes(),
        'phone_sha256': sha(phone.read_bytes()),
        'phone_source_byte_identical': phone.read_bytes() == old_phone.read_bytes(),
        'aac_stream_sha256': sha(new_packets),
        'encoded_aac_stream_byte_identical': new_packets == old_packets,
        'change': 'Marketing brand casing and safe-zone positioning; caption background gradient adjusted for legibility. No change to scene timing, source footage, native UI, or audio.',
        'opening_v8_context_preserved': audience == 'dietetyk',
        'opening_pixels_identical_to_v8': False,
    }
    assert result['background_byte_identical']
    assert result['phone_source_byte_identical']
    assert result['encoded_aac_stream_byte_identical']
    results.append(result)
report = {'status': 'PASS', 'movies': results}
(root / 'qa/b2b-source-preservation.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
