#!/usr/bin/env python3
"""Generate L1 stock-take-flow.drawio and .svg."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from lib.flowchart_engine import FlowBuilder, Node, write_diagram

OUT_DIR = os.path.dirname(__file__)


def build_flow():
    b = FlowBuilder()

    b.place_main(Node("start", "terminator", "Start"))
    b.place_main(Node("create", "process", "Create draft stock take"))
    b.place_main(Node("add_items", "process", "Add count lines per batch"))
    b.place_main(Node("start_q", "decision", "Start counting?"))
    b.place_main(Node("in_progress", "process", "Status IN_PROGRESS"))
    b.place_main(Node("complete_q", "decision", "Complete count?"))
    b.place_main(Node("counted", "process", "Status COUNTED"))
    b.place_main(Node("variance", "decision", "Any variance?"))
    reconcile = b.place_main(
        Node(
            "reconcile",
            "process",
            "Reconcile: auto-adjustment +\nledger movements — RECONCILED",
        )
    )
    b.place_main(Node("end", "terminator", "End"))

    b.link("start", "create")
    b.link("create", "add_items")
    b.link("add_items", "start_q")
    b.link("start_q", "add_items", "No", "loop")
    b.link("start_q", "in_progress", "Yes")
    b.link("in_progress", "complete_q")
    b.link("complete_q", "in_progress", "No", "loop")
    b.link("complete_q", "counted", "Yes")
    b.link("counted", "variance")
    b.link("variance", "reconcile", "Yes")
    b.link("variance", "end", "No")
    b.link("reconcile", "end")

    return b.finalize()


def main():
    nodes, edges = build_flow()
    write_diagram(
        OUT_DIR,
        "stock-take-flow",
        nodes,
        edges,
        "Stock Take Workflow",
        "stock-take-flow",
        subtitle="L1 detail — see cross-cutting-persistence-flow for write pattern.",
    )


if __name__ == "__main__":
    main()
