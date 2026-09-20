#!/usr/bin/env python3
"""Generate minimal L1 prescription-flow.drawio and .svg."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from lib.flowchart_engine import FlowBuilder, Node, write_diagram

OUT_DIR = os.path.dirname(__file__)


def build_flow():
    b = FlowBuilder(with_rejected=True)

    b.place_main(Node("start", "terminator", "Start"))
    b.place_main(Node("create", "process", "Create draft prescription"))
    b.place_main(Node("items", "process", "Add or replace items (draft only)"))
    b.place_main(Node("activate_q", "decision", "Activate?\n(at least one item)"))
    b.place_main(Node("active", "process", "Prescription ACTIVE"))
    b.place_main(Node("cancel_q", "decision", "Cancel prescription?"))
    b.place_main(Node("cancelled", "process", "Status CANCELLED"))
    b.place_main(Node("expire_q", "decision", "Expire prescription?"))
    b.place_main(Node("expired", "process", "Status EXPIRED"))
    b.place_main(Node("dispense", "process", "Sales post updates dispensed qty\n(see sales-invoice-flow)"))
    b.place_main(Node("end", "terminator", "End"))

    b.link("start", "create")
    b.link("create", "items")
    b.link("items", "activate_q")
    b.reject("activate_q")
    b.link("activate_q", "active", "Yes")
    b.link("active", "dispense")
    b.link("dispense", "cancel_q")
    b.link("cancel_q", "cancelled", "Yes")
    b.link("cancel_q", "expire_q", "No")
    b.link("cancelled", "end")
    b.link("expire_q", "expired", "Yes")
    b.link("expire_q", "end", "No")
    b.link("expired", "end")

    return b.finalize()


def main():
    nodes, edges = build_flow()
    write_diagram(
        OUT_DIR,
        "prescription-flow",
        nodes,
        edges,
        "Prescription Workflow (Minimal)",
        "prescription-flow",
        subtitle="Document lifecycle — sales invoice post updates dispensed quantities.",
    )


if __name__ == "__main__":
    main()
