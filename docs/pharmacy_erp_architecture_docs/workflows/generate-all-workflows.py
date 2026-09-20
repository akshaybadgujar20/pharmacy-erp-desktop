#!/usr/bin/env python3
"""Regenerate one or all workflow diagrams."""

import argparse
import importlib.util
import os
import sys

OUT_DIR = os.path.dirname(__file__)

FLOWS = {
    "system-map": "generate-system-map-flow.py",
    "persistence": "generate-cross-cutting-persistence-flow.py",
    "sales": "generate-sales-invoice-flow.py",
    "purchase": "generate-purchase-invoice-flow.py",
    "stock-adjustment": "generate-stock-adjustment-flow.py",
    "stock-transfer": "generate-stock-transfer-flow.py",
    "inventory": "generate-inventory-movement-flow.py",
    "payment": "generate-payment-flow.py",
    "return": "generate-return-flow.py",
    "month-end": "generate-month-end-flow.py",
    "prescription": "generate-prescription-flow.py",
    "stock-take": "generate-stock-take-flow.py",
}


def run_script(script_name: str):
    path = os.path.join(OUT_DIR, script_name)
    spec = importlib.util.spec_from_file_location(script_name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.main()


def main():
    parser = argparse.ArgumentParser(description="Regenerate workflow diagrams")
    parser.add_argument(
        "flow",
        nargs="?",
        choices=list(FLOWS.keys()) + ["all"],
        default="all",
        help="Which diagram to regenerate (default: all)",
    )
    args = parser.parse_args()

    if args.flow == "all":
        for name, script in FLOWS.items():
            print(f"--- {name} ---")
            run_script(script)
    else:
        run_script(FLOWS[args.flow])


if __name__ == "__main__":
    main()
