"""Original 20-second score for Diecik's cinematic specialist ad.

Build plan: compose a sparse felt-piano motif and warm acoustic-style pulse;
open the harmony at 7 s; resolve at 16 s; normalize and verify WAV/AAC.
All oscillators, envelopes, noise and room responses are synthesized here.
No captured UI taps, third-party recordings or previous campaign audio is read.
"""
from pathlib import Path
import hashlib
import json
import math
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
assert ROOT.name == "specjalista-v7-2026-10-01"
OUT = ROOT / "audio"
QA = ROOT / "qa/audio"
WORK = QA / ".work"
for directory in (OUT, QA, WORK):
    directory.mkdir(parents=True, exist_ok=True)
FFMPEG = ROOT.parent / "meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/ffmpeg"
SR, SECONDS = 48000, 20
N = SR * SECONDS
RNG = np.random.default_rng(2026100107)
TARGET_I, TARGET_TP = -15, -2.5


def command(args, data=None):
    result = subprocess.run([str(FFMPEG), "-y", "-hide_banner", *args],
                            input=data, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors="replace")[-3000:])
    return result


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def edges(signal, attack=.012, release=.10):
    result = signal.copy()
    a = min(len(result), round(SR * attack))
    r = min(len(result), round(SR * release))
    if a:
        result[:a] *= np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if r:
        result[-r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return result


def noise(length, lower=120, upper=2500):
    frequency = np.fft.rfftfreq(length, 1 / SR)
    shape = (1 - np.exp(-(frequency / lower) ** 4)) * np.exp(-(frequency / upper) ** 6)
    signal = np.fft.irfft(np.fft.rfft(RNG.normal(size=length)) * shape, n=length)
    return signal / max(np.std(signal), 1e-9)


def add(bus, signal, start, gain=1., pan=0.):
    position = round(start * SR)
    if position < 0:
        signal, position = signal[-position:], 0
    length = min(len(signal), N - position)
    if length <= 0:
        return
    angle = (pan + 1) * np.pi / 4
    bus[position:position + length, 0] += signal[:length] * gain * math.cos(angle)
    bus[position:position + length, 1] += signal[:length] * gain * math.sin(angle)


def felt_piano(midi, duration=3.6, velocity=.8):
    """Soft hammer/string modal synthesis, not a piano sample."""
    t = np.arange(round(duration * SR)) / SR
    fundamental = hz(midi)
    signal = np.zeros_like(t)
    # Inharmonicity and damped upper modes keep the attack rounded and organic.
    for k, amplitude, decay in [(1, 1., 1.8), (2, .34, 1.18), (3, .13, .76),
                                (4, .062, .51), (5, .025, .35), (6, .014, .24)]:
        mode = fundamental * k * math.sqrt(1 + .00010 * k * k)
        lifetime = decay * (1.12 if midi < 65 else .94)
        phase = RNG.uniform(-.035, .035)
        strings = np.sin(2 * np.pi * mode * .9993 * t + phase)
        strings += .54 * np.sin(2 * np.pi * mode * 1.0008 * t - phase)
        signal += strings / 1.54 * amplitude * np.exp(-t / lifetime)
    hammer = noise(len(t), 150, 2300) * np.exp(-t / .012) * .010
    return edges((signal + hammer) * velocity, .009, .17)


def rounded_bass(midi, duration=.78):
    t = np.arange(round(duration * SR)) / SR
    f = hz(midi)
    body = np.sin(2 * np.pi * f * t)
    body += .16 * np.sin(2 * np.pi * 2 * f * t + .035)
    body += .035 * np.sin(2 * np.pi * 3 * f * t)
    return edges(body * np.exp(-t / .29), .024, .13)


def warm_bow(midi, duration):
    t = np.arange(round(duration * SR)) / SR
    f = hz(midi)
    vibrato = .0022 * np.sin(2 * np.pi * .47 * t + RNG.uniform(0, np.pi))
    phase = 2 * np.pi * f * t + vibrato
    body = .74 * np.sin(phase) + .25 * np.sin(phase * 1.0011)
    body += .075 * np.sin(phase * 2) + .017 * np.sin(phase * 3)
    return edges(body, min(1.05, duration / 4), min(1.3, duration / 3))


def room(signal):
    """Quiet, diffuse original room response, without tempo-synced echoes."""
    tail = round(SR * 1.05)
    ir = np.zeros((tail, 2))
    for channel in range(2):
        for delay, gain in [(.021, .115), (.047, .073), (.083, .048),
                            (.137, .031), (.223, .023), (.349, .014), (.521, .008)]:
            index = round((delay + channel * .0037) * SR)
            ir[index, channel] += gain
        for _ in range(85):
            index = RNG.integers(round(.055 * SR), tail)
            ir[index, channel] += RNG.uniform(-.007, .007) * np.exp(-index / SR / .32)
    size = 1 << (N + tail - 1).bit_length()
    frequency = np.fft.rfftfreq(size, 1 / SR)
    rolloff = np.exp(-(frequency / 5100) ** 4)
    result = signal.copy()
    for channel in range(2):
        wet = np.fft.irfft(np.fft.rfft(signal[:, channel], n=size)
                          * np.fft.rfft(ir[:, channel], n=size) * rolloff, n=size)[:N]
        result[:, channel] += wet
    return result


def measure(path):
    result = command(["-i", str(path), "-af",
                      f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA=7:print_format=json",
                      "-f", "null", "-"])
    log = result.stderr.decode(errors="replace")
    raw = json.loads(log[log.rfind("{"):log.rfind("}") + 1])
    return raw


def build():
    music = np.zeros((N, 2), dtype=np.float64)
    # Independent harmony and score, arranged around the five film scenes.
    sections = [
        (0., 4., [47, 54, 59, 62, 66, 69], 47, .070),
        (4., 7., [43, 50, 55, 59, 62, 69], 43, .062),
        (7., 11., [50, 57, 62, 66, 69, 76], 50, .081),
        (11., 16., [45, 52, 57, 59, 62, 69], 45, .068),
        (16., 20., [50, 57, 62, 66, 71, 76], 38, .078),
    ]
    for start, end, notes, root, strength in sections:
        # Hand-spread voicings, rather than metronomic block chords.
        for i, midi in enumerate(notes):
            offset = [.0, .032, .069, .106, .153, .208][i]
            pan = [-.26, .22, -.10, .10, -.18, .18][i]
            add(music, felt_piano(midi, min(4.2, end - start + .6), .82),
                start + offset, strength * (.76 if i < 2 else 1), pan)
            if start >= 7:
                add(music, warm_bow(midi, end - start + .20), start, .012, pan * 1.4)
        if start < 16:
            for j in range(math.ceil(end - start)):
                stamp = start + j + RNG.uniform(-.004, .004)
                if stamp >= end - .05:
                    continue
                add(music, rounded_bass(root - 12), max(0., stamp),
                    (.052 if start >= 7 else .045) * (1 if j % 2 == 0 else .78))
        else:
            add(music, felt_piano(root, 3.9, .70), start + .006, .100)

    # A short original melody; generous space for the visual message.
    melody = [(0.18, 74, .049), (1.30, 69, .039), (2.45, 66, .035),
              (4.22, 71, .034), (5.32, 69, .031),
              (7.02, 74, .055), (8.14, 78, .043), (9.23, 76, .038), (10.12, 69, .031),
              (11.23, 71, .039), (12.36, 74, .035), (13.51, 69, .031), (14.73, 73, .030),
              (16.05, 74, .054), (17.28, 78, .039), (18.24, 76, .034), (19.04, 74, .033)]
    for i, (stamp, midi, gain) in enumerate(melody):
        add(music, felt_piano(midi, min(3.5, 20 - stamp), .79), stamp,
            gain, -.07 if i % 2 else .07)
    music = room(music)

    # One low-level air texture anticipates the reveal; no UI click sounds.
    airy = noise(round(.62 * SR), 180, 1800)
    airy *= np.sin(np.linspace(0, np.pi, len(airy))) ** 2
    add(music, airy, 6.55, .0020, -.08)

    fade = np.ones(N)
    fade[:round(.025 * SR)] = np.sin(np.linspace(0, np.pi / 2, round(.025 * SR))) ** 2
    fade[-round(.80 * SR):] = np.cos(np.linspace(0, np.pi / 2, round(.80 * SR))) ** 2
    music *= fade[:, None]
    raw = WORK / "original-score.float.wav"
    command(["-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "pipe:0",
             "-c:a", "pcm_f32le", str(raw)], music.astype("<f4").tobytes())
    conditioned = WORK / "conditioned.float.wav"
    command(["-i", str(raw), "-af", "highpass=f=28,lowpass=f=14500",
             "-c:a", "pcm_f32le", str(conditioned)])
    measured = measure(conditioned)
    normalization = (f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA=7:"
                     f"measured_I={measured['input_i']}:measured_TP={measured['input_tp']}:"
                     f"measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}:"
                     f"offset={measured['target_offset']}:linear=true")
    master = OUT / "diecik-specjalista-v7-mix-20s.wav"
    command(["-i", str(conditioned), "-af", normalization, "-ar", str(SR),
             "-ac", "2", "-c:a", "pcm_s24le", "-t", str(SECONDS), str(master)])
    aac = QA / "diecik-specjalista-v7-aac-check.m4a"
    command(["-i", str(master), "-c:a", "aac", "-b:a", "256k", "-ar", str(SR),
             "-ac", "2", "-movflags", "+faststart", str(aac)])
    wav_measure, aac_measure = measure(master), measure(aac)
    pcm = command(["-i", str(master), "-f", "f32le", "-ar", str(SR), "-ac", "2", "pipe:1"])
    decoded = np.frombuffer(pcm.stdout, dtype="<f4").reshape(-1, 2)
    duration = len(decoded) / SR
    peak = float(np.max(np.abs(decoded)))
    correlation = float(np.corrcoef(decoded.T)[0, 1])
    passed = (len(decoded) == N and np.isfinite(decoded).all()
              and -15.6 <= float(wav_measure["input_i"]) <= -14.4
              and -15.6 <= float(aac_measure["input_i"]) <= -14.4
              and float(wav_measure["input_tp"]) <= -1.5
              and float(aac_measure["input_tp"]) <= -1.5 and peak < 1)
    report = {
        "status": "AUDIO_TECHNICAL_PASS" if passed else "FAIL",
        "file": str(master.relative_to(ROOT)),
        "sha256": hashlib.sha256(master.read_bytes()).hexdigest(),
        "duration_seconds": duration, "pcm_frames": len(decoded),
        "sample_rate_hz": SR, "channels": 2, "pcm_bit_depth": 24,
        "wav": {"integrated_lufs": float(wav_measure["input_i"]),
                "true_peak_dbtp": float(wav_measure["input_tp"]),
                "loudness_range_lu": float(wav_measure["input_lra"]),
                "sample_peak_dbfs": 20 * math.log10(peak),
                "stereo_correlation": correlation},
        "aac": {"test_file": str(aac.relative_to(ROOT)), "bitrate_kbps": 256,
                "integrated_lufs": float(aac_measure["input_i"]),
                "true_peak_dbtp": float(aac_measure["input_tp"]),
                "sha256": hashlib.sha256(aac.read_bytes()).hexdigest()},
        "target": {"integrated_lufs": TARGET_I, "maximum_true_peak_dbtp": -1.5,
                   "normalizer_ceiling_dbtp": TARGET_TP},
        "authorship": {"method": "Original locally synthesized DSP score and sound design",
                       "seed": 2026100107, "third_party_audio_sources": 0,
                       "previous_campaign_audio_read": False, "ui_tap_sounds": False,
                       "builder": "production/build-audio.py",
                       "builder_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
        "cues": [{"time_seconds": 0, "purpose": "Sparse warm piano for the dietitian hook"},
                 {"time_seconds": 4, "purpose": "Gentle kitchen/phone change of harmony"},
                 {"time_seconds": 7, "purpose": "Brighter harmonic reveal and soft sustained layer"},
                 {"time_seconds": 11, "purpose": "Open space for the meal and benefit"},
                 {"time_seconds": 16, "purpose": "Calm resolved chord for the brand and CTA"},
                 {"time_seconds": 19.2, "purpose": "Smooth final fade"}],
        "measurement_method": "FFmpeg loudnorm EBU R128 analysis of final WAV and AAC decode; float PCM checks of final WAV.",
        "limitations": "Technical measurements and score structure; no claim of a perceptual listening review or user approval."
    }
    (QA / "audio-review.json").write_text(json.dumps(report, ensure_ascii=True, indent=2) + "\n")
    (QA / "loudness-measurements.json").write_text(json.dumps({"wav": wav_measure, "aac": aac_measure}, indent=2) + "\n")
    raw.unlink()
    conditioned.unlink()
    WORK.rmdir()
    print(json.dumps(report, ensure_ascii=True))
    if not passed:
        raise RuntimeError("Audio failed the declared technical constraints")


if __name__ == "__main__":
    build()
