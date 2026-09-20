#!/usr/bin/env python3
"""Generate L1 payment-flow.drawio and .svg."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from lib.flowchart_engine import ManualFlow, Node, write_diagram

OUT_DIR = os.path.dirname(__file__)

LANE_W = 180
V_STEP = 68
LEFT_X = 40
MID_X = 260
RIGHT_X = 480
TAIL_X = 280


def build_flow():
    m = ManualFlow(with_rejected=True, reject_x=720)
    y0 = 80

    m.place_at(Node("start", "terminator", "Start"), TAIL_X - 65, y0, main_track=True)
    m.place_at(
        Node("note_nostock", "note", "No stock change on any payment path"),
        TAIL_X + 200,
        y0 - 10,
        220,
        32,
    )
    type_q = m.place_at(
        Node("type_q", "decision", "Payment type?\n(counter / receipt / supplier)"),
        TAIL_X - 100,
        y0 + 50,
        main_track=True,
    )

    ly = y0 + 140
    # Counter lane (SalesPayment)
    m.place_at(Node("lane_counter", "note", "Counter: SalesPayment"), LEFT_X, ly - 20, LANE_W, 28)
    inv_c = m.place_at(Node("inv_c", "decision", "Sales invoice\nposted?"), LEFT_X + 10, ly + 20)
    create_c = m.place_at(
        Node("create_c", "process", "Create pending\nSalesPayment"),
        LEFT_X,
        ly + 20 + 78,
        LANE_W,
        52,
    )

    # Finance receipt lane
    m.place_at(Node("lane_receipt", "note", "Finance: Receipt"), MID_X, ly - 20, LANE_W, 28)
    inv_r = m.place_at(Node("inv_r", "decision", "Linked invoice\nposted?"), MID_X + 10, ly + 20)
    create_r = m.place_at(
        Node("create_r", "process", "Create pending\nfinance receipt"),
        MID_X,
        ly + 20 + 78,
        LANE_W,
        52,
    )

    # Supplier lane
    m.place_at(Node("lane_supplier", "note", "Supplier: Payment"), RIGHT_X, ly - 20, LANE_W, 28)
    inv_s = m.place_at(Node("inv_s", "decision", "Purchase invoice\nposted?"), RIGHT_X + 10, ly + 20)
    create_s = m.place_at(
        Node("create_s", "process", "Create pending\nsupplier payment"),
        RIGHT_X,
        ly + 20 + 78,
        LANE_W,
        52,
    )

    # Shared tail
    cy = ly + 20 + 78 + 52 + 40
    amount = m.place_at(Node("amount", "decision", "Amount ≤ invoice balance?"), TAIL_X - 100, cy, main_track=True)
    cy += 78
    fy = m.place_at(Node("fy", "decision", "Accounting period open?"), TAIL_X - 100, cy, main_track=True)
    cy += 78
    complete = m.place_at(
        Node("complete", "process", "Complete: post ledger voucher"),
        TAIL_X - 110,
        cy,
        220,
        52,
        main_track=True,
    )
    cy += V_STEP
    settle = m.place_at(
        Node(
            "settle",
            "process",
            "Recompute invoice paid/balance/status\nand update party outstanding",
        ),
        TAIL_X - 120,
        cy,
        240,
        52,
        main_track=True,
    )
    cy += V_STEP
    cancel_q = m.place_at(Node("cancel_q", "decision", "Cancel completed payment?"), TAIL_X - 100, cy, main_track=True)
    cy += 78
    reverse = m.place_at(
        Node("reverse", "process", "Reverse voucher and restore balances"),
        TAIL_X - 110,
        cy,
        220,
        52,
        main_track=True,
    )
    cy += V_STEP
    m.place_at(Node("end", "terminator", "End"), TAIL_X - 65, cy, main_track=True)

    m.place_gap("settle", "gap2", "Accepted v1: Dual settlement — SalesPayment + Receipt", 540, settle.y + 46)
    m.place_gap("settle", "gap3", "GAP: SalesPayment + Receipt both count toward paidAmount", 540, settle.y + 92)

    m.link("start", "type_q")
    m.link("type_q", "inv_c", "Counter")
    m.link("type_q", "inv_r", "Receipt")
    m.link("type_q", "inv_s", "Supplier")
    m.reject("inv_c")
    m.reject("inv_r")
    m.reject("inv_s")
    m.link("inv_c", "create_c", "Yes")
    m.link("inv_r", "create_r", "Yes")
    m.link("inv_s", "create_s", "Yes")
    m.link("create_c", "amount")
    m.link("create_r", "amount")
    m.link("create_s", "amount")
    m.reject("amount")
    m.link("amount", "fy", "Yes")
    m.reject("fy")
    m.link("fy", "complete", "Yes")
    m.link("complete", "settle")
    m.link("settle", "cancel_q")
    m.link("cancel_q", "reverse", "Yes")
    m.link("cancel_q", "end", "No")
    m.link("reverse", "end")

    return m.finalize()


def main():
    nodes, edges = build_flow()
    write_diagram(
        OUT_DIR,
        "payment-flow",
        nodes,
        edges,
        "Payment Workflow",
        "payment-flow",
        subtitle="L1 detail — see cross-cutting-persistence-flow for write pattern. No stock changes.",
    )


if __name__ == "__main__":
    main()
