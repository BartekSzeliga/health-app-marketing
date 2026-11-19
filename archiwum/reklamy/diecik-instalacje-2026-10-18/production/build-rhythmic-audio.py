"""Original Diecik revision-2 grooves: rhythm section, bass, harmony and lead.

All instruments are mathematical synthesis: no samples, recordings, library
loops or third-party music are read. Each twenty-second cue is arranged here.
Run with the existing Codex Python runtime that provides NumPy.
"""
from pathlib import Path
import hashlib
import json
import math
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio"
QA = ROOT / "qa/video/audio-r2"
FFMPEG = ROOT.parent / "meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/ffmpeg"
SR, SECONDS = 48000, 20
N = SR * SECONDS
RNG = np.random.default_rng(20261018)
for directory in (OUT, QA):
    directory.mkdir(parents=True, exist_ok=True)


def run(arguments, data=None):
    p = subprocess.run([str(FFMPEG), "-hide_banner", "-y", *arguments], input=data, capture_output=True)
    if p.returncode:
        raise RuntimeError(p.stderr.decode(errors="replace")[-3000:])
    return p


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def envelope(signal, attack=.003, release=.025):
    signal = signal.copy()
    a, r = min(len(signal), round(SR * attack)), min(len(signal), round(SR * release))
    if a:
        signal[:a] *= np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if r:
        signal[-r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return signal


def noise(length, low, high):
    frequencies = np.fft.rfftfreq(length, 1 / SR)
    shape = (1 - np.exp(-(frequencies / low) ** 4)) * np.exp(-(frequencies / high) ** 8)
    signal = np.fft.irfft(np.fft.rfft(RNG.normal(size=length)) * shape, n=length)
    return signal / max(np.std(signal), 1e-9)


def add(bus, signal, start, gain=1, pan=0):
    position = round(start * SR)
    if position < 0:
        signal, position = signal[-position:], 0
    count = min(len(signal), N - position)
    if count <= 0:
        return
    # Constant-power stereo panning. Low instruments stay centered for mono.
    angle = (pan + 1) * np.pi / 4
    bus[position:position + count, 0] += signal[:count] * gain * math.cos(angle)
    bus[position:position + count, 1] += signal[:count] * gain * math.sin(angle)


def kick(sport=False):
    t = np.arange(round(SR * .36)) / SR
    frequency = 49 + (145 if sport else 112) * np.exp(-t * 46)
    body = np.sin(2 * np.pi * np.cumsum(frequency) / SR)
    body *= np.exp(-t * (11.5 if sport else 13)) * (1 - np.exp(-t * 1800))
    click = noise(len(t), 1800, 7600) * np.exp(-t * 210) * (.085 if sport else .047)
    return envelope(np.tanh(body * 1.15) / 1.15 + click, .0004, .03)


def clap(sport=False):
    t = np.arange(round(SR * .22)) / SR
    env = sum(gain * np.exp(-np.maximum(t - delay, 0) * 57) * (t >= delay)
              for delay, gain in [(0, .48), (.011, .75), (.025, 1), (.039, .62)])
    burst = noise(len(t), 1300, 8100) * env * .28
    snare = np.sin(2 * np.pi * 186 * t) * np.exp(-t * 32) * (.16 if sport else .075)
    return envelope(burst + snare, .0005, .025)


def hat(opened=False):
    duration = .23 if opened else .075
    t = np.arange(round(SR * duration)) / SR
    metal = sum(np.sin(2 * np.pi * f * t) for f in [6281, 7597, 9137, 11009]) * .06
    body = (noise(len(t), 6200, 14900) + metal) * np.exp(-t * (17 if opened else 75))
    return envelope(body, .0007, .018)


def shaker():
    t = np.arange(round(SR * .085)) / SR
    return envelope(noise(len(t), 4200, 12800) * np.exp(-t * 54), .004, .018)


def tom(midi):
    t = np.arange(round(SR * .23)) / SR
    phase = 2 * np.pi * np.cumsum(hz(midi) * (1 + .3 * np.exp(-t * 35))) / SR
    tone = np.sin(phase) * np.exp(-t * 19)
    tone += noise(len(t), 450, 3600) * np.exp(-t * 80) * .035
    return envelope(tone, .0008, .04)


def bass(midi, duration, sport=False):
    t = np.arange(round(SR * duration)) / SR
    f = hz(midi)
    # Warm low-pass harmonic body with a short plucked edge, never a single sine.
    body = sum(amplitude * np.sin(2 * np.pi * f * k * t + (0 if k == 1 else .06))
               for k, amplitude in [(1, 1), (2, .3), (3, .17), (4, .08), (5, .035), (7, .013)])
    body = np.tanh(body * (1.8 if sport else 1.22)) / (1.8 if sport else 1.22)
    return envelope(body * np.exp(-t * (2 if sport else 3.3)), .004, .035)


def keys(midi, duration=.72, bright=1):
    t = np.arange(round(SR * duration)) / SR
    f = hz(midi)
    phase = 2 * np.pi * f * t
    body = np.sin(phase + (1.25 * np.exp(-t * 9) + .15) * np.sin(2 * phase))
    body += .16 * bright * np.sin(2.001 * phase) * np.exp(-t * 8)
    body += .035 * bright * np.sin(4.003 * phase) * np.exp(-t * 15)
    return envelope(body * np.exp(-t * 3.6), .006, .065)


def chord_voice(midi, duration=.38, bright=1):
    t = np.arange(round(SR * duration)) / SR
    f = hz(midi)
    signal = np.zeros_like(t)
    for detune, volume in [(.9985, .38), (1, .54), (1.0016, .38)]:
        phase = 2 * np.pi * f * detune * t
        for harmonic in range(1, 13):
            signal += np.sin(harmonic * phase + harmonic * .021) * volume / harmonic ** (1.55 - .18 * bright)
    signal = np.tanh(signal * .8) / .8
    return envelope(signal * np.exp(-t * 4.8), .009, .07)


def pad(midi, duration):
    t = np.arange(round(SR * duration)) / SR
    f = hz(midi)
    signal = .66 * np.sin(2 * np.pi * f * t) + .32 * np.sin(2 * np.pi * f * 1.0016 * t)
    signal += .08 * np.sin(4 * np.pi * f * t) + .026 * np.sin(6 * np.pi * f * t)
    return envelope(signal, .09, .3)


def delay(stereo, seconds, gain):
    output = np.zeros_like(stereo)
    offset = round(seconds * SR)
    output[offset:] = stereo[:-offset, ::-1] * gain
    return output


def sweep(duration=.29):
    t = np.arange(round(SR * duration)) / SR
    signal = noise(len(t), 2300, 11500) * (t / duration) ** 2
    return envelope(signal, .015, .004)


def measure(file, target):
    log = run(["-i", str(file), "-af", f"loudnorm=I={target}:TP=-1.8:LRA=5:print_format=json", "-f", "null", "-"]).stderr.decode(errors="replace")
    return json.loads(log[log.rfind("{"):log.rfind("}") + 1])


def master(music, stem, target):
    raw = QA / f"{stem}.float.wav"
    run(["-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "pipe:0", "-af", "highpass=f=28,lowpass=f=17500", "-c:a", "pcm_f32le", str(raw)], music.astype("<f4").tobytes())
    measured = measure(raw, target)
    normalize = (f"loudnorm=I={target}:TP=-1.8:LRA=5:measured_I={measured['input_i']}:"
                 f"measured_TP={measured['input_tp']}:measured_LRA={measured['input_lra']}:"
                 f"measured_thresh={measured['input_thresh']}:offset={measured['target_offset']}:linear=true")
    out = OUT / f"{stem}.wav"
    run(["-i", str(raw), "-af", normalize, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s24le", "-t", str(SECONDS), str(out)])
    preview = QA / f"{stem}-aac-check.m4a"
    run(["-i", str(out), "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), "-ac", "2", "-movflags", "+faststart", str(preview)])
    raw.unlink()
    wav_stats, aac_stats = measure(out, target), measure(preview, target)
    if abs(float(wav_stats["input_i"]) - target) > .8 or float(aac_stats["input_tp"]) > -1.05:
        raise RuntimeError(f"Unexpected master: {wav_stats} / {aac_stats}")
    return out, wav_stats, aac_stats


def build(name, bpm, sport=False):
    global RNG
    RNG = np.random.default_rng(20261018 + bpm)
    beat, bar_length = 60 / bpm, 240 / bpm
    drums, low, harmony, lead, effects = [np.zeros((N, 2), dtype=np.float64) for _ in range(5)]
    # Individually voiced progression and a distinct original phrase per cue.
    if sport:
        chords = [[50, 57, 60, 64, 69], [46, 53, 57, 60, 65], [48, 53, 57, 60, 67], [48, 55, 58, 62, 67]]
        roots = [38, 34, 41, 36]
        melody = [74, 77, 81, 79, 77, 74, 72, 69]
    elif name == "recipes":
        chords = [[53, 57, 60, 64, 67], [55, 60, 64, 69], [52, 55, 60, 62, 67], [53, 57, 60, 65, 69]]
        roots = [41, 45, 36, 41]
        melody = [72, 76, 79, 81, 79, 76, 74, 72]
    else:
        chords = [[50, 57, 62, 66, 69], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [45, 52, 57, 61, 64]]
        roots = [38, 35, 31, 33]
        melody = [74, 78, 81, 78, 76, 74, 71, 73]
    total_bars = math.ceil(SECONDS / bar_length)
    events = []
    for bar in range(total_bars):
        start = bar * bar_length
        chord_index = (bar // 2) % 4
        chord, root_note = chords[chord_index], roots[chord_index]
        # Four-on-the-floor + varied backbeat, hats and restrained 16th shakers.
        for quarter in range(4):
            add(drums, kick(sport), start + quarter * beat, (.89 if sport else .63) * (1 if quarter % 2 == 0 else .93))
            if quarter in (1, 3):
                add(drums, clap(sport), start + quarter * beat + .002, .43 if sport else .32)
        for eighth in range(8):
            offbeat = eighth % 2 == 1
            add(drums, hat(offbeat and bar > 0), start + eighth * beat / 2 + (.006 if offbeat else 0), (.065 if sport else .047) * (1 if offbeat else .7), -.22 if offbeat else .20)
        for sixteenth in range(16):
            if sixteenth % 4 in (1, 3) and bar not in (3, 7):
                add(drums, shaker(), start + sixteenth * beat / 4 + (.009 if sixteenth % 2 else 0), .026 if sport else .032, .34 if sixteenth % 2 else -.34)
        if bar % 4 == 3:
            for index, midi in enumerate([57, 53, 50, 45]):
                add(drums, tom(midi), start + (3 + index / 4) * beat, .15 if sport else .08, -.3 + index * .2)
        pattern = [(0, 0, .62), (.75, 0, .34), (1.5, 12, .3), (2, 0, .58), (2.75, 7, .3), (3.5, 12, .32)]
        if sport:
            pattern = [(0, 0, .7), (.75, 0, .36), (1.5, 0, .34), (2, 12, .58), (2.75, 0, .3), (3.25, 7, .38), (3.75, 0, .20)]
        for at, interval, length in pattern:
            add(low, bass(root_note + interval, length * beat, sport), start + at * beat, .35 if sport else .28)
        # Piano/clav groove for recipes; brighter detuned synth stabs for sport.
        rhythm = [.5, 1.75, 2.5, 3.5] if not sport else [.5, 1.5, 2.75, 3.5]
        for at in rhythm:
            for i, midi in enumerate(chord):
                sound = chord_voice(midi, .42, .95) if sport else keys(midi, .76, .85)
                add(harmony, sound, start + at * beat + i * .0018, .077 if sport else .074, [-.36, .25, -.16, .39, .04][i])
        for i, midi in enumerate(chord):
            add(harmony, pad(midi, bar_length + .1), start, .013 if sport else .019, [-.4, .4, -.2, .2, 0][i])
        # Distinct two-bar motifs; leave half of alternate bars open for the UI.
        if bar % 2 == 0:
            for i, midi in enumerate(melody[:4] if bar % 4 == 0 else melody[4:]):
                at = [0, .75, 1.5, 2.75][i]
                note_signal = chord_voice(midi - 12, .48, .8) if sport else keys(midi, .80, 1)
                add(lead, note_signal, start + at * beat, .065 if sport else .062, -.14 if i % 2 else .14)
        if bar in (2, 4, 6, 8):
            add(effects, sweep(.21), start - .21, .027 if sport else .018, -.1)
        events.append({"bar": bar + 1, "timeSeconds": round(start, 6), "frame30fps": round(start * 30)})
    lead += delay(lead, beat * .75, .16)
    harmony += delay(harmony, beat * .5, .08)
    # Low musical buses pump around the kick; percussion keeps its transient.
    time = np.arange(N) / SR
    duck = 1 - (.44 if sport else .27) * np.exp(-np.mod(time, beat) * 24)
    music = drums + (low + harmony) * duck[:, None] + lead + effects
    # A short final chord resolves the excerpt, while drums keep moving at CTA.
    resolve = 18 if name == "recipes" else math.floor(18 / beat) * beat
    for i, midi in enumerate(chords[0]):
        add(music, keys(midi, min(2, SECONDS - resolve), .6), resolve + i * .003, .045, [-.3, .3, -.15, .15, 0][i])
    fade = np.ones(N)
    fade[:96] = np.sin(np.linspace(0, np.pi / 2, 96)) ** 2
    fade[-round(SR * .62):] = np.cos(np.linspace(0, np.pi / 2, round(SR * .62))) ** 2
    music *= fade[:, None]
    if not np.isfinite(music).all():
        raise RuntimeError("Non-finite synthesized audio")
    stem = f"diecik-{name}-groove-r2-20s-{bpm}bpm"
    target = -13.2 if sport else -14
    out, wav_stats, aac_stats = master(music, stem, target)
    report = {"status": "PASS", "variant": name, "bpm": bpm, "seconds": SECONDS, "sampleRate": SR, "channels": 2, "file": str(out.relative_to(ROOT)), "sha256": hashlib.sha256(out.read_bytes()).hexdigest(), "style": "energetic synth-house / sport" if sport else "bright piano-house / syncopated groove", "instruments": ["synthesized kick", "layered clap/snare", "closed/open metallic hats", "stereo shakers", "tom fills", "harmonic bass", "voiced chord stabs", "soft chord pad", "original lead motif", "tempo delay", "transition air"], "wav": wav_stats, "aac192k": aac_stats, "barGrid": events, "thirdPartyRecordings": False, "uiClicksSynthesized": False}
    (QA / f"{name}-music-report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"variant": name, "bpm": bpm, "file": report["file"], "lufs": wav_stats["input_i"], "aacTruePeak": aac_stats["input_tp"]}), flush=True)
    return report


if __name__ == "__main__":
    reports = [build("recipes", 120), build("diet", 124), build("training", 136, True)]
    (QA / "music-review.json").write_text(json.dumps({"status": "PASS", "builder": "production/build-rhythmic-audio.py", "tracks": reports}, indent=2) + "\n")
