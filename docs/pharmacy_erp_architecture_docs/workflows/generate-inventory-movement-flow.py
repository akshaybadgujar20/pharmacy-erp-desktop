#!/usr/bin/env python3
"""Generate L1 inventory-movement-flow.drawio and .svg — ledger hub."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from lib.flowchart_engine import ManualFlow, Node, write_diagram

OUT_DIR = os.path.dirname(__file__)

CX = 300
BOX_W = 200
BOX_H = 48
V_STEP = 72
SPOKE_Y = 80


def build_flow():
    m = ManualFlow(with_rejected=True, reject_x=620)

    y = SPOKE_Y
    m.place_at(Node("start", "terminator", "Start"), CX - 65, y, main_track=True)
    y += 50

    m.place_at(
        Node(
            "triggers",
            "process",
            "What triggered the change?\nGRN / Sale / Return / Adj / Transfer / Stock take",
        ),
        CX - BOX_W / 2,
        y,
        BOX_W + 40,
        BOX_H + 16,
        main_track=True,
    )
    y += BOX_H + 16 + V_STEP

    ctx = m.place_at(
        Node("ctx", "decision", "User and branch\ncontext set?"),
        CX - 100,
        y,
        main_track=True,
    )
    y += 90 + V_STEP

    resolve = m.place_at(
        Node("resolve", "process", "Resolve org-global batch\nand branch stock row"),
        CX - BOX_W / 2,
        y,
        BOX_W,
        BOX_H + 12,
        main_track=True,
    )
    y += BOX_H + 12 + V_STEP

    rules = m.place_at(
        Node("rules", "decision", "Business rules OK?\n(expiry, FEFO, qty)"),
        CX - 100,
        y,
        main_track=True,
    )
    y += 90 + V_STEP

    apply_mv = m.place_at(
        Node(
            "apply",
            "process",
            "applyMovement: update Stock balance\nand insert immutable StockMovement",
        ),
        CX - BOX_W / 2 - 10,
        y,
        BOX_W + 20,
        BOX_H + 16,
        main_track=True,
    )
    y += BOX_H + 16 + V_STEP

    m.place_at(
        Node("l2ref", "note", "Audit + Outbox + commit — see cross-cutting-persistence-flow"),
        CX - 140,
        y,
        280,
        36,
    )
    y += 50

    cancel_q = m.place_at(Node("cancel_q", "decision", "Cancel posted document?"), CX - 100, y, main_track=True)
    y += 90 + V_STEP

    reverse = m.place_at(
        Node("reverse", "process", "Reverse with opposite IN/OUT movement"),
        CX - BOX_W / 2,
        y,
        BOX_W,
        BOX_H,
        main_track=True,
    )
    y += BOX_H + V_STEP

    m.place_at(Node("end", "terminator", "End"), CX - 65, y, main_track=True)

    # Spoke references (left column)
    spoke_x = 40
    spokes = [
        ("sp_grn", "Purchase GRN accept\n→ purchase-invoice-flow"),
        ("sp_sale", "Sales invoice post\n→ sales-invoice-flow"),
        ("sp_adj", "Adjustment approve\n→ stock-adjustment-flow"),
        ("sp_xfer", "Transfer dispatch/receive\n→ stock-transfer-flow"),
        ("sp_ret", "Return approve\n→ return-flow"),
        ("sp_take", "Stock take reconcile\n→ stock-take-flow"),
    ]
    for i, (sid, label) in enumerate(spokes):
        m.place_at(Node(sid, "note", label), spoke_x, SPOKE_Y + 60 + i * 56, 180, 44)

    m.reject("ctx")
    m.reject("rules")

    m.link("start", "triggers")
    m.link("triggers", "ctx")
    m.link("ctx", "resolve", "Yes")
    m.link("resolve", "rules")
    m.link("rules", "apply", "Yes")
    m.link("apply", "l2ref")
    m.link("l2ref", "cancel_q")
    m.link("cancel_q", "reverse", "Yes")
    m.link("cancel_q", "end", "No")
    m.link("reverse", "end")

    for sid, _ in spokes:
        m.link("triggers", sid, "", "gap")

    return m.finalize()


def main():
    nodes, edges = build_flow()
    write_diagram(
        OUT_DIR,
        "inventory-movement-flow",
        nodes,
        edges,
        "Inventory Movement Workflow (L1 Hub)",
        "inventory-movement-flow",
        subtitle="Central ledger pattern — drill down to module L1 diagrams for step detail.",
    )


if __name__ == "__main__":
    main()
