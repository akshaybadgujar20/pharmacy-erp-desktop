#!/usr/bin/env python3
"""Generate L1 purchase-invoice-flow.drawio and .svg."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from lib.flowchart_engine import FlowBuilder, Node, write_diagram

OUT_DIR = os.path.dirname(__file__)


def build_flow():
    b = FlowBuilder()

    b.place_main(Node("start", "terminator", "Start"))
    b.place_main(Node("po_create", "process", "Create draft purchase order"))
    b.place_main(Node("po_items", "process", "Add order lines (medicines, quantities)"))
    b.place_main(Node("po_submit", "decision", "Submit for approval?"))
    b.place_main(Node("po_approve", "decision", "Approved?"))
    b.place_main(Node("po_send", "process", "Send order to supplier"))
    b.place_main(Node("grn_create", "process", "Create goods receipt (GRN)"))
    b.place_main(Node("grn_po", "decision", "Linked to purchase order?"))
    b.place_main(Node("grn_inspect", "process", "Submit for inspection"))
    b.place_main(Node("grn_accept", "decision", "Accept goods?"))
    grn_post = b.place_main(
        Node("grn_post", "process", "Accept GRN: create/match batch,\nstock IN, update PO status")
    )
    b.bump(
        b.place_gaps(
            grn_post,
            [("gap_grn", "GAP: GRN without PO gated by setting")],
        )
    )
    b.place_main(Node("inv_create", "process", "Create draft purchase invoice"))
    b.place_main(Node("inv_link", "decision", "Link to goods receipt?"))
    b.place_main(Node("inv_post", "decision", "Ready to post invoice?"))
    post = b.place_main(
        Node("post", "process", "Post invoice: supplier liability,\nledger entry — no stock change")
    )
    b.bump(
        b.place_gaps(
            post,
            [("gap_inv", "GAP: Invoice post does not move stock — stock moved at GRN accept only")],
        )
    )
    b.place_main(Node("return_q", "decision", "Purchase return later?"))
    b.place_main(Node("do_return", "process", "Approve return: stock OUT to supplier"))
    b.place_main(Node("cancel_q", "decision", "Cancel document?"))
    b.place_main(Node("do_cancel", "process", "Cancel (reverse GRN stock if accepted)"))
    b.place_main(Node("end", "terminator", "End"))
    b.place_footer_gaps(
        [
            ("gap7", "GAP-7: No automated tests for Purchase module"),
            ("gap8", "GAP-8: No end-to-end tests for purchase workflow"),
        ]
    )

    b.link("start", "po_create")
    b.link("po_create", "po_items")
    b.link("po_items", "po_submit")
    b.link("po_submit", "po_approve", "Yes")
    b.link("po_submit", "po_items", "No", "loop")
    b.reject("po_approve")
    b.link("po_approve", "po_send", "Yes")
    b.link("po_send", "grn_create")
    b.link("grn_create", "grn_po")
    b.reject("grn_po", "No PO and not allowed")
    b.link("grn_po", "grn_inspect", "Yes")
    b.link("grn_inspect", "grn_accept")
    b.reject("grn_accept")
    b.link("grn_accept", "grn_post", "Yes")
    b.link("grn_post", "inv_create")
    b.link("inv_create", "inv_link")
    b.link("inv_link", "inv_post", "Yes")
    b.reject("inv_link", "No")
    b.reject("inv_post")
    b.link("inv_post", "post", "Yes")
    b.link("post", "return_q")
    b.link("return_q", "do_return", "Yes")
    b.link("return_q", "cancel_q", "No")
    b.link("do_return", "cancel_q")
    b.link("cancel_q", "do_cancel", "Yes")
    b.link("cancel_q", "end", "No")
    b.link("do_cancel", "end")

    return b.finalize()


def main():
    nodes, edges = build_flow()
    write_diagram(
        OUT_DIR,
        "purchase-invoice-flow",
        nodes,
        edges,
        "Purchase Workflow",
        "purchase-invoice-flow",
        subtitle="L1: PO → GRN accept (stock IN) → Purchase Invoice post. See cross-cutting-persistence-flow.",
    )


if __name__ == "__main__":
    main()
