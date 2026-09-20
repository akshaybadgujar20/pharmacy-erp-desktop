#!/usr/bin/env python3
"""Generate L0 system-map-flow.drawio and .svg — module handoffs only."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from lib.flowchart_engine import Node, Edge, write_diagram

OUT_DIR = os.path.dirname(__file__)

BOX_W = 200
BOX_H = 48
H_GAP = 40
V_GAP = 56
START_X = 80
START_Y = 80


def _box(nid: str, label: str, x: float, y: float, kind: str = "process") -> Node:
    n = Node(nid, kind, label)
    n.x, n.y, n.w, n.h = x, y, BOX_W, BOX_H
    return n


def build_flow():
    nodes: list[Node] = []
    edges: list[Edge] = []

    def add(n: Node):
        nodes.append(n)

    def link(a: str, b: str, label: str = ""):
        edges.append(Edge(a, b, label, "horizontal" if label == "" else "normal"))

    y = START_Y
    add(_box("start", "Pharmacy ERP — System Map", START_X + 200, y - 30, "terminator"))
    add(Node("note_l0", "note", "L0 overview — drill down to L1 flowcharts per module", START_X + 420, y - 28, 280, 36))

    # Purchase chain (row 1)
    y += 50
    x = START_X
    po = _box("po", "Purchase Order\n(see purchase-invoice-flow)", x, y)
    grn = _box("grn", "Goods Receipt\n(see purchase-invoice-flow)", x + BOX_W + H_GAP, y)
    inv_hub = _box("inv", "Inventory Ledger\n(see inventory-movement-flow)", x + 2 * (BOX_W + H_GAP), y)
    pi = _box("pi", "Purchase Invoice\n(see purchase-invoice-flow)", x + 3 * (BOX_W + H_GAP), y)
    for n in [po, grn, inv_hub, pi]:
        add(n)
    link("po", "grn")
    link("grn", "inv")
    link("inv", "pi")

    # Sales chain (row 2)
    y += BOX_H + V_GAP + 20
    x = START_X + BOX_W + H_GAP
    si = _box("si", "Sales Invoice\n(see sales-invoice-flow)", x, y)
    pay = _box("pay", "Payment / Receipt\n(see payment-flow)", x + BOX_W + H_GAP, y)
    add(si)
    add(pay)
    link("inv", "si")
    link("si", "pay")

    # Returns (row 3)
    y += BOX_H + V_GAP
    sr = _box("sr", "Sales Return\n(see return-flow)", START_X + BOX_W + H_GAP, y)
    pr = _box("pr", "Purchase Return\n(see return-flow)", START_X + 2 * (BOX_W + H_GAP), y)
    add(sr)
    add(pr)
    link("si", "sr")
    link("pi", "pr")
    link("sr", "inv")
    link("pr", "inv")

    # Inventory ops (row 4)
    y += BOX_H + V_GAP
    adj = _box("adj", "Stock Adjustment\n(see stock-adjustment-flow)", START_X, y)
    xfer = _box("xfer", "Stock Transfer\n(see stock-transfer-flow)", START_X + BOX_W + H_GAP, y)
    add(adj)
    add(xfer)
    link("inv", "adj")
    link("inv", "xfer")
    link("xfer", "inv")

    # Month end (row 5)
    y += BOX_H + V_GAP
    close = _box("close", "Month-end Close\n(see month-end-flow)", START_X + BOX_W + H_GAP, y)
    add(close)
    link("pay", "close")
    link("pi", "close")

    # L2 reference
    y += BOX_H + V_GAP + 20
    l2 = _box("l2", "L2: cross-cutting-persistence-flow\n(UnitOfWork, Audit, Outbox)", START_X + 80, y)
    l2.w = 360
    add(l2)

    y += BOX_H + 30
    end = _box("end", "End — pick an L1 diagram for step detail", START_X + 200, y, "terminator")
    add(end)

    return nodes, edges


def main():
    nodes, edges = build_flow()
    write_diagram(
        OUT_DIR,
        "system-map-flow",
        nodes,
        edges,
        "Pharmacy ERP System Map (L0)",
        "system-map-flow",
        subtitle="High-level module handoffs — no step-level decisions. Open L1 flowcharts for detail.",
    )


if __name__ == "__main__":
    main()
