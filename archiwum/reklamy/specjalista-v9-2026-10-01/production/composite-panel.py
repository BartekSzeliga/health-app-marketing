"""One shared diet-and-training laptop composite using the accepted v8 plane.

Keep the original footage, tracked quads and foreground matte unchanged.
Only contain/project the complete authentic ready-package screenshot.
The v8 compositor is a read-only dependency; bytecode writes are disabled.
"""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import importlib.util
import json
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
assert ROOT.name == "specjalista-v9-2026-10-01"
V8 = ROOT.parent / "specjalista-v8-2026-10-01"
QA = ROOT / "qa/panel-composite"
OUT = ROOT / "assets/panel-composite"
SCREENSHOT = ROOT.parent / "meta-specjalista-ruch/sources/panel/05-package-ready-dieta-training.png"
SHARED_SCRIPT = V8 / "production/composite-panel.py"
TRACK_FILE = V8 / "qa/panel-composite/tracked-display-corners.json"


def main():
    loader = importlib.util.spec_from_file_location("accepted_v8_compositor", SHARED_SCRIPT)
    module = importlib.util.module_from_spec(loader)
    loader.loader.exec_module(module)
    accepted = json.loads((V8 / "qa/panel-composite/composite-review.json").read_text())
    if module.sha(SHARED_SCRIPT) != accepted["script_sha256"]:
        raise RuntimeError("Accepted compositor implementation changed")
    if module.sha(module.SOURCE) != accepted["source_sha256"]:
        raise RuntimeError("Original office footage changed")
    data = json.loads(TRACK_FILE.read_text())
    if data["source_original_frames"] != list(range(150, 250)):
        raise RuntimeError("Unexpected source interval in accepted tracking")
    tracks = np.asarray(data["smoothed_corners"], dtype=np.float64)
    if tracks.shape != (100, 4, 2) or not np.isfinite(tracks).all():
        raise RuntimeError("Invalid inherited display geometry")
    QA.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    # Store the exact inherited evidence locally, without altering v8.
    (QA / "tracked-display-corners-inherited-v8.json").write_bytes(TRACK_FILE.read_bytes())
    module.ROOT, module.QA, module.OUT = ROOT, QA, OUT
    source_sha = module.sha(module.SOURCE)
    screenshot_sha = module.sha(SCREENSHOT)
    display, fit = module.canvas(SCREENSHOT)
    result = module.encode_variant("opening-diet-and-training-4s", display, tracks, False)
    if module.sha(module.SOURCE) != source_sha or module.sha(SCREENSHOT) != screenshot_sha:
        raise RuntimeError("An input changed during the build")
    result.update({"screenshot": str(SCREENSHOT.relative_to(ROOT.parent)),
                   "screenshot_sha256": screenshot_sha, "display_fit": fit})
    report = {
        "status": "COMPOSITE_ENCODED",
        "shared_by": ["dietitian_film", "trainer_film"],
        "source": str(module.SOURCE.relative_to(ROOT.parent)), "source_sha256": source_sha,
        "source_interval_seconds": [6, 10], "source_fps": 25, "source_speed": 1,
        "output": {"width": 1080, "height": 1920, "fps": 30, "frames": 120,
                   "duration_seconds": 4, "audio": False, "montage_source_start_seconds": 0},
        "tracking": {"inherited_from": str(TRACK_FILE.relative_to(ROOT.parent)),
                     "sha256": module.sha(TRACK_FILE), "original_frames": [150, 249],
                     "quad_count": 100, "geometry_changed": False,
                     "local_copy": "qa/panel-composite/tracked-display-corners-inherited-v8.json"},
        "foreground": {"same_matte_as_v8": True,
                       "method": "Original bright neutral display matte; hand, jacket and bezel retained in front",
                       "protected_pixels_changed_before_encoding": result["protected_foreground_changed_pixels"]},
        "authentic_ui_state": {"package": "Pakiet 4: Pakiet dieta + ruch \u2014 DEMO",
                              "diet_in_package": True, "training_in_package": True,
                              "status_text": "Gotowy do wysy\u0142ki",
                              "state": "ready_to_send", "publication_demonstrated": False},
        "complete_original_screenshot_retained": True,
        "ui_elements_or_text_rewritten": False, "source_screenshot_bytes_modified": False,
        "transformations": ["Whole-screenshot contain fit on a 16:10 display plane",
                            "Accepted four-corner projective homography",
                            "Accepted original-display illumination field and foreground matte",
                            "25-to-30fps frame repetition at 1x; H264 encoding"],
        "external_demo_labels_added": False,
        "illustrative_stock_screen_replacement": True, "model_session_verified": False,
        "causal_handoff_to_mobile_verified": False,
        "script": "production/composite-panel.py", "script_sha256": module.sha(Path(__file__)),
        "shared_implementation": str(SHARED_SCRIPT.relative_to(ROOT.parent)),
        "shared_implementation_sha256": module.sha(SHARED_SCRIPT), "outputs": [result]
    }
    (QA / "composite-review.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"file": result["file"], "sha256": result["sha256"],
                      "frames": result["frame_count"], "foreground_pixels_changed": result["protected_foreground_changed_pixels"]}))


if __name__ == "__main__":
    main()
