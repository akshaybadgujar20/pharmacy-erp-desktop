#!/usr/bin/env python3
"""Generate L1 stock-transfer-flow.drawio and .svg."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from lib.flowchart_engine import FlowBuilder, Node, write_diagram

OUT_DIR = os.path.dirname(__file__)


def build_flow():
    b = FlowBuilder()

    b.place_main(Node("start", "terminator", "Start"))
    b.place_main(Node("create", "process", "Create draft transfer\n(source branch ≠ destination)"))
    b.place_main(Node("add_items", "process", "Add items with sent quantities"))
    b.place_main(Node("dispatch_q", "decision", "Dispatch goods?"))
    b.place_main(Node("has_items", "decision", "At least one item?"))
    dispatch = b.place_main(Node("dispatch", "process", "Dispatch: stock OUT at source — IN_TRANSIT"))
    b.place_main(Node("receive_q", "decision", "Receive at destination?"))
    b.place_main(Node("partial", "decision", "Partial quantity received?"))
    receive = b.place_main(
        Node("receive", "process", "Receive: stock IN at destination\n— COMPLETED or PARTIALLY_RECEIVED")
    )
    b.bump(
        b.place_gaps(
            receive,
            [
                ("gap1", "Deferred v2: inTransitQuantity bucket not implemented"),
            ],
        )
    )
    b.place_main(Node("end", "terminator", "End"))

    b.link("start", "create")
    b.link("create", "add_items")
    b.link("add_items", "dispatch_q")
    b.link("dispatch_q", "add_items", "No", "loop")
    b.link("dispatch_q", "has_items", "Yes")
    b.reject("has_items")
    b.link("has_items", "dispatch", "Yes")
    b.link("dispatch", "receive_q")
    b.link("receive_q", "partial", "Yes")
    b.link("receive_q", "end", "No")
    b.link("partial", "receive", "Yes")
    b.link("partial", "receive", "No")
    b.link("receive", "end")

    return b.finalize()


def main():
    nodes, edges = build_flow()
    write_diagram(
        OUT_DIR,
        "stock-transfer-flow",
        nodes,
        edges,
        "Stock Transfer Workflow",
        "stock-transfer-flow",
        subtitle="L1 detail — see cross-cutting-persistence-flow for write pattern.",
    )


if __name__ == "__main__":
    main()
