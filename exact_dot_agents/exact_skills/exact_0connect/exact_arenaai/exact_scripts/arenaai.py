#!/usr/bin/env python3
"""arena.ai benchmark scraper — rating, pricing, context, release type."""

from __future__ import annotations

import concurrent.futures
import json
import re
import subprocess
import sys
import time
from dataclasses import dataclass, fields
from typing import Any

BASE = "https://arena.ai"

CATEGORIES = {
    "text":           "text/overall-no-style-control",
    "text-coding":    "text/coding",
    "text-math":      "text/math",
    "text-creative":  "text/creative-writing",
    "text-hard":      "text/hard-prompts",
    "text-expert":    "text/expert",
    "text-if":        "text/instruction-following",
    "code":           "code",
    "code-webdev":    "code/webdev",
    "vision":         "vision",
    "image":          "image",
    "video":          "video",
    "search":         "search",
    "document":       "document",
    "image-edit":     "image-edit",
    "text-to-image":  "text-to-image",
    "text-to-video":  "text-to-video",
    "image-to-video": "image-to-video",
    "video-edit":     "video-edit",
    "agent":          "agent",
    "speech":         "speech",
    "music":          "music",
}

CACHE_TTL = 300


@dataclass
class Entry:
    rank: int
    model: str
    display: str
    rating: float
    rating_upper: float
    rating_lower: float
    votes: int
    vendor: str | None
    license: str | None
    input_price: float | None
    output_price: float | None
    context: int | None
    release_type: str | None
    category: str = ""


_BROWSER_UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

_RETRY_DELAYS = [1, 2, 4]


def _curl(url: str, headers: dict[str, str] | None = None, timeout: int = 30) -> str:
    cmd = ["curl", "-s", "--compressed", "--max-time", str(timeout), "-A", _BROWSER_UA]
    if headers:
        for k, v in headers.items():
            cmd += ["-H", f"{k}: {v}"]
    cmd.append(url)
    for attempt in range(len(_RETRY_DELAYS) + 1):
        try:
            out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
            if out.returncode == 0:
                return out.stdout
            # rc=28: timeout but may have partial data — check it
            if out.returncode == 28 and len(out.stdout) > 1000:
                m = re.search(r'"entries"\s*:\s*(\[[\s\S]*?\])\s*[,}\]]', out.stdout)
                if m:
                    try:
                        json.loads(m.group(1))
                        return out.stdout
                    except json.JSONDecodeError:
                        pass
            if attempt < len(_RETRY_DELAYS):
                time.sleep(_RETRY_DELAYS[attempt])
                continue
            raise RuntimeError(f"curl rc={out.returncode}: {out.stderr[:200]}")
        except subprocess.TimeoutExpired:
            if attempt < len(_RETRY_DELAYS):
                time.sleep(_RETRY_DELAYS[attempt])
                continue
            raise


def _fetch(path: str) -> str:
    return _curl(f"{BASE}/leaderboard/{path}", headers={"RSC": "1"})


def parse_entries(html: str, category: str = "") -> list[Entry]:
    m = re.search(r'"entries"\s*:\s*(\[[\s\S]*?\])\s*[,}\]]', html)
    if not m:
        return []
    raw = m.group(1)
    try:
        arr = json.loads(raw)
    except json.JSONDecodeError:
        m2 = re.search(r'\$[0-9A-Za-z]+\s*\[([\s\S]*?)\]\s*[,}\]]', raw)
        if m2:
            try:
                arr = json.loads("[" + m2.group(1) + "]")
            except json.JSONDecodeError:
                return []
        else:
            return []
    return [
        Entry(
            rank=item.get("rank"),
            model=item.get("modelKey", ""),
            display=item.get("modelDisplayName", item.get("modelKey", "")),
            rating=item.get("rating", 0.0),
            rating_upper=item.get("ratingUpper", item.get("rating", 0.0)),
            rating_lower=item.get("ratingLower", item.get("rating", 0.0)),
            votes=item.get("votes", 0),
            vendor=item.get("modelOrganization"),
            license=item.get("license"),
            input_price=item.get("inputPricePerMillion"),
            output_price=item.get("outputPricePerMillion"),
            context=item.get("contextLength"),
            release_type=item.get("releaseType"),
            category=category,
        )
        for item in arr
        if isinstance(item, dict) and "rank" in item
    ]


