"""Shared flowchart layout and render engine for workflow diagrams."""

import html
from dataclasses import dataclass, field

# Layout defaults — spacing must exceed shape height to avoid overlap
CENTER_X = 300
COL_W = 220
DIAMOND_W = 200
DIAMOND_H = 90
PROCESS_H = 52
TERM_H = 40
REJECT_X = 540
GAP_X = 760
GAP_W = 300
GAP_H = 38
V_GAP = 32
Y_START = 60


def esc(text: str) -> str:
    return html.escape(text, quote=True).replace("\n", "&#xa;")


@dataclass
class Node:
    id: str
    kind: str  # terminator | process | decision | error | gap | note
    label: str
    x: float = 0
    y: float = 0
    w: float = COL_W
    h: float = PROCESS_H


@dataclass
class Edge:
    src: str
    tgt: str
    label: str = ""
    kind: str = "normal"  # normal | error | loop | gap | merge | horizontal


def size_for(kind: str) -> tuple[float, float]:
    if kind == "terminator":
        return 130, TERM_H
    if kind == "decision":
        return DIAMOND_W, DIAMOND_H
    if kind == "error":
        return 150, 40
    if kind == "gap":
        return GAP_W, GAP_H
    if kind == "note":
        return GAP_W, GAP_H
    return COL_W, PROCESS_H


class FlowBuilder:
    """Vertical L1 flowchart builder with shared Rejected node."""

    def __init__(
        self,
        center_x: float = CENTER_X,
        y_start: float = Y_START,
        with_rejected: bool = True,
    ):
        self.center_x = center_x
        self.y = y_start
        self.nodes: list[Node] = []
        self.edges: list[Edge] = []
        self.main_ids: list[str] = []
        self.with_rejected = with_rejected

    def link(self, src: str, tgt: str, label: str = "", kind: str = "normal"):
        self.edges.append(Edge(src, tgt, label, kind))

    def reject(self, decision_id: str, label: str = "No"):
        if self.with_rejected:
            self.link(decision_id, "rejected", label, "error")

    def place_at(
        self,
        node: Node,
        x: float,
        y: float,
        w: float | None = None,
        h: float | None = None,
        main_track: bool = False,
    ) -> Node:
        """Place a node at explicit coordinates (for forks / hub layouts)."""
        sw, sh = size_for(node.kind)
        node.x, node.y = x, y
        node.w = w if w is not None else sw
        node.h = h if h is not None else sh
        self.nodes.append(node)
        if main_track:
            self.main_ids.append(node.id)
        return node

    def place_main(self, node: Node) -> Node:
        w, h = size_for(node.kind)
        node.w, node.h = w, h
        node.x = self.center_x - w / 2
        node.y = self.y
        self.nodes.append(node)
        self.main_ids.append(node.id)
        self.y += h + V_GAP
        return node

    def place_gaps(self, parent: Node, specs: list[tuple[str, str]]) -> int:
        extra = 0
        for i, (gid, glabel) in enumerate(specs):
            g = Node(gid, "gap", glabel)
            g.w, g.h = GAP_W, GAP_H
            g.x = GAP_X
            g.y = parent.y + i * (GAP_H + 8)
            self.nodes.append(g)
            self.edges.append(Edge(parent.id, gid, "", "gap"))
            bottom = g.y + g.h - parent.y
            extra = max(extra, bottom - parent.h)
        return max(0, extra)

    def bump(self, extra: float):
        self.y += extra

    def place_footer_gaps(self, specs: list[tuple[str, str]]):
        footer_y = self.y + 40
        for i, (gid, glabel) in enumerate(specs):
            g = Node(gid, "gap", glabel)
            g.x = 40 + i * 400
            g.y = footer_y
            g.w, g.h = 380, GAP_H
            self.nodes.append(g)

    def finalize(self) -> tuple[list[Node], list[Edge]]:
        if self.with_rejected and self.main_ids:
            main_nodes = [n for n in self.nodes if n.id in self.main_ids]
            mid_y = (main_nodes[0].y + main_nodes[-1].y) / 2
            rejected = Node("rejected", "error", "Rejected")
            rejected.w, rejected.h = 150, 40
            rejected.x = REJECT_X
            rejected.y = mid_y
            self.nodes.append(rejected)
        return self.nodes, self.edges


