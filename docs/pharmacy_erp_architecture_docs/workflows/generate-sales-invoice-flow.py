#!/usr/bin/env python3
"""Generate traditional plain-English sales-invoice-flow.drawio and .svg."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from lib.flowchart_engine import FlowBuilder, Node, write_diagram

OUT_DIR = os.path.dirname(__file__)


def build_flow():
    b = FlowBuilder()

    b.place_main(Node("start", "terminator", "Start"))
    b.place_main(Node("create", "process", "Create a new draft sales invoice"))
    b.place_main(Node("cust_sel", "decision", "Customer selected?"))
    b.place_main(Node("cust_act", "decision", "Customer active?"))
    b.place_main(Node("rx_link", "decision", "Prescription linked?"))
    rx_valid = b.place_main(Node("rx_valid", "decision", "Prescription valid?"))
    b.place_main(Node("add_items", "process", "Add or edit medicines and quantities"))
    b.place_main(Node("ready", "decision", "Ready to finalise?"))
    b.place_main(Node("has_items", "decision", "At least one item?"))
    b.place_main(Node("credit_chk", "decision", "Credit sale without customer?"))
    b.place_main(Node("allocate", "process", "Allocate stock by earliest expiry first"))
    b.place_main(Node("stock_ok", "decision", "Enough stock?"))
    b.place_main(Node("exp_chk", "decision", "Expired batch and not allowed?"))
    b.place_main(Node("price", "process", "Set price from price list (cap at MRP if set)"))
    b.place_main(Node("price_ok", "decision", "Price found?"))
    b.place_main(Node("fy_ok", "decision", "Accounting period open?"))
    finalise = b.place_main(
        Node("finalise", "process", "Generate invoice number, reduce stock,\npost accounts, update dues — POSTED")
    )
    b.bump(
        b.place_gaps(
            finalise,
            [
                ("gap2", "Accepted v1: Payment captured via payment-flow, not at finalise"),
            ],
        )
    )
    b.place_main(Node("pay_now", "decision", "Collect payment now?"))
    record_pay = b.place_main(Node("record_pay", "process", "Record payment and settle invoice"))
    b.place_main(Node("leave_unpaid", "process", "Leave as credit or unpaid"))
    b.place_main(Node("returns", "decision", "Customer returns items later?"))
    do_return = b.place_main(Node("do_return", "process", "Create return, approve, restock, settle"))
    b.bump(b.place_gaps(do_return, [("gap3", "GAP-3: Only restock supported")]))
    b.place_main(Node("cancel_q", "decision", "Cancel invoice?"))
    b.place_main(Node("do_cancel", "process", "Cancel (reverse stock/accounts if allowed)"))
    b.place_main(Node("end", "terminator", "End"))
    b.place_footer_gaps(
        [
            ("gap7", "GAP-7: No automated tests for Sales module"),
            ("gap8", "GAP-8: No end-to-end tests for sales invoice workflow"),
        ]
    )

    b.link("start", "create")
    b.link("create", "cust_sel")
    b.link("cust_sel", "cust_act", "Yes")
    b.link("cust_sel", "rx_link", "No")
    b.reject("cust_act")
    b.link("cust_act", "rx_link", "Yes")
    b.link("rx_link", "rx_valid", "Yes")
    b.link("rx_link", "add_items", "No")
    b.reject("rx_valid")
    b.link("rx_valid", "add_items", "Yes")
    b.link("add_items", "ready")
    b.link("ready", "add_items", "No", "loop")
    b.link("ready", "has_items", "Yes")
    b.reject("has_items")
    b.link("has_items", "credit_chk", "Yes")
    b.reject("credit_chk", "Yes")
    b.link("credit_chk", "allocate", "No")
    b.link("allocate", "stock_ok")
    b.reject("stock_ok")
    b.link("stock_ok", "exp_chk", "Yes")
    b.reject("exp_chk", "Yes")
    b.link("exp_chk", "price", "No")
    b.link("price", "price_ok")
    b.reject("price_ok")
    b.link("price_ok", "fy_ok", "Yes")
    b.reject("fy_ok")
    b.link("fy_ok", "finalise", "Yes")
    b.link("finalise", "pay_now")
    b.link("pay_now", "record_pay", "Yes")
    b.link("pay_now", "leave_unpaid", "No")
    b.link("record_pay", "returns")
    b.link("leave_unpaid", "returns")
    b.link("returns", "do_return", "Yes")
    b.link("returns", "cancel_q", "No")
    b.link("do_return", "cancel_q")
    b.link("cancel_q", "do_cancel", "Yes")
    b.link("cancel_q", "end", "No")
    b.link("do_cancel", "end")

    return b.finalize()


def main():
    nodes, edges = build_flow()
    write_diagram(
        OUT_DIR,
        "sales-invoice-flow",
        nodes,
        edges,
        "Sales Invoice Workflow",
        "sales-invoice-flow",
        subtitle="L1 detail — see cross-cutting-persistence-flow for write pattern.",
    )


if __name__ == "__main__":
    main()
