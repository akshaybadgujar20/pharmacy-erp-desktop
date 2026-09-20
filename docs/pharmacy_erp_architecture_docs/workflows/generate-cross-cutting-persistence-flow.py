#!/usr/bin/env python3
"""Generate L2 cross-cutting-persistence-flow.drawio and .svg."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from lib.flowchart_engine import FlowBuilder, Node, write_diagram

OUT_DIR = os.path.dirname(__file__)


def build_flow():
    b = FlowBuilder(with_rejected=True)

    b.place_main(Node("start", "terminator", "User action"))
    b.place_main(Node("ctx", "decision", "Branch and user\ncontext set?"))
    b.place_main(Node("uow", "process", "Begin database transaction (UnitOfWork)"))
    b.place_main(Node("validate", "decision", "Business rules\npass?"))
    b.place_main(Node("doc", "process", "Insert or update business document"))
    b.place_main(Node("side", "process", "Side effects in same transaction:\nsequence, stock movement, ledger, outstanding"))
    b.place_main(Node("audit", "process", "Write AuditLog and enqueue Outbox"))
    b.place_main(Node("commit", "process", "Commit transaction"))
    b.place_main(Node("end", "terminator", "Success"))

    b.reject("ctx")
    b.reject("validate")

    b.link("start", "ctx")
    b.link("ctx", "uow", "Yes")
    b.link("uow", "validate")
    b.link("validate", "doc", "Yes")
    b.link("doc", "side")
    b.link("side", "audit")
    b.link("audit", "commit")
    b.link("commit", "end")

    return b.finalize()


def main():
    nodes, edges = build_flow()
    write_diagram(
        OUT_DIR,
        "cross-cutting-persistence-flow",
        nodes,
        edges,
        "Cross-Cutting Persistence (L2)",
        "cross-cutting-persistence-flow",
        subtitle="Pattern used by every L1 workflow write — referenced from each module diagram.",
    )


if __name__ == "__main__":
    main()