class ManualFlow:
    """Free-form placement for hub, fork, and multi-lane L1 diagrams."""

    def __init__(self, with_rejected: bool = True, reject_x: float = REJECT_X):
        self.nodes: list[Node] = []
        self.edges: list[Edge] = []
        self.main_ids: list[str] = []
        self.with_rejected = with_rejected
        self.reject_x = reject_x

    def link(self, src: str, tgt: str, label: str = "", kind: str = "normal"):
        self.edges.append(Edge(src, tgt, label, kind))

    def reject(self, decision_id: str, label: str = "No"):
        if self.with_rejected:
            self.link(decision_id, "rejected", label, "error")

    def place_at(
        self,
        node: Node,
        x: float,
        y: float,
        w: float | None = None,
        h: float | None = None,
        main_track: bool = False,
    ) -> Node:
        sw, sh = size_for(node.kind)
        node.x, node.y = x, y
        node.w = w if w is not None else sw
        node.h = h if h is not None else sh
        self.nodes.append(node)
        if main_track:
            self.main_ids.append(node.id)
        return node

    def place_gap(self, parent_id: str, gid: str, label: str, x: float, y: float):
        g = Node(gid, "gap", label)
        g.x, g.y, g.w, g.h = x, y, GAP_W, GAP_H
        self.nodes.append(g)
        self.edges.append(Edge(parent_id, gid, "", "gap"))

    def place_footer_gaps(self, specs: list[tuple[str, str]], start_x: float = 40, y_offset: float = 40):
        if not self.main_ids:
            footer_y = y_offset
        else:
            main_nodes = [n for n in self.nodes if n.id in self.main_ids]
            footer_y = max(n.y + n.h for n in main_nodes) + y_offset
        for i, (gid, glabel) in enumerate(specs):
            g = Node(gid, "gap", glabel)
            g.x = start_x + i * 400
            g.y = footer_y
            g.w, g.h = 380, GAP_H
            self.nodes.append(g)

    def finalize(self) -> tuple[list[Node], list[Edge]]:
        if self.with_rejected and self.main_ids:
            main_nodes = [n for n in self.nodes if n.id in self.main_ids]
            mid_y = (main_nodes[0].y + main_nodes[-1].y) / 2
            rejected = Node("rejected", "error", "Rejected")
            rejected.w, rejected.h = 150, 40
            rejected.x = self.reject_x
            rejected.y = mid_y
            self.nodes.append(rejected)
        return self.nodes, self.edges


def node_center(n: Node) -> tuple[float, float]:
    return n.x + n.w / 2, n.y + n.h / 2


def node_bottom(n: Node) -> float:
    return n.y + n.h


def node_top(n: Node) -> float:
    return n.y


def node_right(n: Node) -> float:
    return n.x + n.w


def node_left(n: Node) -> float:
    return n.x


