"""Perspective-tracked authentic app screens in the illustrative v7 laptop shot.

Plan: inspect the real 6-10 s source; track the four inner display edges;
contain each unchanged screenshot on a 16:10 display plane; project by
homography; retain the original hand/jacket in front; encode 120 CFR frames.
Only the compositor output and its QA directory are written.
Run with qa/panel-composite/.venv/bin/python production/composite-panel.py.
"""
from pathlib import Path
import argparse
import hashlib
import json
import math
import subprocess
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
assert ROOT.name == "specjalista-v8-2026-10-01"
OUT = ROOT / "assets/panel-composite"
QA = ROOT / "qa/panel-composite"
SOURCE = ROOT.parent / "specjalista-v7-2026-10-01/assets/footage/professional-laptop-4065629.mp4"
FFMPEG = ROOT.parent / "meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/ffmpeg"
W, H, FPS, COUNT = 1080, 1920, 30, 120
SOURCE_FPS, SOURCE_FIRST, SOURCE_COUNT = 25, 150, 100
DISP_W, DISP_H = 1600, 1000
VARIANTS = {
    "opening-panel-4s": ROOT.parent / "ulubione-v6-2026-10-01/assets/b2b/web-editor-full-context.png",
    "opening-training-panel-4s": ROOT.parent / "meta-specjalista-ruch/sources/panel/02-training-plan-three-days.png",
}
# Initial inner white display corners, in the cover-fitted 1080x1920 frame.
# The lower-left corner is partly occluded; it is derived from intersecting
# the visible upper left and right-hand bottom edge, never from the hand.
INITIAL = np.array([[405., 1309.], [818., 1324.], [772., 1621.], [343., 1579.]])
PLANE = np.array([[0., 0.], [DISP_W - 1., 0.],
                  [DISP_W - 1., DISP_H - 1.], [0., DISP_H - 1.]], dtype=np.float32)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def cover(frame):
    height, width = frame.shape[:2]
    scale = max(W / width, H / height)
    resized = cv2.resize(frame, (round(width * scale), round(height * scale)),
                         interpolation=cv2.INTER_AREA)
    x, y = (resized.shape[1] - W) // 2, (resized.shape[0] - H) // 2
    return resized[y:y + H, x:x + W].copy()


def source_frames():
    cap = cv2.VideoCapture(str(SOURCE))
    if not cap.isOpened():
        raise RuntimeError("Cannot decode original footage")
    if abs(cap.get(cv2.CAP_PROP_FPS) - SOURCE_FPS) > .001:
        raise RuntimeError("Unexpected source frame rate")
    cap.set(cv2.CAP_PROP_POS_FRAMES, SOURCE_FIRST)
    try:
        for index in range(SOURCE_COUNT):
            ok, frame = cap.read()
            if not ok:
                raise RuntimeError(f"Source ended before original frame {SOURCE_FIRST + index}")
            yield index, cover(frame)
    finally:
        cap.release()


def line_through(a, b):
    line = np.cross(np.r_[a, 1.], np.r_[b, 1.])
    return line / np.linalg.norm(line[:2])


def intersect(a, b):
    point = np.cross(a, b)
    if abs(point[2]) < 1e-6:
        raise RuntimeError("Degenerate display geometry")
    return point[:2] / point[2]


def white_pixel(pixel):
    blue, green, red = map(float, pixel)
    return min(blue, green, red) > 190 and blue - red > 0


