#!/usr/bin/env python3
"""Generate L1 stock-adjustment-flow.drawio and .svg."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from lib.flowchart_engine import FlowBuilder, Node, write_diagram

OUT_DIR = os.path.dirname(__file__)


def build_flow():
    b = FlowBuilder()

    b.place_main(Node("start", "terminator", "Start"))
    b.place_main(Node("create", "process", "Create draft stock adjustment"))
    b.place_main(Node("add_items", "process", "Add lines with signed quantities (+ gain, − loss)"))
    b.place_main(Node("ready", "decision", "Ready to approve?"))
    b.place_main(Node("has_items", "decision", "At least one item?"))
    approve = b.place_main(
        Node("approve", "process", "Approve: gain = stock IN,\nloss = stock OUT — APPROVED")
    )
    b.bump(
        b.place_gaps(
            approve,
            [
                ("gap1", "GAP: No submit step — DRAFT goes straight to approve"),
                ("gap2", "GAP: No cancel or reversal — use a new adjustment"),
                ("gap3", "GAP: No finance valuation posting"),
            ],
        )
    )
    b.place_main(Node("end", "terminator", "End"))

    b.link("start", "create")
    b.link("create", "add_items")
    b.link("add_items", "ready")
    b.link("ready", "add_items", "No", "loop")
    b.link("ready", "has_items", "Yes")
    b.reject("has_items")
    b.link("has_items", "approve", "Yes")
    b.link("approve", "end")

    return b.finalize()


def main():
    nodes, edges = build_flow()
    write_diagram(
        OUT_DIR,
        "stock-adjustment-flow",
        nodes,
        edges,
        "Stock Adjustment Workflow",
        "stock-adjustment-flow",
        subtitle="L1 detail — see cross-cutting-persistence-flow for write pattern.",
    )


if __name__ == "__main__":
    main()
