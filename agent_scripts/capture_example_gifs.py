#!/usr/bin/env python3
"""Build example configs, capture animated GIFs for the documentation site."""

from __future__ import annotations

import argparse
import importlib.util
import os
import shutil
import signal
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import List, Tuple

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))


def _load_run_all_configs():
    """Load run_all_configs helpers without requiring an agent_scripts package."""
    module_path = REPO_ROOT / "agent_scripts" / "run_all_configs.py"
    spec = importlib.util.spec_from_file_location("run_all_configs", module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load {module_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


_run_all = _load_run_all_configs()
ConfigResult = _run_all.ConfigResult
process_config = _run_all.process_config

MEDIA_DIR = REPO_ROOT / "docs" / "media"
EXAMPLES: List[Tuple[str, str, int]] = [
    ("Config_Simplest.json", "example_simplest.gif", 3101),
    ("Config_GlobalLitter.json", "example_global_litter.gif", 3102),
    ("Config_Advanced_Example.json", "example_advanced.gif", 3103),
]


def capture_gif(url: str, output_path: Path, frames: int = 16, delay_ms: int = 500) -> None:
    """Capture browser frames and assemble a GIF with ffmpeg.

    Args:
        url: Local URL of the running ParticleViz instance.
        output_path: Destination GIF path.
        frames: Number of screenshots to capture.
        delay_ms: Delay between screenshots in milliseconds.
    """
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait
    import time

    output_path.parent.mkdir(parents=True, exist_ok=True)
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1280,800")
    options.add_argument("--hide-scrollbars")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(options=options)
    try:
        driver.get(url)
        wait = WebDriverWait(driver, 180)
        try:
            continue_btn = wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, 'button[title="Continue"]'))
            )
            continue_btn.click()
        except Exception:
            pass
        time.sleep(45)
        buttons = driver.find_elements(By.CSS_SELECTOR, "button.btn-info")
        for button in buttons:
            if button.text.strip() == "":
                try:
                    button.click()
                    break
                except Exception:
                    continue
        with tempfile.TemporaryDirectory(prefix="pviz_gif_") as tmp_dir:
            frames_dir = Path(tmp_dir)
            for frame_idx in range(frames):
                frame_path = frames_dir / f"frame_{frame_idx:03d}.png"
                driver.save_screenshot(str(frame_path))
                time.sleep(delay_ms / 1000.0)
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-framerate",
                    str(1000 // delay_ms),
                    "-i",
                    str(frames_dir / "frame_%03d.png"),
                    "-vf",
                    "scale=900:-1:flags=lanczos",
                    str(output_path),
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
    finally:
        driver.quit()


def stop_server(result: ConfigResult) -> None:
    """Terminate a started web server subprocess group.

    Args:
        result: Config run result containing the server PID.
    """
    if result.pid is None:
        return
    try:
        os.killpg(result.pid, signal.SIGTERM)
    except ProcessLookupError:
        return


def run_example(config_name: str, gif_name: str, port: int, skip_capture: bool) -> ConfigResult:
    """Preprocess a config, optionally capture a GIF, and stop the server.

    Args:
        config_name: Config file name under ConfigExamples/.
        gif_name: Output GIF filename under docs/media/.
        port: TCP port for the dev server.
        skip_capture: If True, only verify preprocessing and server startup.

    Returns:
        Result object from process_config.
    """
    print(f"\n=== {config_name} ===")
    result = process_config(config_name, port)
    if result.status != "OK":
        return result
    if not skip_capture:
        try:
            capture_gif(result.url, MEDIA_DIR / gif_name)
            print(f"Saved {MEDIA_DIR / gif_name}")
        except Exception as exc:  # noqa: BLE001
            stop_server(result)
            result.status = "FAIL"
            result.detail = f"GIF capture failed: {exc}"
            return result
    stop_server(result)
    return result


def main() -> int:
    """Capture GIFs for bundled example configs.

    Returns:
        Process exit code.
    """
    parser = argparse.ArgumentParser(description="Capture docs example GIFs")
    parser.add_argument(
        "--only",
        action="append",
        help="Run a single config file name from ConfigExamples/",
    )
    parser.add_argument(
        "--skip-capture",
        action="store_true",
        help="Only verify preprocessing and server startup",
    )
    args = parser.parse_args()

    os.chdir(REPO_ROOT)
    selected = EXAMPLES
    if args.only:
        allowed = set(args.only)
        selected = [item for item in EXAMPLES if item[0] in allowed]

    failures: List[ConfigResult] = []
    for config_name, gif_name, port in selected:
        result = run_example(config_name, gif_name, port, args.skip_capture)
        if result.status != "OK":
            failures.append(result)
            print(f"FAILED: {config_name} -> {result.detail}")

    if failures:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