def render_drawio(
    nodes: list[Node],
    edges: list[Edge],
    diagram_id: str,
    diagram_name: str,
    agent: str = "flowchart-engine",
) -> str:
    next_mx_id = 2

    def mid() -> str:
        nonlocal next_mx_id
        next_mx_id += 1
        return str(next_mx_id)

    id_map: dict[str, str] = {}
    cells: list[str] = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']

    styles = {
        "terminator": "ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;",
        "process": "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;",
        "decision": "rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;",
        "error": "rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=10;fontStyle=1;",
        "gap": "rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#b85450;dashed=1;dashPattern=8 8;fontSize=9;align=left;spacingLeft=6;",
        "note": "rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontSize=9;align=left;spacingLeft=6;",
    }

    for n in nodes:
        cid = mid()
        id_map[n.id] = cid
        style = styles.get(n.kind, styles["process"])
        cells.append(
            f'<mxCell id="{cid}" value="{esc(n.label)}" style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{n.x:.0f}" y="{n.y:.0f}" width="{n.w:.0f}" height="{n.h:.0f}" as="geometry"/>'
            f"</mxCell>"
        )

    for e in edges:
        eid = mid()
        src, tgt = id_map.get(e.src), id_map.get(e.tgt)
        if not src or not tgt:
            continue
        stroke = "#b85450" if e.kind == "error" else "#666666"
        dashed = "dashed=1;" if e.kind in ("loop", "gap") else ""
        val = f' value="{esc(e.label)}"' if e.label else ""
        exit_x = ""
        if e.kind == "loop":
            exit_x = "exitX=0;exitY=0.5;entryX=0;entryY=0.5;"
        elif e.kind in ("error", "gap"):
            exit_x = "exitX=1;exitY=0.5;entryX=0;entryY=0.5;"
        elif e.kind == "horizontal":
            exit_x = "exitX=1;exitY=0.5;entryX=0;entryY=0.5;"
        cells.append(
            f'<mxCell id="{eid}"{val} style="endArrow=classic;html=1;strokeColor={stroke};{dashed}{exit_x}rounded=1;" '
            f'edge="1" parent="1" source="{src}" target="{tgt}">'
            f'<mxGeometry relative="1" as="geometry"/></mxCell>'
        )

    max_y = max(n.y + n.h for n in nodes) + 80
    max_x = max(n.x + n.w for n in nodes) + 40
    body = "\n        ".join(cells)
    return f"""<mxfile host="app.diagrams.net" agent="{agent}" version="22.1.0">
  <diagram id="{diagram_id}" name="{esc(diagram_name)}">
    <mxGraphModel grid="1" pageWidth="{max_x:.0f}" pageHeight="{max_y:.0f}" math="0">
      <root>
        {body}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
"""


def _svg_edge_path(e: Edge, s: Node, t: Node) -> tuple[str, float, float] | None:
    if e.kind == "error":
        x1, y1 = node_right(s), node_center(s)[1]
        x2, y2 = node_left(t), node_center(t)[1]
        d = f"M{x1:.0f},{y1:.0f} L{x2:.0f},{y1:.0f} L{x2:.0f},{y2:.0f}"
        return d, (x1 + x2) / 2, y1 - 6

    if e.kind == "gap":
        x1, y1 = node_right(s), node_center(s)[1]
        x2, y2 = node_left(t), node_center(t)[1]
        d = f"M{x1:.0f},{y1:.0f} L{x2:.0f},{y2:.0f}"
        return d, 0, 0

    if e.kind == "loop":
        x1, y1 = node_left(s), node_center(s)[1]
        x2, y2 = node_left(t), node_center(t)[1]
        loop_x = min(x1, x2) - 50
        d = (
            f"M{x1:.0f},{y1:.0f} L{loop_x:.0f},{y1:.0f} "
            f"L{loop_x:.0f},{y2:.0f} L{x2:.0f},{y2:.0f}"
        )
        return d, loop_x - 8, (y1 + y2) / 2

    if e.kind == "horizontal":
        x1, y1 = node_right(s), node_center(s)[1]
        x2, y2 = node_left(t), node_center(t)[1]
        d = f"M{x1:.0f},{y1:.0f} L{x2:.0f},{y2:.0f}"
        return d, (x1 + x2) / 2, y1 - 6

    x1, y1 = node_center(s)[0], node_bottom(s)
    x2, y2 = node_center(t)[0], node_top(t)
    d = f"M{x1:.0f},{y1:.0f} L{x2:.0f},{y2:.0f}"
    return d, (x1 + x2) / 2 + 10, (y1 + y2) / 2