class ArenaAI:
    def __init__(self, cache_ttl: int = CACHE_TTL):
        self._cache: dict[str, tuple[float, Any]] = {}
        self._ttl = cache_ttl

    def _cached(self, key: str, fn):
        now = time.time()
        if key in self._cache:
            ts, val = self._cache[key]
            if now - ts < self._ttl:
                return val
        val = fn()
        self._cache[key] = (now, val)
        return val

    def leaderboard(self, category: str = "text") -> list[Entry]:
        path = CATEGORIES.get(category)
        if not path:
            raise KeyError(f"unknown {category!r}")
        return self._cached(f"lb:{category}", lambda: parse_entries(_fetch(path), category))

    def find(self, query: str, category: str | None = None) -> list[Entry]:
        q = query.lower()
        if category:
            return [e for e in self.leaderboard(category) if q in e.model.lower() or q in e.display.lower()]
        results: list[Entry] = []
        cats = list(CATEGORIES)

        def _search(cat: str) -> list[Entry]:
            try:
                lb = self.leaderboard(cat)
                return [e for e in lb if q in e.model.lower() or q in e.display.lower()]
            except Exception:
                return []

        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            for batch in pool.map(_search, cats):
                results.extend(batch)
        return results

    def pricing(self, name: str) -> dict:
        """Look up pricing for a single model across all categories."""
        for cat in CATEGORIES:
            try:
                for e in self.leaderboard(cat):
                    if e.display == name or e.model == name:
                        if e.input_price is not None:
                            return {
                                "input_per_million": e.input_price,
                                "output_per_million": e.output_price,
                                "context": e.context or 0,
                                "category": cat,
                            }
            except Exception:
                continue
        return {}


# ── CLI ─────────────────────────────────────────────────────────


def fmt_price(v):
    return f"${v:.2f}" if v is not None else "-"


def fmt_ctx(v):
    return f"{v // 1000}k" if v else "-"


def fmt_rt(v):
    return v or "ga"


def _cli():
    import argparse

    p = argparse.ArgumentParser(prog="arenaai")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("categories")

    ls = sub.add_parser("ls")
    ls.add_argument("category", nargs="?", default="text")
    ls.add_argument("-n", type=int, default=0)
    ls.add_argument("--find", "-f", type=str, default=None)
    ls.add_argument("--pricing", "--price", "-p", action="store_true")
    ls.add_argument("--release", "--rt", "-r", action="store_true")

    f = sub.add_parser("find")
    f.add_argument("query")
    f.add_argument("--category", "-c", default=None)

    pr = sub.add_parser("price")
    pr.add_argument("model")

    w = sub.add_parser("watch")
    w.add_argument("category", nargs="?", default="text")
    w.add_argument("--interval", type=int, default=300)

    args = p.parse_args()
    aa = ArenaAI()

    match args.cmd:
        case "categories":
            for k in sorted(CATEGORIES):
                print(k)

        case "ls":
            entries = aa.leaderboard(args.category)
            if args.find:
                q = args.find.lower()
                entries = [e for e in entries if q in e.display.lower() or q in e.model.lower()]
            elif args.n:
                entries = entries[: args.n]

            cols = [("Rank", 4), ("Model", 44), ("Rating", 6), ("Votes", 6)]
            if args.pricing:
                cols += [("In$/M", 6), ("Out$/M", 6), ("Ctx", 6)]
            if args.release:
                cols += [("Type", 10)]

            hdr = "  ".join(f"{h:>{w}}" if i == 0 else f"{h:<{w}}" for i, (h, w) in enumerate(cols))
            print(hdr)
            for e in entries:
                row = f"{e.rank:>4}  {e.display:<44} {e.rating:>6.0f}  {e.votes:>6}"
                if args.pricing:
                    row += f"  {fmt_price(e.input_price):>6} {fmt_price(e.output_price):>6} {fmt_ctx(e.context):>6}"
                if args.release:
                    row += f"  {fmt_rt(e.release_type):>10}"
                print(row)

        case "find":
            for e in aa.find(args.query, args.category):
                print(f"  [{e.category:<12}] #{e.rank:<4} {e.display:<42} {e.rating:>6.0f}  {e.votes:>6}  {fmt_rt(e.release_type)}")

        case "price":
            for cat in CATEGORIES:
                try:
                    for e in aa.leaderboard(cat):
                        if e.display == args.model or e.model == args.model:
                            if e.input_price is not None:
                                print(f"  Input:  {fmt_price(e.input_price)}/M")
                                print(f"  Output: {fmt_price(e.output_price)}/M")
                                print(f"  Ctx:    {fmt_ctx(e.context)}")
                                print(f"  Cat:    {cat}")
                                return
                except Exception:
                    continue
            print(f"  no data for {args.model}")

        case "watch":
            prev: dict[str, Entry] = {}
            cycle = 0
            print(f"[arenaai] watching {args.category} every {args.interval}s", flush=True)
            while True:
                cycle += 1
                try:
                    cur = {e.model: e for e in aa.leaderboard(args.category)}
                except Exception as e:
                    print(f"[err] {e}", file=sys.stderr)
                    time.sleep(args.interval)
                    continue
                for key, e in cur.items():
                    p = prev.get(key)
                    if p is None:
                        print(f"  [+] {e.display} #{e.rank} {e.rating:.0f}")
                    else:
                        if e.rank != p.rank:
                            print(f"  [~] {e.display} rank {p.rank} -> {e.rank}")
                        if abs(e.rating - p.rating) > 1:
                            print(f"  [~] {e.display} rating {p.rating:.1f} -> {e.rating:.1f}")
                prev = cur
                time.sleep(args.interval)


if __name__ == "__main__":
    _cli()
