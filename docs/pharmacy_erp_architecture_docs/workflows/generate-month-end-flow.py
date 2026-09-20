#!/usr/bin/env python3
"""Generate L1 month-end-flow.drawio and .svg."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from lib.flowchart_engine import FlowBuilder, Node, write_diagram

OUT_DIR = os.path.dirname(__file__)


def build_flow():
    b = FlowBuilder(with_rejected=False)

    b.place_main(Node("start", "terminator", "Start"))
    b.place_main(Node("s1", "process", "1. Pre-close checklist\n(GET /closing/pre-close-checklist)"))
    b.place_main(Node("s2", "process", "2. Stock reconciliation\n(StockTake optional) — Partial"))
    b.place_main(Node("s3", "process", "3. Ledger review / trial balance — GAP"))
    b.place_main(Node("s4", "process", "4. GST summary from posted invoices — GAP"))
    b.place_main(Node("s5", "process", "5. Mark period closed\n(FinancialYear.close) — Implemented"))
    b.place_main(Node("s6", "process", "6. Lock postings to OPEN FY for transaction date — Implemented"))
    b.place_main(Node("s7", "process", "7. Archive P&L, stock, GST reports — GAP"))
    close = b.place_main(Node("s8", "process", "8. Audit close action — Implemented"))
    b.bump(
        b.place_gaps(
            close,
            [
                ("gap3", "Deferred: No reopen-period API"),
            ],
        )
    )
    b.place_main(Node("end", "terminator", "End"))

    b.link("start", "s1")
    b.link("s1", "s2")
    b.link("s2", "s3")
    b.link("s3", "s4")
    b.link("s4", "s5")
    b.link("s5", "s6")
    b.link("s6", "s7")
    b.link("s7", "s8")
    b.link("s8", "end")

    return b.finalize()


def main():
    nodes, edges = build_flow()
    write_diagram(
        OUT_DIR,
        "month-end-flow",
        nodes,
        edges,
        "Month-End Closing Workflow",
        "month-end-flow",
        subtitle="L1 spine — labels show Implemented / Partial / GAP vs current code.",
    )


if __name__ == "__main__":
    main()