def detect_edges(frame, predicted):
    x0, y0, x1, y1 = 315, 1240, 865, 1680
    gray = cv2.cvtColor(frame[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 55, 135)
    found = cv2.HoughLinesP(edges, 1, np.pi / 720, threshold=30,
                            minLineLength=35, maxLineGap=12)
    segments = np.asarray(found).reshape(-1, 4) if found is not None else []
    center = predicted.mean(axis=0)
    lines, observations = [], []
    for edge in range(4):
        a, b = predicted[edge], predicted[(edge + 1) % 4]
        reference = line_through(a, b)
        direction = (b - a) / np.linalg.norm(b - a)
        normal = center - (a + b) / 2
        normal -= direction * np.dot(normal, direction)
        normal /= np.linalg.norm(normal)
        choices = []
        for raw in segments:
            p, q = np.asarray(raw[:2], float) + [x0, y0], np.asarray(raw[2:], float) + [x0, y0]
            length = np.linalg.norm(q - p)
            candidate_direction = (q - p) / length
            if abs(np.dot(direction, candidate_direction)) < .996:
                continue
            midpoint = (p + q) / 2
            distance = abs(np.dot(reference, np.r_[midpoint, 1.]))
            if distance > 8:
                continue
            parameter = np.dot(midpoint - a, direction) / np.linalg.norm(b - a)
            if not -.02 < parameter < 1.02:
                continue
            valid = 0
            for fraction in (.25, .50, .75):
                point = p + fraction * (q - p)
                inside = np.rint(point + normal * 4).astype(int)
                outside = np.rint(point - normal * 4).astype(int)
                if white_pixel(frame[inside[1], inside[0]]) and np.mean(frame[outside[1], outside[0]]) < 180:
                    valid += 1
            if valid < 2:
                continue
            choices.append((length / (1 + .15 * distance ** 2), p, q, distance))
        if not choices:
            lines.append(reference)
            observations.append({"edge": edge, "observed": False})
            continue
        choices.sort(key=lambda item: -item[0])
        best = choices[0]
        line = line_through(best[1], best[2])
        lines.append(line)
        observations.append({"edge": edge, "observed": True,
                             "reference_distance_px": float(best[3]),
                             "segment_length_px": float(np.linalg.norm(best[2] - best[1]))})
    corners = np.array([intersect(lines[3], lines[0]), intersect(lines[0], lines[1]),
                        intersect(lines[1], lines[2]), intersect(lines[2], lines[3])])
    area = abs(cv2.contourArea(corners.astype(np.float32)))
    if not 95000 < area < 145000 or np.max(np.linalg.norm(corners - predicted, axis=1)) > 9:
        raise RuntimeError(f"Unreliable tracked display plane: area={area:.1f}")
    return corners, observations


def track():
    corners, observed, predicted = [], [], INITIAL.copy()
    for index, frame in source_frames():
        current, audit = detect_edges(frame, predicted)
        corners.append(current)
        observed.append(audit)
        predicted = current
    points = np.array(corners)
    # Centered quadratic fit removes Hough quantization without a temporal lag.
    smooth = points.copy()
    for index in range(len(points)):
        low, high = max(0, index - 4), min(len(points), index + 5)
        t = np.arange(low, high) - index
        for corner in range(4):
            for axis in range(2):
                smooth[index, corner, axis] = np.polyfit(t, points[low:high, corner, axis], 2)[-1]
    missing = sum(not item["observed"] for items in observed for item in items)
    if missing > SOURCE_COUNT * 4 * .06:
        raise RuntimeError(f"Too many unobserved display edges: {missing}/400")
    return smooth, observed, points


def canvas(image_path):
    image = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if image is None:
        raise RuntimeError(f"Cannot read authentic screenshot: {image_path}")
    height, width = image.shape[:2]
    scale = min(DISP_W / width, DISP_H / height)
    fitted = cv2.resize(image, (round(width * scale), round(height * scale)),
                        interpolation=cv2.INTER_AREA)
    display = np.full((DISP_H, DISP_W, 3), 255, dtype=np.uint8)
    x, y = (DISP_W - fitted.shape[1]) // 2, (DISP_H - fitted.shape[0]) // 2
    display[y:y + fitted.shape[0], x:x + fitted.shape[1]] = fitted
    return display, {"original_size": [width, height],
                     "fit_bounds_in_display": [x, y, fitted.shape[1], fitted.shape[0]],
                     "full_screenshot_retained": True, "crop": None,
                     "native_elements_rewritten": False}


def composite(frame, display, corners):
    matrix = cv2.getPerspectiveTransform(PLANE, corners.astype(np.float32))
    inserted = cv2.warpPerspective(display, matrix, (W, H), flags=cv2.INTER_LINEAR)
    geometric = cv2.warpPerspective(np.ones((DISP_H, DISP_W), np.float32), matrix,
                                    (W, H), flags=cv2.INTER_LINEAR)
    # Key the original neutral bright display, retaining warm skin, jacket and bezel.
    rgb = frame.astype(np.float32)
    brightness = np.clip((np.min(rgb, axis=2) - 180) / 35, 0, 1)
    neutral = np.clip((rgb[:, :, 0] - rgb[:, :, 2] + 3) / 9, 0, 1)
    visible = brightness * neutral
    alpha = geometric * visible
    # The original white display is the lighting/colour field; a white UI pixel
    # reproduces that field exactly, including the source grain and illumination.
    lit = inserted.astype(np.float32) * rgb / 255
    out = np.rint(rgb * (1 - alpha[:, :, None]) + lit * alpha[:, :, None]).clip(0, 255).astype(np.uint8)
    protected = (geometric > .9) & ((np.min(rgb, axis=2) < 180) | (rgb[:, :, 0] - rgb[:, :, 2] < -3))
    altered_foreground = int(np.count_nonzero(np.any(out[protected] != frame[protected], axis=1)))
    if altered_foreground:
        raise RuntimeError("Original foreground was overwritten")
    return out, alpha, {"protected_foreground_pixels": int(protected.sum()),
                        "altered_protected_foreground_pixels": altered_foreground,
                        "inserted_pixels": int((alpha > .9).sum())}


def encode_variant(name, display, tracks, preview_only):
    samples = {0: "start", 60: "middle", 119: "end"}
    detail_frames = {0, 15, 30, 45, 60, 75, 90, 119}
    process = None
    output = OUT / f"{name}.mp4"
    if not preview_only:
        log = (QA / f"{name}-encode.log").open("wb")
        process = subprocess.Popen([str(FFMPEG), "-hide_banner", "-loglevel", "warning", "-y",
                                    "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                                    "-r", str(FPS), "-i", "pipe:0", "-an", "-c:v", "libx264",
                                    "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p",
                                    "-r", str(FPS), "-g", "30", "-frames:v", str(COUNT),
                                    "-color_primaries", "bt709", "-color_trc", "bt709",
                                    "-colorspace", "bt709", "-movflags", "+faststart", str(output)],
                                   stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=log)
    detail, audits = [], []
    iterator = iter(source_frames())
    source_index, frame = next(iterator)
    try:
        for n in range(COUNT):
            required = math.floor(n * SOURCE_FPS / FPS)
            while source_index < required:
                source_index, frame = next(iterator)
            out, alpha, audit = composite(frame, display, tracks[source_index])
            audit.update({"output_frame": n, "source_frame": SOURCE_FIRST + source_index})
            audits.append(audit)
            if process:
                process.stdin.write(out.tobytes())
            if n in samples:
                cv2.imwrite(str(QA / f"{name}-{samples[n]}.jpg"), out, [cv2.IMWRITE_JPEG_QUALITY, 96])
                cv2.imwrite(str(QA / f"{name}-{samples[n]}-matte.png"), np.rint(alpha * 255).astype(np.uint8))
            if n in detail_frames:
                crop = out[1240:1680, 315:865].copy()
                cv2.putText(crop, f"{n / FPS:.3f}s | source {(SOURCE_FIRST + source_index) / SOURCE_FPS:.2f}s",
                            (8, 22), cv2.FONT_HERSHEY_SIMPLEX, .53, (0, 50, 220), 1, cv2.LINE_AA)
                detail.append(crop)
    finally:
        if process:
            process.stdin.close()
            code = process.wait()
            log.close()
            if code:
                raise RuntimeError(f"Encode failed for {name}: {code}")
    board = np.vstack([np.hstack(detail[:4]), np.hstack(detail[4:])])
    cv2.imwrite(str(QA / f"{name}-screen-contact.jpg"), board, [cv2.IMWRITE_JPEG_QUALITY, 95])
    return {"file": str(output.relative_to(ROOT)),
            "sha256": sha(output) if not preview_only else None,
            "frame_count": COUNT, "duration_seconds": COUNT / FPS,
            "protected_foreground_changed_pixels": sum(a["altered_protected_foreground_pixels"] for a in audits),
            "minimum_protected_foreground_pixels_per_frame": min(a["protected_foreground_pixels"] for a in audits),
            "minimum_inserted_pixels_per_frame": min(a["inserted_pixels"] for a in audits),
            "frame_audit": audits}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview-only", action="store_true")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    source_sha = sha(SOURCE)
    tracks, observations, raw_tracks = track()
    (QA / "tracked-display-corners.json").write_text(json.dumps({
        "coordinate_space": "cover-fitted 1080x1920 output; TL/TR/BR/BL",
        "source_original_frames": list(range(SOURCE_FIRST, SOURCE_FIRST + SOURCE_COUNT)),
        "method": "Observed inner white/black display edge lines, intersections, centered quadratic denoise",
        "raw_corners": raw_tracks.tolist(), "smoothed_corners": tracks.tolist(),
        "edge_observations": observations}, indent=2) + "\n")
    outputs = []
    for name, screenshot in VARIANTS.items():
        display, fit = canvas(screenshot)
        result = encode_variant(name, display, tracks, args.preview_only)
        result.update({"screenshot": str(screenshot.relative_to(ROOT.parent)),
                       "screenshot_sha256": sha(screenshot), "display_fit": fit})
        outputs.append(result)
    if sha(SOURCE) != source_sha:
        raise RuntimeError("Source footage changed")
    report = {"status": "PREVIEW_ONLY" if args.preview_only else "COMPOSITE_ENCODED",
              "source": str(SOURCE.relative_to(ROOT.parent)), "source_sha256": source_sha,
              "source_interval_seconds": [6, 10], "source_fps": SOURCE_FPS,
              "output": {"width": W, "height": H, "fps": FPS, "frames": COUNT,
                         "duration_seconds": 4, "audio": False},
              "screen_plane_assumption": "16:10 physical MacBook display; whole screenshots contained with white fit margins",
              "tracking_edges_observed": sum(item["observed"] for items in observations for item in items),
              "tracking_edges_total": SOURCE_COUNT * 4,
              "maximum_smoothing_displacement_px": float(np.max(np.linalg.norm(tracks - raw_tracks, axis=2))),
              "source_speed": 1, "source_samples_repeated_for_cfr": 20,
              "foreground_method": "Original bright neutral display matte; source hand/jacket/bezel preserved in front",
              "application_elements_modified": False,
              "illustrative_stock_screen_replacement": True,
              "model_session_verified": False, "causal_handoff_to_mobile_verified": False,
              "script": "production/composite-panel.py", "script_sha256": sha(Path(__file__)),
              "software": {"opencv": cv2.__version__, "numpy": np.__version__}, "outputs": outputs}
    (QA / "composite-review.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"status": report["status"], "observed_edges": report["tracking_edges_observed"],
                      "outputs": [{"file": o["file"], "sha256": o["sha256"]} for o in outputs]}))


if __name__ == "__main__":
    main()
