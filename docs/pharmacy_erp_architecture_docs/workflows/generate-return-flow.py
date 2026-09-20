#!/usr/bin/env python3
"""Generate L1 return-flow.drawio and .svg — sales and purchase branches."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from lib.flowchart_engine import ManualFlow, Node, write_diagram

OUT_DIR = os.path.dirname(__file__)

SALES_X = 40
PURCHASE_X = 360
COL_W = 240
V_STEP = 68
GAP_X = 680


def build_flow():
    m = ManualFlow(with_rejected=True, reject_x=620)
    y = 80

    m.place_at(Node("start", "terminator", "Start"), 280, y, main_track=True)
    y += 50
    type_q = m.place_at(
        Node("type_q", "decision", "Return type?\nSales / Purchase"),
        260,
        y,
        main_track=True,
    )
    y += 100

    sy = y
    m.place_at(Node("s_create", "process", "Load posted sales invoice\nand create draft return"), SALES_X, sy, COL_W, 52)
    sy += V_STEP
    m.place_at(Node("s_items", "process", "Add items: qty ≤ sold,\nRESTOCK disposition only"), SALES_X, sy, COL_W, 52)
    sy += V_STEP
    s_approve_q = m.place_at(Node("s_approve_q", "decision", "Approve return?"), SALES_X + 20, sy)
    sy += 78
    s_approve = m.place_at(
        Node(
            "s_approve",
            "process",
            "Approve: stock IN, ledger reversal,\nrefund payment if mode set",
        ),
        SALES_X,
        sy,
        COL_W,
        52,
    )
    sy += V_STEP
    s_cancel_q = m.place_at(Node("s_cancel_q", "decision", "Cancel return?"), SALES_X + 20, sy)
    sy += 78
    m.place_at(Node("s_cancel", "process", "Cancel: reverse if completed"), SALES_X, sy, COL_W, 52)

    py = y
    m.place_at(Node("p_create", "process", "Create draft purchase return"), PURCHASE_X, py, COL_W, 52)
    py += V_STEP
    m.place_at(Node("p_items", "process", "Add items with stock check"), PURCHASE_X, py, COL_W, 52)
    py += V_STEP
    m.place_at(Node("p_submit", "process", "Submit for approval"), PURCHASE_X, py, COL_W, 52)
    py += V_STEP
    p_approve_q = m.place_at(Node("p_approve_q", "decision", "Approve return?"), PURCHASE_X + 20, py)
    py += 78
    p_approve = m.place_at(Node("p_approve", "process", "Approve: stock OUT to supplier"), PURCHASE_X, py, COL_W, 52)
    py += V_STEP
    p_cancel_q = m.place_at(Node("p_cancel_q", "decision", "Cancel return?"), PURCHASE_X + 20, py)
    py += 78
    m.place_at(Node("p_cancel", "process", "Cancel: reverse stock if dispatched"), PURCHASE_X, py, COL_W, 52)

    end_y = max(sy, py) + V_STEP
    m.place_at(Node("end", "terminator", "End"), 280, end_y, main_track=True)

    m.place_gap("s_approve", "gap2", "Accepted v1: RESTOCK only — no quarantine/expired", GAP_X, s_approve.y + 46)

    m.link("start", "type_q")
    m.link("type_q", "s_create", "Sales")
    m.link("type_q", "p_create", "Purchase")
    m.link("s_create", "s_items")
    m.link("s_items", "s_approve_q")
    m.reject("s_approve_q")
    m.link("s_approve_q", "s_approve", "Yes")
    m.link("s_approve", "s_cancel_q")
    m.link("s_cancel_q", "s_cancel", "Yes")
    m.link("s_cancel_q", "end", "No")
    m.link("s_cancel", "end")

    m.link("p_create", "p_items")
    m.link("p_items", "p_submit")
    m.link("p_submit", "p_approve_q")
    m.reject("p_approve_q")
    m.link("p_approve_q", "p_approve", "Yes")
    m.link("p_approve", "p_cancel_q")
    m.link("p_cancel_q", "p_cancel", "Yes")
    m.link("p_cancel_q", "end", "No")
    m.link("p_cancel", "end")

    return m.finalize()


def main():
    nodes, edges = build_flow()
    write_diagram(
        OUT_DIR,
        "return-flow",
        nodes,
        edges,
        "Return Workflow",
        "return-flow",
        subtitle="L1: Sales and purchase return branches. See cross-cutting-persistence-flow.",
    )


if __name__ == "__main__":
    main()
