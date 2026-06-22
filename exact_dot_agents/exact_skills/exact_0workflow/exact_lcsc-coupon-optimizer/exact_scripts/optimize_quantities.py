#!/usr/bin/env python3
"""Brute-force search for optimal quantity combinations to hit coupon thresholds.

Each product line is described as:
  unit_price  min_qty  qty_multiple  min_extra_allowed  [current_qty]

- unit_price: 单品单价
- min_qty: 最少起购数量
- qty_multiple: 必须以 N 的倍数购买
- min_extra_allowed: 允许在原基础上最少额外增加的数量 (>=0)
- current_qty (optional): 当前已购买数量

When a product has a minimum indivisible amount (min_qty * unit_price),
treat that as a "pseudo unit price" for optimization purposes.
"""

import sys
import json
import itertools
import math
from typing import NamedTuple


class Product(NamedTuple):
    name: str
    unit_price: float
    min_qty: int = 1
    qty_multiple: int = 1
    current_qty: int = 0
    min_extra: int = 0

    @property
    def pseudo_price(self) -> float:
        """Minimum indivisible price unit (min_qty * unit_price)."""
        return self.unit_price * self.min_qty

    def total_for_qty(self, qty: int) -> float:
        return self.unit_price * qty


def is_valid_qty(qty: int, prod: Product) -> bool:
    """Check if quantity satisfies min_qty, qty_multiple, and min_extra constraints."""
    if qty < prod.current_qty + prod.min_extra:
        return False
    if qty < prod.min_qty and qty > 0:
        return False
    if qty > 0 and qty % prod.qty_multiple != 0:
        return False
    return True


def enumerate_quantities(prod: Product, max_iter: int = 100) -> list[int]:
    """Generate all valid quantities for a product within reasonable bounds."""
    results = []
    if prod.current_qty > 0 or prod.min_extra > 0:
        start = max(prod.min_qty, prod.current_qty + prod.min_extra)
    else:
        start = prod.min_qty
    start = max(start, 0)
    step = max(prod.qty_multiple, 1)
    # Add zero option if current_qty is 0
    if prod.current_qty == 0 and prod.min_extra == 0:
        results.append(0)
    for q in range(start, start + step * max_iter, step):
        results.append(q)
    return results


def optimize(
    products: list[Product],
    threshold: float,
    max_above: float = 0.30,
    max_combinations: int = 200_000,
) -> list[dict]:
    """Find quantity combinations whose total is within [threshold, threshold+max_above].

    Returns list of {qty_map, total} sorted by total ascending (closest to threshold first).
    """
    qty_ranges = [enumerate_quantities(p) for p in products]
    total_combos = 1
    for r in qty_ranges:
        total_combos *= len(r)

    results = []

    # If too many combinations, prune by keeping only the cheapest options per product
    if total_combos > max_combinations:
        qty_ranges = [r[: min(len(r), 20)] for r in qty_ranges]

    for combo in itertools.product(*qty_ranges):
        total = sum(p.total_for_qty(q) for p, q in zip(products, combo))
        if threshold <= total <= threshold + max_above:
            qty_map = {p.name: q for p, q in zip(products, combo)}
            results.append({"qty_map": qty_map, "total": round(total, 2)})

    results.sort(key=lambda r: r["total"])
    return results[:20]


def find_closest(products: list[Product], threshold: float) -> dict | None:
    """Find the single quantity combination closest to threshold from above."""
    best = optimize(products, threshold, max_above=threshold * 2)
    return best[0] if best else None


def format_result(result: dict | None) -> str:
    """Pretty-print an optimization result."""
    if result is None:
        return "No valid combination found."
    lines = [f"Total: ¥{result['total']:.2f}"]
    for name, qty in result["qty_map"].items():
        if qty > 0:
            lines.append(f"  {name}: {qty} pcs")
    return "\n".join(lines)


def parse_products(json_input: str) -> list[Product]:
    """Parse products from JSON string.

    Expected format:
    [{"name":"...", "unit_price":0.5, "min_qty":1, "qty_multiple":1, "current_qty":0, "min_extra":0}, ...]
    """
    data = json.loads(json_input)
    return [Product(**{k: d.get(k, 0) if k in ("current_qty", "min_extra") else d.get(k, 1 if k in ("min_qty", "qty_multiple") else 0)
                        for k in Product._fields})
            for d in data]


def main():
    if len(sys.argv) < 3:
        print("Usage: optimize_quantities.py <json_products> <threshold> [max_above]")
        print("  json_products: JSON array of product objects")
        print("  threshold: minimum total price to reach (e.g. 16.0)")
        print("  max_above: maximum above threshold (default 0.30)")
        sys.exit(1)

    products = parse_products(sys.argv[1])
    threshold = float(sys.argv[2])
    max_above = float(sys.argv[3]) if len(sys.argv) > 3 else 0.30

    results = optimize(products, threshold, max_above)
    if not results:
        print("No valid combination found in the given range.")
        # Try wider range
        wider = optimize(products, threshold, threshold * 0.5)
        if wider:
            print(f"\nClosest matches (wider range):")
            for r in wider[:5]:
                print(format_result(r))
                print("---")
    else:
        for r in results:
            print(format_result(r))
            print("---")


if __name__ == "__main__":
    main()
