#!/usr/bin/env python3
"""Smoke test: regenerate all workflow diagrams and validate XML."""

import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

WORKFLOWS_DIR = Path(__file__).resolve().parent

# Must match generate-all-workflows.py FLOWS keys → base filenames
FLOW_BASE_NAMES = {
    "system-map": "system-map-flow",
    "persistence": "cross-cutting-persistence-flow",
    "sales": "sales-invoice-flow",
    "purchase": "purchase-invoice-flow",
    "stock-adjustment": "stock-adjustment-flow",
    "stock-transfer": "stock-transfer-flow",
    "inventory": "inventory-movement-flow",
    "payment": "payment-flow",
    "return": "return-flow",
    "month-end": "month-end-flow",
    "prescription": "prescription-flow",
    "stock-take": "stock-take-flow",
}


def main() -> int:
    result = subprocess.run(
        [sys.executable, "generate-all-workflows.py", "all"],
        cwd=WORKFLOWS_DIR,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr, file=sys.stderr)
        return result.returncode

    errors: list[str] = []
    for key, base in FLOW_BASE_NAMES.items():
        for ext in (".drawio", ".svg"):
            path = WORKFLOWS_DIR / f"{base}{ext}"
            if not path.exists():
                errors.append(f"Missing output for {key}: {path.name}")
                continue
            try:
                tree = ET.parse(path)
                root = tree.getroot()
                if ext == ".drawio":
                    cells = root.findall(".//mxCell[@vertex='1']")
                    if len(cells) < 2:
                        errors.append(f"{path.name}: expected at least 2 nodes, got {len(cells)}")
            except ET.ParseError as exc:
                errors.append(f"{path.name}: XML parse error: {exc}")

    if errors:
        for err in errors:
            print(f"FAIL: {err}", file=sys.stderr)
        return 1

    print(f"OK: {len(FLOW_BASE_NAMES)} flows, {len(FLOW_BASE_NAMES) * 2} files validated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
