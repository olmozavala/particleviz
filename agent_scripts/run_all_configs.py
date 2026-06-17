#!/usr/bin/env python3
"""Run ParticleViz config examples on separate ports and verify they work."""

from __future__ import annotations

import json
import os
import shutil
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from ParticleViz_DataPreproc.ConfigParams import ConfigParams
from ParticleViz_DataPreproc.PreprocParticleViz import PreprocParticleViz
CONFIG_DIR = REPO_ROOT / "ConfigExamples"
WEBAPP_SRC = REPO_ROOT / "ParticleViz_WebApp"
INSTANCES_ROOT = REPO_ROOT / ".pviz_instances"

CONFIG_FILES: List[str] = [
    "Config_Advanced_Example.json",
    "Config_Blue_Hack.json",
    "Config_Blue_HackBK.json",
    "Config_Caribbean_MPW.json",
    "Config_Caribbean_Uniform.json",
    "Config_Colored_Particles.json",
    "Config_GlobalLitter.json",
    "Config_GlobalLitter_Agregated.json",
    "Config_GlobalLitterComplete.json",
    "Config_OpenDrift.json",
    "Config_NOAA.json",
    "Config_Sea_Clearly.json",
    "Config_Simplest.json",
    "Config_Test.json",
    "Config_TidalForcing.json",
]

BASE_PORT = 3001
PREPROC_TIMEOUT_SEC = 1800
SERVER_START_TIMEOUT_SEC = 180


@dataclass
class ConfigResult:
    """Outcome for a single config run."""

    name: str
    port: int
    status: str
    detail: str = ""
    url: str = ""
    pid: Optional[int] = None
    log_file: str = ""


def load_merged_config(config_path: Path) -> Dict[str, Any]:
    """Load and merge a user config with defaults.

    Args:
        config_path: Path to the user JSON config file.

    Returns:
        Merged configuration dictionary.

    Raises:
        json.JSONDecodeError: If the config file is not valid JSON.
    """
    with config_path.open() as config_file:
        user_config = json.load(config_file)
    config_obj = ConfigParams(user_config)
    return config_obj.get_config()