def render_svg(
    nodes: list[Node],
    edges: list[Edge],
    title: str,
    subtitle: str = "Plain English flowchart. Red dashed = known gaps.",
) -> str:
    by_id = {n.id: n for n in nodes}
    max_y = max(n.y + n.h for n in nodes) + 80
    max_x = max(n.x + n.w for n in nodes) + 40
    lines: list[str] = []

    lines.append(
        f'<text x="40" y="28" font-family="Arial,sans-serif" font-size="16" font-weight="bold">{esc(title)}</text>'
    )
    if subtitle:
        lines.append(
            f'<text x="40" y="44" font-family="Arial,sans-serif" font-size="10" fill="#666">{esc(subtitle)}</text>'
        )

    for e in edges:
        if e.src not in by_id or e.tgt not in by_id:
            continue
        s, t = by_id[e.src], by_id[e.tgt]
        result = _svg_edge_path(e, s, t)
        if not result:
            continue
        d, lx, ly = result
        color = "#b85450" if e.kind == "error" else "#555"
        dash = ' stroke-dasharray="6,4"' if e.kind in ("loop", "gap") else ""
        marker = "" if e.kind == "gap" else ' marker-end="url(#arrow)"'
        lines.append(
            f'<path d="{d}" fill="none" stroke="{color}" stroke-width="1.5"{marker}{dash}/>'
        )
        if e.label and e.kind != "gap":
            lines.append(
                f'<text x="{lx:.0f}" y="{ly:.0f}" font-family="Arial,sans-serif" '
                f'font-size="9" fill="#333">{esc(e.label)}</text>'
            )

    for n in nodes:
        cx, _ = node_center(n)
        if n.kind == "terminator":
            lines.append(
                f'<ellipse cx="{cx:.0f}" cy="{n.y + n.h/2:.0f}" rx="{n.w/2:.0f}" ry="{n.h/2:.0f}" '
                f'fill="#d5e8d4" stroke="#82b366" stroke-width="1.5"/>'
            )
        elif n.kind == "decision":
            x, y = n.x, n.y
            cy = y + n.h / 2
            pts = f"{cx:.0f},{y:.0f} {x+n.w:.0f},{cy:.0f} {cx:.0f},{y+n.h:.0f} {x:.0f},{cy:.0f}"
            lines.append(f'<polygon points="{pts}" fill="#fff2cc" stroke="#d6b656" stroke-width="1.5"/>')
        elif n.kind == "error":
            lines.append(
                f'<rect x="{n.x:.0f}" y="{n.y:.0f}" width="{n.w:.0f}" height="{n.h:.0f}" rx="8" '
                f'fill="#f8cecc" stroke="#b85450" stroke-width="1.5"/>'
            )
        elif n.kind in ("gap", "note"):
            dash = ' stroke-dasharray="8,8"' if n.kind == "gap" else ""
            fill = "#fff2cc" if n.kind == "gap" else "#f5f5f5"
            stroke = "#b85450" if n.kind == "gap" else "#666666"
            lines.append(
                f'<rect x="{n.x:.0f}" y="{n.y:.0f}" width="{n.w:.0f}" height="{n.h:.0f}" rx="6" '
                f'fill="{fill}" stroke="{stroke}" stroke-width="1.5"{dash}/>'
            )
        else:
            lines.append(
                f'<rect x="{n.x:.0f}" y="{n.y:.0f}" width="{n.w:.0f}" height="{n.h:.0f}" rx="8" '
                f'fill="#dae8fc" stroke="#6c8ebf" stroke-width="1.5"/>'
            )
        for i, line in enumerate(n.label.split("\n")):
            lines.append(
                f'<text x="{cx:.0f}" y="{n.y + 20 + i * 14:.0f}" text-anchor="middle" '
                f'font-family="Arial,sans-serif" font-size="10" fill="#333">{esc(line)}</text>'
            )

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{max_x:.0f}" height="{max_y:.0f}" viewBox="0 0 {max_x:.0f} {max_y:.0f}">
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#555"/>
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  {chr(10).join(lines)}
</svg>
"""


def write_diagram(
    out_dir: str,
    base_name: str,
    nodes: list[Node],
    edges: list[Edge],
    title: str,
    diagram_id: str,
    subtitle: str = "Plain English flowchart. Red dashed = known gaps.",
):
    drawio_path = f"{out_dir}/{base_name}.drawio"
    svg_path = f"{out_dir}/{base_name}.svg"
    with open(drawio_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(render_drawio(nodes, edges, diagram_id, title, agent=f"generate-{base_name}"))
    with open(svg_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(render_svg(nodes, edges, title, subtitle))
    print(f"Wrote {drawio_path} ({len(nodes)} nodes, {len(edges)} edges)")
    print(f"Wrote {svg_path}")