def resolve_repo_path(path_value: str) -> Optional[Path]:
    """Resolve a repo-relative path to an existing absolute path.

    Args:
        path_value: Path string from a config file.

    Returns:
        Resolved existing path, or None if not found.
    """
    if not path_value:
        return None

    candidates = [
        Path(path_value),
        REPO_ROOT / path_value.lstrip("./"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def resolve_dataset_path(file_name: str) -> Optional[Path]:
    """Resolve a dataset path from config to an existing file.

    Args:
        file_name: Dataset path from the config file.

    Returns:
        Resolved existing path, or None if not found.
    """
    if not file_name or file_name.startswith("Laura"):
        return None
    return resolve_repo_path(file_name)


def missing_datasets(config_json: Dict[str, Any]) -> List[str]:
    """Return dataset paths referenced by a config that do not exist.

    Args:
        config_json: Merged configuration dictionary.

    Returns:
        List of missing dataset paths.
    """
    missing: List[str] = []
    for experiment in config_json["preprocessing"]["experiments"]:
        file_name = experiment.get("file_name", "")
        if resolve_dataset_path(file_name) is None and file_name and not file_name.startswith("Laura"):
            missing.append(file_name)
    return missing


def prepare_instance_webapp(instance_dir: Path, data_dir: Path) -> Path:
    """Create an isolated webapp directory for one config instance.

    Args:
        instance_dir: Root directory for this config instance.
        data_dir: Preprocessed data directory.

    Returns:
        Path to the webapp directory inside the instance.
    """
    current_config_path = instance_dir / "Current_Config.json"
    with current_config_path.open() as config_file:
        config_json = json.load(config_file)
    webapp_dir = instance_dir / "webapp"
    if webapp_dir.exists() or webapp_dir.is_symlink():
        shutil.rmtree(webapp_dir, ignore_errors=True)

    ignore = shutil.ignore_patterns("node_modules", "data", "build*", ".pviz_instances")
    shutil.copytree(WEBAPP_SRC, webapp_dir, ignore=ignore)

    node_modules_src = WEBAPP_SRC / "node_modules"
    if node_modules_src.exists():
        os.symlink(node_modules_src, webapp_dir / "node_modules", target_is_directory=True)

    public_data = webapp_dir / "public" / "data"
    if public_data.exists():
        shutil.rmtree(public_data)
    shutil.copytree(data_dir, public_data)

    web_data_path = config_json.get("webapp", {}).get("data_folder")
    if web_data_path:
        extra_data = Path(web_data_path)
        if not extra_data.is_absolute():
            extra_data = REPO_ROOT / web_data_path.lstrip("./")
        if extra_data.exists() and extra_data.resolve() != data_dir.resolve():
            shutil.copytree(extra_data, public_data, dirs_exist_ok=True)

    repo_assets = REPO_ROOT / "data"
    if repo_assets.exists():
        shutil.copytree(repo_assets, public_data, dirs_exist_ok=True)

    shutil.copyfile(current_config_path, webapp_dir / "src" / "Config.json")

    return webapp_dir


def wait_for_http(url: str, timeout_sec: int) -> bool:
    """Poll an HTTP URL until it responds or timeout is reached.

    Args:
        url: URL to request.
        timeout_sec: Maximum wait time in seconds.

    Returns:
        True if the URL responded with HTTP < 500, else False.
    """
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=5) as response:
                return response.status < 500
        except (urllib.error.URLError, TimeoutError):
            time.sleep(2)
    return False


def normalize_dataset_paths(config_json: Dict[str, Any]) -> Dict[str, Any]:
    """Convert relative dataset paths to absolute paths under the repo root.

    Args:
        config_json: Merged configuration dictionary.

    Returns:
        Configuration with absolute dataset paths.
    """
    config_json = json.loads(json.dumps(config_json))
    for experiment in config_json["preprocessing"]["experiments"]:
        file_name = experiment.get("file_name", "")
        resolved = resolve_dataset_path(file_name)
        if resolved is not None:
            experiment["file_name"] = str(resolved)
        color_scheme = experiment.get("color_scheme")
        if color_scheme:
            resolved_scheme = resolve_repo_path(color_scheme)
            if resolved_scheme is not None:
                experiment["color_scheme"] = str(resolved_scheme)
    return config_json


def run_preprocessing(config_json: Dict[str, Any], data_dir: Path) -> Dict[str, Any]:
    """Run preprocessing into an isolated output directory.

    Args:
        config_json: Merged configuration dictionary.
        data_dir: Output directory for preprocessed data.

    Returns:
        Final configuration written by preprocessing (includes dataset metadata).
    """
    data_dir.mkdir(parents=True, exist_ok=True)
    config_json = normalize_dataset_paths(config_json)
    config_json["preprocessing"]["output_folder"] = str(data_dir)
    config_json["webapp"]["data_folder"] = str(data_dir)

    preproc = PreprocParticleViz(config_json)
    preproc.createBinaryFileMultiple()
    return preproc._config_json


def start_web_server(webapp_dir: Path, port: int, log_path: Path) -> subprocess.Popen[str]:
    """Start the React dev server for one instance.

    Args:
        webapp_dir: Webapp directory for the instance.
        port: TCP port for the dev server.
        log_path: File to capture server stdout/stderr.

    Returns:
        Started subprocess handle.
    """
    env = {
        **os.environ,
        "PORT": str(port),
        "BROWSER": "none",
    }
    log_file = log_path.open("w")
    return subprocess.Popen(
        ["npm", "start"],
        cwd=webapp_dir,
        env=env,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        start_new_session=True,
        text=True,
    )


def process_config(config_name: str, port: int) -> ConfigResult:
    """Preprocess one config and start its web server.

    Args:
        config_name: Config filename in ConfigExamples.
        port: TCP port for the web server.

    Returns:
        Result object describing success or failure.
    """
    config_path = CONFIG_DIR / config_name
    instance_name = config_path.stem
    instance_dir = INSTANCES_ROOT / instance_name
    data_dir = instance_dir / "data"
    logs_dir = instance_dir / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_path = logs_dir / "webapp.log"
    url = f"http://localhost:{port}/"

    if not config_path.exists():
        return ConfigResult(config_name, port, "FAIL", "Config file not found", url)

    try:
        config_json = load_merged_config(config_path)
    except json.JSONDecodeError as exc:
        return ConfigResult(config_name, port, "FAIL", f"Invalid JSON: {exc}", url)

    missing = missing_datasets(config_json)
    if missing:
        preview = ", ".join(missing[:2])
        suffix = "..." if len(missing) > 2 else ""
        return ConfigResult(
            config_name,
            port,
            "SKIP",
            f"Missing dataset(s): {preview}{suffix}",
            url,
        )

    config_json["advanced"]["port"] = port
    instance_dir.mkdir(parents=True, exist_ok=True)

    try:
        print(f"[{config_name}] Preprocessing...")
        final_config = run_preprocessing(config_json, data_dir)
        with (instance_dir / "Current_Config.json").open("w") as config_out:
            json.dump(final_config, config_out, indent=4)
    except Exception as exc:  # noqa: BLE001 - report all preprocessing failures
        return ConfigResult(config_name, port, "FAIL", f"Preprocessing error: {exc}", url)

    try:
        webapp_dir = prepare_instance_webapp(instance_dir, data_dir)
    except Exception as exc:  # noqa: BLE001 - report all setup failures
        return ConfigResult(config_name, port, "FAIL", f"Webapp setup error: {exc}", url)

    if not (WEBAPP_SRC / "node_modules").exists():
        return ConfigResult(
            config_name,
            port,
            "FAIL",
            "node_modules not found. Run npm install in ParticleViz_WebApp first.",
            url,
        )

    print(f"[{config_name}] Starting web server on port {port}...")
    process = start_web_server(webapp_dir, port, log_path)
    if not wait_for_http(url, SERVER_START_TIMEOUT_SEC):
        os.killpg(process.pid, signal.SIGTERM)
        return ConfigResult(
            config_name,
            port,
            "FAIL",
            f"Server did not become ready within {SERVER_START_TIMEOUT_SEC}s",
            url,
            pid=process.pid,
            log_file=str(log_path),
        )

    return ConfigResult(
        config_name,
        port,
        "OK",
        "Preprocessing and web server started",
        url,
        pid=process.pid,
        log_file=str(log_path),
    )


def print_summary(results: List[ConfigResult]) -> None:
    """Print a table of run results.

    Args:
        results: List of per-config results.
    """
    print("\n" + "=" * 90)
    print(f"{'Config':<34} {'Port':<6} {'Status':<6} Details")
    print("-" * 90)
    for result in results:
        print(f"{result.name:<34} {result.port:<6} {result.status:<6} {result.detail}")
        if result.url and result.status == "OK":
            print(f"{'':34} {'':6} {'':6} -> {result.url}")
    print("=" * 90)

    ok_count = sum(1 for result in results if result.status == "OK")
    skip_count = sum(1 for result in results if result.status == "SKIP")
    fail_count = sum(1 for result in results if result.status == "FAIL")
    print(f"OK: {ok_count} | SKIP: {skip_count} | FAIL: {fail_count}")
    print(f"Instance data/logs: {INSTANCES_ROOT}")
    print("Stop all servers with: pkill -f '.pviz_instances/.*/webapp'")


def main() -> int:
    """Run all config examples and report results.

    Returns:
        Process exit code (0 if all runnable configs succeeded).
    """
    os.chdir(REPO_ROOT)
    INSTANCES_ROOT.mkdir(parents=True, exist_ok=True)

    results: List[ConfigResult] = []
    for index, config_name in enumerate(CONFIG_FILES):
        port = BASE_PORT + index
        print(f"\n--- {config_name} (port {port}) ---")
        results.append(process_config(config_name, port))

    print_summary(results)
    failed = [result for result in results if result.status == "FAIL"]
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
